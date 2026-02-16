import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';

export const useAppointments = (params, options = {}) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: async () => {
      try {
        const response = await api.get('/appointments', { params });
        return response.data.data || response.data;
      } catch (error) {
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
    keepPreviousData: true,
    refetchInterval: options.refetchInterval || 1000 * 30, // Rafraîchissement auto toutes les 30 secondes
    refetchOnWindowFocus: true,
    staleTime: 1000 * 20, // Considérer les données comme fraîches pendant 20 secondes
    retry: 1,
    ...options
  });
};

export const useDoctors = (params = {}) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['doctors', params],
    queryFn: async () => {
      try {
        const response = await api.get('/doctors', { params });
        return response.data.data || response.data;
      } catch (error) {
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
    retry: 1
  });
};

export const useAppointmentMutations = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const invalidate = () => {
    // Invalider toutes les queries rendez-vous (y compris avec params)
    queryClient.invalidateQueries({ queryKey: ['appointments'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Rafraîchir le dashboard (métriques RDV)
    queryClient.invalidateQueries({ queryKey: ['patients'], exact: false }); // Rafraîchir les patients aussi
  };

  return {
    createAppointment: useMutation({
      mutationFn: async (data) => {
        const response = await api.post('/appointments', data);
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
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
        } else if (error.response?.status === 403) {
          // Pour les erreurs 403, utiliser uniquement le message du backend (déjà dans error.userMessage)
          showToast(error.userMessage || 'Vous n\'avez pas les permissions nécessaires pour cette action.', 'error');
        } else {
          const message = error.userMessage || 'Erreur lors de la création du rendez-vous.';
          showToast(message, 'error');
        }
      }
    }),
    updateAppointmentStatus: useMutation({
      mutationFn: async ({ id, status }) => {
        const response = await api.patch(`/appointments/${id}/status`, { status });
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        if (data?.message) {
          showToast(data.message, 'success');
        }
      },
      onError: (error) => {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else {
          const message = error.userMessage || 'Erreur lors de la mise à jour du rendez-vous.';
          showToast(message, 'error');
        }
      }
    }),
    deleteAppointment: useMutation({
      mutationFn: async (id) => {
        const response = await api.delete(`/appointments/${id}`);
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        if (data?.message) {
          showToast(data.message, 'success');
        }
      },
      onError: (error) => {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else {
          const message = error.userMessage || 'Erreur lors de la suppression du rendez-vous.';
          showToast(message, 'error');
        }
      }
    }),
    updateAppointment: useMutation({
      mutationFn: async ({ id, data }) => {
        const response = await api.patch(`/appointments/${id}`, data);
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        if (data?.message) {
          showToast(data.message, 'success');
        }
      },
      onError: (error) => {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else {
          const message = error.userMessage || 'Erreur lors de la mise à jour du rendez-vous.';
          showToast(message, 'error');
        }
      }
    }),
  };
};

