import { useCallback } from 'react';
import api from '../lib/axios';

/**
 * Hook pour enregistrer les actions dans le journal d'audit
 * Permet la traçabilité complète de toutes les opérations du système
 */
export const useAuditLog = () => {

  /**
   * Enregistre une action dans le journal d'audit
   * @param {Object} params - Paramètres de l'audit
   * @param {string} params.action - Type d'action (created, updated, deleted, validated, etc.)
   * @param {string} params.resourceType - Type de ressource (analyse, resultat, patient, etc.)
   * @param {string|number} params.resourceId - ID de la ressource
   * @param {string} params.description - Description de l'action
   * @param {Object} params.metadata - Métadonnées additionnelles (optionnel)
   */
  const logAction = useCallback(async ({
    action,
    resourceType,
    resourceId,
    description,
    metadata = {}
  }) => {
    try {
      // Construire le type d'action complet (ex: analyse_created, resultat_validated)
      const actionType = `${resourceType}_${action}`;
      
      await api.post('/audit', {
        action: actionType,
        resourceId: String(resourceId),
        description
      });
    } catch (error) {
      // Ne pas bloquer l'opération si l'audit échoue
      // Mais logger l'erreur en développement
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors de l\'enregistrement dans l\'audit:', error);
      }
    }
  }, []);

  /**
   * Helpers spécifiques pour les analyses
   */
  const logAnalyseCreated = useCallback((analyseId, analyseData) => {
    return logAction({
      action: 'created',
      resourceType: 'analyse',
      resourceId: analyseId,
      description: `Nouvelle analyse créée: ${analyseData.numeroAnalyse}`,
      metadata: {
        typeAnalyse: analyseData.typeAnalyse,
        patientId: analyseData.patientId,
        priorite: analyseData.priorite
      }
    });
  }, [logAction]);

  const logAnalyseUpdated = useCallback((analyseId, analyseData, changes = {}) => {
    return logAction({
      action: 'updated',
      resourceType: 'analyse',
      resourceId: analyseId,
      description: `Analyse modifiée: ${analyseData.numeroAnalyse}`,
      metadata: {
        changes,
        typeAnalyse: analyseData.typeAnalyse
      }
    });
  }, [logAction]);

  const logAnalyseDeleted = useCallback((analyseId, numeroAnalyse) => {
    return logAction({
      action: 'deleted',
      resourceType: 'analyse',
      resourceId: analyseId,
      description: `Analyse supprimée: ${numeroAnalyse}`,
      metadata: {}
    });
  }, [logAction]);

  const logAnalyseCancelled = useCallback((analyseId, numeroAnalyse, reason = '') => {
    return logAction({
      action: 'cancelled',
      resourceType: 'analyse',
      resourceId: analyseId,
      description: `Analyse annulée: ${numeroAnalyse}`,
      metadata: { reason }
    });
  }, [logAction]);

  /**
   * Helpers spécifiques pour les résultats
   */
  const logResultatCreated = useCallback((resultatId, analyseData, resultatData) => {
    return logAction({
      action: 'created',
      resourceType: 'resultat',
      resourceId: resultatId,
      description: `Résultat ajouté pour analyse ${analyseData.numeroAnalyse}: ${resultatData.parametre}`,
      metadata: {
        analyseId: analyseData.id,
        parametre: resultatData.parametre,
        valeur: resultatData.valeur
      }
    });
  }, [logAction]);

  const logResultatUpdated = useCallback((resultatId, analyseData, resultatData) => {
    return logAction({
      action: 'updated',
      resourceType: 'resultat',
      resourceId: resultatId,
      description: `Résultat modifié pour analyse ${analyseData.numeroAnalyse}: ${resultatData.parametre}`,
      metadata: {
        analyseId: analyseData.id,
        parametre: resultatData.parametre,
        valeur: resultatData.valeur
      }
    });
  }, [logAction]);

  const logResultatValidated = useCallback((resultatId, analyseData, resultatData, validatorData) => {
    return logAction({
      action: 'validated',
      resourceType: 'resultat',
      resourceId: resultatId,
      description: `Résultat validé pour analyse ${analyseData.numeroAnalyse}: ${resultatData.parametre}`,
      metadata: {
        analyseId: analyseData.id,
        parametre: resultatData.parametre,
        validatorName: validatorData.name,
        validatorId: validatorData.id
      }
    });
  }, [logAction]);

  const logResultatCommented = useCallback((resultatId, analyseData, resultatData) => {
    return logAction({
      action: 'commented',
      resourceType: 'resultat',
      resourceId: resultatId,
      description: `Commentaire ajouté pour résultat: ${resultatData.parametre} (Analyse ${analyseData.numeroAnalyse})`,
      metadata: {
        analyseId: analyseData.id,
        parametre: resultatData.parametre
      }
    });
  }, [logAction]);

  return {
    logAction,
    // Analyses
    logAnalyseCreated,
    logAnalyseUpdated,
    logAnalyseDeleted,
    logAnalyseCancelled,
    // Résultats
    logResultatCreated,
    logResultatUpdated,
    logResultatValidated,
    logResultatCommented
  };
};

export default useAuditLog;

