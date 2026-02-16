import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';

// --- Base de Connaissances ---
export const useKnowledgeBase = (category, search) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['clinical', 'knowledge', category, search],
    queryFn: async () => {
      try {
        const params = {};
        if (category) params.type = category;
        if (search && search.length >= 2) params.search = search;
        
        const response = await api.get('/clinical/knowledge', { params });
        return response.data.data || response.data || [];
      } catch (error) {
        // Ne pas afficher les erreurs 403 dans le catch du queryFn pour éviter la duplication
        // Gestion des erreurs de rate limiting uniquement
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.response?.status !== 403 && error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        return [];
      }
    },
    enabled: !!category,
    staleTime: 1000 * 60 * 5, // Considérer les données comme fraîches pendant 5 minutes
    retry: 1
  });
};

// --- Symptômes Communs ---
export const useCommonSymptoms = (params) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['clinical', 'symptoms', params],
    queryFn: async () => {
      try {
        const response = await api.get('/clinical/symptoms', { params });
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

// --- Examens Communs ---
export const useCommonExams = (params) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['clinical', 'exams', params],
    queryFn: async () => {
      try {
        const response = await api.get('/clinical/exams', { params });
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

// --- Actions Cliniques ---
export const useClinicalMutations = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return {
    saveConsultation: useMutation({
      mutationFn: async (data) => {
        const response = await api.post('/consultations', data);
        return response.data;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['patients'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['appointments'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['finance'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['clinical'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['analyses'], exact: false });
        
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
          const message = error.userMessage || 'Erreur lors de l\'enregistrement de la consultation.';
          showToast(message, 'error');
        }
      }
    })
  };
};
