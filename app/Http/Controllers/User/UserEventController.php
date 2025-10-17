<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\UserEventService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class UserEventController extends Controller
{
    protected UserEventService $userEventService;

    public function __construct(UserEventService $userEventService)
    {
        $this->userEventService = $userEventService;
    }

    /**
     * Get user's event registrations.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }

        try {
            $filters = [
                'status' => $request->input('status'),
                'active_only' => $request->boolean('active_only'),
            ];

            $userEvents = $this->userEventService->getUserRegistrations($user, $filters);

            return response()->json([
                'success' => true,
                'registrations' => $userEvents->map(function ($userEvent) {
                    return $this->userEventService->transformUserEventToArray($userEvent);
                }),
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to retrieve user events', [
                'user_id' => $user->user_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve event registrations.',
            ], 500);
        }
    }

    /**
     * Register user for an event.
     */
    public function register(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }

        try {
            $userEvent = $this->userEventService->registerForEvent($user, $request->all());

            return response()->json([
                'success' => true,
                'message' => 'Successfully registered for event!',
                'registration' => [
                    'id' => $userEvent->user_event_id,
                    'status' => $userEvent->status,
                    'registered_at' => $userEvent->created_at,
                ],
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid input.',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            // Check if it's a specific business logic error
            $statusCode = 500;
            $message = $e->getMessage();

            if (str_contains($message, 'already registered')) {
                $statusCode = 409;
            } elseif (str_contains($message, 'not found') || str_contains($message, 'not available')) {
                $statusCode = 404;
            } elseif (str_contains($message, 'Invalid session')) {
                $statusCode = 400;
            }

            Log::error('Event registration failed', [
                'user_id' => $user->user_id,
                'error' => $message,
            ]);

            return response()->json([
                'success' => false,
                'message' => $message,
            ], $statusCode);
        }
    }

    /**
     * Update registration status.
     */
    public function updateStatus(Request $request, $registrationId): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }

        try {
            $status = $request->input('status');
            $userEvent = $this->userEventService->updateRegistrationStatus($user, $registrationId, $status);

            return response()->json([
                'success' => true,
                'message' => 'Registration status updated successfully!',
                'registration' => [
                    'id' => $userEvent->user_event_id,
                    'status' => $userEvent->status,
                    'updated_at' => $userEvent->updated_at,
                ],
            ]);

        } catch (\Exception $e) {
            $statusCode = str_contains($e->getMessage(), 'not found') ? 404 : 
                         (str_contains($e->getMessage(), 'Invalid') ? 422 : 500);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }

    /**
     * Cancel registration.
     */
    public function cancel($registrationId): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }

        try {
            $userEvent = $this->userEventService->cancelRegistration($user, $registrationId);

            return response()->json([
                'success' => true,
                'message' => 'Registration cancelled successfully.',
                'registration' => [
                    'id' => $userEvent->user_event_id,
                    'status' => $userEvent->status,
                ],
            ]);

        } catch (\Exception $e) {
            $statusCode = str_contains($e->getMessage(), 'not found') ? 404 : 
                         (str_contains($e->getMessage(), 'already cancelled') ? 400 : 500);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }
}

