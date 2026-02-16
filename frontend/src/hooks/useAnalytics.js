import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';

export const useAdvancedAnalytics = (params) => {
  const { showToast } = useToast();

  return useQuery({
  queryKey: ['analytics', params],
    queryFn: async () => {
      try {
        const response = await api.get('/pharmacy/analytics', { params });
        return response.data.data || response.data;
      } catch (error) {
        if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 15, // Cache de 15 minutes car lourd
    retry: 1
  });
};

export const useStatsOverview = (params = {}) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['stats', 'overview', params],
    queryFn: async () => {
      try {
        const response = await api.get('/stats/overview', { params });
        return response.data.data || response.data;
      } catch (error) {
        if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 10, // Cache de 10 minutes
    retry: 1
  });
};

export const useStatsPeriod = (params) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['stats', 'period', params],
    queryFn: async () => {
      try {
        // Le backend attend 'start' et 'end', pas 'startDate' et 'endDate'
        const backendParams = params ? {
          start: params.start || params.startDate,
          end: params.end || params.endDate,
          type: params.type || 'daily'
        } : {};
        
        const response = await api.get('/stats/period', { params: backendParams });
        return response.data.data || response.data;
      } catch (error) {
        // Ne pas afficher d'erreur si les paramètres sont manquants (c'est normal au chargement initial)
        if (error.response?.status === 400 && error.response?.data?.message?.includes('requises')) {
          return [];
        }
        if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        return [];
      }
    },
    enabled: !!params && !!params.start && !!params.end, // Ne pas appeler si les paramètres sont manquants
    staleTime: 1000 * 60 * 10,
    retry: 1
  });
};

export const useTopDoctors = (params = {}) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['stats', 'top-doctors', params],
    queryFn: async () => {
      try {
        // Le backend attend 'start' et 'end', pas 'startDate' et 'endDate'
        const backendParams = {
          start: params.start || params.startDate,
          end: params.end || params.endDate,
          limit: params.limit
        };
        // Ne pas envoyer les paramètres undefined
        Object.keys(backendParams).forEach(key => {
          if (backendParams[key] === undefined) {
            delete backendParams[key];
          }
        });
        
        const response = await api.get('/stats/top-doctors', { params: backendParams });
        return response.data.data || response.data;
      } catch (error) {
        if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 15,
    retry: 1
  });
};

export const useRevenueStats = (params) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['stats', 'revenue', params],
    queryFn: async () => {
      try {
        // Le backend attend 'start' et 'end', pas 'startDate' et 'endDate'
        const backendParams = {
          start: params?.start || params?.startDate,
          end: params?.end || params?.endDate,
          period: params?.period || 'monthly'
        };
        // Ne pas envoyer les paramètres undefined
        Object.keys(backendParams).forEach(key => {
          if (backendParams[key] === undefined) {
            delete backendParams[key];
          }
        });
        
        const response = await api.get('/stats/revenue', { params: backendParams });
        return response.data.data || response.data;
      } catch (error) {
        if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 10,
    retry: 1
});
};

export const useDepartmentStats = (params = {}) => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['stats', 'departments', params],
    queryFn: async () => {
      try {
        // Le backend attend 'start' et 'end', pas 'startDate' et 'endDate'
        const backendParams = {
          start: params.start || params.startDate,
          end: params.end || params.endDate
        };
        // Ne pas envoyer les paramètres undefined
        Object.keys(backendParams).forEach(key => {
          if (backendParams[key] === undefined) {
            delete backendParams[key];
          }
        });
        
        const response = await api.get('/stats/departments', { params: backendParams });
        return response.data.data || response.data;
      } catch (error) {
        // Si l'endpoint n'existe pas (404), on retourne null silencieusement pour utiliser les données de topDoctors
        if (error.response?.status === 404) {
          return null;
        }
        // Ne pas afficher d'erreur pour les 404 car c'est normal si l'endpoint n'existe pas encore
        if (error.response?.status !== 404 && error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        return null;
      }
    },
    staleTime: 1000 * 60 * 15,
    retry: 1
  });
};

export const useReportsList = () => {
  const { showToast } = useToast();
  
  return useQuery({
    queryKey: ['analytics', 'reports'],
    queryFn: async () => {
      try {
        // Utiliser les exports disponibles comme rapports
        // Les exports sont disponibles via /export/patients, /export/consultations, /export/invoices
        return [
          {
            id: 'patients',
            name: 'Rapport des Patients',
            description: 'Export complet de tous les patients',
            endpoint: '/export/patients',
            type: 'csv',
            lastGenerated: null
          },
          {
            id: 'consultations',
            name: 'Rapport des Consultations',
            description: 'Export de toutes les consultations',
            endpoint: '/export/consultations',
            type: 'csv',
            lastGenerated: null
          },
          {
            id: 'invoices',
            name: 'Rapport des Factures',
            description: 'Export de toutes les factures',
            endpoint: '/export/invoices',
            type: 'csv',
            lastGenerated: null
          }
        ];
      } catch (error) {
        if (error.userMessage) {
          showToast(error.userMessage, 'error');
        }
        return [];
    }
    },
    staleTime: 1000 * 60 * 30 // Cache de 30 minutes
});
};
