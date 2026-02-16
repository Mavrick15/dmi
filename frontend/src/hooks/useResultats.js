import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';
import { normalizeApiResponse, extractData } from '../utils/apiNormalizers';
import { useAuditLog } from './useAuditLog';

export const useResultatsByAnalyse = (analyseId) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['resultats', analyseId],
    queryFn: async () => {
      try {
        const response = await api.get(`/analyses/${analyseId}/resultats`);
        const normalized = normalizeApiResponse(response.data);
        return extractData(normalized) || [];
      } catch (error) {
        if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    enabled: !!analyseId,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 0, // Toujours considérer comme périmé pour forcer le refetch
    cacheTime: 1000 * 60 * 5,
    retry: 1
  });
};

export const useResultatsMutations = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const {
    logResultatCreated,
    logResultatUpdated,
    logResultatValidated,
    logResultatCommented
  } = useAuditLog();
  
  const invalidate = (analyseId) => {
    // Invalider les résultats de l'analyse
    queryClient.invalidateQueries({ queryKey: ['resultats', analyseId] });
    queryClient.invalidateQueries({ queryKey: ['resultats'], exact: false });
    // Invalider les analyses pour mettre à jour le statut
    queryClient.invalidateQueries({ queryKey: ['analyses'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['analyses', 'stats'] });
    // Refetch immédiatement
    queryClient.refetchQueries({ queryKey: ['resultats', analyseId] });
    queryClient.refetchQueries({ queryKey: ['analyses'], exact: false });
    queryClient.refetchQueries({ queryKey: ['analyses', 'stats'] });
  };

  return {
    // Mutation pour créer des résultats
    createResultats: useMutation({
      mutationFn: async ({ analyseId, resultats, analyse }) => {
        const response = await api.post(`/analyses/${analyseId}/resultats`, { resultats });
        return { ...response.data, analyseId, resultats, analyse };
      },
      onSuccess: async (data, variables) => {
        invalidate(variables.analyseId);
        if (data?.message) {
          showToast(data.message, 'success');
        } else {
          showToast('Résultats enregistrés avec succès', 'success');
        }
        // 🔍 Audit: Enregistrer la création des résultats
        if (data?.data && Array.isArray(data.data) && data.analyse) {
          for (const resultat of data.data) {
            await logResultatCreated(resultat.id, data.analyse, resultat);
          }
        }
      },
      onError: (error) => {
        if (error.response?.status === 422) {
          return;
        }
        const message = error.userMessage || 'Erreur lors de l\'enregistrement des résultats.';
        showToast(message, 'error');
      }
    }),

    // Mutation pour mettre à jour un résultat
    updateResultat: useMutation({
      mutationFn: async ({ id, data, analyse, isComment = false }) => {
        const response = await api.put(`/analyses/resultats/${id}`, data);
        return { ...response.data, updateId: id, updateData: data, analyse, isComment };
      },
      onSuccess: async (data, variables) => {
        // Trouver l'analyseId depuis les variables ou les données
        const analyseId = variables?.analyseId || data?.analyseId || data?.analyse?.id;
        if (analyseId) {
          queryClient.invalidateQueries({ queryKey: ['resultats', analyseId] });
        }
        queryClient.invalidateQueries({ queryKey: ['resultats'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['analyses'], exact: false });
        // Refetch immédiatement
        if (analyseId) {
          queryClient.refetchQueries({ queryKey: ['resultats', analyseId] });
        }
        queryClient.refetchQueries({ queryKey: ['analyses'], exact: false });
        if (data?.message) {
          showToast(data.message, 'success');
        } else {
          showToast('Résultat mis à jour avec succès', 'success');
        }
        // 🔍 Audit: Enregistrer la modification ou le commentaire
        if (data?.updateId && data?.analyse && data?.data) {
          if (data.isComment) {
            await logResultatCommented(data.updateId, data.analyse, data.data);
          } else {
            await logResultatUpdated(data.updateId, data.analyse, data.data);
          }
        }
      },
      onError: (error) => {
        if (error.response?.status === 422) {
          return;
        }
        const message = error.userMessage || 'Erreur lors de la mise à jour du résultat.';
        showToast(message, 'error');
      }
    }),

    // Mutation pour valider un résultat
                validateResultat: useMutation({
                  mutationFn: async ({ id, signature, analyse, resultat, validator }) => {
                    const response = await api.patch(`/analyses/resultats/${id}/validate`, { signature });
                    return { ...response.data, validateId: id, analyse, resultat, validator };
                  },
      onSuccess: async (data) => {
        // Invalider toutes les queries de résultats
        queryClient.invalidateQueries({ queryKey: ['resultats'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['analyses'], exact: false });
        // Refetch immédiatement
        await queryClient.refetchQueries({ queryKey: ['resultats'], exact: false });
        await queryClient.refetchQueries({ queryKey: ['analyses'], exact: false });
        if (data?.message) {
          showToast(data.message, 'success');
        } else {
          showToast('Résultat validé avec succès', 'success');
        }
        // 🔍 Audit: Enregistrer la validation
        if (data?.validateId && data?.analyse && data?.resultat && data?.validator) {
          await logResultatValidated(data.validateId, data.analyse, data.resultat, data.validator);
        }
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la validation du résultat.';
        showToast(message, 'error');
      }
    })
  };
};


