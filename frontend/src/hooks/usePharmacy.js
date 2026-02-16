import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';
import { normalizeApiResponse, extractData } from '../utils/apiNormalizers';

export const usePharmacyStats = () => {
  const { showToast } = useToast();

  return useQuery({
  queryKey: ['pharmacy', 'stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/pharmacy/stats');
        return response.data.data || response.data;
      } catch (error) {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    retry: 1
});
};

export const useInventory = (params) => {
  const { showToast } = useToast();
  
  return useQuery({
  queryKey: ['pharmacy', 'inventory', params],
    queryFn: async () => {
      try {
        const response = await api.get('/pharmacy/inventory', { params });
        // Le backend retourne { success: true, data: [...], meta: {...} }
        return {
          data: response.data.data || [],
          meta: response.data.meta || {}
        };
      } catch (error) {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    keepPreviousData: true,
    retry: 1
});
};

export const useExpiryAlerts = () => {
  const { showToast } = useToast();
  
  return useQuery({
  queryKey: ['pharmacy', 'alerts'],
    queryFn: async () => {
      try {
        const response = await api.get('/pharmacy/alerts');
        return response.data.data || response.data;
      } catch (error) {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    retry: 1
});
};

/**
 * Hook pour récupérer les fournisseurs avec pagination
 * Retourne une structure paginée: { data: [...], pagination: {...} }
 */
export const useSuppliers = (params = {}) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: async () => {
      try {
        const response = await api.get('/suppliers', { params });
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
        } else if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    keepPreviousData: true,
    retry: 1
  });
};

export const useRecentOrders = () => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['pharmacy', 'orders', 'recent'],
    queryFn: async () => {
      try {
        const response = await api.get('/pharmacy/orders/recent');
        return response.data.data || response.data;
      } catch (error) {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    retry: 1
});
};

export const usePendingOrders = () => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['pharmacy', 'orders', 'pending'],
    queryFn: async () => {
      try {
        const response = await api.get('/pharmacy/orders/pending');
        return response.data.data || response.data;
      } catch (error) {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    retry: 1
  });
};

export const useMedicationDetails = (id) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['pharmacy', 'medications', id],
    queryFn: async () => {
      try {
        const response = await api.get(`/pharmacy/medications/${id}/details`);
        return response.data.data || response.data;
      } catch (error) {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    enabled: !!id,
    retry: 1
  });
};

