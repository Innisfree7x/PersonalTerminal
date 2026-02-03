import { InputHTMLAttributes, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className' | 'onChange'> {
  label?: string;
  description?: string;
  error?: string;
  className?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className = '', checked, disabled, onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };
    return (
      <div className={`flex items-start gap-3 ${className}`}>
        <label className="relative flex items-center cursor-pointer">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            className="peer sr-only"
            {...props}
          />
          
          <motion.div
            {...(!disabled ? { whileTap: { scale: 0.9 } } : {})}
            className={`
              w-5 h-5 rounded-sm border-2 flex items-center justify-center
              transition-all duration-fast cursor-pointer
              ${checked 
                ? 'bg-primary border-primary' 
                : 'bg-transparent border-border hover:border-primary'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background
            `}
          >
            <AnimatePresence mode="wait">
              {checked && (
                <motion.div
                  key="check"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    transition: {
                      type: 'spring',
                      stiffness: 500,
                      damping: 25,
                    }
                  }}
                  exit={{ 
                    scale: 0, 
                    opacity: 0,
                    transition: { duration: 0.1 }
                  }}
                >
                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </label>

        {(label || description) && (
          <div className="flex flex-col gap-1">
            {label && (
              <label
                className={`
                  text-sm font-medium text-text-primary cursor-pointer
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-text-secondary">
                {description}
              </p>
            )}
            {error && (
              <p className="text-xs text-error">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// Checkbox Group for multiple checkboxes
export interface CheckboxGroupProps {
  label?: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const CheckboxGroup = forwardRef<HTMLDivElement, CheckboxGroupProps>(
  ({ label, description, error, children, className = '' }, ref) => {
    return (
      <div ref={ref} className={`flex flex-col gap-3 ${className}`}>
        {(label || description) && (
          <div className="flex flex-col gap-1">
            {label && (
              <label className="text-sm font-semibold text-text-primary">
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-text-secondary">
                {description}
              </p>
            )}
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          {children}
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

CheckboxGroup.displayName = 'CheckboxGroup';
