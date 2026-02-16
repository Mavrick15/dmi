import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';
import { normalizeApiResponse, extractData } from '../utils/apiNormalizers';

/**
 * Hook pour récupérer les templates de consultation
 * Retourne maintenant une structure paginée: { data: [...], pagination: {...} }
 */
export const useConsultationTemplates = (params = {}) => {
  const { showToast } = useToast();

  return useQuery({
    queryKey: ['clinical', 'templates', params],
    queryFn: async () => {
      try {
        const response = await api.get('/clinical/templates', { params });
        const normalized = normalizeApiResponse(response.data);
        const data = extractData(normalized);
        
        // Si la réponse contient une structure paginée { data: [...], pagination: {...} }
        if (data && typeof data === 'object' && data.data && Array.isArray(data.data)) {
          return {
            data: data.data || [],
            pagination: data.pagination || {
              page: 1,
              limit: 20,
              total: 0,
              totalPages: 0
            }
          };
        }
        
        // Fallback pour les anciennes réponses (tableau direct)
        return {
          data: Array.isArray(data) ? data : [],
          pagination: {
            page: 1,
            limit: 20,
            total: Array.isArray(data) ? data.length : 0,
            totalPages: 1
          }
        };
      } catch (error) {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else {
          const errorMessage = error.userMessage || 'Erreur lors de la récupération des templates de consultation';
          showToast(errorMessage, 'error');
        }
        throw error;
      }
    },
    keepPreviousData: true,
    retry: 1,
  });
};

/**
 * Hook pour récupérer les notes rapides
 * Retourne maintenant une structure paginée: { data: [...], pagination: {...} }
 */
export const useQuickNotes = (params = {}) => {
  const { showToast } = useToast();

  return useQuery({
    queryKey: ['clinical', 'quick-notes', params],
    queryFn: async () => {
      try {
        const response = await api.get('/clinical/quick-notes', { params });
        const normalized = normalizeApiResponse(response.data);
        const data = extractData(normalized);
        
        // Si la réponse contient une structure paginée { data: [...], pagination: {...} }
        if (data && typeof data === 'object' && data.data && Array.isArray(data.data)) {
          return {
            data: data.data || [],
            pagination: data.pagination || {
              page: 1,
              limit: 20,
              total: 0,
              totalPages: 0
            }
          };
        }
        
        // Si la réponse utilise le format AdonisJS standard (meta avec pagination)
        if (normalized.meta && normalized.meta.current_page) {
          return {
            data: Array.isArray(data) ? data : [],
            pagination: {
              page: normalized.meta.current_page || 1,
              limit: normalized.meta.per_page || 20,
              total: normalized.meta.total || 0,
              totalPages: normalized.meta.last_page || 1
            }
          };
        }
        
        // Fallback pour les anciennes réponses (tableau direct)
        return {
          data: Array.isArray(data) ? data : [],
          pagination: {
            page: 1,
            limit: 20,
            total: Array.isArray(data) ? data.length : 0,
            totalPages: 1
          }
        };
      } catch (error) {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else {
          const errorMessage = error.userMessage || 'Erreur lors de la récupération des notes rapides';
          showToast(errorMessage, 'error');
        }
        throw error;
      }
    },
    keepPreviousData: true,
    retry: 1,
  });
};

/**
 * Hook pour rechercher les codes CIM-10
 * Retourne maintenant une structure paginée: { data: [...], pagination: {...} }
 */
export const useCIM10Search = (query = '', category = null, page = 1, limit = 50) => {
  const { showToast } = useToast();

  return useQuery({
    queryKey: ['clinical', 'cim10', query, category, page, limit],
    queryFn: async () => {
      try {
        const params = { page, limit };
        if (query) params.q = query;
        if (category) params.category = category;
        
        const response = await api.get('/clinical/cim10', { params });
        const normalized = normalizeApiResponse(response.data);
        const data = extractData(normalized);
        
        // Si la réponse contient une structure paginée { data: [...], pagination: {...} }
        if (data && typeof data === 'object' && data.data && Array.isArray(data.data)) {
          return {
            data: data.data || [],
            pagination: data.pagination || {
              page: 1,
              limit: 50,
              total: 0,
              totalPages: 0
            }
          };
        }
        
        // Fallback pour les anciennes réponses (tableau direct)
        return {
          data: Array.isArray(data) ? data : [],
          pagination: {
            page: 1,
            limit: 50,
            total: Array.isArray(data) ? data.length : 0,
            totalPages: 1
          }
        };
      } catch (error) {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else {
          const errorMessage = error.userMessage || 'Erreur lors de la recherche de codes CIM-10';
          showToast(errorMessage, 'error');
        }
        throw error;
      }
    },
    enabled: query.length >= 2 || category !== null,
    retry: 1,
  });
};

