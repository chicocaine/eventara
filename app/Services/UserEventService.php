<?php

namespace App\Services;

use App\Models\UserAuth;
use App\Models\UserEvent;
use App\Models\Event;
use App\Models\EventSession;
use App\Repositories\UserEventRepository;
use App\Repositories\EventRepository;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\Collection;

class UserEventService
{
    protected UserEventRepository $userEventRepository;
    protected EventRepository $eventRepository;

    public function __construct(
        UserEventRepository $userEventRepository,
        EventRepository $eventRepository
    ) {
        $this->userEventRepository = $userEventRepository;
        $this->eventRepository = $eventRepository;
    }

    /**
     * Get user's event registrations.
     *
     * @param UserAuth $user
     * @param array $filters
     * @return Collection
     */
    public function getUserRegistrations(UserAuth $user, array $filters = []): Collection
    {
        return $this->userEventRepository->getUserRegistrations($user->user_id, $filters);
    }

    /**
     * Register user for an event.
     *
     * @param UserAuth $user
     * @param array $data
     * @return UserEvent
     * @throws ValidationException
     * @throws \Exception
     */
    public function registerForEvent(UserAuth $user, array $data): UserEvent
    {
        // Validate input
        $validatedData = $this->validateRegistrationData($data);

        $eventId = $validatedData['event_id'];
        $sessionId = $validatedData['session_id'] ?? null;

        // Verify event exists and is published
        $event = $this->eventRepository->find($eventId);
        if (!$event || !$event->isPublished()) {
            throw new \Exception('Event not found or not available for registration.');
        }

        // If session_id provided, verify it belongs to the event
        if ($sessionId) {
            $this->validateSession($sessionId, $eventId);
        }

        // Check if user is already registered
        if ($this->userEventRepository->isUserRegistered($user->user_id, $eventId, $sessionId)) {
            $existingRegistration = $this->userEventRepository->findUserEventRegistration(
                $user->user_id,
                $eventId,
                $sessionId
            );
            throw new \Exception(
                "You are already registered for this event/session. Current status: {$existingRegistration->status}"
            );
        }

        // Create registration
        $userEvent = $this->userEventRepository->create([
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

        return $userEvent;
    }

    /**
     * Update registration status.
     *
     * @param UserAuth $user
     * @param int $registrationId
     * @param string $status
     * @return UserEvent
     * @throws \Exception
     */
    public function updateRegistrationStatus(UserAuth $user, int $registrationId, string $status): UserEvent
    {
        // Validate status
        if (!in_array($status, UserEvent::getStatusOptions())) {
            throw new \Exception('Invalid status value.');
        }

        // Find registration
        $userEvent = $this->userEventRepository->find($registrationId);

        if (!$userEvent || $userEvent->user_id !== $user->user_id) {
            throw new \Exception('Registration not found.');
        }

        $oldStatus = $userEvent->status;

        // Update status
        if (!$this->userEventRepository->updateStatus($userEvent, $status)) {
            throw new \Exception('Failed to update registration status.');
        }

        Log::info('User event status updated', [
            'user_id' => $user->user_id,
            'registration_id' => $registrationId,
            'old_status' => $oldStatus,
            'new_status' => $status,
        ]);

        $userEvent->refresh();
        return $userEvent;
    }

    /**
     * Cancel user's registration.
     *
     * @param UserAuth $user
     * @param int $registrationId
     * @return UserEvent
     * @throws \Exception
     */
    public function cancelRegistration(UserAuth $user, int $registrationId): UserEvent
    {
        $userEvent = $this->userEventRepository->find($registrationId);

        if (!$userEvent || $userEvent->user_id !== $user->user_id) {
            throw new \Exception('Registration not found.');
        }

        if ($userEvent->status === UserEvent::STATUS_CANCELLED) {
            throw new \Exception('Registration is already cancelled.');
        }

        if (!$this->userEventRepository->cancelRegistration($userEvent)) {
            throw new \Exception('Failed to cancel registration.');
        }

        Log::info('User event cancelled', [
            'user_id' => $user->user_id,
            'registration_id' => $registrationId,
            'event_id' => $userEvent->event_id,
        ]);

        $userEvent->refresh();
        return $userEvent;
    }

    /**
     * Transform user event to API response format.
     *
     * @param UserEvent $userEvent
     * @return array
     */
    public function transformUserEventToArray(UserEvent $userEvent): array
    {
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
    }

    /**
     * Validate registration data.
     *
     * @param array $data
     * @return array
     * @throws ValidationException
     */
    protected function validateRegistrationData(array $data): array
    {
        $validator = Validator::make($data, [
            'event_id' => 'required|exists:events,event_id',
            'session_id' => 'nullable|exists:event_sessions,session_id',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $validator->validated();
    }

    /**
     * Validate that session belongs to event.
     *
     * @param int $sessionId
     * @param int $eventId
     * @throws \Exception
     */
    protected function validateSession(int $sessionId, int $eventId): void
    {
        $session = EventSession::where('session_id', $sessionId)
                              ->where('event_id', $eventId)
                              ->first();
        
        if (!$session) {
            throw new \Exception('Invalid session for this event.');
        }
    }

    /**
     * Get registration count for an event.
     *
     * @param int $eventId
     * @param int|null $sessionId
     * @return int
     */
    public function getRegistrationCount(int $eventId, ?int $sessionId = null): int
    {
        return $this->userEventRepository->getRegistrationsCount($eventId, $sessionId);
    }
}
