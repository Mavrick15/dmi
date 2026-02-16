import { useMutation } from '@tanstack/react-query';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';

/**
 * Hook pour gérer les exports de données
 */
export const useExportMutations = () => {
  const { showToast } = useToast();
  
  const handleExportError = (error, defaultMessage) => {
    // Gestion des erreurs de rate limiting
    if (error.response?.status === 429) {
      showToast('Trop de requêtes. Veuillez patienter quelques instants.', 'error');
    } else {
      const message = error.userMessage || defaultMessage;
      showToast(message, 'error');
    }
  };
  
  return {
    exportPatients: useMutation({
      mutationFn: async (params) => {
        try {
          const response = await api.get('/export/patients', { 
            params,
            responseType: 'blob' // Important pour les téléchargements
          });
          
          // Créer un lien de téléchargement
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          
          // Extraire le nom de fichier depuis les headers ou utiliser un nom par défaut
          const contentDisposition = response.headers['content-disposition'];
          let filename = 'patients_export.csv';
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch) filename = filenameMatch[1];
          }
          
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          
          return { success: true };
        } catch (error) {
          handleExportError(error, 'Erreur lors de l\'export des patients.');
          throw error;
        }
      },
      onSuccess: () => {
        showToast('Export des patients démarré avec succès', 'success');
      }
    }),
    
    exportConsultations: useMutation({
      mutationFn: async (params) => {
        try {
          const response = await api.get('/export/consultations', { 
            params,
            responseType: 'blob'
          });
          
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          
          const contentDisposition = response.headers['content-disposition'];
          let filename = 'consultations_export.csv';
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch) filename = filenameMatch[1];
          }
          
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          
          return { success: true };
        } catch (error) {
          handleExportError(error, 'Erreur lors de l\'export des consultations.');
          throw error;
        }
      },
      onSuccess: () => {
        showToast('Export des consultations démarré avec succès', 'success');
      }
    }),
    
    exportInvoices: useMutation({
      mutationFn: async (params) => {
        try {
          const response = await api.get('/export/invoices', { 
            params,
            responseType: 'blob'
          });
          
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          
          const contentDisposition = response.headers['content-disposition'];
          let filename = 'invoices_export.csv';
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch) filename = filenameMatch[1];
          }
          
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          
          return { success: true };
        } catch (error) {
          handleExportError(error, 'Erreur lors de l\'export des factures.');
          throw error;
        }
      },
      onSuccess: () => {
        showToast('Export des factures démarré avec succès', 'success');
      }
    }),

    exportAudit: useMutation({
      mutationFn: async (params) => {
        try {
          const response = await api.get('/export/audit', {
            params,
            responseType: 'blob'
          });
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          const contentDisposition = response.headers['content-disposition'];
          let filename = 'audit_export.csv';
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch) filename = filenameMatch[1];
          }
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          return { success: true };
        } catch (error) {
          handleExportError(error, 'Erreur lors de l\'export des logs d\'audit.');
          throw error;
        }
      },
      onSuccess: () => {
        showToast('Export des logs d\'audit démarré avec succès', 'success');
      }
    })
  };
};

