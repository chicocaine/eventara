<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;

class ChangePasswordRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Auth::check(); // Only authenticated users can change password
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'current_password' => [
                'required',
                'string',
                'current_password', // Laravel 8+ validation rule
            ],
            'password' => [
                'required',
                'string',
                'confirmed',
                'different:current_password', // New password must be different from current
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'current_password.required' => 'Current password is required.',
            'current_password.current_password' => 'The current password is incorrect.',
            'password.required' => 'New password is required.',
            'password.confirmed' => 'Password confirmation does not match.',
            'password.different' => 'New password must be different from your current password.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'current_password' => 'current password',
            'password' => 'new password',
            'password_confirmation' => 'password confirmation',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Additional validation logic can go here
            // For example, checking password change frequency limits
            
            if ($this->hasRecentPasswordChange()) {
                $validator->errors()->add(
                    'password', 
                    'You can only change your password once every 24 hours.'
                );
            }
        });
    }

    /**
     * Check if user has changed password recently.
     * This is a placeholder for additional business logic.
     */
    protected function hasRecentPasswordChange(): bool
    {
        // Implementation would check last password change timestamp
        // For now, return false (no restriction)
        return false;
    }

    /**
     * Get the validated data from the request.
     */
    public function validated($key = null, $default = null)
    {
        $validated = parent::validated($key, $default);
        
        // Remove password_confirmation as it's not needed
        unset($validated['password_confirmation']);
        
        return $validated;
    }
}