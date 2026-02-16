import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';
import { transformDashboardData } from '../utils/dataTransformers';
import { normalizeApiResponse } from '../utils/apiNormalizers';

export const useDashboardData = (options = {}) => {
  const { showToast } = useToast();

  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        const response = await api.get('/dashboard');
        
        // Le backend retourne { success: true, data: {...} }
        // Normaliser la réponse pour extraire les données
        const normalized = normalizeApiResponse(response.data);
        
        // Extraire les données du champ data (ou utiliser directement si déjà transformé)
        const dashboardData = normalized.data || normalized;
        
        // Transformer les données pour une structure cohérente
        // transformDashboardData accepte soit l'objet complet soit juste les données
        return transformDashboardData(dashboardData);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[useDashboard] Erreur lors de la récupération des données:', error);
        }
        // Ne pas afficher les erreurs 403 dans le catch du queryFn pour éviter la duplication
        // Gestion des erreurs de rate limiting uniquement
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.response?.status !== 403 && error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    refetchInterval: options.refetchInterval || 1000 * 30, // Rafraîchissement auto toutes les 30 secondes par défaut
    refetchOnWindowFocus: true, // Rafraîchir quand la fenêtre reprend le focus
    refetchOnMount: true, // Rafraîchir à chaque montage
    staleTime: 1000 * 20, // Considérer les données comme fraîches pendant 20 secondes
    retry: 1,
    ...options
  });
};