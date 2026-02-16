import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/axios';
import { extractData, normalizeApiResponse } from '../utils/apiNormalizers';
import { transformPatientData, transformPatientsList } from '../utils/dataTransformers';

export const usePatientsList = (params, options = {}) => {
  const { showToast } = useToast();

  // Mémoriser les params pour éviter les re-renders inutiles
  const memoizedParams = useMemo(() => params, [JSON.stringify(params)]);

  return useQuery({
    queryKey: ['patients', memoizedParams],
    queryFn: async () => {
      try {
        const response = await api.get('/patients', { params: memoizedParams });
        // Normaliser et transformer les données
        return transformPatientsList(response.data);
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
    refetchInterval: options.refetchInterval || 1000 * 60, // Rafraîchissement auto toutes les minutes
    refetchOnWindowFocus: true,
    staleTime: 1000 * 30, // Considérer les données comme fraîches pendant 30 secondes
    retry: 1,
    ...options
  });
};

export const usePatientStats = () => {
  const { showToast } = useToast();

  return useQuery({
  queryKey: ['patients', 'stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/patients/stats');
        const normalized = normalizeApiResponse(response.data);
        return extractData(normalized) || {};
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

export const usePatientDetails = (id) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['patients', id],
    queryFn: async () => {
      try {
        const response = await api.get(`/patients/${id}`);
        const normalized = normalizeApiResponse(response.data);
        const data = extractData(normalized);
        return transformPatientData(data);
      } catch (error) {
        // Ne pas afficher les erreurs 403 dans le catch du queryFn pour éviter la duplication
        if (error.response?.status !== 403 && error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    enabled: !!id,
    retry: 1
});
};

export const usePatientMutations = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  // Mémoriser la fonction d'invalidation pour éviter les re-créations
  const invalidate = useCallback(() => {
    // Invalider toutes les queries patients (y compris avec params)
    queryClient.invalidateQueries({ queryKey: ['patients'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Rafraîchir le dashboard (métriques patients)
  }, [queryClient]);

  return {
    // Mutation pour créer un patient
    createPatient: useMutation({
      mutationFn: async (data) => {
        // Si c'est un FormData (upload de fichier), ajouter le header multipart
        const config = data instanceof FormData 
          ? { headers: { 'Content-Type': 'multipart/form-data' } }
          : {};
        const response = await api.post('/patients', data, config);
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        if (data?.message) {
          showToast(data.message, 'success');
        } else {
          showToast('Patient créé avec succès', 'success');
        }
      },
      onError: (error) => {
        // Ne pas afficher les erreurs 422 (validation) car elles sont gérées par les modales
        if (error.response?.status === 422) {
          return;
        }
        // Pour les erreurs 403, utiliser uniquement le message du backend (déjà dans error.userMessage)
        if (error.response?.status === 403) {
          showToast(error.userMessage || 'Vous n\'avez pas les permissions nécessaires pour cette action.', 'error');
        } else {
          const message = error.userMessage || 'Erreur lors de la création du patient.';
          showToast(message, 'error');
        }
      }
    }),
    // Mutation pour mettre à jour un patient
    updatePatient: useMutation({
      mutationFn: async ({ id, data }) => {
        // Si c'est un FormData (upload de fichier), ajouter le header multipart
        const config = data instanceof FormData 
          ? { headers: { 'Content-Type': 'multipart/form-data' } }
          : {};
        const response = await api.put(`/patients/${id}`, data, config);
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        if (data?.message) {
          showToast(data.message, 'success');
        } else {
          showToast('Patient mis à jour avec succès', 'success');
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
          const message = error.userMessage || 'Erreur lors de la mise à jour du patient.';
          showToast(message, 'error');
        }
      }
    }),
    // Mutation générique pour créer ou mettre à jour (compatibilité)
    savePatient: useMutation({
      mutationFn: async (data) => {
        const response = data.id 
          ? await api.put(`/patients/${data.id}`, data)
          : await api.post('/patients', data);
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
          const message = error.userMessage || 'Erreur lors de la sauvegarde du patient.';
          showToast(message, 'error');
        }
      }
    }),
    // Mutation pour supprimer un patient
    deletePatient: useMutation({
      mutationFn: async (id) => {
        const response = await api.delete(`/patients/${id}`);
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
          const message = error.userMessage || 'Erreur lors de la suppression du patient.';
          showToast(message, 'error');
        }
      }
    }),
    // Note: Les rendez-vous sont maintenant gérés par useAppointmentMutations dans useAppointments.js
  };
};