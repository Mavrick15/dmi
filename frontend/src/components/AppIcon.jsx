import { useMemo } from "react";
import * as LucideIcons from "lucide-react";
import { HelpCircle } from "lucide-react";

/**
 * Wrapper d'icônes Lucide pour le projet. Utiliser uniquement ce composant pour les icônes UI.
 * @param {string} name - Nom de l'icône (ex: "Check", "Loader2")
 * @param {number} size - Taille en px
 * @param {string} className - Classes Tailwind (ex: "text-primary")
 */
const Icon = ({
  name,
  size = 24,
  color = "currentColor",
  className = "",
  strokeWidth = 2,
  ...props
}) => {
  const IconComponent = useMemo(() => {
    if (!name) return null;
    const cleanName = typeof name === "string" ? name.trim() : "";
    const normalizedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    return LucideIcons[cleanName] || LucideIcons[normalizedName];
  }, [name]);

  if (!IconComponent) {
    if (process.env.NODE_ENV === "development" && name) {
      console.warn(`[AppIcon] Icône introuvable : "${name}"`);
    }
    return (
      <HelpCircle
        size={size}
        strokeWidth={strokeWidth}
        className={`text-slate-400 dark:text-slate-500 opacity-60 ${className}`}
        {...props}
      />
    );
  }

  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={`transition-colors duration-200 ${className}`}
      {...props}
    />
  );
};

export default Icon;