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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="flex flex-col items-center justify-center py-12 px-6 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-primary bg-white dark:bg-slate-900 shadow-sm">
          <Icon name="Loader2" size={32} className="animate-spin text-primary mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement…</p>
        </div>
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="flex flex-col items-center justify-center py-12 px-6 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-primary bg-white dark:bg-slate-900 shadow-sm">
          <Icon name="Loader2" size={32} className="animate-spin text-primary mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement…</p>
        </div>
      </div>
    );
  }

  // Déterminer la route par défaut selon les permissions
  const defaultRoute = getDefaultRoute(permissions || [], user?.role);
  return <Navigate to={defaultRoute} replace />;
};

export default DefaultRouteRedirect;

