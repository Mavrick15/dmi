import React from "react";
import Icon from "../AppIcon";
import { cn } from "../../utils/cn";

const Checkbox = React.forwardRef(({
    className,
    id,
    checked,
    indeterminate = false,
    disabled = false,
    required = false,
    label,
    description,
    error,
    size = "default",
    ...props
}, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    const sizeClasses = {
        sm: "h-4 w-4",
        default: "h-5 w-5", // Légèrement plus grand pour le confort tactile
        lg: "h-6 w-6"
    };

    const iconSizes = {
        sm: 10,
        default: 14,
        lg: 16
    };

    return (
        <div className={cn("flex items-start space-x-3", className)}>
            <div className="relative flex items-center mt-0.5">
                <input
                    type="checkbox"
                    ref={ref}
                    id={checkboxId}
                    checked={checked}
                    disabled={disabled}
                    required={required}
                    className="sr-only peer" // 'peer' permet de styliser le label quand l'input est focus
                    onChange={props.onChange} // Important pour le fonctionnement
                    {...props}
                />

                <label
                    htmlFor={checkboxId}
                    className={cn(
                        "flex items-center justify-center shrink-0 rounded-lg border transition-all duration-200 cursor-pointer shadow-sm",
                        // Styles de base (Light/Dark)
                        "backdrop-blur-sm bg-white/80 dark:bg-white/10 border-white/50 dark:border-white/15",
                        
                        // Focus ring via le 'peer' (l'input caché)
                        "peer-focus-visible:ring-0 peer-focus-visible:border-white/60 dark:peer-focus-visible:border-white/25",
                        
                        // Taille
                        sizeClasses?.[size],
                        
                        // État Checked / Indeterminate
                        (checked || indeterminate) && "bg-primary border-primary text-white shadow-sm",
                        
                        // État Erreur
                        error && "border-rose-500 ring-rose-500/20",
                        
                        // État Disabled
                        disabled && "cursor-not-allowed opacity-50 bg-slate-100 dark:bg-slate-800 text-slate-400"
                    )}
                >
                    {checked && !indeterminate && (
                        <Icon name="Check" size={iconSizes[size]} className="text-current" />
                    )}
                    {indeterminate && (
                        <Icon name="Minus" size={iconSizes[size]} className="text-current" />
                    )}
                </label>
            </div>
            
            {(label || description || error) && (
                <div className="flex-1 space-y-0.5">
                    {label && (
                        <label
                            htmlFor={checkboxId}
                            className={cn(
                                "text-sm font-medium leading-none cursor-pointer select-none transition-colors",
                                error ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-200",
                                disabled && "cursor-not-allowed opacity-70"
                            )}
                        >
                            {label}
                            {required && <span className="text-rose-500 ml-1">*</span>}
                        </label>
                    )}

                    {description && !error && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {description}
                        </p>
                    )}

                    {error && (
                        <p className="text-xs text-rose-500 dark:text-rose-400 font-medium mt-1">
                            {error}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
});

Checkbox.displayName = "Checkbox";

const CheckboxGroup = React.forwardRef(({
    className,
    children,
    label,
    description,
    error,
    required = false,
    disabled = false,
    ...props
}, ref) => {
    return (
        <fieldset
            ref={ref}
            disabled={disabled}
            className={cn("space-y-3", className)}
            {...props}
        >
            {label && (
                <legend
                    className={cn(
                        "text-sm font-semibold mb-2 block",
                        error ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                    )}
                >
                    {label}
                    {required && <span className="text-rose-500 ml-1">*</span>}
                </legend>
            )}

            {description && !error && (
                <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1.5 mb-3">
                    {description}
                </p>
            )}

            <div className="space-y-3">
                {children}
            </div>

            {error && (
                <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 font-medium">
                    {error}
                </p>
            )}
        </fieldset>
    );
});

CheckboxGroup.displayName = "CheckboxGroup";

export { Checkbox, CheckboxGroup };