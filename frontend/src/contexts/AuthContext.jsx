import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import api from "../lib/axios";
import tokenService from "../services/tokenService";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- VÉRIFICATION DE SESSION ---
  useEffect(() => {
    const checkSession = async () => {
      const token = tokenService.getAccessToken();
      const storedUser = tokenService.getUser();
      
      if (!token) {
        setLoading(false);
        return;
      }

      // Optimisation UX : Affichage immédiat si données locales présentes
      if (storedUser) {
        try {
          setUser(storedUser);
        } catch (e) {
          // Erreur de parsing - données corrompues, on nettoie
          tokenService.clearTokens();
        }
      }

      try {
        // Vérification réelle côté serveur
        const response = await api.get('/auth/me');

        if (response.data && response.data.success) {
          const freshUser = response.data.user;
          setUser(freshUser);
          tokenService.setUser(freshUser);
        } else {
          throw new Error("Session invalide");
        }
      } catch (error) {
        // Token expiré ou 401 : nettoyer et rediriger (l'intercepteur peut déjà avoir redirigé)
        const is401 = error.response?.status === 401;
        const isTokenExpired = error._tokenExpired || 
          (is401 && /expiré|expirée|Token expiré/i.test(error.response?.data?.error?.message || ''));
        const isSessionRevoked = error._sessionRevoked ||
          (is401 && /déconnectée|révoqué/i.test(error.response?.data?.error?.message || ''));

        if (is401 || error._tokenExpired) {
          tokenService.clearTokens();
          localStorage.removeItem('refresh_token');
          sessionStorage.clear();
          setUser(null);
          if (!window.location.pathname.includes('/portail-connexion')) {
            const reason = isSessionRevoked ? 'session_revoked' : (isTokenExpired ? 'token_expired' : '');
            window.location.href = reason ? `/portail-connexion?reason=${reason}` : '/portail-connexion';
          }
        }
        // Pour les erreurs réseau, on garde la session locale temporairement
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // --- CONNEXION (Sign In) ---
  const signIn = useCallback(async (email, password, rememberMe = false) => {
    try {
      const response = await api.post('/auth/login', { email, password, rememberMe });
      const { user, token, refreshToken, message } = response.data;

      if (!token) throw new Error("Erreur protocole : Token manquant");

      // Utiliser tokenService pour stocker les tokens
      tokenService.setTokens(token, rememberMe);
      tokenService.setUser(user);
      
      // Stocker le refresh token (en production, idéalement dans un cookie httpOnly)
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }

      setUser(user);
      
      // Afficher un message si d'autres sessions ont été déconnectées
      if (message && message.includes('déconnectées')) {
        // Le message sera affiché par le composant de connexion
      }
      
      return { success: true, user, message };
      
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur Login Context:", err);
      }
      
      // C'EST ICI QUE LA CORRECTION OPÈRE :
      // On utilise 'userMessage' préparé par l'intercepteur Axios
      const errorMessage = err.userMessage || "Impossible de se connecter.";

      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }, []);

  // --- DÉCONNEXION (Sign Out) ---
  const signOut = useCallback(async () => {
    try {
      // Appeler le backend pour invalider la session
      await api.post('/auth/logout');
    } catch (e) {
      // Ignorer erreur réseau au logout (on nettoie quand même localement)
      if (process.env.NODE_ENV === 'development') {
        console.warn("Logout serveur échoué (réseau?), nettoyage local effectué.");
      }
    }
    
    // Destruction complète de la session locale
    tokenService.clearTokens();
    localStorage.removeItem('refresh_token');
    localStorage.clear(); // Nettoyer tout le localStorage
    sessionStorage.clear(); // Nettoyer tout le sessionStorage
    setUser(null);
    window.location.href = '/portail-connexion';
  }, []);

  // --- MISE À JOUR DU PROFIL (Mon compte) ---
  const updateUser = useCallback((newUser) => {
    if (newUser && typeof newUser === 'object') {
      setUser(newUser);
      tokenService.setUser(newUser);
    }
  }, []);

  // --- VALEUR DU CONTEXTE ---
  const value = useMemo(() => ({
    user,
    loading,
    signIn,
    signOut,
    updateUser,
    isAuthenticated: !!user,
  }), [user, loading, signIn, signOut, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};