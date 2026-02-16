import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';
import { useAuditLog } from './useAuditLog';
import { normalizeApiResponse, extractData } from '../utils/apiNormalizers';

export const useAnalysesList = (params = {}, options = {}) => {
  const { showToast } = useToast();

  return useQuery({
    queryKey: ['analyses', params],
    queryFn: async () => {
      try {
        const response = await api.get('/analyses', { params });
        const normalized = normalizeApiResponse(response.data);
        return extractData(normalized) || [];
      } catch (error) {
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    keepPreviousData: true,
    refetchInterval: options.refetchInterval || false, // Désactiver le polling automatique, on utilisera l'invalidation
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 0, // Toujours considérer les données comme périmées pour forcer le refetch
    cacheTime: 1000 * 60 * 5, // Garder en cache pendant 5 minutes
    retry: 1,
    ...options
  });
};

export const useAnalyseDetails = (id) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['analyses', id],
    queryFn: async () => {
      try {
        const response = await api.get(`/analyses/${id}`);
        const normalized = normalizeApiResponse(response.data);
        return extractData(normalized);
      } catch (error) {
        // Ne pas afficher d'erreur si l'analyse n'existe pas (404) - elle a probablement été supprimée
        if (error.response?.status !== 404 && error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    enabled: !!id,
    retry: false // Ne pas réessayer si l'analyse n'existe pas
  });
};

export const useAnalysesByPatient = (patientId, options = {}) => {
  return useAnalysesList({ patientId }, options);
};

export const useAnalysesByConsultation = (consultationId, options = {}) => {
  return useAnalysesList({ consultationId }, options);
};

export const useAnalysesStats = () => {
  const { showToast } = useToast();

  return useQuery({
    queryKey: ['analyses', 'stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/analyses/stats');
        const normalized = normalizeApiResponse(response.data);
        return extractData(normalized) || {};
      } catch (error) {
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 0, // Toujours considérer comme périmé pour forcer le refetch
    cacheTime: 1000 * 60 * 5,
    retry: 1
  });
};

export const useAnalysesMutations = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const {
    logAnalyseCreated,
    logAnalyseUpdated,
    logAnalyseDeleted,
    logAnalyseCancelled
  } = useAuditLog();
  
  const invalidate = () => {
    // Invalider toutes les queries liées aux analyses
    queryClient.invalidateQueries({ queryKey: ['analyses'], exact: false });
    // Invalider aussi les stats pour qu'elles se mettent à jour
    queryClient.invalidateQueries({ queryKey: ['analyses', 'stats'] });
    // Refetch immédiatement pour mettre à jour l'interface
    queryClient.refetchQueries({ queryKey: ['analyses'], exact: false });
    queryClient.refetchQueries({ queryKey: ['analyses', 'stats'] });
  };

  return {
    // Mutation pour créer une analyse
    createAnalyse: useMutation({
      mutationFn: async (data) => {
        const response = await api.post('/analyses', data);
        return response.data;
      },
      onSuccess: async (data) => {
        invalidate();
        if (data?.message) {
          showToast(data.message, 'success');
        } else {
          showToast('Analyse prescrite avec succès', 'success');
        }
        // 🔍 Audit: Enregistrer la création
        if (data?.data?.id) {
          await logAnalyseCreated(data.data.id, data.data);
        }
      },
      onError: (error) => {
        if (error.response?.status === 422) {
          return; // Les erreurs de validation sont gérées par les modales
        }
        const message = error.userMessage || 'Erreur lors de la prescription de l\'analyse.';
        showToast(message, 'error');
      }
    }),

    // Mutation pour mettre à jour une analyse
    updateAnalyse: useMutation({
      mutationFn: async ({ id, data }) => {
        const response = await api.put(`/analyses/${id}`, data);
        return { ...response.data, updateId: id, updateData: data };
      },
      onSuccess: async (responseData) => {
        invalidate();
        if (responseData?.message) {
          showToast(responseData.message, 'success');
        } else {
          showToast('Analyse mise à jour avec succès', 'success');
        }
        // 🔍 Audit: Enregistrer la modification
        if (responseData?.updateId) {
          await logAnalyseUpdated(responseData.updateId, responseData.data || {}, responseData.updateData);
        }
      },
      onError: (error) => {
        if (error.response?.status === 422) {
          return;
        }
        const message = error.userMessage || 'Erreur lors de la mise à jour de l\'analyse.';
        showToast(message, 'error');
      }
    }),

    // Mutation pour annuler une analyse
    cancelAnalyse: useMutation({
      mutationFn: async ({ id, numeroAnalyse, reason }) => {
        const response = await api.patch(`/analyses/${id}/cancel`);
        return { ...response.data, cancelledId: id, numeroAnalyse, reason };
      },
      onSuccess: async (data) => {
        invalidate();
        if (data?.message) {
          showToast(data.message, 'success');
        } else {
          showToast('Analyse annulée avec succès', 'success');
        }
        // 🔍 Audit: Enregistrer l'annulation
        if (data?.cancelledId) {
          await logAnalyseCancelled(data.cancelledId, data.numeroAnalyse, data.reason);
        }
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de l\'annulation de l\'analyse.';
        showToast(message, 'error');
      }
    }),

    // Mutation pour supprimer une analyse
    deleteAnalyse: useMutation({
      mutationFn: async ({ id, numeroAnalyse }) => {
        const response = await api.delete(`/analyses/${id}`);
        return { ...response.data, deletedId: id, numeroAnalyse };
      },
      onSuccess: async (data) => {
        // Supprimer l'analyse du cache immédiatement
        if (data.deletedId) {
          queryClient.removeQueries({ queryKey: ['analyses', data.deletedId] });
        }
        invalidate();
        // 🔍 Audit: Enregistrer la suppression
        if (data?.deletedId) {
          await logAnalyseDeleted(data.deletedId, data.numeroAnalyse);
        }
        if (data?.message) {
          showToast(data.message, 'success');
        } else {
          showToast('Analyse supprimée avec succès', 'success');
        }
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la suppression de l\'analyse.';
        showToast(message, 'error');
      }
    })
  };
};

