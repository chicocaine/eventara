<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventSession;
use App\Models\UserEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class UserEventController extends Controller
{
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
            $query = $user->userEvents()->with(['event', 'session']);

            // Filter by status if provided
            if ($request->has('status')) {
                $statuses = is_array($request->status) ? $request->status : [$request->status];
                $query->whereIn('status', $statuses);
            }

            // Filter by active/inactive registrations
            if ($request->boolean('active_only')) {
                $query->active();
            }

            $userEvents = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'registrations' => $userEvents->map(function ($userEvent) {
                    return [
                        'id' => $userEvent->user_event_id,
                        'status' => $userEvent->status,
                        'registered_at' => $userEvent->created_at,
                        'event' => [
                            'id' => $userEvent->event->event_id,
                            'title' => $userEvent->event->title,
                            'description' => $userEvent->event->description,
                            'start_date' => $userEvent->event->start_date,
                            'end_date' => $userEvent->event->end_date,
                            'status' => $userEvent->event->event_status,
                        ],
                        'session' => $userEvent->session ? [
                            'id' => $userEvent->session->session_id,
                            'title' => $userEvent->session->title,
                            'date' => $userEvent->session->session_date,
                            'start_time' => $userEvent->session->start_time,
                            'end_time' => $userEvent->session->end_time,
                        ] : null,
                    ];
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

        $validator = Validator::make($request->all(), [
            'event_id' => 'required|exists:events,event_id',
            'session_id' => 'nullable|exists:event_sessions,session_id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid input.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $eventId = $request->input('event_id');
        $sessionId = $request->input('session_id');

        // Verify event exists and is published
        $event = Event::where('event_id', $eventId)->first();
        if (!$event || !$event->isPublished()) {
            return response()->json([
                'success' => false,
                'message' => 'Event not found or not available for registration.',
            ], 404);
        }

        // If session_id provided, verify it belongs to the event
        if ($sessionId) {
            $session = EventSession::where('session_id', $sessionId)
                                  ->where('event_id', $eventId)
                                  ->first();
            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid session for this event.',
                ], 400);
            }
        }

        // Check if user is already registered
        $existingRegistration = UserEvent::where('user_id', $user->user_id)
                                        ->where('event_id', $eventId)
                                        ->where('session_id', $sessionId)
                                        ->first();

        if ($existingRegistration) {
            return response()->json([
                'success' => false,
                'message' => 'You are already registered for this event/session.',
                'current_status' => $existingRegistration->status,
            ], 409);
        }

        try {
            $userEvent = UserEvent::create([
                'user_id' => $user->user_id,
                'event_id' => $eventId,
                'session_id' => $sessionId,
                'status' => UserEvent::STATUS_REGISTERED,
            ]);

            Log::info('User registered for event', [
                'user_id' => $user->user_id,
                'event_id' => $eventId,
                'session_id' => $sessionId,
                'registration_id' => $userEvent->user_event_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Successfully registered for event!',
                'registration' => [
                    'id' => $userEvent->user_event_id,
                    'status' => $userEvent->status,
                    'registered_at' => $userEvent->created_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            Log::error('Event registration failed', [
                'user_id' => $user->user_id,
                'event_id' => $eventId,
                'session_id' => $sessionId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Registration failed. Please try again.',
            ], 500);
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

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:' . implode(',', UserEvent::getStatusOptions()),
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid status.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $userEvent = UserEvent::where('user_event_id', $registrationId)
                             ->where('user_id', $user->user_id)
                             ->first();

        if (!$userEvent) {
            return response()->json([
                'success' => false,
                'message' => 'Registration not found.',
            ], 404);
        }

        $oldStatus = $userEvent->status;
        $newStatus = $request->input('status');

        $userEvent->update(['status' => $newStatus]);

        Log::info('User event status updated', [
            'user_id' => $user->user_id,
            'registration_id' => $registrationId,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Registration status updated successfully!',
            'registration' => [
                'id' => $userEvent->user_event_id,
                'status' => $userEvent->status,
                'updated_at' => $userEvent->updated_at,
            ],
        ]);
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

        $userEvent = UserEvent::where('user_event_id', $registrationId)
                             ->where('user_id', $user->user_id)
                             ->first();

        if (!$userEvent) {
            return response()->json([
                'success' => false,
                'message' => 'Registration not found.',
            ], 404);
        }

        if ($userEvent->status === UserEvent::STATUS_CANCELLED) {
            return response()->json([
                'success' => false,
                'message' => 'Registration is already cancelled.',
            ], 400);
        }

        $userEvent->update(['status' => UserEvent::STATUS_CANCELLED]);

        Log::info('User cancelled event registration', [
            'user_id' => $user->user_id,
            'registration_id' => $registrationId,
            'event_id' => $userEvent->event_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Registration cancelled successfully.',
        ]);
    }
}
