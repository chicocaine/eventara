<?php

namespace App\Mail;

use App\Models\UserAuth;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public UserAuth $user;
    public string $resetCode;
    public string $expiresAt;

    /**
     * Create a new message instance.
     */
    public function __construct(UserAuth $user, string $resetCode, string $expiresAt)
    {
        $this->user = $user;
        $this->resetCode = $resetCode;
        $this->expiresAt = $expiresAt;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset Your Eventara Password',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.password-reset',
            text: 'emails.password-reset-text',
            with: [
                'user' => $this->user,
                'resetCode' => $this->resetCode,
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