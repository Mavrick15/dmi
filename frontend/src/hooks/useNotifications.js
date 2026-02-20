import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'
import { useToast } from '../contexts/ToastContext'

/**
 * Hook pour récupérer les notifications
 */
export const useNotifications = (options = {}) => {
  const { unreadOnly = false, category = null, page = 1, limit = 50 } = options

  return useQuery({
    queryKey: ['notifications', { unreadOnly, category, page, limit }],
    staleTime: 60 * 1000, // 1 min : éviter le refetch à chaque navigation (Header remonte dans chaque page)
    gcTime: 5 * 60 * 1000, // 5 min : garder le cache pour navigation fluide
    queryFn: async () => {
      try {
        const params = new URLSearchParams()
        if (unreadOnly) params.append('unread_only', 'true')
        if (category) params.append('category', category)
        params.append('page', page)
        params.append('limit', limit)

        const response = await api.get(`/notifications?${params.toString()}`)
        if (process.env.NODE_ENV === 'development') {
          console.log('[useNotifications] Response:', response.data)
        }
        // Le backend retourne { success: true, data: [...], meta: {...} }
        return response.data
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching notifications:', error)
        }
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          // Ne pas afficher de toast ici car useToast n'est pas disponible dans ce hook
          // L'intercepteur axios gérera l'affichage
        }
        // Retourner une structure vide en cas d'erreur
        return { success: true, data: [], meta: { total: 0, unread_count: 0 } }
      }
    },
    refetchInterval: false,
    refetchOnMount: true, // Refetch seulement si données périmées, pas à chaque montage
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

/**
 * Hook pour récupérer le nombre de notifications non lues
 */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      try {
        const response = await api.get('/notifications/unread-count')
        // Le backend retourne { success: true, count: number }
        const count = response.data?.count || response.data?.data?.count || 0
        if (process.env.NODE_ENV === 'development') {
          console.log('[useUnreadCount] Response:', response.data, 'Count:', count)
        }
        return count
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching unread count:', error)
        }
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          // Ne pas afficher de toast ici car useToast n'est pas disponible dans ce hook
          // L'intercepteur axios gérera l'affichage
        }
        return 0
      }
    },
    refetchInterval: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

/**
 * Hook pour les mutations de notifications
 */
export const useNotificationMutations = () => {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const invalidate = async () => {
    // Attendre un court délai pour s'assurer que le backend a fini de traiter la mutation
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Forcer le refetch immédiat depuis le backend (source de vérité unique)
    await queryClient.refetchQueries({ queryKey: ['notifications'], exact: false });
    await queryClient.refetchQueries({ queryKey: ['notifications', 'unread-count'] });
    await queryClient.refetchQueries({ queryKey: ['unreadCount'] });
    await queryClient.refetchQueries({ queryKey: ['dashboard'] }); // Rafraîchir le dashboard (notifications affichées)
  }

  return {
    markAsRead: useMutation({
      mutationFn: async (id) => {
        const response = await api.patch(`/notifications/${id}/read`)
        return response.data
      },
      onSuccess: async (data) => {
        // Invalider les queries pour recharger les données fraîches du backend
        await invalidate()
        // Ne pas afficher de toast si pas de message (notification déjà lue)
        if (data?.message) {
          showToast(data.message, 'success')
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
          const message = error.userMessage || 'Erreur lors de la mise à jour de la notification.'
          showToast(message, 'error')
        }
      },
    }),

    markAllAsRead: useMutation({
      mutationFn: async () => {
        const response = await api.patch('/notifications/read-all')
        return response.data
      },
      onSuccess: async () => {
        // Invalider les queries pour recharger les données fraîches du backend
        await invalidate()
        showToast('Toutes les notifications ont été marquées comme lues', 'success')
      },
      onError: (error) => {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else {
          const message = error.userMessage || 'Erreur lors de la mise à jour des notifications.'
          showToast(message, 'error')
        }
      },
    }),

    archive: useMutation({
      mutationFn: async (id) => {
        const response = await api.delete(`/notifications/${id}`)
        return response.data
      },
      onSuccess: async (data) => {
        // Invalider les queries pour recharger les données fraîches du backend
        await invalidate()
        const message = data?.message || 'Notification supprimée avec succès'
        showToast(message, 'success')
      },
      onError: (error) => {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else {
          const message = error.userMessage || 'Erreur lors de l\'archivage de la notification.'
          showToast(message, 'error')
        }
      },
    }),

    archiveAllRead: useMutation({
      mutationFn: async () => {
        const response = await api.delete('/notifications/archive-read')
        return response.data
      },
      onSuccess: async (data) => {
        // Invalider les queries pour recharger les données fraîches du backend
        await invalidate()
        const count = data?.data?.count || data?.count || 0
        const message = data?.message || `${count} notification(s) supprimée(s)`
        showToast(message, 'success')
      },
      onError: (error) => {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else {
          const message = error.userMessage || 'Erreur lors de la suppression des notifications.'
          showToast(message, 'error')
        }
      },
    }),
  }
}

