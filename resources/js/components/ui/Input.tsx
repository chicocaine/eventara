import React from 'react';

interface InputProps {
  id?: string;
  name?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  autoComplete?: string;
  error?: boolean;
}

const Input: React.FC<InputProps> = ({
  type = 'text',
  error = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors duration-200';
  
  const stateClasses = error 
    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500';
  
  const finalClasses = `${baseClasses} ${stateClasses} ${className}`;

  return (
    <input
      type={type}
      className={finalClasses}
      {...props}
    />
  );
};

export default Input;