import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Composant pour protéger des sections de l'interface basé sur les permissions
 * @param {string|string[]} requiredPermission - Permission(s) requise(s)
 * @param {React.ReactNode} children - Contenu à afficher si la permission est accordée
 * @param {React.ReactNode} fallback - Contenu à afficher si la permission n'est pas accordée (optionnel)
 * @param {boolean} showFallback - Afficher le fallback ou rien (par défaut: false)
 */
const PermissionGuard = ({ 
  requiredPermission, 
  children, 
  fallback = null,
  showFallback = false 
}) => {
  const { hasPermission, isLoading } = usePermissions();

  // Si les permissions sont en cours de chargement, ne rien afficher
  if (isLoading) {
    return null;
  }

  // Vérifier la permission
  if (hasPermission(requiredPermission)) {
    return <>{children}</>;
  }

  // Afficher le fallback si demandé
  if (showFallback) {
    return <>{fallback}</>;
  }

  // Par défaut, ne rien afficher
  return null;
};

export default PermissionGuard;

