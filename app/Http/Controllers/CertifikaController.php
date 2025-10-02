<?php

namespace App\Http\Controllers;

use App\Services\CertifikaService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CertifikaController extends Controller
{
    private CertifikaService $certifikaService;

    public function __construct(CertifikaService $certifikaService)
    {
        $this->certifikaService = $certifikaService;
    }

    /**
     * Verify QR code and link Certifika wallet to user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function verifyQr(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'qr_content' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid input.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }

        // Parse QR code data
        $qrData = $this->certifikaService->parseQrData($request->qr_content);
        if (!$qrData) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid QR code format.',
            ], 400);
        }

        // Verify with Certifika API
        $verificationResult = $this->certifikaService->verifyPoapSignature($qrData);
        
        if (!$verificationResult['success']) {
            return response()->json([
                'success' => false,
                'message' => $verificationResult['message'],
            ], 400);
        }

        // Save user Certifika information
        $saved = $this->certifikaService->saveUserCertifikaInfo(
            $user->user_id,
            $verificationResult['data']
        );

        if (!$saved) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save Certifika information.',
            ], 500);
        }

        // Sync user's NFTs
        $syncResult = $this->certifikaService->syncUserNfts(
            $user->user_id,
            $verificationResult['wallet_address']
        );

        return response()->json([
            'success' => true,
            'message' => 'Certifika wallet verified successfully!',
            'verification' => $verificationResult,
            'sync' => $syncResult,
        ]);
    }

    /**
     * Get user's Certifika NFTs.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getUserNfts(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }

        $nfts = $this->certifikaService->getUserNfts($user->user_id);

        return response()->json([
            'success' => true,
            'data' => $nfts->map(function ($nft) {
                return [
                    'id' => $nft->id,
                    'event' => [
                        'id' => $nft->event_id,
                        'name' => $nft->event_name,
                        'description' => $nft->event_description,
                        'place' => $nft->event_place,
                        'date_range' => $nft->event_date_range,
                        'image_url' => $nft->event_image,
                        'category' => $nft->event_category,
                    ],
                    'nft' => [
                        'tx_hash' => $nft->tx_hash,
                        'chain' => $nft->chain,
                        'contract_address' => $nft->contract_address,
                        'block_timestamp' => $nft->block_timestamp?->toISOString(),
                    ],
                    'personalization' => [
                        'has_personalization' => $nft->hasPersonalization(),
                        'image_url' => $nft->getPersonalizedImageUrl(),
                    ],
                    'created_at' => $nft->created_at->toISOString(),
                ];
            }),
            'count' => $nfts->count(),
        ]);
    }

    /**
     * Sync user's Certifika NFTs manually.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function syncNfts(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }

        // Check if user has a verified Certifika wallet
        $profile = $user->profile;
        if (!$profile || !$profile->certifika_wallet) {
            return response()->json([
                'success' => false,
                'message' => 'No Certifika wallet linked. Please verify a QR code first.',
            ], 400);
        }

        $syncResult = $this->certifikaService->syncUserNfts(
            $user->user_id,
            $profile->certifika_wallet
        );

        return response()->json($syncResult);
    }

    /**
     * Get user's Certifika profile information.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getUserProfile(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }

        $profile = $user->profile;
        
        return response()->json([
            'success' => true,
            'data' => [
                'has_certifika_wallet' => !empty($profile->certifika_wallet),
                'wallet_address' => $profile->certifika_wallet,
                'certifika_name' => $profile->certifika_name,
                'certifika_email' => $profile->certifika_email,
                'profile_url' => $profile->certifika_profile_url,
                'verified_at' => $profile->certifika_verified_at?->toISOString(),
            ],
        ]);
    }
}
