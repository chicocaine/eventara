<?php

namespace App\Models;

// This is a legacy compatibility class that redirects to UserAuth
// In your application, use UserAuth directly for authentication
// This exists to maintain compatibility with Laravel's default structure

class User extends UserAuth
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'users_auth';

    /**
     * The primary key associated with the table.
     *
     * @var string
     */
    protected $primaryKey = 'user_id';
}
