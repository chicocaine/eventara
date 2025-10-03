# User Activation/Deactivation System

This document explains the automatic user inactivation system implemented in Eventara.

## Overview

The system automatically marks users as inactive if they haven't logged in for 3 months. This helps maintain a clean and accurate user base while still allowing users to reactivate their accounts when needed.

## Components

### 1. UserAuth Model Enhancements

The `UserAuth` model has been enhanced with several methods to handle inactivation:

- `shouldBeInactive()`: Checks if a user should be marked as inactive
- `markInactive()`: Marks a user as inactive
- `activate()`: Activates a user account
- `scopeShouldBeInactive()`: Query scope to find users that should be inactive

### 2. UserInactivationService

A dedicated service class (`App\Services\UserInactivationService`) handles the business logic for user inactivation:

- `getUsersToInactivate()`: Get all users that should be marked inactive
- `markInactiveUsers()`: Bulk mark users as inactive
- `markUserInactive()`: Mark a specific user as inactive
- `getInactivityStats()`: Get statistics about user activity

### 3. MarkInactiveUsers Command

An Artisan command (`php artisan users:mark-inactive`) that provides:

- Manual execution with confirmation prompts
- Dry-run mode to preview changes (`--dry-run`)
- Force mode for automated execution (`--force`)
- Statistics display (`--stats`)

### 4. Automated Scheduling

The command is automatically scheduled to run daily at 2:00 AM via Laravel's task scheduler.

## Inactivity Criteria

A user is considered inactive and will be automatically marked as such if:

1. **They have logged in before** AND their last login was more than 3 months ago, OR
2. **They have never logged in** AND their account was created more than 3 months ago

## Usage

### Manual Execution

```bash
# Check what users would be marked inactive (dry run)
php artisan users:mark-inactive --dry-run

# Actually mark users as inactive (with confirmation)
php artisan users:mark-inactive

# Force mark users as inactive (no confirmation)
php artisan users:mark-inactive --force

# Show inactivity statistics
php artisan users:mark-inactive --stats
```

### Automated Execution

The system automatically runs daily at 2:00 AM via Laravel's scheduler. To enable this:

1. Ensure your server has a cron job for Laravel's scheduler:
   ```bash
   * * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
   ```

2. The command will run automatically with the `--force` flag to prevent hanging on confirmation prompts.

## Reactivation

Users who have been marked as inactive can reactivate their accounts using the existing reactivation system:

1. Visit `/reactivate`
2. Enter their email address
3. Receive a reactivation code via email
4. Enter the code to reactivate their account

## Logging

All inactivation actions are logged with the following information:
- User ID and email
- Last login timestamp
- Account creation timestamp
- Inactivation timestamp
- Inactivity threshold used

## Configuration

The inactivity threshold is currently set to 3 months and can be changed by modifying the `INACTIVITY_THRESHOLD_MONTHS` constant in the `UserInactivationService` class.

## Database Impact

- The system only updates the `active` field in the `users_auth` table
- No data is deleted or permanently modified
- Users can be reactivated at any time

## Monitoring

You can monitor the system's effectiveness using:

```bash
# View current statistics
php artisan users:mark-inactive --stats

# Check Laravel logs for inactivation activities
tail -f storage/logs/laravel.log | grep "inactive"
```

## Security Considerations

- Inactive users cannot log in until they reactivate their accounts
- The reactivation process includes rate limiting and email verification
- All actions are logged for audit purposes
- Suspended users are handled separately and are not affected by this system