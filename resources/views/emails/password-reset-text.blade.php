Password Reset Request - Eventara

Hello {{ $user->display_name ?? 'User' }},

We received a request to reset the password for your Eventara account ({{ $user->email }}). If you made this request, please use the verification code below to reset your password.

Your Password Reset Code: {{ $resetCode }}

⏰ IMPORTANT: This code will expire on {{ $expiresAt }}. Please use it as soon as possible.

HOW TO RESET YOUR PASSWORD:
1. Go to the password reset page in your browser
2. Enter this verification code: {{ $resetCode }}
3. Create a new password (minimum 8 characters)
4. Confirm your new password
5. Submit the form to complete the password reset

🔒 SECURITY NOTICE: If you didn't request this password reset, please ignore this email. Your account remains secure, and no changes will be made. For additional security concerns, please contact our support team.

If you're having trouble with the password reset process, please contact our support team for assistance.

Best regards,
The Eventara Team

---
Eventara - Making event management simple and efficient.

This is an automated message. Please do not reply to this email.
If you need assistance, please contact our support team.