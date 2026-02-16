import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import ResultatsChart from '../../laboratory-analyses/components/ResultatsChart';
import { useAnalysesByPatient } from '../../../hooks/useAnalyses';
import api from '../../../lib/axios';
import { Loader2 } from 'lucide-react';

const PatientAnalysesHistory = ({ patient }) => {
  const navigate = useNavigate();
  const [selectedAnalyse, setSelectedAnalyse] = useState(null);
  const { data: analysesData, isLoading } = useAnalysesByPatient(patient?.id);

  const analyses = analysesData?.data || analysesData || [];

  // Récupérer les résultats pour toutes les analyses terminées
  const { data: allResultatsData } = useQuery({
    queryKey: ['analyses', 'patient', patient?.id, 'resultats'],
    queryFn: async () => {
      if (!patient?.id || !Array.isArray(analyses) || analyses.length === 0) return [];
      
      const analysesTerminees = analyses.filter(a => a.statut === 'terminee');
      const resultatsPromises = analysesTerminees.map(async (analyse) => {
        try {
          const response = await api.get(`/analyses/${analyse.id}/resultats`);
          return {
            analyseId: analyse.id,
            date: analyse.dateResultat || analyse.datePrescription,
            resultats: response.data.success ? response.data.data : []
          };
        } catch (error) {
          return { analyseId: analyse.id, date: analyse.dateResultat || analyse.datePrescription, resultats: [] };
        }
      });
      
      return await Promise.all(resultatsPromises);
    },
    enabled: !!patient?.id && analyses.length > 0,
    retry: 1,
  });

  const historiqueResultats = allResultatsData || [];

  const getStatutBadge = (statut) => {
    const badges = {
      prescrite: { variant: 'info', label: 'Prescrite' },
      en_cours: { variant: 'warning', label: 'En cours' },
      terminee: { variant: 'success', label: 'Terminée' },
      annulee: { variant: 'error', label: 'Annulée' },
      en_attente_validation: { variant: 'warning', label: 'En attente' }
    };
    return badges[statut] || { variant: 'info', label: statut };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Grouper les analyses par type
  const analysesByType = useMemo(() => {
    const grouped = {};
    analyses.forEach(analyse => {
      const type = analyse.typeAnalyse || 'autre';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(analyse);
    });
    return grouped;
  }, [analyses]);

  // Statistiques globales
  const stats = useMemo(() => {
    const analysesArray = Array.isArray(analyses) ? analyses : [];
    const total = analysesArray.length;
    const terminees = analysesArray.filter(a => a.statut === 'terminee').length;
    const enCours = analysesArray.filter(a => a.statut === 'en_cours').length;
    const prescrites = analysesArray.filter(a => a.statut === 'prescrite').length;
    
    return {
      total,
      terminees,
      enCours,
      prescrites,
      tauxCompletion: total > 0 ? ((terminees / total) * 100).toFixed(1) : 0
    };
  }, [analyses]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <EmptyState
        icon="TestTube"
        title="Aucune analyse"
        description="Aucune analyse médicale n'a été prescrite pour ce patient."
        action={
          <Button
            variant="primary"
            iconName="Plus"
            onClick={() => navigate(`/analyses-laboratoire?patientId=${patient?.id}&prescribe=true`)}
          >
            Prescrire une analyse
          </Button>
        }
      />
    );
  }

  // Trouver les résultats pour l'analyse sélectionnée
  const resultatsForSelected = selectedAnalyse 
    ? historiqueResultats.find(h => h.analyseId === selectedAnalyse.id)?.resultats || []
    : [];

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <Icon name="TestTube" size={18} className="text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Total</p>
          </div>
          <p className="text-2xl font-black text-blue-900 dark:text-blue-100">{stats.total}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <Icon name="CheckCircle" size={18} className="text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Terminées</p>
          </div>
          <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100">{stats.terminees}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 rounded-xl p-4 border border-amber-200 dark:border-amber-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Clock" size={18} className="text-amber-600 dark:text-amber-400" />
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">En cours</p>
          </div>
          <p className="text-2xl font-black text-amber-900 dark:text-amber-100">{stats.enCours}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-900/10 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <Icon name="TrendingUp" size={18} className="text-indigo-600 dark:text-indigo-400" />
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">Complétion</p>
          </div>
          <p className="text-2xl font-black text-indigo-900 dark:text-indigo-100">{stats.tauxCompletion}%</p>
        </motion.div>
      </div>

      {/* Graphiques de tendance */}
      {historiqueResultats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
        >
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Icon name="TrendingUp" size={18} className="text-primary" />
            Évolution des résultats dans le temps
          </h4>
          <ResultatsChart 
            resultats={resultatsForSelected} 
            historique={historiqueResultats}
          />
        </motion.div>
      )}

      {/* Liste des analyses par type */}
      <div className="space-y-6">
        {analysesByType && typeof analysesByType === 'object' && Object.entries(analysesByType).map(([type, analysesType]) => (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                {type.replace('_', ' ')} ({analysesType.length})
              </h4>
            </div>

            <div className="space-y-3">
              {Array.isArray(analysesType) && analysesType.map((analyse, idx) => {
                const statutBadge = getStatutBadge(analyse.statut);
                const hasResultats = analyse.statut === 'terminee' && 
                  historiqueResultats.find(h => h.analyseId === analyse.id)?.resultats?.length > 0;
                
                return (
                  <motion.div
                    key={analyse.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border transition-all cursor-pointer ${
                      selectedAnalyse?.id === analyse.id 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedAnalyse(selectedAnalyse?.id === analyse.id ? null : analyse)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon name="TestTube" size={20} className="text-primary" />
                          <div>
                            <h5 className="font-semibold text-slate-900 dark:text-white">
                              {analyse.numeroAnalyse}
                            </h5>
                            {analyse.notesPrescription && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                                {analyse.notesPrescription}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mt-3">
                          <div className="flex items-center gap-1">
                            <Icon name="Calendar" size={14} />
                            <span>Prescrite: {formatDate(analyse.datePrescription)}</span>
                          </div>
                          {analyse.dateResultat && (
                            <div className="flex items-center gap-1">
                              <Icon name="CheckCircle" size={14} className="text-emerald-500" />
                              <span>Résultat: {formatDate(analyse.dateResultat)}</span>
                            </div>
                          )}
                          {analyse.laboratoire && (
                            <div className="flex items-center gap-1">
                              <Icon name="Building" size={14} />
                              <span>{analyse.laboratoire}</span>
                            </div>
                          )}
                        </div>

                        {hasResultats && selectedAnalyse?.id === analyse.id && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                              Résultats disponibles
                            </p>
                            <ResultatsChart 
                              resultats={historiqueResultats.find(h => h.analyseId === analyse.id)?.resultats || []}
                              historique={historiqueResultats.filter(h => h.analyseId === analyse.id)}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        <Badge variant={statutBadge.variant} size="sm">
                          {statutBadge.label}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            iconName="Eye"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/analyses-laboratoire?analyseId=${analyse.id}`);
                            }}
                          >
                            Voir
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PatientAnalysesHistory;

