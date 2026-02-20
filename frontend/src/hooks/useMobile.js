import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';

// Utilise les données du dashboard pour déterminer le statut de synchronisation
export const useSyncStatus = () => {
  const { showToast } = useToast();

  return useQuery({
  queryKey: ['mobile', 'sync'],
  queryFn: async () => {
      try {
        // Utiliser le dashboard pour obtenir les dernières activités
        const dashboardResponse = await api.get('/dashboard');
        const dashboard = dashboardResponse.data;
        
        // Utiliser les logs d'audit pour déterminer la dernière synchronisation
        const auditResponse = await api.get('/audit', { params: { limit: 1 } });
        const lastLog = auditResponse.data.data?.[0];
        
        const lastSync = lastLog?.timestamp 
          ? new Date(lastLog.timestamp).toString()
          : new Date().toString();
        
        // Déterminer le statut basé sur l'ancienneté de la dernière activité
        const lastSyncDate = new Date(lastSync);
        const now = new Date();
        const diffMinutes = (now - lastSyncDate) / (1000 * 60);
        
        let status = 'synced';
        if (diffMinutes > 60) {
          status = 'outdated';
        } else if (diffMinutes > 15) {
          status = 'syncing';
        }
        
        return {
          lastSync,
          status,
          lastActivity: lastLog?.action || 'Aucune activité récente',
          pendingChanges: dashboard?.metrics?.alerts || 0
        };
      } catch (error) {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        // Retourner un statut par défaut en cas d'erreur
        return {
          lastSync: new Date().toString(),
          status: 'error',
          lastActivity: 'Erreur de connexion',
          pendingChanges: 0
        };
      }
  },
  refetchInterval: 1000 * 30 // Check toutes les 30s
});
};

export const useMobileMutations = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  return {
    triggerSync: useMutation({
        mutationFn: async () => {
        // Invalider les queries pour forcer une resynchronisation
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['patients'] });
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        queryClient.invalidateQueries({ queryKey: ['audit'] });
        
        // Attendre un peu pour simuler la synchronisation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { success: true, message: 'Synchronisation déclenchée' };
      },
      onSuccess: (data) => {
        if (data?.message) {
          showToast(data.message, 'success');
        }
        // Rafraîchir le statut de synchronisation
        queryClient.invalidateQueries({ queryKey: ['mobile', 'sync'] });
      },
      onError: (error) => {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else {
          const message = error.userMessage || 'Erreur lors de la synchronisation.';
          showToast(message, 'error');
        }
      }
    })
  };
};
