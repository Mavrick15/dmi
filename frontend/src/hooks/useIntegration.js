import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';
import { formatShortDateTimeInBusinessTimezone } from '../utils/dateTime';

// Utilise les webhooks comme proxy pour les intégrations
export const useIntegrationsList = () => {
  const { showToast } = useToast();

  return useQuery({
  queryKey: ['integrations'],
  queryFn: async () => {
      try {
        // Utiliser les webhooks comme intégrations enregistrées
        const response = await api.get('/webhooks');
        const webhooks = response.data.data || [];
        
        // Transformer les webhooks en format intégration
        return webhooks.map((webhook, index) => ({
          id: webhook.id || `webhook-${index}`,
          name: webhook.event || 'Webhook',
          provider: 'Système',
          category: 'webhook',
          icon: 'Webhook',
          status: 'connected',
          description: `Webhook pour l'événement: ${webhook.event}`,
          url: webhook.url,
          lastSync: formatShortDateTimeInBusinessTimezone(webhook.createdAt || new Date())
        }));
      } catch (error) {
        // Si l'endpoint n'existe pas (404), retourner un tableau vide silencieusement
        if (error.response?.status === 404) {
          return [];
        }
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        return [];
      }
    },
    retry: false
  });
};

export const useDataFlows = () => {
  const { showToast } = useToast();
  
  return useQuery({
  queryKey: ['integrations', 'flows'],
  queryFn: async () => {
      try {
        // Utiliser les logs d'audit pour simuler les flux de données
        const auditResponse = await api.get('/audit', { 
          params: { 
            limit: 20,
            actionType: 'data_sync' // Filtrer par type si disponible
          } 
        });
        const logs = auditResponse.data.data || [];
        
        // Transformer les logs en flux de données
        return logs.map(log => ({
          id: log.id,
          source: 'Système',
          destination: log.target || 'Base de données',
          type: 'sync',
          status: log.status === 'Success' ? 'active' : 'error',
          description: log.action,
          lastActivity: log.timestamp
        }));
      } catch (error) {
        // Si l'endpoint n'existe pas (404), retourner un tableau vide silencieusement
        if (error.response?.status === 404) {
          return [];
        }
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        return [];
      }
    },
    retry: false
});
};

export const useIntegrationMutations = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  return {
    connectIntegration: useMutation({
      mutationFn: async (data) => {
        // Utiliser l'endpoint webhook pour enregistrer une intégration
        const response = await api.post('/webhooks', {
          event: data.event || 'integration.connected',
          url: data.url
        });
        return response.data;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['integrations'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['webhooks'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        if (data?.message) {
          showToast(data.message, 'success');
        }
      },
      onError: (error) => {
        // Ne pas afficher les erreurs 422 (validation) car elles sont gérées par les modales
        if (error.response?.status === 422) {
          return;
        }
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else {
          const message = error.userMessage || 'Erreur lors de la connexion de l\'intégration.';
          showToast(message, 'error');
        }
      }
    }),
    disconnectIntegration: useMutation({
      mutationFn: async (data) => {
        // Supprimer le webhook correspondant
        const response = await api.delete('/webhooks', { data });
        return response.data;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['integrations'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['webhooks'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        if (data?.message) {
          showToast(data.message, 'success');
        }
      },
      onError: (error) => {
        // Ne pas afficher les erreurs 422 (validation) car elles sont gérées par les modales
        if (error.response?.status === 422) {
          return;
        }
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else {
          const message = error.userMessage || 'Erreur lors de la déconnexion de l\'intégration.';
          showToast(message, 'error');
        }
      }
    })
  };
};
