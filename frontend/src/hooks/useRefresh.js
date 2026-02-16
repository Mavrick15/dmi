import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

/**
 * Hook global pour rafraîchir toutes les données de l'application
 */
export const useRefresh = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  /**
   * Rafraîchir toutes les données
   */
  const refreshAll = useCallback(async () => {
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        queryClient.invalidateQueries({ queryKey: ['patients'] }),
        queryClient.invalidateQueries({ queryKey: ['consultations'] }),
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
        queryClient.invalidateQueries({ queryKey: ['invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['medications'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
      showToast('Données rafraîchies', 'success');
    } catch (error) {
      showToast('Erreur lors du rafraîchissement', 'error');
    }
  }, [queryClient, showToast]);

  /**
   * Rafraîchir une query spécifique
   */
  const refreshQuery = useCallback(async (queryKey, showNotification = true) => {
    try {
      await queryClient.invalidateQueries({ queryKey });
      if (showNotification) {
        showToast('Données rafraîchies', 'success');
      }
    } catch (error) {
      if (showNotification) {
        showToast('Erreur lors du rafraîchissement', 'error');
      }
    }
  }, [queryClient, showToast]);

  /**
   * Rafraîchir plusieurs queries
   */
  const refreshQueries = useCallback(async (queryKeys, showNotification = true) => {
    try {
      await Promise.all(
        queryKeys.map(key => queryClient.invalidateQueries({ queryKey: key }))
      );
      if (showNotification) {
        showToast('Données rafraîchies', 'success');
      }
    } catch (error) {
      if (showNotification) {
        showToast('Erreur lors du rafraîchissement', 'error');
      }
    }
  }, [queryClient, showToast]);

  return {
    refreshAll,
    refreshQuery,
    refreshQueries,
    queryClient
  };
};

