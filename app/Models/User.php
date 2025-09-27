<?php

namespace App\Models;

// This is a legacy compatibility class that redirects to UserAuth
// In your application, use UserAuth directly for authentication
// This exists to maintain compatibility with Laravel's default structure

class User extends UserAuth
{
    // This class simply extends UserAuth to maintain compatibility
    // with Laravel's default expectations for authentication
    
    /**
     * Create a new User instance (actually UserAuth).
     * This is here for backward compatibility only.
     */
    public function __construct(array $attributes = [])
    {
        // Redirect to UserAuth table
        $this->setTable('users_auth');
        $this->setPrimaryKey('user_id');
        
        parent::__construct($attributes);
    }
}
