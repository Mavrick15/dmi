/**
 * Utilitaires pour la conversion des filtres Analytics en paramètres API
 */

/**
 * Convertit les filtres de l'interface utilisateur en paramètres API
 * @param {Object} filters - Objet contenant les filtres (dateRange, department, provider, etc.)
 * @returns {Object} Paramètres formatés pour l'API
 */
export const getApiParamsFromFilters = (filters) => {
  const params = {};
  
  // Conversion de la plage de dates
  const now = new Date();
  let startDate, endDate;
  
  switch (filters.dateRange) {
    case 'today': {
      const today = new Date(now);
      startDate = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(now);
      endDate = new Date(todayEnd.setHours(23, 59, 59, 999));
      break;
    }
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = new Date(yesterday);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(yesterday);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case 'last7days': {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      endDate = new Date(now);
      break;
    }
    case 'last30days': {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      endDate = new Date(now);
      break;
    }
    case 'last90days': {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
      endDate = new Date(now);
      break;
    }
    case 'thisMonth': {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now);
      break;
    }
    case 'lastMonth': {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    }
    case 'thisYear': {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now);
      break;
    }
    case 'custom':
      if (filters.customStartDate) {
        startDate = new Date(filters.customStartDate);
      }
      if (filters.customEndDate) {
        endDate = new Date(filters.customEndDate);
      }
      break;
    default: {
      // last30days par défaut
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      endDate = new Date(now);
    }
  }
  
  if (startDate) {
    params.startDate = startDate.toISOString().split('T')[0];
    params.start = startDate.toISOString().split('T')[0]; // Pour compatibilité avec /stats/period
  }
  if (endDate) {
    params.endDate = endDate.toISOString().split('T')[0];
    params.end = endDate.toISOString().split('T')[0]; // Pour compatibilité avec /stats/period
  }
  
  // Ajouter les autres filtres
  if (filters.department && filters.department !== 'all') {
    params.department = filters.department;
  }
  if (filters.provider && filters.provider !== 'all') {
    params.provider = filters.provider;
  }
  
  return params;
};

