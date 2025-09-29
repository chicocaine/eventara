<?php

/**
 * Example usage of AccountReactivationMail and AccountReactivationService
 * 
 * This file demonstrates how to use the reactivation system.
 */

// Example 1: Using the service to send reactivation email
use App\Services\AccountReactivationService;
use App\Models\UserAuth;

// Get an inactive user
$user = UserAuth::where('active', false)->first();

if ($user) {
    $service = new AccountReactivationService();
    
    try {
        $result = $service->sendReactivationCode($user);
        echo "✅ Reactivation email sent successfully!\n";
        echo "Message: {$result['message']}\n";
        echo "Expires: {$result['expires_at']}\n";
    } catch (Exception $e) {
        echo "❌ Error: {$e->getMessage()}\n";
    }
}

// Example 2: Verifying reactivation code
$code = 'ABC123'; // This would come from user input
try {
    $result = $service->verifyAndReactivate($user, $code);
    echo "✅ Account reactivated successfully!\n";
    echo "Message: {$result['message']}\n";
} catch (Exception $e) {
    echo "❌ Verification failed: {$e->getMessage()}\n";
}

// Example 3: Direct mailable usage (for testing)
use App\Mail\AccountReactivationMail;
use Illuminate\Support\Facades\Mail;

$reactivationCode = 'TEST123';
$expiresAt = now()->addMinutes(30)->format('M d, Y \a\\t g:i A T');

$mail = new AccountReactivationMail($user, $reactivationCode, $expiresAt);

// Send the email
Mail::to($user->email)->send($mail);

// Or preview the email (for development)
// return $mail->render();