import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'className'> {
  label?: string;
  description?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      description,
      error,
      leftIcon,
      rightIcon,
      fullWidth = false,
      inputSize = 'md',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        
        {description && !error && (
          <p className="text-xs text-text-secondary">
            {description}
          </p>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            disabled={disabled}
            className={`
              bg-surface border border-border rounded-md
              text-text-primary placeholder:text-text-tertiary
              transition-all duration-fast
              ${sizeStyles[inputSize]}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${fullWidth ? 'w-full' : ''}
              focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
              hover:border-border-secondary
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea Component
export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label?: string;
  description?: string;
  error?: string;
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      description,
      error,
      fullWidth = false,
      resize = 'vertical',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const resizeClass = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    }[resize];

    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        
        {description && !error && (
          <p className="text-xs text-text-secondary">
            {description}
          </p>
        )}

        <textarea
          ref={ref}
          disabled={disabled}
          className={`
            bg-surface border border-border rounded-md
            px-3 py-2 text-sm
            text-text-primary placeholder:text-text-tertiary
            transition-all duration-fast
            min-h-[80px]
            ${resizeClass}
            ${fullWidth ? 'w-full' : ''}
            focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20
            hover:border-border-secondary
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
            ${className}
          `}
          {...props}
        />

        {error && (
          <p className="text-xs text-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Input Group (for multiple inputs side by side)
export interface InputGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div ref={ref} className={`flex gap-2 ${className}`}>
        {children}
      </div>
    );
  }
);

InputGroup.displayName = 'InputGroup';
