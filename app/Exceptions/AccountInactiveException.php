<?php

namespace App\Exceptions;

use Exception;

class AccountInactiveException extends Exception
{
    /**
     * Create a new exception instance.
     *
     * @param string $message
     * @param int $code
     * @param Exception|null $previous
     */
    public function __construct(string $message = 'Account is inactive', int $code = 403, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Get the exception's context information.
     *
     * @return array
     */
    public function context(): array
    {
        return [
            'needs_reactivation' => true,
            'redirect_to' => '/reactivate',
        ];
    }
}
