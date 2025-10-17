<?php

namespace App\Repositories;

use App\Models\Event;
use Illuminate\Database\Eloquent\Collection;

class EventRepository extends BaseRepository
{
    public function __construct(Event $model)
    {
        $this->model = $model;
    }

    /**
     * Get all published events.
     *
     * @return Collection
     */
    public function getPublishedEvents(): Collection
    {
        return $this->model->where('event_status', 'published')
                          ->orderBy('start_date', 'asc')
                          ->get();
    }

    /**
     * Get active (published and not ended) events.
     *
     * @return Collection
     */
    public function getActiveEvents(): Collection
    {
        return $this->model->where('event_status', 'published')
                          ->where('end_date', '>=', now())
                          ->orderBy('start_date', 'asc')
                          ->get();
    }

    /**
     * Get upcoming events (not started yet).
     *
     * @return Collection
     */
    public function getUpcomingEvents(): Collection
    {
        return $this->model->where('event_status', 'published')
                          ->where('start_date', '>', now())
                          ->orderBy('start_date', 'asc')
                          ->get();
    }

    /**
     * Get events by creator.
     *
     * @param int $userId
     * @return Collection
     */
    public function getEventsByCreator(int $userId): Collection
    {
        return $this->model->where('created_by', $userId)
                          ->orderBy('created_at', 'desc')
                          ->get();
    }

    /**
     * Check if event is published.
     *
     * @param int $eventId
     * @return bool
     */
    public function isEventPublished(int $eventId): bool
    {
        $event = $this->find($eventId);
        return $event && $event->event_status === 'published';
    }
}
