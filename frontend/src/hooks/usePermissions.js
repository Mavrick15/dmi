import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/axios';

/**
 * Hook pour récupérer et gérer les permissions de l'utilisateur connecté
 */
export const usePermissions = () => {
  const { user } = useAuth();
  const userRole = user?.role;

  // Récupérer les permissions du rôle de l'utilisateur
  const { data: permissionsData, isLoading, refetch } = useQuery({
    queryKey: ['permissions', userRole],
    queryFn: async () => {
      if (!userRole) return [];
      
      try {
        // Utiliser la route /me pour récupérer les permissions de l'utilisateur connecté
        const response = await api.get(`/permissions/me`);
        if (response.data.success) {
          const perms = response.data.data || [];
          if (process.env.NODE_ENV === 'development') {
            console.log(`[usePermissions] Permissions chargées pour ${userRole}:`, perms);
          }
          return perms;
        }
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[usePermissions] Pas de permissions pour ${userRole}`);
        }
        return [];
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur lors de la récupération des permissions:', error);
        }
        // Gestion des erreurs de rate limiting (silencieuse car hook sans toast)
        if (error.response?.status === 429 && process.env.NODE_ENV === 'development') {
          console.warn('Rate limit atteint pour les permissions');
        }
        return [];
      }
    },
    enabled: !!userRole && userRole !== 'visiteur',
    staleTime: 30 * 1000, // Cache pendant 30 secondes (pour permettre les mises à jour rapides)
    refetchOnWindowFocus: true, // Rafraîchir quand l'utilisateur revient sur la page
  });

  const permissions = permissionsData || [];
  

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   * @param {string|string[]} permissionIds - Permission(s) à vérifier
   * @returns {boolean}
   */
  const hasPermission = (permissionIds) => {
    if (!userRole) return false;
    
    // Si les permissions ne sont pas encore chargées, retourner false
    // (on attend que les permissions soient chargées avant d'autoriser l'accès)
    if (isLoading) return false;
    
    // Si les permissions sont chargées mais vides, l'utilisateur n'a aucune permission
    if (!permissions.length) return false;
    
    // Si c'est un tableau, vérifier si l'utilisateur a au moins une des permissions
    if (Array.isArray(permissionIds)) {
      return permissionIds.some(perm => permissions.includes(perm));
    }
    
    // Sinon, vérifier la permission unique
    return permissions.includes(permissionIds);
  };

  /**
   * Vérifie si l'utilisateur a toutes les permissions spécifiées
   * @param {string[]} permissionIds - Permissions à vérifier
   * @returns {boolean}
   */
  const hasAllPermissions = (permissionIds) => {
    if (!userRole || !permissions.length) return false;
    
    // Vérifier que l'utilisateur a toutes les permissions spécifiées
    // (même pour les admins, les permissions doivent être explicitement définies)
    return permissionIds.every(perm => permissions.includes(perm));
  };

  return {
    permissions,
    isLoading,
    hasPermission,
    hasAllPermissions,
    refetch, // Exposer refetch pour forcer le rafraîchissement
  };
};

