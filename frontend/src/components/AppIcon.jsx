import { useMemo } from "react";
import * as LucideIcons from "lucide-react";
import { HelpCircle } from "lucide-react";

const Icon = ({
  name,
  size = 24,
  color = "currentColor",
  className = "",
  strokeWidth = 2,
  ...props
}) => {
  // Memoization pour éviter de recalculer à chaque rendu
  const IconComponent = useMemo(() => {
    if (!name) return null;

    // 1. Nettoyage du nom (au cas où il y a des espaces)
    const cleanName = typeof name === 'string' ? name.trim() : '';

    // 2. Récupération de l'icône dans l'objet global LucideIcons
    // On gère la casse (ex: "activity" -> "Activity")
    const normalizedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    
    // Accès direct sécurisé
    const icon = LucideIcons[cleanName] || LucideIcons[normalizedName];

    return icon;
  }, [name]);

  // Rendu de secours si l'icône n'est pas trouvée ou si le nom est invalide
  if (!IconComponent) {
    // On évite de polluer la console en prod, mais utile en dev
    if (process.env.NODE_ENV === 'development' && name) {
      console.warn(`[AppIcon] Icône introuvable : "${name}"`);
    }
    
    return (
      <HelpCircle
        size={size}
        color={color === "currentColor" ? "gray" : color}
        strokeWidth={strokeWidth}
        className={`opacity-50 ${className}`}
        {...props}
      />
    );
  }

  // Rendu de l'icône
  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      {...props}
    />
  );
};

export default Icon;