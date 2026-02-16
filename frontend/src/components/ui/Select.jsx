import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "../../utils/cn";

const Select = React.forwardRef(({
    className,
    buttonClassName,
    options = [],
    value,
    defaultValue,
    placeholder = "Sélectionner...",
    multiple = false,
    disabled = false,
    required = false,
    label,
    description,
    error,
    searchable = false,
    clearable = false,
    loading = false,
    id,
    name,
    onChange,
    onOpenChange,
    ...props
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    // Calculer la position du dropdown
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const updatePosition = () => {
                const rect = containerRef.current.getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + window.scrollY + 6,
                    left: rect.left + window.scrollX,
                    width: rect.width
                });
            };
            
            updatePosition();
            // Mettre à jour la position lors du scroll ou du resize
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isOpen]);

    // Gestion du clic à l'extérieur pour fermer le menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target) &&
                dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                onOpenChange?.(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onOpenChange]);

    // Filtrage des options
    const filteredOptions = searchable && searchTerm
        ? options.filter(option =>
            option?.label?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            String(option?.value)?.toLowerCase()?.includes(searchTerm.toLowerCase())
        )
        : options;

    // Affichage de la valeur sélectionnée
    const getSelectedDisplay = () => {
        if (value === null || value === undefined || value === "") return placeholder;

        if (multiple && Array.isArray(value)) {
            if (value.length === 0) return placeholder;
            if (value.length === 1) {
                const opt = options.find(o => o.value === value[0]);
                return opt ? opt.label : value[0];
            }
            return `${value.length} sélectionnés`;
        }

        const selectedOption = options.find(opt => opt.value === value);
        return selectedOption ? selectedOption.label : placeholder;
    };

    const handleToggle = (e) => {
        e.preventDefault(); // Empêche le rechargement si dans un form
        if (!disabled) {
            setIsOpen(!isOpen);
            onOpenChange?.(!isOpen);
            if (!isOpen) setSearchTerm("");
        }
    };

    const handleOptionSelect = (optionValue, e) => {
        e.stopPropagation(); // Empêche la propagation vers le bouton parent
        if (multiple) {
            const newValue = Array.isArray(value) ? [...value] : [];
            const index = newValue.indexOf(optionValue);
            if (index > -1) {
                newValue.splice(index, 1);
            } else {
                newValue.push(optionValue);
            }
            onChange?.(newValue);
        } else {
            onChange?.(optionValue);
            setIsOpen(false);
            onOpenChange?.(false);
        }
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange?.(multiple ? [] : "");
    };

    const isSelected = (optionValue) => {
        if (multiple && Array.isArray(value)) return value.includes(optionValue);
        return value === optionValue;
    };

    // Vérification si une valeur est présente
    const hasValue = multiple 
        ? (Array.isArray(value) && value.length > 0) 
        : (value !== null && value !== undefined && value !== "");

    const dropdownContent = isOpen ? (
        ReactDOM.createPortal(
            <div
                ref={dropdownRef}
                className="fixed bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl animate-in fade-in-0 zoom-in-95 duration-100"
                style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                    zIndex: 100000
                }}
            >
                {searchable && (
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 rounded-t-xl z-10">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                autoFocus
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                    </div>
                )}

                <div className="py-1 max-h-[200px] overflow-auto custom-scrollbar p-1">
                    {filteredOptions.length === 0 ? (
                        <div className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400 text-center italic">
                            Aucune option trouvée
                        </div>
                    ) : (
                        filteredOptions.map((option) => {
                            const selected = isSelected(option.value);
                            return (
                                <div
                                    key={option.value}
                                    onClick={(e) => !option.disabled && handleOptionSelect(option.value, e)}
                                    className={cn(
                                        "relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors",
                                        selected 
                                            ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-400" 
                                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
                                        option.disabled && "pointer-events-none opacity-50"
                                    )}
                                >
                                    <span className="flex-1 truncate">{option.label}</span>
                                    {selected && (
                                        <Check className="h-4 w-4 ml-2 shrink-0" />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>,
            document.body
        )
    ) : null;

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            {label && (
                <label
                    htmlFor={selectId}
                    className={cn(
                        "block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2",
                        error && "text-rose-500 dark:text-rose-400"
                    )}
                >
                    {label}
                    {required && <span className="text-rose-500 ml-1">*</span>}
                </label>
            )}
            
            <div className="relative">
                <button
                    ref={ref}
                    id={selectId}
                    type="button"
                    onClick={handleToggle}
                    disabled={disabled}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    className={cn(
                        "flex h-10 w-full items-center justify-between rounded-xl border px-4 py-2 text-sm ring-offset-background transition-all duration-200",
                        // Utiliser les mêmes couleurs que les Input pour la cohérence
                        "bg-white dark:bg-slate-900 text-slate-900 dark:text-white", 
                        "border-slate-200 dark:border-slate-800", 
                        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-rose-500 focus:ring-rose-500/20",
                        !hasValue && "text-slate-500 dark:text-slate-400",
                        // Permettre de surcharger avec buttonClassName personnalisée
                        buttonClassName || className
                    )}
                    {...props}
                >
                    <span className="truncate block text-left flex-1">
                        {getSelectedDisplay()}
                    </span>

                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        {loading ? (
                            <svg className="animate-spin h-4 w-4 text-primary" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <>
                                {clearable && hasValue && (
                                    <div
                                        role="button"
                                        onClick={handleClear}
                                        className="p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </div>
                                )}
                                <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
                            </>
                        )}
                    </div>
                </button>
            </div>
            
            {dropdownContent}

            {description && !error && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    {description}
                </p>
            )}
            {error && (
                <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-rose-500 inline-block" />
                    {error}
                </p>
            )}
        </div>
    );
});

Select.displayName = "Select";

export default Select;