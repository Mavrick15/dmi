import { cn } from '../../utils/cn';
import Icon from '../AppIcon';

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'default',
  icon,
  iconPosition = 'left',
  className,
  ...props 
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    primary: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
    warning: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
    error: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700',
    info: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    default: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg font-semibold border transition-all duration-200 shadow-sm',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <Icon name={icon} size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12} />
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <Icon name={icon} size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12} />
      )}
    </span>
  );
};

export default Badge;

