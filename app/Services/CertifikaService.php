<?php

namespace App\Services;

use App\Models\CertifikaNft;
use App\Models\UserProfile;
use Carbon\Carbon;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CertifikaService
{
    private const API_BASE_URL = 'https://api.certifika.org/v1';
    private const VERIFY_ENDPOINT = '/poap/verify';
    private const NFTS_ENDPOINT = '/poap/nfts/minted';

    /**
     * Verify POAP signature and wallet ownership.
     *
     * @param array $qrData Decoded QR data
     * @return array
     */
    public function verifyPoapSignature(array $qrData): array
    {
        try {
            // Parse the message to extract components
            $message = $qrData['message'] ?? '';
            $signature = $qrData['signature'] ?? '';

            if (!$message || !$signature) {
                return [
                    'success' => false,
                    'message' => 'Invalid QR code format. Missing message or signature.',
                ];
            }

            // Parse message: wallet_address:chain:token_id:timestamp
            $parts = explode(':', $message);
            if (count($parts) !== 4) {
                return [
                    'success' => false,
                    'message' => 'Invalid message format in QR code.',
                ];
            }

            [$walletAddress, $chain, $tokenId, $timestamp] = $parts;

            // Verify the signature with Certifika API
            $response = Http::timeout(30)
                ->accept('application/json')
                ->post(self::API_BASE_URL . self::VERIFY_ENDPOINT, [
                    'chain' => $chain,
                    'signerWalletAddress' => $walletAddress,
                    'tokenId' => (int) $tokenId,
                    'expirationTimestamp' => (int) $timestamp,
                    'signature' => $signature,
                ]);

            if (!$response->successful()) {
                Log::error('Certifika verification failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'message' => 'Failed to verify with Certifika API.',
                ];
            }

            $data = $response->json();

            if (!$data['success']) {
                return [
                    'success' => false,
                    'message' => $data['message'] ?? 'Verification failed.',
                ];
            }

            return [
                'success' => true,
                'data' => $data['data'],
                'wallet_address' => $walletAddress,
                'chain' => $chain,
            ];

        } catch (\Exception $e) {
            Log::error('Error verifying POAP signature', [
                'error' => $e->getMessage(),
                'qr_data' => $qrData,
            ]);

            return [
                'success' => false,
                'message' => 'An error occurred during verification.',
            ];
        }
    }

    /**
     * Save user Certifika information to profile.
     *
     * @param int $userId
     * @param array $certifikaData
     * @return bool
     */
    public function saveUserCertifikaInfo(int $userId, array $certifikaData): bool
    {
        try {
            $user = $certifikaData['user'] ?? [];
            
            $profile = UserProfile::where('user_id', $userId)->first();
            if (!$profile) {
                Log::error('User profile not found', ['user_id' => $userId]);
                return false;
            }

            $profile->update([
                'certifika_wallet' => $user['walletAddress'] ?? null,
                'certifika_email' => $user['email'] ?? null,
                'certifika_name' => $user['name'] ?? null,
                'certifika_profile_url' => $user['profileMediaUrl'] ?? null,
                'certifika_verified_at' => now(),
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Error saving Certifika user info', [
                'error' => $e->getMessage(),
                'user_id' => $userId,
            ]);

            return false;
        }
    }

    /**
     * Fetch and sync user's Certifika NFTs.
     *
     * @param int $userId
     * @param string $walletAddress
     * @return array
     */
    public function syncUserNfts(int $userId, string $walletAddress): array
    {
        try {
            $response = Http::timeout(30)
                ->accept('application/json')
                ->get(self::API_BASE_URL . self::NFTS_ENDPOINT, [
                    'page' => 1,
                    'minter' => $walletAddress,
                ]);

            if (!$response->successful()) {
                Log::error('Failed to fetch Certifika NFTs', [
                    'status' => $response->status(),
                    'wallet' => $walletAddress,
                ]);

                return [
                    'success' => false,
                    'message' => 'Failed to fetch NFTs from Certifika.',
                ];
            }

            $data = $response->json();

            if (!$data['success']) {
                return [
                    'success' => false,
                    'message' => $data['message'] ?? 'Failed to fetch NFTs.',
                ];
            }

            $nfts = $data['data']['nfts'] ?? [];
            $savedCount = 0;

            foreach ($nfts as $nft) {
                if ($this->saveNftToDatabase($userId, $nft)) {
                    $savedCount++;
                }
            }

            return [
                'success' => true,
                'message' => "Synced {$savedCount} NFT certificates.",
                'count' => $savedCount,
                'total' => count($nfts),
            ];

        } catch (\Exception $e) {
            Log::error('Error syncing Certifika NFTs', [
                'error' => $e->getMessage(),
                'user_id' => $userId,
                'wallet' => $walletAddress,
            ]);

            return [
                'success' => false,
                'message' => 'An error occurred while syncing NFTs.',
            ];
        }
    }

    /**
     * Save a single NFT to the database.
     *
     * @param int $userId
     * @param array $nft
     * @return bool
     */
    private function saveNftToDatabase(int $userId, array $nft): bool
    {
        try {
            $event = $nft['event'] ?? [];
            $user = $nft['user'] ?? [];

            CertifikaNft::updateOrCreate(
                [
                    'tx_hash' => $nft['txHash'],
                    'log_index' => $nft['logIndex'],
                ],
                [
                    'user_id' => $userId,
                    'contract_address' => $nft['contractAddress'],
                    'chain' => $nft['chain'],
                    'chain_icon' => $nft['chainIcon'],
                    'tx_event_id' => $nft['txEvent'] ?? null,
                    'metadata' => $nft['metadata'] ?? [],
                    'event_id' => $event['id'],
                    'event_name' => $event['name'],
                    'event_description' => $event['description'],
                    'event_place' => $event['place'],
                    'event_start_date' => $event['eventStartDate'] ? Carbon::createFromTimestamp($event['eventStartDate']) : null,
                    'event_end_date' => $event['eventEndDate'] ? Carbon::createFromTimestamp($event['eventEndDate']) : null,
                    'event_image_url' => $event['imageUrl'],
                    'event_category' => $event['category'],
                    'event_metadata' => $event['metadata'] ?? [],
                    'certifika_wallet_address' => $user['walletAddress'],
                    'certifika_email' => $user['email'],
                    'certifika_name' => $user['name'],
                    'certifika_profile_media_id' => $user['profileMediaId'],
                    'certifika_profile_media_url' => $user['profileMediaUrl'],
                    'block_timestamp' => $nft['blockTimestamp'] ? Carbon::createFromTimestamp($nft['blockTimestamp']) : null,
                ]
            );

            return true;

        } catch (\Exception $e) {
            Log::error('Error saving NFT to database', [
                'error' => $e->getMessage(),
                'nft' => $nft,
            ]);

            return false;
        }
    }

    /**
     * Get user's Certifika NFTs from database.
     *
     * @param int $userId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getUserNfts(int $userId)
    {
        return CertifikaNft::forUser($userId)
            ->recent()
            ->get();
    }

    /**
     * Parse QR code data from JSON string.
     *
     * @param string $qrContent
     * @return array|null
     */
    public function parseQrData(string $qrContent): ?array
    {
        try {
            $data = json_decode($qrContent, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                return null;
            }

            // Validate required fields
            if (!isset($data['message']) || !isset($data['signature'])) {
                return null;
            }

            return $data;

        } catch (\Exception $e) {
            Log::error('Error parsing QR data', [
                'error' => $e->getMessage(),
                'content' => $qrContent,
            ]);

            return null;
        }
    }
}