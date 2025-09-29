<?php

namespace App\Mail;

use App\Models\UserAuth;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AccountReactivationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public UserAuth $user;
    public string $reactivationCode;
    public string $expiresAt;

    /**
     * Create a new message instance.
     */
    public function __construct(UserAuth $user, string $reactivationCode, string $expiresAt)
    {
        $this->user = $user;
        $this->reactivationCode = $reactivationCode;
        $this->expiresAt = $expiresAt;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reactivate Your Eventara Account',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.account-reactivation',
            text: 'emails.account-reactivation-text',
            with: [
                'user' => $this->user,
                'reactivationCode' => $this->reactivationCode,
                'expiresAt' => $this->expiresAt,
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
