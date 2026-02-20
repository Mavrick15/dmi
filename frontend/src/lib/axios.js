import axios from 'axios';
import tokenService from '../services/tokenService';

const getBaseUrl = () => {
  if (import.meta.env.PROD) {
    return '/api/v1';
  }

  let url = import.meta.env.VITE_API_URL || 'http://10.0.0.2:5040/api/v1';

  if (window.location.protocol === 'https:' && url.startsWith('http:')) {
    url = url.replace('http:', 'https:');
  }

  return url;
};

const api = axios.create({
  baseURL: getBaseUrl(), 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

let isRefreshing = false;
let failedQueue = [];

api.interceptors.request.use(
  async (config) => {
    const token = tokenService.getAccessToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Rafraîchissement proactif : vérifier si le token est proche de l'expiration
      // et le rafraîchir avant qu'il n'expire (évite les erreurs 401)
      // On ne fait pas ça pour /auth/refresh pour éviter les boucles infinies
      const isAuthEndpoint = config.url?.includes('/auth/refresh') || 
                            config.url?.includes('/auth/login') ||
                            config.url?.includes('/auth/register');
      
      if (!isAuthEndpoint && tokenService.hasRefreshToken()) {
        // Vérifier si le token est proche de l'expiration (dans les 2 prochaines minutes)
        // Note: On ne peut pas vérifier l'expiration exacte côté client sans décoder le token
        // Donc on rafraîchit silencieusement si on a un refresh token disponible
        // Le backend vérifiera si le token est vraiment expiré
        try {
      // Note: Le refresh proactif est désactivé pour l'instant
      // car on ne peut pas vérifier l'expiration exacte sans décoder le token
      // Le refresh se fera automatiquement lors d'une erreur 401
        } catch (e) {
          // Ignorer les erreurs de refresh proactif, la requête continuera avec l'ancien token
          // Si le token est vraiment expiré, le backend retournera 401 et on gérera dans l'intercepteur response
        }
      }
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // Extraire les headers de rate limiting pour monitoring
    const rateLimitHeaders = {
      limit: response.headers['x-ratelimit-limit'],
      remaining: response.headers['x-ratelimit-remaining'],
      reset: response.headers['x-ratelimit-reset'],
    };
    
    // Avertir si on approche de la limite (80%)
    if (rateLimitHeaders.limit && rateLimitHeaders.remaining) {
      const limit = parseInt(rateLimitHeaders.limit, 10);
      const remaining = parseInt(rateLimitHeaders.remaining, 10);
      const percentage = (remaining / limit) * 100;
      
      if (percentage < 20 && process.env.NODE_ENV === 'development') {
        console.warn(`[Rate Limit] Approche de la limite: ${remaining}/${limit} requêtes restantes`);
      }
    }
    
    return response;
  },
  async (error) => {
    if (!error.response) {
      error.userMessage = "Impossible de contacter le serveur. Vérifiez votre connexion.";
      return Promise.reject(error);
    }

    const status = error.response.status;
    const data = error.response.data;
    
    // Gestion améliorée du rate limiting (429)
    if (status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 
                        (data?.error?.details?.retryAfter) || 
                        'quelques instants';
      error.userMessage = data?.error?.message || 
                         `Trop de requêtes. Veuillez réessayer dans ${retryAfter} seconde(s).`;
      error.retryAfter = retryAfter;
      return Promise.reject(error);
    }

    const isAuthEndpoint = error.config.url?.includes('/auth/login') || 
                          error.config.url?.includes('/auth/refresh') ||
                          error.config.url?.includes('/auth/register');
    const isLogoutRequest = error.config._isLogout === true || error.config.url?.includes('/auth/logout');
    
    // Gestion des erreurs 401 : Token expiré ou invalide (ne pas traiter la déconnexion volontaire)
    if (status === 401 && !error.config._retry && !isAuthEndpoint && !isLogoutRequest) {
      error.config._retry = true;
      const msg = data?.error?.message || data?.message || '';
      const isTokenExpired = /expiré|expirée|Token expiré/i.test(msg);

      const expulseUser = (reason) => {
        tokenService.clearTokens();
        localStorage.removeItem('refresh_token');
        sessionStorage.clear();
        isRefreshing = false;
        failedQueue = [];
        error._tokenExpired = reason === 'token_expired';
        if (!window.location.pathname.includes('/portail-connexion')) {
          const query = reason ? `?reason=${reason}` : '';
          window.location.href = `/portail-connexion${query}`;
        }
      };
      
      // Si c'est une erreur sur /auth/refresh, le refresh token est invalide
      if (error.config.url?.includes('/auth/refresh')) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Axios Interceptor] Refresh token échoué, expulsion de l\'utilisateur');
        }
        expulseUser(isTokenExpired ? 'token_expired' : undefined);
        return Promise.reject(error);
      }
      
      // Si un refresh est déjà en cours, mettre la requête en file d'attente
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: error.config });
        });
      }
      
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Axios Interceptor] Token expiré, tentative de rafraîchissement...', {
          hasRefreshToken: !!refreshToken,
          url: error.config.url,
          currentPath: window.location.pathname,
          errorMessage: data?.error?.message,
        });
      }
      
      // Tenter de rafraîchir le token si on a un refresh token
      // Ne pas rafraîchir si on est déjà sur la page de connexion
      if (refreshToken && !window.location.pathname.includes('/portail-connexion')) {
        isRefreshing = true;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[Axios Interceptor] Tentative de refresh du token...', {
            url: error.config.url,
            queueLength: failedQueue.length,
          });
        }
        
        try {
          const refreshAxios = axios.create({
            baseURL: getBaseUrl(),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            timeout: 5000,
          });
          
          const response = await refreshAxios.post('/auth/refresh', { refreshToken });
          
          if (response.data && response.data.success && response.data.token) {
            const newToken = response.data.token;
            tokenService.setTokens(newToken, tokenService.isRememberMe());
            
            // Mettre à jour le refresh token si fourni
            if (response.data.refreshToken) {
              localStorage.setItem('refresh_token', response.data.refreshToken);
            }
            
            if (process.env.NODE_ENV === 'development') {
              console.log('[Axios Interceptor] Token rafraîchi avec succès', {
                queueLength: failedQueue.length,
                url: error.config.url,
              });
            }
            
            // Mettre à jour le header de la requête originale
            error.config.headers.Authorization = `Bearer ${newToken}`;
            error.config._retry = false;
            
            // Traiter toutes les requêtes en file d'attente
            failedQueue.forEach(({ resolve, config }) => {
              config.headers.Authorization = `Bearer ${newToken}`;
              config._retry = false;
              resolve(api(config));
            });
            
            failedQueue = [];
            isRefreshing = false;
            
            // Réessayer la requête originale avec le nouveau token
            return api(error.config);
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[Axios Interceptor] Format de réponse invalide lors du refresh:', response.data);
            }
            
            failedQueue.forEach(({ reject }) => {
              reject(new Error('Format de réponse invalide lors du refresh'));
            });
            failedQueue = [];
            isRefreshing = false;
            expulseUser('token_expired');
            return Promise.reject(new Error('Format de réponse invalide lors du refresh'));
          }
        } catch (refreshError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[Axios Interceptor] Échec du refresh token:', {
              status: refreshError.response?.status,
              message: refreshError.response?.data?.message || refreshError.message,
              data: refreshError.response?.data,
            });
          }
          failedQueue.forEach(({ reject }) => {
            reject(refreshError);
          });
          failedQueue = [];
          isRefreshing = false;
          expulseUser('token_expired');
          return Promise.reject(refreshError);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Axios Interceptor] Aucun refresh token disponible, expulsion');
        }
        expulseUser(isTokenExpired ? 'token_expired' : undefined);
        return Promise.reject(error);
      }
    }

    // Gestion spéciale pour /auth/me : permettre le refresh automatique
    if (status === 401 && error.config?.url?.includes('/auth/me')) {
      // Vérifier si le token a été révoqué (nouvelle connexion depuis un autre appareil)
      const errorMessage = data?.error?.message || '';
      if (errorMessage.includes('déconnectée') || errorMessage.includes('révoqué') || errorMessage.includes('déconnecté')) {
        // Token révoqué : nettoyer et rediriger
        tokenService.clearTokens();
        localStorage.removeItem('refresh_token');
        sessionStorage.clear();
        
        error.userMessage = 'Votre session a été déconnectée car une nouvelle connexion a été établie avec ce compte.';
        error.status = status;
        error.backendData = data;
        error._sessionRevoked = true;
        
        // Rediriger vers la page de connexion si on n'y est pas déjà
        if (!window.location.pathname.includes('/portail-connexion')) {
          setTimeout(() => {
            window.location.href = '/portail-connexion';
          }, 100);
        }
        
        return Promise.reject(error);
      }
      
      // Si le token peut être rafraîchi (canRefresh: true), essayer de le rafraîchir
      if (data?.error?.canRefresh && !error.config._retry) {
        error.config._retry = true;
        
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken && !isRefreshing) {
          isRefreshing = true;
          
          try {
            const refreshAxios = axios.create({
              baseURL: getBaseUrl(),
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              timeout: 5000,
            });
            
            const response = await refreshAxios.post('/auth/refresh', { refreshToken });
            
            if (response.data && response.data.success && response.data.token) {
              const newToken = response.data.token;
              tokenService.setTokens(newToken, tokenService.isRememberMe());
              
              // Réessayer la requête originale avec le nouveau token
              error.config.headers.Authorization = `Bearer ${newToken}`;
              error.config._retry = false;
              isRefreshing = false;
              
              return api(error.config);
            }
          } catch (refreshError) {
            // Si le refresh échoue, continuer avec le comportement normal
            isRefreshing = false;
          }
        }
      }
      
      // Ne pas créer de userMessage, l'erreur sera gérée silencieusement par AuthContext
      // Ne pas logger non plus pour éviter d'afficher le JSON brut
      error.userMessage = null;
      error.status = status;
      error.backendData = data;
      error._silent = true; // Marquer comme silencieuse pour éviter les logs
      return Promise.reject(error);
    }
    
    // Gestion améliorée des erreurs réseau/timeout
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.userMessage = "La requête a pris trop de temps. Veuillez réessayer.";
      error.status = 408;
      return Promise.reject(error);
    }
    
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      error.userMessage = "Erreur de connexion réseau. Vérifiez votre connexion internet.";
      error.status = 0;
      return Promise.reject(error);
    }

    let userMessage = "Une erreur inattendue est survenue.";

    // Ne pas logger les erreurs silencieuses (comme /auth/me 401)
    if (process.env.NODE_ENV === 'development' && !error._silent) {
      // Ne pas logger le data complet si c'est un JSON de log du backend
      const logData = typeof data === 'object' && data !== null && 'level' in data && 'time' in data
        ? { status, url: error.config?.url, message: data?.error?.message || data?.msg }
        : { status, url: error.config?.url, data, errorMessage: data?.error?.message, directMessage: data?.message };
      
      console.log('[Axios Interceptor] Extraction du message d\'erreur:', logData);
    }

    // Extraire le message d'erreur, en gérant les objets JSON de log du backend
    // Détecter si data est un objet de log du backend (contient level, time, pid, etc.)
    const isBackendLog = data && typeof data === 'object' && 'level' in data && 'time' in data && 'error' in data;
    
    if (isBackendLog && data.error) {
        // C'est un log du backend, extraire le message de l'erreur
        const errorObj = data.error;
        if (typeof errorObj === 'object' && errorObj.message) {
            userMessage = errorObj.message;
        } else if (typeof errorObj === 'string') {
            userMessage = errorObj;
        } else {
            userMessage = "Une erreur est survenue.";
        }
    }
    else if (data?.error?.message) {
        // Si c'est un objet JSON de log, extraire le message de l'erreur
        const errorMsg = data.error.message;
        if (typeof errorMsg === 'string' && !errorMsg.startsWith('{')) {
            userMessage = errorMsg;
        } else if (typeof errorMsg === 'object') {
            // Si c'est un objet, essayer d'extraire le message
            userMessage = errorMsg.message || errorMsg.msg || "Une erreur est survenue.";
        } else {
            userMessage = "Une erreur est survenue.";
        }
    } 
    else if (data?.message) {
        const msg = data.message;
        // Vérifier si c'est un JSON brut
        if (typeof msg === 'string' && msg.startsWith('{')) {
            try {
                const parsed = JSON.parse(msg);
                // Si c'est un log du backend, extraire le message
                if (parsed.error && typeof parsed.error === 'object' && parsed.error.message) {
                    userMessage = parsed.error.message;
                } else {
                    userMessage = parsed.error?.message || parsed.msg || "Une erreur est survenue.";
                }
            } catch {
                userMessage = "Une erreur est survenue.";
            }
        } else {
            userMessage = msg;
        }
    } 
    else if (typeof data?.error === 'string') {
        // Vérifier si c'est un JSON brut
        if (data.error.startsWith('{')) {
            try {
                const parsed = JSON.parse(data.error);
                // Si c'est un log du backend, extraire le message
                if (parsed.error && typeof parsed.error === 'object' && parsed.error.message) {
                    userMessage = parsed.error.message;
                } else {
                    userMessage = parsed.error?.message || parsed.msg || "Une erreur est survenue.";
                }
            } catch {
                userMessage = "Une erreur est survenue.";
            }
        } else {
            userMessage = data.error;
        }
    } 
    else if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        userMessage = data.errors.map(err => err.message || err).join(', ');
    } 
    else {
        switch (status) {
            case 400:
                userMessage = "Requête invalide. Veuillez vérifier les données saisies.";
                break;
            case 401:
                const isAuthError = error.config?.url?.includes('/auth/login') || 
                                   error.config?.url?.includes('/auth/register');
                if (isAuthError) {
                    userMessage = data?.error?.message || data?.message || "Identifiants incorrects.";
                } else {
                    userMessage = "Session expirée. Veuillez vous reconnecter.";
                }
                break;
            case 403:
                userMessage = data?.error?.message || data?.message || "Vous n'avez pas les permissions nécessaires pour cette action.";
                break;
            case 404:
                userMessage = "Ressource introuvable.";
                break;
            case 409:
                userMessage = "Conflit détecté. Cette ressource existe déjà ou est en conflit.";
                break;
            case 422:
                userMessage = "Données de validation invalides.";
                break;
            case 429:
                userMessage = "Trop de requêtes. Veuillez patienter quelques instants.";
                break;
            case 500:
                userMessage = "Erreur serveur. Veuillez réessayer plus tard.";
                break;
            case 503:
                userMessage = "Service temporairement indisponible.";
                break;
            default:
                userMessage = "Une erreur inattendue est survenue.";
        }
    }

    error.userMessage = userMessage;
    error.status = status;
    error.backendData = data;

    return Promise.reject(error);
  }
);

export default api;
