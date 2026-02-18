import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import ResultatsChart from '../../laboratory-analyses/components/ResultatsChart';
import { useAnalysesByPatient } from '../../../hooks/useAnalyses';
import api from '../../../lib/axios';
import { Loader2 } from 'lucide-react';

const EmptyBlock = ({ icon, title, description, action, className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-14 px-6 text-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 ${className}`}>
    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700 shadow-sm">
      <Icon name={icon} size={28} className="text-slate-400 dark:text-slate-500" />
    </div>
    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5">{description}</p>
    {action}
  </div>
);

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

  const getStatutAccent = (statut) => {
    switch (statut) {
      case 'terminee': return 'bg-emerald-500';
      case 'en_cours': return 'bg-amber-500';
      case 'annulee': return 'bg-rose-500';
      case 'en_attente_validation': return 'bg-amber-400';
      default: return 'bg-blue-500';
    }
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
      <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={36} />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement des analyses...</p>
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <EmptyBlock
        icon="TestTube"
        title="Aucune analyse"
        description="Aucune analyse médicale n'a été prescrite pour ce patient."
        action={
          patient && (
            <Button
              variant="outline"
              size="sm"
              iconName="Plus"
              onClick={() => navigate(`/analyses-laboratoire?patientId=${patient?.id}&prescribe=true`)}
              className="rounded-xl"
            >
              Prescrire une analyse
            </Button>
          )
        }
      />
    );
  }

  // Trouver les résultats pour l'analyse sélectionnée
  const resultatsForSelected = selectedAnalyse 
    ? historiqueResultats.find(h => h.analyseId === selectedAnalyse.id)?.resultats || []
    : [];

  return (
    <div className="space-y-5">
      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl p-3 border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-900/20">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="TestTube" size={16} className="text-blue-600 dark:text-blue-400" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Total</p>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">{stats.total}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl p-3 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-900/20">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="CheckCircle" size={16} className="text-emerald-600 dark:text-emerald-400" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Terminées</p>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">{stats.terminees}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl p-3 border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-900/20">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="Clock" size={16} className="text-amber-600 dark:text-amber-400" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">En cours</p>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">{stats.enCours}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl p-3 border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-900/20">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="TrendingUp" size={16} className="text-indigo-600 dark:text-indigo-400" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Complétion</p>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">{stats.tauxCompletion}%</p>
        </motion.div>
      </div>

      {/* Graphiques de tendance */}
      {historiqueResultats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4"
        >
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Icon name="TrendingUp" size={16} className="text-primary" />
            Évolution des résultats
          </h4>
          <ResultatsChart resultats={resultatsForSelected} historique={historiqueResultats} />
        </motion.div>
      )}

      {/* Liste par type */}
      <div className="space-y-4">
        {analysesByType && typeof analysesByType === 'object' && Object.entries(analysesByType).map(([type, analysesType]) => (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <Icon name="TestTube" size={16} className="text-primary" />
              <h4 className="font-bold text-slate-900 dark:text-white capitalize">
                {type.replace(/_/g, ' ')}
              </h4>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">({analysesType.length})</span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {Array.isArray(analysesType) && analysesType.map((analyse, idx) => {
                const statutBadge = getStatutBadge(analyse.statut);
                const isSelected = selectedAnalyse?.id === analyse.id;

                return (
                  <motion.div
                    key={analyse.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`flex overflow-hidden transition-all cursor-pointer ${isSelected ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                    onClick={() => setSelectedAnalyse(isSelected ? null : analyse)}
                  >
                    <div className={`w-1 shrink-0 ${getStatutAccent(analyse.statut)}`} />
                    <div className="flex-1 min-w-0 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="shrink-0 w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
                          <Icon name="TestTube" size={16} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{analyse.numeroAnalyse}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                            <span><Icon name="Calendar" size={10} className="inline mr-0.5" />{formatDate(analyse.datePrescription)}</span>
                            {analyse.dateResultat && (
                              <span className="text-emerald-600 dark:text-emerald-400"><Icon name="CheckCircle" size={10} className="inline mr-0.5" />{formatDate(analyse.dateResultat)}</span>
                            )}
                            {analyse.laboratoire && <span><Icon name="Building" size={10} className="inline mr-0.5" />{analyse.laboratoire}</span>}
                          </div>
                          {analyse.notesPrescription && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic line-clamp-1">{analyse.notesPrescription}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={statutBadge.variant} size="sm" className="text-xs">
                          {statutBadge.label}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          iconName="Eye"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/analyses-laboratoire?analyseId=${analyse.id}`);
                          }}
                          className="rounded-lg"
                        >
                          Voir
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Résultats dépliés pour l'analyse sélectionnée dans ce groupe */}
            {Array.isArray(analysesType) && analysesType.some(a => a.id === selectedAnalyse?.id) && (() => {
              const analyse = analysesType.find(a => a.id === selectedAnalyse?.id);
              const res = historiqueResultats.find(h => h.analyseId === analyse?.id)?.resultats;
              if (!analyse || !res?.length) return null;
              return (
                <div className="px-4 pb-4 pt-0 border-t border-slate-200 dark:border-slate-700">
                  <div className="pl-4 mt-3">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">Résultats</p>
                    <ResultatsChart
                      resultats={res}
                      historique={historiqueResultats.filter(h => h.analyseId === analyse.id)}
                    />
                  </div>
                </div>
              );
            })()}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PatientAnalysesHistory;

