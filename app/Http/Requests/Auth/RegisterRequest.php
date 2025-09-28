<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Allow all users to register
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'string',
                'email:filter',
                'max:255',
                'unique:users_auth,email',
            ],
            'password' => [
                'required',
                'string',
                'confirmed',
                Password::min(8),
                    // ->mixedCase() -- include next time
                    // ->numbers()
                    // ->symbols()
                    // ->uncompromised(),
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.max' => 'Email address must not exceed 255 characters.',
            'email.unique' => 'This email address is already registered.',
            'password.required' => 'Password is required.',
            'password.confirmed' => 'Password confirmation does not match.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'email' => 'email address',
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
            // For example, checking if registration is currently allowed
            
            if (!$this->isRegistrationEnabled()) {
                $validator->errors()->add('registration', 'Registration is currently disabled.');
            }
        });
    }

    /**
     * Check if registration is enabled.
     * This could be configured via settings or environment variables.
     */
    protected function isRegistrationEnabled(): bool
    {
        return config('app.registration_enabled', true);
    }

    /**
     * Get the validated data from the request.
     * Only return the fields we need for user creation.
     */
    public function validated($key = null, $default = null)
    {
        $validated = parent::validated($key, $default);
        
        // Remove password_confirmation as it's not needed for user creation
        unset($validated['password_confirmation']);
        
        return $validated;
    }
}