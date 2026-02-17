import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import tokenService from '../services/tokenService';

export const useUsers = (params) => {
  const { showToast } = useToast();

  return useQuery({
  queryKey: ['users', params],
    queryFn: async () => {
      try {
        const response = await api.get('/users', { params });
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

// Alias pour compatibilité
export const useUsersList = useUsers;

export const useUserDetails = (id) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      try {
        const response = await api.get(`/users/${id}`);
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

export const useEstablishments = (params) => {
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const hasToken = !!tokenService.getAccessToken();

  return useQuery({
    queryKey: ['establishments', params],
    enabled: !!isAuthenticated && hasToken,
    queryFn: async () => {
      try {
        const response = await api.get('/establishments', { params });
        return {
          data: response.data.data || [],
          meta: response.data.meta || {}
        };
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
    retry: 1
  });
};

// Alias pour compatibilité
export const useEstablishmentsList = useEstablishments;

export const useDepartments = (params) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['departments', params],
    queryFn: async () => {
      try {
        const response = await api.get('/departments', { params });
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

// Alias pour compatibilité
export const useDepartmentsList = useDepartments;

export const useAuditLogs = (params) => {
  const { showToast } = useToast();
  
  return useQuery({
  queryKey: ['audit', params],
    queryFn: async () => {
      try {
        const response = await api.get('/audit', { params });
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
    keepPreviousData: true,
    retry: 1
});
};

export const useAdminMutations = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const invalidateEtabs = () => {
    queryClient.invalidateQueries({ queryKey: ['establishments'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  return {
    saveUser: useMutation({ 
      mutationFn: async (data) => {
        const response = data.id 
          ? await api.put(`/users/${data.id}`, data)
          : await api.post('/users', data);
        return response.data;
      },
      onSuccess: (data) => {
        invalidateUsers();
        const message = data?.message || (data?.id ? 'Utilisateur mis à jour avec succès' : 'Utilisateur créé avec succès');
        showToast(message, 'success');
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la sauvegarde de l\'utilisateur.';
        showToast(message, 'error');
      }
    }),
    deleteUser: useMutation({ 
      mutationFn: async (id) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
      },
      onSuccess: (data) => {
        invalidateUsers();
        if (data?.message) {
          showToast(data.message, 'success');
        }
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la suppression de l\'utilisateur.';
        showToast(message, 'error');
      }
    }),
    saveEstablishment: useMutation({ 
      mutationFn: async (data) => {
        const response = await api.post('/establishments', data);
        return response.data;
      },
      onSuccess: (data) => {
        invalidateEtabs();
        const message = data?.message || 'Établissement créé avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la sauvegarde de l\'établissement.';
        showToast(message, 'error');
      }
    }),
    deleteEstablishment: useMutation({ 
      mutationFn: async (id) => {
        const response = await api.delete(`/establishments/${id}`);
        return response.data;
      },
      onSuccess: (data) => {
        invalidateEtabs();
        const message = data?.message || 'Établissement supprimé avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la suppression de l\'établissement.';
        showToast(message, 'error');
      }
    }),
  };
};

// Hooks séparés pour une meilleure organisation
export const useUserMutations = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const invalidateUsers = () => {
    // Invalider toutes les queries utilisateurs (y compris avec params pour les compteurs)
    queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Rafraîchir le dashboard (métriques utilisateurs)
  };

  return {
    createUser: useMutation({ 
      mutationFn: async (data) => {
        // Si c'est un FormData (upload de fichier), ajouter le header multipart
        const config = data instanceof FormData 
          ? { headers: { 'Content-Type': 'multipart/form-data' } }
          : {};
        const response = await api.post('/users', data, config);
        return response.data;
      },
      onSuccess: (data) => {
        invalidateUsers();
        const message = data?.message || 'Utilisateur créé avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la création de l\'utilisateur.';
        showToast(message, 'error');
      }
    }),
    updateUser: useMutation({ 
      mutationFn: async ({ id, data }) => {
        // Si c'est un FormData (upload de fichier), ajouter le header multipart
        const config = data instanceof FormData 
          ? { headers: { 'Content-Type': 'multipart/form-data' } }
          : {};
        const response = await api.put(`/users/${id}`, data, config);
        return response.data;
      },
      onSuccess: (data) => {
        invalidateUsers();
        const message = data?.message || 'Utilisateur mis à jour avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la mise à jour de l\'utilisateur.';
        showToast(message, 'error');
      }
    }),
    deleteUser: useMutation({ 
      mutationFn: async (id) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
      },
      onSuccess: (data) => {
        invalidateUsers();
        const message = data?.message || 'Utilisateur supprimé avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la suppression de l\'utilisateur.';
        showToast(message, 'error');
      }
    }),
  };
};

export const usePermissionMutations = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return {
    updateRolePermissions: useMutation({
      mutationFn: async ({ role, permissions }) => {
        const response = await api.put(`/permissions/roles/${role}`, { permissions });
        return response.data;
      },
      onSuccess: async (data) => {
        // Invalider toutes les queries de permissions
        await queryClient.invalidateQueries({ queryKey: ['permissions'], exact: false });
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        
        // Forcer un refetch immédiat pour tous les rôles (car un utilisateur peut modifier son propre rôle)
        await queryClient.refetchQueries({ queryKey: ['permissions'], exact: false });
        
        const message = data?.message || 'Permissions mises à jour avec succès. Rafraîchissez la page pour voir les changements.';
        showToast(message, 'success');
      },
      onError: (error) => {
        const message = error.response?.data?.message || error.userMessage || 'Erreur lors de la sauvegarde des permissions.';
        showToast(message, 'error');
      }
    }),
  };
};

export const useEstablishmentMutations = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const invalidateEtabs = () => {
    // Invalider toutes les queries établissements (y compris avec params)
    queryClient.invalidateQueries({ queryKey: ['establishments'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Rafraîchir le dashboard
  };

  return {
    createEstablishment: useMutation({ 
      mutationFn: async (data) => {
        const response = await api.post('/establishments', data);
        return response.data;
      },
      onSuccess: (data) => {
        invalidateEtabs();
        const message = data?.message || 'Établissement créé avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la création de l\'établissement.';
        showToast(message, 'error');
      }
    }),
    updateEstablishment: useMutation({ 
      mutationFn: async ({ id, data }) => {
        const response = await api.put(`/establishments/${id}`, data);
        return response.data;
      },
      onSuccess: (data) => {
        invalidateEtabs();
        const message = data?.message || 'Établissement mis à jour avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la mise à jour de l\'établissement.';
        showToast(message, 'error');
      }
    }),
    deleteEstablishment: useMutation({ 
      mutationFn: async (id) => {
        const response = await api.delete(`/establishments/${id}`);
        return response.data;
      },
      onSuccess: (data) => {
        invalidateEtabs();
        const message = data?.message || 'Établissement supprimé avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la suppression de l\'établissement.';
        showToast(message, 'error');
      }
    }),
  };
};

export const useDepartmentMutations = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const invalidateDepartments = () => {
    queryClient.invalidateQueries({ queryKey: ['departments'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['stats'], exact: false });
  };

  return {
    createDepartment: useMutation({ 
      mutationFn: async (data) => {
        const response = await api.post('/departments', data);
        return response.data;
      },
      onSuccess: (data) => {
        invalidateDepartments();
        const message = data?.message || 'Département créé avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la création du département.';
        showToast(message, 'error');
      }
    }),
    updateDepartment: useMutation({ 
      mutationFn: async ({ id, data }) => {
        const response = await api.put(`/departments/${id}`, data);
        return response.data;
      },
      onSuccess: (data) => {
        invalidateDepartments();
        const message = data?.message || 'Département mis à jour avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la mise à jour du département.';
        showToast(message, 'error');
      }
    }),
    deleteDepartment: useMutation({ 
      mutationFn: async (id) => {
        const response = await api.delete(`/departments/${id}`);
        return response.data;
      },
      onSuccess: (data) => {
        invalidateDepartments();
        const message = data?.message || 'Département supprimé avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        const message = error.userMessage || 'Erreur lors de la suppression du département.';
        showToast(message, 'error');
      }
    }),
  };
};
