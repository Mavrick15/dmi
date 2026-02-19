import React from 'react';
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn";
import Icon from '../AppIcon';

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] hover:shadow-md",
    {
        variants: {
            variant: {
                default: 
                    "bg-primary text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 border border-transparent",
                destructive: 
                    "bg-rose-500 text-white hover:bg-rose-600 shadow-sm dark:bg-rose-600 dark:hover:bg-rose-700",
                outline: 
                    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
                secondary: 
                    "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
                ghost: 
                    "hover:bg-slate-100 hover:text-slate-900 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                link: 
                    "text-primary underline-offset-4 hover:underline dark:text-blue-400",
                success: 
                    "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/20 dark:bg-emerald-600",
                warning: 
                    "bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-500/20 dark:bg-amber-600",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-lg px-3 text-xs",
                lg: "h-12 rounded-xl px-6 text-base",
                icon: "h-10 w-10",
                xs: "h-7 rounded-md px-2 text-[10px]",
                xl: "h-14 rounded-xl px-8 text-lg",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

const Button = React.forwardRef(({
    className,
    variant,
    size,
    asChild = false,
    children,
    loading = false,
    iconName = null,
    iconPosition = 'left',
    iconSize = null,
    fullWidth = false,
    disabled = false,
    ...props
}, ref) => {
    const Comp = asChild ? Slot : "button";

    // Mapping intelligent des tailles d'icônes par rapport à la taille du bouton
    const iconSizeMap = {
        xs: 12,
        sm: 14,
        default: 18,
        lg: 20,
        xl: 24,
        icon: 20,
    };

    const calculatedIconSize = iconSize || iconSizeMap?.[size] || 18;

    const LoadingSpinner = () => (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );

    const renderIcon = () => {
        if (!iconName) return null;
        return (
            <Icon
                name={iconName}
                size={calculatedIconSize}
                className={cn(
                    "flex-shrink-0",
                    children && iconPosition === 'left' && "mr-2",
                    children && iconPosition === 'right' && "ml-2"
                )}
            />
        );
    };

    // Logique simplifiée pour le contenu
    // Si asChild est true, on rend le children tel quel (c'est à l'utilisateur de gérer l'intérieur)
    // Sinon, on gère le loading et les icônes
    if (asChild) {
        return (
            <Comp
                className={cn(
                    buttonVariants({ variant, size, className }),
                    fullWidth && "w-full"
                )}
                ref={ref}
                disabled={disabled || loading}
                {...props}
            >
                {children}
            </Comp>
        );
    }

    return (
        <Comp
            className={cn(
                buttonVariants({ variant, size, className }),
                fullWidth && "w-full"
            )}
            ref={ref}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <>
                    <LoadingSpinner />
                    {children}
                </>
            ) : (
                <>
                    {iconName && iconPosition === 'left' && renderIcon()}
                    {children}
                    {iconName && iconPosition === 'right' && renderIcon()}
                </>
            )}
        </Comp>
    );
});

Button.displayName = "Button";
export { buttonVariants }; // Export utile si on veut réutiliser les styles ailleurs
export default Button;