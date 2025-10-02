<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CertifikaNft extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tx_hash',
        'log_index',
        'contract_address',
        'chain',
        'chain_icon',
        'tx_event_id',
        'metadata',
        'event_id',
        'event_name',
        'event_description',
        'event_place',
        'event_start_date',
        'event_end_date',
        'event_image_url',
        'event_category',
        'event_metadata',
        'certifika_wallet_address',
        'certifika_email',
        'certifika_name',
        'certifika_profile_media_id',
        'certifika_profile_media_url',
        'block_timestamp',
    ];

    protected $casts = [
        'metadata' => 'array',
        'event_metadata' => 'array',
        'event_start_date' => 'datetime',
        'event_end_date' => 'datetime',
        'block_timestamp' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that owns this NFT.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    /**
     * Get the event image URL with fallback.
     */
    public function getEventImageAttribute(): string
    {
        return $this->event_image_url ?: '/images/events/default-certificate.png';
    }

    /**
     * Get formatted event date range.
     */
    public function getEventDateRangeAttribute(): string
    {
        if (!$this->event_start_date) return 'Date not available';
        
        $start = $this->event_start_date->format('M j, Y');
        
        if ($this->event_end_date && !$this->event_start_date->isSameDay($this->event_end_date)) {
            $end = $this->event_end_date->format('M j, Y');
            return "$start - $end";
        }
        
        return $start;
    }

    /**
     * Check if the certificate has personalization metadata.
     */
    public function hasPersonalization(): bool
    {
        return isset($this->event_metadata['personalizedCertificateImage']);
    }

    /**
     * Get the personalized certificate image URL.
     */
    public function getPersonalizedImageUrl(): ?string
    {
        return $this->event_metadata['personalizedCertificateImage'] ?? null;
    }

    /**
     * Scope to filter by user.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter by wallet address.
     */
    public function scopeForWallet($query, $walletAddress)
    {
        return $query->where('certifika_wallet_address', $walletAddress);
    }

    /**
     * Scope to order by most recent.
     */
    public function scopeRecent($query)
    {
        return $query->orderBy('block_timestamp', 'desc');
    }
}
