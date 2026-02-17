import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export const useDocuments = (params) => {
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['documents', params],
    queryFn: async () => {
      try {
        const response = await api.get('/documents', { params });
        // Le backend retourne une pagination Lucid avec data et meta
        // Format: { data: [...], meta: { total, per_page, current_page, last_page, ... } }
        if (response.data.data && response.data.meta) {
          return response.data;
        }
        // Fallback si la structure est différente
        if (Array.isArray(response.data)) {
          return { data: response.data, meta: {} };
        }
        return response.data;
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
    enabled: !!isAuthenticated,
    keepPreviousData: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    retry: 1
  });
};

export const useDocumentStats = () => {
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['documents', 'stats'],
    enabled: !!isAuthenticated,
    queryFn: async () => {
      try {
        const response = await api.get('/documents/stats');
        return response.data.data || {};
      } catch (error) {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        // Retourner des valeurs par défaut en cas d'erreur
        return {
          totalDocuments: 0,
          archivedDocuments: 0,
          pendingSignatures: 0,
          signedToday: 0,
          totalViews: 0,
          totalDownloads: 0,
          storageUsed: '0 MB'
        };
      }
    },
    refetchOnMount: true, // Rafraîchir à chaque montage
    staleTime: 0, // Les données sont immédiatement considérées comme périmées pour forcer le rafraîchissement
    retry: 1
  });
};

export const usePatientDocuments = (patientId) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['documents', 'patient', patientId],
    queryFn: async () => {
      try {
        const response = await api.get(`/patients/${patientId}/documents`);
        // Le backend retourne directement un tableau ou { data: [...] }
        if (Array.isArray(response.data)) {
          return response.data;
        }
        return response.data.data || [];
      } catch (error) {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        return [];
      }
    },
    enabled: !!patientId,
    retry: 1
  });
};

