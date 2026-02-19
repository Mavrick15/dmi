import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { getDefaultRoute } from '../utils/getDefaultRoute';
import Icon from './AppIcon';

/**
 * Composant de Route Protégée avec gestion des permissions (PBAC)
 * Les permissions sont entièrement gérées par le backend
 * @param {string|string[]} requiredPermission - Permission(s) requise(s) pour accéder à la route
cd  * @param {boolean} authOnly - Si true, seul l'authentification est requise (ex: Mon compte)
 */
const ProtectedRoute = ({ requiredPermission = null, authOnly = false }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const { hasPermission, isLoading: permissionsLoading, permissions } = usePermissions();
  const location = useLocation();

  // 1. Écran de chargement pendant la vérification du token
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="flex flex-col items-center justify-center py-12 px-6 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-primary bg-white dark:bg-slate-900 shadow-sm">
          <Icon name="Loader2" size={32} className="animate-spin text-primary mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement…</p>
        </div>
      </div>
    );
  }

  // 2. Vérification de l'authentification de base
  if (!isAuthenticated || !user) {
    return <Navigate to="/portail-connexion" state={{ from: location }} replace />;
  }

  // 3. Route "auth only" (ex: Mon compte) : pas de permission requise
  if (authOnly) {
    return <Outlet />;
  }

  // 4. Une permission est OBLIGATOIRE - ATTENDRE que les permissions soient chargées
  if (!requiredPermission) {
    // Si aucune permission n'est spécifiée, refuser l'accès par défaut
    if (process.env.NODE_ENV === 'development') {
      console.warn('Route protégée sans permission spécifiée. Accès refusé par sécurité.');
    }
    const defaultRoute = getDefaultRoute([], user?.role);
    return <Navigate to={defaultRoute} replace />;
  }

  if (permissionsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="flex flex-col items-center justify-center py-12 px-6 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-primary bg-white dark:bg-slate-900 shadow-sm">
          <Icon name="Loader2" size={32} className="animate-spin text-primary mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement…</p>
        </div>
      </div>
    );
  }

  // 5. Vérification des Permissions (PBAC) - Uniquement basé sur les permissions du backend
  if (!hasPermission(requiredPermission)) {
    // Rediriger vers la page par défaut selon les permissions de l'utilisateur
    const defaultRoute = getDefaultRoute(permissions || [], user?.role);
    return <Navigate to={defaultRoute} replace />;
  }

  // 6. Accès autorisé
  return <Outlet />;
};

export default ProtectedRoute;