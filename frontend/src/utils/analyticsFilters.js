/**
 * Utilitaires pour la conversion des filtres Analytics en paramètres API
 */
import { addDaysToBusinessDateKey, getTodayInBusinessTimezone, toBusinessDateKey } from './dateTime';

/**
 * Convertit les filtres de l'interface utilisateur en paramètres API
 * @param {Object} filters - Objet contenant les filtres (dateRange, department, provider, etc.)
 * @returns {Object} Paramètres formatés pour l'API
 */
export const getApiParamsFromFilters = (filters) => {
  const params = {};
  
  // Conversion de la plage de dates
  const now = new Date();
  const todayKey = getTodayInBusinessTimezone();
  let startDate, endDate;
  
  switch (filters.dateRange) {
    case 'today': {
      startDate = todayKey;
      endDate = todayKey;
      break;
    }
    case 'yesterday': {
      const yesterday = addDaysToBusinessDateKey(todayKey, -1);
      startDate = yesterday;
      endDate = yesterday;
      break;
    }
    case 'last7days': {
      startDate = addDaysToBusinessDateKey(todayKey, -7);
      endDate = todayKey;
      break;
    }
    case 'last30days': {
      startDate = addDaysToBusinessDateKey(todayKey, -30);
      endDate = todayKey;
      break;
    }
    case 'last90days': {
      startDate = addDaysToBusinessDateKey(todayKey, -90);
      endDate = todayKey;
      break;
    }
    case 'thisMonth': {
      startDate = `${todayKey.slice(0, 8)}01`;
      endDate = todayKey;
      break;
    }
    case 'lastMonth': {
      const [year, month] = todayKey.split('-').map((v) => Number.parseInt(v, 10));
      const firstCurrentMonth = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));
      firstCurrentMonth.setUTCMonth(firstCurrentMonth.getUTCMonth() - 1);
      const lastMonthYear = firstCurrentMonth.getUTCFullYear();
      const lastMonth = String(firstCurrentMonth.getUTCMonth() + 1).padStart(2, '0');
      startDate = `${lastMonthYear}-${lastMonth}-01`;
      const firstThisMonth = `${todayKey.slice(0, 8)}01`;
      endDate = addDaysToBusinessDateKey(firstThisMonth, -1);
      break;
    }
    case 'thisYear': {
      startDate = `${todayKey.slice(0, 4)}-01-01`;
      endDate = todayKey;
      break;
    }
    case 'custom':
      if (filters.customStartDate) {
        startDate = toBusinessDateKey(filters.customStartDate);
      }
      if (filters.customEndDate) {
        endDate = toBusinessDateKey(filters.customEndDate);
      }
      break;
    default: {
      // last30days par défaut
      startDate = addDaysToBusinessDateKey(todayKey, -30);
      endDate = todayKey;
    }
  }
  
  if (startDate) {
    params.startDate = startDate;
    params.start = startDate; // Pour compatibilité avec /stats/period
  }
  if (endDate) {
    params.endDate = endDate;
    params.end = endDate; // Pour compatibilité avec /stats/period
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

