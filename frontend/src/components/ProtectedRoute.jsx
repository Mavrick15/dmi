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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
          <div className="absolute w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <Icon name="ShieldCheck" size={24} className="text-primary animate-pulse" />
        </div>
        <p className="mt-6 text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          Vérification de l'authentification...
        </p>
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
          <div className="absolute w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <Icon name="ShieldCheck" size={24} className="text-primary animate-pulse" />
        </div>
        <p className="mt-6 text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          Chargement des permissions...
        </p>
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