export const usePharmacyMutations = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const invalidateAll = () => {
    // Invalider toutes les queries pharmacie (y compris avec params)
    queryClient.invalidateQueries({ queryKey: ['pharmacy'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['inventory'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['suppliers'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Rafraîchir le dashboard (alertes stock)
  };

  const handleSuccess = (data, defaultMessage) => {
    invalidateAll();
    // Support du nouveau format ApiResponse { success: true, data: {...}, message: '...' }
    const message = data?.message || (data?.data && data?.data?.message) || defaultMessage;
    if (message) {
      showToast(message, 'success');
    }
  };

  const handleError = (error, defaultMessage) => {
    // Ne pas afficher les erreurs 422 (validation) car elles sont gérées par les modales
    if (error.response?.status === 422) {
      return;
    }
    // Gestion des erreurs de rate limiting
    if (error.response?.status === 429) {
      showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
    } else {
      const message = error.userMessage || defaultMessage;
      showToast(message, 'error');
    }
  };

  return {
    addMedication: useMutation({
      mutationFn: async (data) => {
        const response = await api.post('/pharmacy/medications', data);
        return response.data;
      },
      onSuccess: (data) => handleSuccess(data, 'Médicament ajouté avec succès'),
      onError: (error) => handleError(error, 'Erreur lors de l\'ajout du médicament')
    }),
    updateMedication: useMutation({
      mutationFn: async ({id, ...data}) => {
        const response = await api.put(`/pharmacy/medications/${id}`, data);
        return response.data;
      },
      onSuccess: (data) => handleSuccess(data, 'Médicament mis à jour avec succès'),
      onError: (error) => handleError(error, 'Erreur lors de la mise à jour du médicament')
    }),
    deleteMedication: useMutation({
      mutationFn: async (id) => {
        const response = await api.delete(`/pharmacy/medications/${id}`);
        return response.data;
      },
      onSuccess: (data) => handleSuccess(data, 'Médicament supprimé avec succès'),
      onError: (error) => handleError(error, 'Erreur lors de la suppression du médicament')
    }),
    adjustStock: useMutation({
      mutationFn: async (data) => {
        const response = await api.post('/pharmacy/inventory/adjust', data);
        return response.data;
      },
      onSuccess: (data) => handleSuccess(data, 'Stock ajusté avec succès'),
      onError: (error) => handleError(error, 'Erreur lors de l\'ajustement du stock')
    }),
    reduceStockForPrescription: useMutation({
      mutationFn: async (medications) => {
        // Réduire le stock pour chaque médicament prescrit
        const promises = medications.map(async (med) => {
          if (!med.id || !med.quantity || med.quantity <= 0) {
            return null;
          }
          // Calculer le nouveau stock (ne peut pas être négatif)
          const newStock = Math.max(0, (med.currentStock || 0) - med.quantity);
          const response = await api.post('/pharmacy/inventory/adjust', {
            medicamentId: med.id,
            realQuantity: newStock,
            reason: `Prescription - ${med.name || 'Médicament'} (${med.quantity} unité(s))`
          });
          return response.data;
        });
        return Promise.all(promises.filter(Boolean));
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['inventory'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['pharmacy'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['alerts'], exact: false });
      },
      onError: (error) => {
        // Ne pas bloquer si la réduction de stock échoue, juste logger
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur lors de la réduction de stock pour prescription:', error);
        }
      }
    }),
    reduceStockForSale: useMutation({
      mutationFn: async (medications) => {
        // Réduire le stock pour chaque médicament vendu
        const promises = medications.map(async (med) => {
          if (!med.medicamentId || !med.quantity || med.quantity <= 0) {
            return null;
          }
          const response = await api.post('/pharmacy/inventory/adjust', {
            medicamentId: med.medicamentId,
            realQuantity: med.currentStock - med.quantity,
            reason: `Vente - ${med.name || 'Médicament'} (${med.quantity} unité(s))`
          });
          return response.data;
        });
        return Promise.all(promises.filter(Boolean));
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['inventory'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['pharmacy'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['alerts'], exact: false });
      },
      onError: (error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur lors de la réduction de stock pour vente:', error);
        }
      }
    }),
    createOrder: useMutation({
      mutationFn: async (data) => {
        const response = await api.post('/pharmacy/orders', data);
        return response.data;
      },
      onSuccess: (data) => {
        handleSuccess(data, 'Commande créée avec succès');
        queryClient.invalidateQueries({ queryKey: ['pharmacy', 'orders'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['pharmacy', 'orders', 'recent'], exact: false });
      },
      onError: (error) => handleError(error, 'Erreur lors de la création de la commande')
    }),
    receiveOrder: useMutation({
      mutationFn: async (id) => {
        const response = await api.post(`/pharmacy/orders/${id}/receive`);
        return response.data;
      },
      onSuccess: (data) => {
        handleSuccess(data, 'Commande réceptionnée avec succès');
        queryClient.invalidateQueries({ queryKey: ['pharmacy', 'orders'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['pharmacy', 'orders', 'recent'], exact: false });
      },
      onError: (error) => handleError(error, 'Erreur lors de la réception de la commande')
    }),
    addSupplier: useMutation({
      mutationFn: async (data) => {
        const response = await api.post('/suppliers', data);
        return response.data;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['suppliers'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['pharmacy'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        if (data?.message) {
          showToast(data.message, 'success');
        }
      },
      onError: (error) => handleError(error, 'Erreur lors de l\'ajout du fournisseur')
    }),
    updateSupplier: useMutation({
      mutationFn: async ({ id, ...data }) => {
        const response = await api.put(`/suppliers/${id}`, data);
        return response.data;
      },
      onSuccess: (data) => {
        handleSuccess(data, 'Fournisseur mis à jour avec succès');
        queryClient.invalidateQueries({ queryKey: ['suppliers'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['pharmacy'], exact: false });
      },
      onError: (error) => handleError(error, 'Erreur lors de la mise à jour du fournisseur')
    }),
    deleteSupplier: useMutation({
      mutationFn: async (id) => {
        const response = await api.delete(`/suppliers/${id}`);
        return response.data;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['suppliers'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['pharmacy'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        if (data?.message) {
          showToast(data.message, 'success');
        }
      },
      onError: (error) => handleError(error, 'Erreur lors de la suppression du fournisseur')
    }),
    markPrescriptionDelivered: useMutation({
          mutationFn: async (id) => {
            const response = await api.patch(`/pharmacy/prescriptions/${id}/deliver`);
            return response.data;
          },
          onSuccess: (data) => {
            handleSuccess(data, 'Prescription marquée comme délivrée avec succès');
            queryClient.invalidateQueries({ queryKey: ['pharmacy', 'prescriptions'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['pharmacy'], exact: false });
          },
          onError: (error) => handleError(error, 'Erreur lors du marquage de la prescription')
        }),
      };
    };

    /**
     * Hook pour récupérer les prescriptions en attente
     */
    export const usePendingPrescriptions = (options = {}) => {
      const { page = 1, limit = 20, search = '', patientId = null } = options;

      return useQuery({
        queryKey: ['pharmacy', 'prescriptions', 'pending', { page, limit, search, patientId }],
        queryFn: async () => {
          try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', limit);
            if (search) params.append('search', search);
            if (patientId) params.append('patientId', patientId);

            const response = await api.get(`/pharmacy/prescriptions/pending?${params.toString()}`);
            return response.data;
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Error fetching pending prescriptions:', error);
            }
            return { success: true, data: [], meta: { total: 0, currentPage: 1, perPage: limit, lastPage: 1 } };
          }
        },
        staleTime: 30000, // 30 secondes
        refetchOnWindowFocus: true,
        retry: 1,
      });
    };