export const useDocumentMutations = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const invalidate = () => {
    // Invalider et rafraîchir immédiatement toutes les queries documents (y compris avec params)
    queryClient.invalidateQueries({ queryKey: ['documents'], exact: false });
    // Rafraîchir immédiatement les queries actives (celles qui sont actuellement affichées)
    queryClient.refetchQueries({ queryKey: ['documents'], exact: false, type: 'active' });
    // Invalider et rafraîchir les statistiques immédiatement
    queryClient.invalidateQueries({ queryKey: ['documents', 'stats'] });
    queryClient.refetchQueries({ queryKey: ['documents', 'stats'], type: 'active' });
    // Invalider les autres queries liées
    queryClient.invalidateQueries({ queryKey: ['patients'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Rafraîchir le dashboard
  };

  return {
    uploadDocument: useMutation({
      mutationFn: async (formData) => {
        const response = await api.post('/documents', formData, { 
          headers: { 'Content-Type': 'multipart/form-data' } 
        });
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        const message = data?.message || 'Document uploadé avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        // Ne pas afficher les erreurs 422 (validation) car elles sont gérées par les modales
        if (error.response?.status === 422) {
          return;
        }
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else {
          const message = error.userMessage || 'Erreur lors de l\'upload du document.';
          showToast(message, 'error');
        }
      }
    }),
    deleteDocument: useMutation({ 
      mutationFn: async (id) => {
        const response = await api.delete(`/documents/${id}`);
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        const message = data?.message || 'Document supprimé avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        // Ne pas afficher les erreurs 422 (validation) car elles sont gérées par les modales
        if (error.response?.status === 422) {
          return;
        }
        const message = error.userMessage || 'Erreur lors de la suppression du document.';
        showToast(message, 'error');
      }
    }),
    signDocument: useMutation({ 
      mutationFn: async ({id, signatureImage}) => {
        const response = await api.post(`/documents/${id}/sign`, { signatureImage });
        return response.data;
      },
      onSuccess: (data) => {
        // Mettre à jour le cache avec le document signé retourné par le backend
        // La structure de la réponse est { success: true, data: {...}, message: "..." }
        const updatedDocument = data?.data;
        if (updatedDocument) {
          // Mettre à jour toutes les queries documents qui contiennent ce document
          queryClient.setQueriesData(
            { queryKey: ['documents'], exact: false },
            (oldData) => {
              if (!oldData) return oldData;
              
              // Structure paginée: { data: [...], meta: {...} }
              if (oldData.data && Array.isArray(oldData.data)) {
                const updated = oldData.data.map((doc) => 
                  String(doc.id) === String(updatedDocument.id) ? updatedDocument : doc
                );
                return {
                  ...oldData,
                  data: updated
                };
              }
              
              return oldData;
            }
          );
        }
        
        invalidate();
        const message = data?.message || 'Document signé avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        // Ne pas afficher les erreurs 422 (validation) car elles sont gérées par les modales
        if (error.response?.status === 422) {
          return;
        }
        const message = error.userMessage || 'Erreur lors de la signature du document.';
        showToast(message, 'error');
      }
    }),
    // Nouvelles mutations Phase 1-3
    updateTags: useMutation({
      mutationFn: async ({ id, action, tags }) => {
        const response = await api.patch(`/documents/${id}/tags`, { action, tags });
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        const message = data?.message || 'Tags mis à jour avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        // Ne pas afficher les erreurs 422 (validation) car elles sont gérées par les modales
        if (error.response?.status === 422) {
          return;
        }
        const message = error.userMessage || 'Erreur lors de la mise à jour des tags.';
        showToast(message, 'error');
      }
    }),
    shareDocument: useMutation({
      mutationFn: async ({ id, userIds, roleIds, permission, expiresAt }) => {
        const response = await api.post(`/documents/${id}/share`, { 
          userIds, roleIds, permission, expiresAt 
        });
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        const message = data?.message || 'Document partagé avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        // Ne pas afficher les erreurs 422 (validation) car elles sont gérées par les modales
        if (error.response?.status === 422) {
          return;
        }
        const message = error.userMessage || 'Erreur lors du partage du document.';
        showToast(message, 'error');
      }
    }),
    addComment: useMutation({
      mutationFn: async ({ id, content, parentCommentId, annotations }) => {
        const response = await api.post(`/documents/${id}/comments`, { 
          content, parentCommentId, annotations 
        });
        return response.data;
      },
      onSuccess: (data, variables) => {
        // Invalider les commentaires du document spécifique
        queryClient.invalidateQueries({ queryKey: ['documents', variables.id, 'comments'] });
        // Invalider aussi la liste des documents pour mettre à jour les compteurs
        invalidate();
        const message = data?.message || 'Commentaire ajouté avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        // Ne pas afficher les erreurs 422 (validation) car elles sont gérées par les modales
        if (error.response?.status === 422) {
          return;
        }
        const message = error.userMessage || 'Erreur lors de l\'ajout du commentaire.';
        showToast(message, 'error');
      }
    }),
    createApprovalWorkflow: useMutation({
      mutationFn: async ({ id, approvers }) => {
        const response = await api.post(`/documents/${id}/approvals`, { approvers });
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        const message = data?.message || 'Workflow d\'approbation créé avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        // Ne pas afficher les erreurs 422 (validation) car elles sont gérées par les modales
        if (error.response?.status === 422) {
          return;
        }
        const message = error.userMessage || 'Erreur lors de la création du workflow.';
        showToast(message, 'error');
      }
    }),
    processApproval: useMutation({
      mutationFn: async ({ id, stepNumber, status, comment }) => {
        const response = await api.post(`/documents/${id}/approvals/process`, { 
          stepNumber, status, comment 
        });
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        const message = data?.message || 'Approbation traitée avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        // Ne pas afficher les erreurs 422 (validation) car elles sont gérées par les modales
        if (error.response?.status === 422) {
          return;
        }
        const message = error.userMessage || 'Erreur lors du traitement de l\'approbation.';
        showToast(message, 'error');
      }
    }),
    toggleArchive: useMutation({
      mutationFn: async ({ id, action }) => {
        const response = await api.post(`/documents/${id}/archive`, { action });
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        const message = data?.message || (data?.action === 'archive' ? 'Document archivé avec succès' : 'Document désarchivé avec succès');
        showToast(message, 'success');
      },
      onError: (error) => {
        // Ne pas afficher les erreurs 422 (validation) car elles sont gérées par les modales
        if (error.response?.status === 422) {
          return;
        }
        const message = error.userMessage || 'Erreur lors de l\'archivage.';
        showToast(message, 'error');
      }
    }),
    addWatermark: useMutation({
      mutationFn: async ({ id, watermarkText }) => {
        const response = await api.post(`/documents/${id}/watermark`, { watermarkText });
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        const message = data?.message || 'Watermark ajouté avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        // Ne pas afficher les erreurs 422 (validation) car elles sont gérées par les modales
        if (error.response?.status === 422) {
          return;
        }
        const message = error.userMessage || 'Erreur lors de l\'ajout du watermark.';
        showToast(message, 'error');
      }
    }),
    restoreVersion: useMutation({
      mutationFn: async ({ id, versionNumber }) => {
        const response = await api.post(`/documents/${id}/versions/restore`, { versionNumber });
        return response.data;
      },
      onSuccess: (data) => {
        invalidate();
        const message = data?.message || 'Version restaurée avec succès';
        showToast(message, 'success');
      },
      onError: (error) => {
        // Ne pas afficher les erreurs 422 (validation) car elles sont gérées par les modales
        if (error.response?.status === 422) {
          return;
        }
        const message = error.userMessage || 'Erreur lors de la restauration de la version.';
        showToast(message, 'error');
      }
    }),
    exportBulk: useMutation({
      mutationFn: async (documentIds) => {
        const response = await api.post('/documents/export', { documentIds }, {
          responseType: 'blob'
        });
        return response.data;
      },
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `documents_export_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showToast('Export réussi', 'success');
      },
      onError: (error) => {
        // Ne pas afficher les erreurs 422 (validation) car elles sont gérées par les modales
        if (error.response?.status === 422) {
          return;
        }
        const message = error.userMessage || 'Erreur lors de l\'export.';
        showToast(message, 'error');
      }
    }),
    trackView: useMutation({
      mutationFn: async (id) => {
        const response = await api.post(`/documents/${id}/view`);
        return response.data;
      },
      onError: () => {
        // Erreur silencieuse pour le tracking
      }
    }),
    previewDocument: (id) => {
      // Retourne l'URL de prévisualisation
      const baseUrl = api.defaults.baseURL || '';
      return `${baseUrl}/documents/${id}/preview`;
    },
    downloadDocument: (id) => {
      // Retourne l'URL de téléchargement
      const baseUrl = api.defaults.baseURL || '';
      return `${baseUrl}/documents/${id}/download`;
    }
  };
};

// Hook pour récupérer les versions d'un document
export const useDocumentVersions = (documentId) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['documents', documentId, 'versions'],
    queryFn: async () => {
      try {
        const response = await api.get(`/documents/${documentId}/versions`);
        return response.data.data || [];
      } catch (error) {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        return [];
      }
    },
    enabled: !!documentId,
    retry: 1
  });
};

// Hook pour récupérer les commentaires d'un document
export const useDocumentComments = (documentId) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['documents', documentId, 'comments'],
    queryFn: async () => {
      try {
        const response = await api.get(`/documents/${documentId}/comments`);
        return response.data.data || [];
      } catch (error) {
        // Gestion des erreurs de rate limiting
        if (error.response?.status === 429) {
          showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
        } else if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        return [];
      }
    },
    enabled: !!documentId,
    retry: 1
  });
};