import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { getDefaultRoute } from '../utils/getDefaultRoute';
import Icon from './AppIcon';

/**
 * Composant qui redirige vers la route par défaut selon les permissions de l'utilisateur
 */
const DefaultRouteRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { permissions, isLoading: permissionsLoading } = usePermissions();

  // Attendre que l'authentification soit vérifiée
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

  // Si non authentifié, rediriger vers le portail de connexion
  if (!isAuthenticated || !user) {
    return <Navigate to="/portail-connexion" replace />;
  }

  // Attendre que les permissions soient chargées
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

  // Déterminer la route par défaut selon les permissions
  const defaultRoute = getDefaultRoute(permissions || [], user?.role);
  return <Navigate to={defaultRoute} replace />;
};

export default DefaultRouteRedirect;

