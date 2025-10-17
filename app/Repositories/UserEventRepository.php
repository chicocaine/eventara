<?php

namespace App\Repositories;

use App\Models\UserEvent;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Builder;

class UserEventRepository extends BaseRepository
{
    public function __construct(UserEvent $model)
    {
        $this->model = $model;
    }

    /**
     * Get user's event registrations.
     *
     * @param int $userId
     * @param array $filters
     * @return Collection
     */
    public function getUserRegistrations(int $userId, array $filters = []): Collection
    {
        $query = $this->model->newQuery()
                            ->where('user_id', $userId)
                            ->with(['event', 'session']);

        // Apply status filter
        if (!empty($filters['status'])) {
            $statuses = is_array($filters['status']) ? $filters['status'] : [$filters['status']];
            $query->whereIn('status', $statuses);
        }

        // Apply active only filter
        if (!empty($filters['active_only'])) {
            $query->whereHas('event', function (Builder $eventQuery) {
                $eventQuery->where('event_status', 'published')
                          ->where('end_date', '>=', now());
            });
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Find user's registration for a specific event/session.
     *
     * @param int $userId
     * @param int $eventId
     * @param int|null $sessionId
     * @return UserEvent|null
     */
    public function findUserEventRegistration(int $userId, int $eventId, ?int $sessionId = null): ?UserEvent
    {
        return $this->model->where('user_id', $userId)
                          ->where('event_id', $eventId)
                          ->where('session_id', $sessionId)
                          ->first();
    }

    /**
     * Check if user is already registered for event/session.
     *
     * @param int $userId
     * @param int $eventId
     * @param int|null $sessionId
     * @return bool
     */
    public function isUserRegistered(int $userId, int $eventId, ?int $sessionId = null): bool
    {
        return $this->findUserEventRegistration($userId, $eventId, $sessionId) !== null;
    }

    /**
     * Get event registrations count.
     *
     * @param int $eventId
     * @param int|null $sessionId
     * @return int
     */
    public function getRegistrationsCount(int $eventId, ?int $sessionId = null): int
    {
        $query = $this->model->where('event_id', $eventId)
                            ->whereIn('status', [
                                UserEvent::STATUS_REGISTERED,
                                UserEvent::STATUS_CONFIRMED,
                                UserEvent::STATUS_ATTENDED
                            ]);

        if ($sessionId) {
            $query->where('session_id', $sessionId);
        }

        return $query->count();
    }

    /**
     * Update registration status.
     *
     * @param UserEvent $userEvent
     * @param string $status
     * @return bool
     */
    public function updateStatus(UserEvent $userEvent, string $status): bool
    {
        return $userEvent->update(['status' => $status]);
    }

    /**
     * Get registrations by event ID.
     *
     * @param int $eventId
     * @param array $filters
     * @return Collection
     */
    public function getEventRegistrations(int $eventId, array $filters = []): Collection
    {
        $query = $this->model->newQuery()
                            ->where('event_id', $eventId)
                            ->with(['user', 'session']);

        // Apply status filter
        if (!empty($filters['status'])) {
            $statuses = is_array($filters['status']) ? $filters['status'] : [$filters['status']];
            $query->whereIn('status', $statuses);
        }

        // Apply session filter
        if (isset($filters['session_id'])) {
            $query->where('session_id', $filters['session_id']);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Cancel user's registration.
     *
     * @param UserEvent $userEvent
     * @return bool
     */
    public function cancelRegistration(UserEvent $userEvent): bool
    {
        return $this->updateStatus($userEvent, UserEvent::STATUS_CANCELLED);
    }
}
