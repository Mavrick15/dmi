import React from 'react';
import { cn } from '../../utils/cn';
import Icon from '../AppIcon';

const Input = React.forwardRef(({ 
  className, 
  type = 'text', 
  icon, 
  iconPosition = 'left',
  error,
  label,
  helperText,
  ...props 
}, ref) => {
  const inputClasses = cn(
    'flex h-10 w-full items-center rounded-xl border border-slate-200 dark:border-slate-800',
    'bg-white dark:bg-slate-900',
    'px-4 py-2 text-sm font-medium',
    'text-slate-900 dark:text-white',
    'placeholder:text-slate-400 dark:placeholder:text-slate-500',
    'transition-all duration-300',
    'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
    'hover:border-slate-300 dark:hover:border-slate-700',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    error && 'border-rose-300 dark:border-rose-700 focus:ring-rose-500/20 focus:border-rose-500',
    icon && iconPosition === 'left' && 'pl-11',
    icon && iconPosition === 'right' && 'pr-11',
    className
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon 
              name={icon} 
              size={18} 
              className={cn(
                'text-slate-400 dark:text-slate-500 transition-colors duration-300',
                'group-focus-within:text-primary',
                error && 'text-rose-500'
              )} 
            />
          </div>
        )}
        <input
          type={type}
          className={inputClasses}
          ref={ref}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <Icon 
              name={icon} 
              size={18} 
              className={cn(
                'text-slate-400 dark:text-slate-500 transition-colors duration-300',
                'group-focus-within:text-primary',
                error && 'text-rose-500'
              )} 
            />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
          <Icon name="AlertCircle" size={14} />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