/**
 * Hook pour récupérer les catégories CIM-10
 */
export const useCIM10Categories = () => {
  const { showToast } = useToast();

  return useQuery({
    queryKey: ['clinical', 'cim10', 'categories'],
    queryFn: async () => {
      try {
        const response = await api.get('/clinical/cim10/categories');
        const normalized = normalizeApiResponse(response.data);
        return extractData(normalized) || [];
      } catch (error) {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else {
          const errorMessage = error.userMessage || 'Erreur lors de la récupération des catégories CIM-10';
          showToast(errorMessage, 'error');
        }
        throw error;
      }
    },
    retry: 1,
  });
};

/**
 * Hook pour les mutations de templates
 */
export const useTemplateMutations = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['clinical', 'templates'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['clinical'], exact: false });
  };

  return {
    createTemplate: useMutation({
      mutationFn: async (data) => {
        const response = await api.post('/clinical/templates', data);
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        const message = data?.message || 'Template créé avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        const errorMessage = error.userMessage || 'Erreur lors de la création du template';
        showToast(errorMessage, 'error');
      },
    }),

    updateTemplate: useMutation({
      mutationFn: async ({ id, ...data }) => {
        const response = await api.put(`/clinical/templates/${id}`, data);
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        const message = data?.message || 'Template mis à jour avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la mise à jour du template';
        showToast(message, 'error');
      },
    }),

    deleteTemplate: useMutation({
      mutationFn: async (id) => {
        const response = await api.delete(`/clinical/templates/${id}`);
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        const message = data?.message || 'Template supprimé avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la suppression du template';
        showToast(message, 'error');
      },
    }),
  };
};

/**
 * Hook pour les mutations de notes rapides
 */
export const useQuickNotesMutations = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['clinical', 'quick-notes'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['clinical'], exact: false });
  };

  return {
    createNote: useMutation({
      mutationFn: async (data) => {
        const response = await api.post('/clinical/quick-notes', data);
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        const message = data?.message || 'Note créée avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la création de la note';
        showToast(message, 'error');
      },
    }),

    useNote: useMutation({
      mutationFn: async (id) => {
        const response = await api.post(`/clinical/quick-notes/${id}/use`);
        return response.data;
      },
      onSuccess: () => {
        invalidate();
      },
      onError: (error) => {
        // Ne pas afficher d'erreur pour l'utilisation d'une note
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur utilisation note:', error);
        }
      },
    }),

    updateNote: useMutation({
      mutationFn: async ({ id, ...data }) => {
        const response = await api.put(`/clinical/quick-notes/${id}`, data);
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        const message = data?.message || 'Note mise à jour avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la mise à jour de la note';
        showToast(message, 'error');
      },
    }),

    deleteNote: useMutation({
      mutationFn: async (id) => {
        const response = await api.delete(`/clinical/quick-notes/${id}`);
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        const message = data?.message || 'Note supprimée avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la suppression de la note';
        showToast(message, 'error');
      },
    }),
  };
};

/**
 * Hook pour utiliser un code CIM-10 (incrémenter le compteur)
 */
export const useCIM10Mutations = () => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['clinical', 'cim10'] });
  };

  return {
    useCode: useMutation({
      mutationFn: async (id) => {
        const response = await api.post(`/clinical/cim10/${id}/use`);
        return response.data;
      },
      onSuccess: () => {
        invalidate();
      },
      onError: (error) => {
        // Ne pas afficher d'erreur pour l'utilisation d'un code
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur utilisation code CIM-10:', error);
        }
      },
    }),
  };
};

