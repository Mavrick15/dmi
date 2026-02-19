import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import Icon from './AppIcon';

/**
 * Protège des sections de l'interface selon les permissions (PBAC).
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-primary bg-slate-50/50 dark:bg-slate-800/30 min-h-[120px]">
        <Icon name="Loader2" size={24} className="animate-spin text-primary mb-2" />
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Chargement…</span>
      </div>
    );
  }

  if (hasPermission(requiredPermission)) {
    return <>{children}</>;
  }
  if (showFallback) {
    return <>{fallback}</>;
  }
  return null;
};

export default PermissionGuard;

