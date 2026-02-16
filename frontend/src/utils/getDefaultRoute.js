/**
 * Détermine la route par défaut selon les permissions de l'utilisateur
 * @param {Array} permissions - Liste des permissions de l'utilisateur
 * @param {string} userRole - Rôle de l'utilisateur (fallback si permissions non chargées)
 * @returns {string} Route par défaut
 */
export const getDefaultRoute = (permissions = [], userRole = null) => {
  // Vérifier les permissions dans l'ordre de priorité
  // (de la plus spécifique à la plus générale)
  
  if (permissions.includes('clinical_view')) {
    return '/console-clinique';
  }
  
  if (permissions.includes('patient_view')) {
    return '/gestion-patients';
  }
  
  if (permissions.includes('inventory_view')) {
    return '/operations-pharmacie';
  }
  
  if (permissions.includes('billing_view')) {
    return '/operations-financieres';
  }
  
  if (permissions.includes('document_view')) {
    return '/gestion-documents';
  }
  
  if (permissions.includes('audit_view')) {
    return '/centre-analytique';
  }
  
  if (permissions.includes('settings_manage')) {
    return '/centre-integration';
  }
  
  if (permissions.includes('permission_manage')) {
    return '/administration-utilisateurs';
  }
  
  // Fallback sur le tableau de bord si l'utilisateur a la permission
  if (permissions.includes('dashboard_view')) {
    return '/tableau-de-bord';
  }
  
  // Si aucune permission n'est trouvée, utiliser le rôle comme dernier recours
  // (ceci ne devrait normalement pas arriver si les permissions sont bien configurées)
  if (userRole) {
    switch (userRole) {
      case 'docteur':
        return '/console-clinique';
      case 'infirmiere':
        return '/gestion-patients';
      case 'pharmacien':
        return '/operations-pharmacie';
      case 'gestionnaire':
        return '/operations-financieres';
      case 'it_specialist':
        return '/centre-integration';
      case 'admin':
        return '/tableau-de-bord';
      default:
        return '/portail-connexion';
    }
  }
  
  // Dernier recours : retourner au portail de connexion
  return '/portail-connexion';
};

