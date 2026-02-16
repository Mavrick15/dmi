import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';

export const useFinanceOverview = () => {
  const { showToast } = useToast();

  return useQuery({
  queryKey: ['finance', 'overview'],
    queryFn: async () => {
      try {
        const response = await api.get('/finance/overview');
        return response.data.data || response.data;
      } catch (error) {
        // Ne pas afficher les erreurs 403 dans le catch du queryFn pour éviter la duplication
        // Les erreurs de permission sont permanentes et ne doivent pas être réessayées
        // Gestion des erreurs de rate limiting uniquement
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.response?.status !== 403 && error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    refetchInterval: 1000 * 60, // Rafraîchissement auto toutes les minutes
    refetchOnWindowFocus: true,
    staleTime: 1000 * 30, // Considérer les données comme fraîches pendant 30 secondes
    retry: 1
  });
};

export const useFinanceChart = () => {
  const { showToast } = useToast();
  
  return useQuery({
  queryKey: ['finance', 'chart'],
    queryFn: async () => {
      try {
        const response = await api.get('/finance/chart');
        return response.data.data || response.data;
      } catch (error) {
        // Ne pas afficher les erreurs 403 dans le catch du queryFn pour éviter la duplication
        // Les erreurs de permission sont permanentes et ne doivent pas être réessayées
        // Gestion des erreurs de rate limiting uniquement
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.response?.status !== 403 && error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    refetchInterval: 1000 * 60, // Rafraîchissement auto toutes les minutes
    refetchOnWindowFocus: true,
    staleTime: 1000 * 30, // Considérer les données comme fraîches pendant 30 secondes
    retry: 1
  });
};

export const useOutstandingInvoices = () => {
  const { showToast } = useToast();
  
  return useQuery({
  queryKey: ['finance', 'outstanding'],
    queryFn: async () => {
      try {
        const response = await api.get('/finance/outstanding');
        return response.data.data || response.data;
      } catch (error) {
        // Ne pas afficher les erreurs 403 dans le catch du queryFn pour éviter la duplication
        if (error.response?.status !== 403 && error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    retry: 1
  });
};

export const useFinanceHistory = (params) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['finance', 'history', params],
    queryFn: async () => {
      try {
        const response = await api.get('/finance/history', { params });
        return response.data.data || response.data;
      } catch (error) {
        // Ne pas afficher les erreurs 403 dans le catch du queryFn pour éviter la duplication
        if (error.response?.status !== 403 && error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    placeholderData: (previousData) => previousData,
    refetchInterval: 1000 * 60, // Rafraîchissement auto toutes les minutes
    refetchOnWindowFocus: true,
    staleTime: 1000 * 30, // Considérer les données comme fraîches pendant 30 secondes
    retry: 1
  });
};

export const usePaymentMethods = () => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['finance', 'payment-methods'],
    queryFn: async () => {
      try {
        const response = await api.get('/finance/payment-methods');
        return response.data.data || response.data || [];
      } catch (error) {
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.response?.status !== 403 && error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        return [];
      }
    },
    staleTime: 1000 * 60 * 10, // Considérer les données comme fraîches pendant 10 minutes
    retry: 1
  });
};

export const usePaymentMethodsStats = () => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['finance', 'payment-methods', 'stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/finance/payment-methods/stats');
        return response.data.data || response.data || [];
      } catch (error) {
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.response?.status !== 403 && error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        return [];
      }
    },
    refetchInterval: 1000 * 60 * 5, // Rafraîchissement toutes les 5 minutes
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 2, // Considérer les données comme fraîches pendant 2 minutes
    retry: 1
  });
};

export const useFinanceMutations = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return {
    createInvoice: useMutation({
      mutationFn: async (data) => {
        const response = await api.post('/finance/invoices', data);
        return response.data;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['finance'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        const message = data?.message || 'Facture créée avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        // Ne pas afficher les erreurs 422 (validation) car elles sont gérées par les modales
        if (error.response?.status === 422) {
          return;
        }
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.response?.status === 403) {
          // Pour les erreurs 403, utiliser uniquement le message du backend (déjà dans error.userMessage)
          showToast(error.userMessage || 'Vous n\'avez pas les permissions nécessaires pour cette action.', 'error');
        } else {
          const message = error.response?.data?.message || error.userMessage || 'Erreur lors de la création de la facture.';
          showToast(message, 'error');
        }
      }
    }),
    updateInvoice: useMutation({
      mutationFn: async ({ invoiceId, data }) => {
        const response = await api.put(`/finance/invoices/${invoiceId}`, data);
        return response.data;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['finance'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        const message = data?.message || 'Facture mise à jour avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        // Ne pas afficher les erreurs 422 (validation) car elles sont gérées par les modales
        if (error.response?.status === 422) {
          return;
        }
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.response?.status === 403) {
          // Pour les erreurs 403, utiliser uniquement le message du backend (déjà dans error.userMessage)
          showToast(error.userMessage || 'Vous n\'avez pas les permissions nécessaires pour cette action.', 'error');
        } else {
          const message = error.response?.data?.message || error.userMessage || 'Erreur lors de la mise à jour de la facture.';
          showToast(message, 'error');
        }
      }
    }),
    recordPayment: useMutation({
      mutationFn: async ({ invoiceId, ...paymentData }) => {
        const response = await api.post(`/finance/invoices/${invoiceId}/payment`, paymentData);
        return response.data;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['finance'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        const message = data?.message || 'Paiement enregistré avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        // Ne pas afficher les erreurs 422 (validation) car elles sont gérées par les modales
        if (error.response?.status === 422) {
          return;
        }
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.response?.status === 403) {
          // Pour les erreurs 403, utiliser uniquement le message du backend (déjà dans error.userMessage)
          showToast(error.userMessage || 'Vous n\'avez pas les permissions nécessaires pour cette action.', 'error');
        } else {
          const message = error.response?.data?.message || error.userMessage || 'Erreur lors de l\'enregistrement du paiement.';
          showToast(message, 'error');
        }
      }
    }),
  };
};