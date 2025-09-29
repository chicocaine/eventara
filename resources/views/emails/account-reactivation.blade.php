<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reactivate Your Eventara Account</title>
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
        .reactivation-code {
            font-size: 32px;
            font-weight: bold;
            color: #059669;
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
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .support-link {
            color: #4f46e5;
            text-decoration: none;
        }
        .support-link:hover {
            text-decoration: underline;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .email-container {
                padding: 20px;
            }
            .reactivation-code {
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
            <h1 class="title">Account Reactivation Required</h1>
        </div>

        <div class="greeting">
            Hello {{ $user->display_name ?: $user->email }},
        </div>

        <div class="content">
            <p>We noticed that you're trying to access your Eventara account, but it appears to be deactivated. Don't worry – you can easily reactivate your account and get back to managing your events!</p>
            
            <p>To reactivate your account, please use the verification code below:</p>
        </div>

        <div class="code-container">
            <div class="reactivation-code">{{ $reactivationCode }}</div>
            <div class="code-label">Account Reactivation Code</div>
        </div>

        <div class="expiry-notice">
            ⏰ <strong>Important:</strong> This code will expire on {{ $expiresAt }}. Please use it as soon as possible.
        </div>

        <div class="instructions">
            <h3>How to reactivate your account:</h3>
            <ol>
                <li>Go back to the Eventara reactivation page</li>
                <li>Enter the 6-digit code shown above</li>
                <li>Click "Reactivate Account"</li>
                <li>Your account will be immediately reactivated!</li>
            </ol>
        </div>

        <div class="security-note">
            🔐 <strong>Security Notice:</strong> If you didn't request this reactivation, please ignore this email. Your account will remain deactivated and secure.
        </div>

        <div class="content">
            <p>Once reactivated, you'll have full access to:</p>
            <ul>
                <li>Create and manage events</li>
                <li>Volunteer for events</li>
                <li>Access your full dashboard</li>
                <li>All Eventara features</li>
            </ul>
        </div>

        <div class="footer">
            <p>Need help? Contact our support team at <a href="mailto:support@eventara.com" class="support-link">support@eventara.com</a></p>
            <p>&copy; {{ date('Y') }} Eventara. All rights reserved.</p>
        </div>
    </div>
</body>
</html>