<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Eventara Password</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #4f46e5;
            margin-bottom: 10px;
        }
        .title {
            color: #1f2937;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #4b5563;
        }
        .content {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 30px;
        }
        .code-container {
            background-color: #f3f4f6;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        .reset-code {
            font-size: 32px;
            font-weight: bold;
            color: #dc2626;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
        }
        .code-label {
            font-size: 14px;
            color: #6b7280;
            margin-top: 10px;
        }
        .expiry-notice {
            background-color: #fef3cd;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
        }
        .instructions {
            background-color: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .instructions h3 {
            color: #065f46;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .instructions ol {
            margin: 0;
            padding-left: 20px;
        }
        .instructions li {
            margin-bottom: 8px;
            color: #064e3b;
        }
        .security-note {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #991b1b;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .footer-logo {
            font-weight: 600;
            color: #4f46e5;
        }
        .contact-info {
            margin-top: 20px;
            font-size: 12px;
            color: #9ca3af;
        }
        @media only screen and (max-width: 600px) {
            body {
                padding: 10px;
            }
            .email-container {
                padding: 20px;
            }
            .reset-code {
                font-size: 24px;
                letter-spacing: 2px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">Eventara</div>
            <h1 class="title">Password Reset Request</h1>
        </div>

        <div class="greeting">
            Hello {{ $user->display_name ?? 'User' }},
        </div>

        <div class="content">
            <p>We received a request to reset the password for your Eventara account ({{ $user->email }}). If you made this request, please use the verification code below to reset your password.</p>
        </div>

        <div class="code-container">
            <div class="reset-code">{{ $resetCode }}</div>
            <div class="code-label">Your Password Reset Code</div>
        </div>

        <div class="expiry-notice">
            <strong>⏰ Important:</strong> This code will expire on {{ $expiresAt }}. Please use it as soon as possible.
        </div>

        <div class="instructions">
            <h3>📋 How to Reset Your Password:</h3>
            <ol>
                <li>Go to the password reset page in your browser</li>
                <li>Enter this verification code: <strong>{{ $resetCode }}</strong></li>
                <li>Create a new password (minimum 8 characters)</li>
                <li>Confirm your new password</li>
                <li>Submit the form to complete the password reset</li>
            </ol>
        </div>

        <div class="security-note">
            <strong>🔒 Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure, and no changes will be made. For additional security concerns, please contact our support team.
        </div>

        <div class="content">
            <p>If you're having trouble with the password reset process, please contact our support team for assistance.</p>
            
            <p>Best regards,<br>
            The Eventara Team</p>
        </div>

        <div class="footer">
            <div class="footer-logo">Eventara</div>
            <p>Making event management simple and efficient.</p>
            
            <div class="contact-info">
                This is an automated message. Please do not reply to this email.<br>
                If you need assistance, please contact our support team.
            </div>
        </div>
    </div>
</body>
</html>