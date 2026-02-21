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
    default: 'backdrop-blur-md bg-white/50 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-white/40 dark:border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]',
    primary: 'backdrop-blur-md bg-blue-500/15 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-500/20',
    success: 'backdrop-blur-md bg-emerald-500/15 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-500/20',
    warning: 'backdrop-blur-md bg-amber-500/15 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-500/20',
    error: 'backdrop-blur-md bg-rose-500/15 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-500/20',
    info: 'backdrop-blur-md bg-cyan-500/15 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200/60 dark:border-cyan-500/20',
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

