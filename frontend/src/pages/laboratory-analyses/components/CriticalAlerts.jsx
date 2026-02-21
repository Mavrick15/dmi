import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import Icon from '../../../components/AppIcon';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { useAnalysesList } from '../../../hooks/useAnalyses';
import { useNavigate } from 'react-router-dom';

/**
 * Composant pour afficher les alertes critiques (valeurs anormales)
 */
const CriticalAlerts = () => {
  const navigate = useNavigate();

  // Récupérer les analyses avec résultats critiques
  const { data: analysesData, isLoading } = useAnalysesList({ 
    statut: 'terminee',
    limit: 50 
  });

  const analyses = analysesData?.data || analysesData || [];

  // Récupérer les résultats pour toutes les analyses
  const { data: allResultats } = useQuery({
    queryKey: ['analyses', 'critical-results'],
    queryFn: async () => {
      const resultatsPromises = analyses.map(async (analyse) => {
        try {
          const response = await api.get(`/analyses/${analyse.id}/resultats`);
          return {
            analyseId: analyse.id,
            analyse,
            resultats: response.data.success ? response.data.data : []
          };
        } catch (error) {
          return { analyseId: analyse.id, analyse, resultats: [] };
        }
      });
      return await Promise.all(resultatsPromises);
    },
    enabled: analyses.length > 0,
    retry: 1,
  });

  // Filtrer les résultats critiques
  const criticalResults = useMemo(() => {
    if (!allResultats) return [];

    const critical = [];
    allResultats.forEach(({ analyse, resultats }) => {
      resultats.forEach(resultat => {
        if (resultat.interpretation === 'critique') {
          critical.push({
            analyse,
            resultat,
            severity: 'critique'
          });
        } else if (resultat.interpretation === 'anormal_haut' || resultat.interpretation === 'anormal_bas') {
          // Vérifier si la valeur est très en dehors des normes
          const valeur = parseFloat(resultat.valeur);
          const min = resultat.valeurNormaleMin;
          const max = resultat.valeurNormaleMax;
          
          if (min !== null && max !== null) {
            const ecart = resultat.interpretation === 'anormal_haut' 
              ? ((valeur - max) / max) * 100
              : ((min - valeur) / min) * 100;
            
            // Si l'écart est supérieur à 50%, considérer comme critique
            if (ecart > 50) {
              critical.push({
                analyse,
                resultat,
                severity: 'critique'
              });
            } else {
              critical.push({
                analyse,
                resultat,
                severity: 'warning'
              });
            }
          } else {
            critical.push({
              analyse,
              resultat,
              severity: 'warning'
            });
          }
        }
      });
    });

    return critical.sort((a, b) => {
      if (a.severity === 'critique' && b.severity !== 'critique') return -1;
      if (a.severity !== 'critique' && b.severity === 'critique') return 1;
      return 0;
    });
  }, [allResultats]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/20 dark:border-white/10 glass-surface border-l-4 border-l-primary flex flex-col items-center justify-center py-8">
        <Icon name="Loader2" size={24} className="animate-spin text-primary mb-2" />
        <span className="text-sm text-slate-500 dark:text-slate-400">Chargement…</span>
      </div>
    );
  }

  if (criticalResults.length === 0) {
    return (
        <div className="glass-panel rounded-xl p-4 text-center">
        <Icon name="CheckCircle" size={48} className="mx-auto text-emerald-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Aucune alerte critique
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Tous les résultats sont dans les normes
        </p>
      </div>
    );
  }

  const critiques = criticalResults.filter(r => r.severity === 'critique');
  const warnings = criticalResults.filter(r => r.severity === 'warning');

  return (
    <div className="space-y-4">
      {/* Résumé */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4 border border-rose-200 dark:border-rose-800 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Critiques</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{critiques.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <Icon name="AlertCircle" size={20} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Avertissements</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{warnings.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Icon name="AlertTriangle" size={20} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Liste des alertes */}
      <div className="space-y-3">
        {criticalResults.map((alert, idx) => {
          const { analyse, resultat, severity } = alert;
          const isCritique = severity === 'critique';

          return (
            <motion.div
              key={`${analyse.id}-${resultat.id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded-xl p-3 border transition-all cursor-pointer hover:shadow-md ${
                isCritique
                  ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
              }`}
              onClick={() => navigate(`/analyses-laboratoire?analyseId=${analyse.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isCritique
                        ? 'bg-rose-500 text-white'
                        : 'bg-amber-500 text-white'
                    }`}>
                      <Icon name={isCritique ? "AlertCircle" : "AlertTriangle"} size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {resultat.parametre}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                        {analyse.numeroAnalyse}
                      </p>
                    </div>
                    <Badge variant={isCritique ? "error" : "warning"} size="sm">
                      {isCritique ? 'CRITIQUE' : 'ATTENTION'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Valeur</p>
                      <p className={`font-bold ${
                        isCritique ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-300'
                      }`}>
                        {resultat.valeur} {resultat.unite || ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Normale</p>
                      <p className="text-slate-700 dark:text-slate-300">
                        {resultat.valeurNormaleMin !== null && resultat.valeurNormaleMax !== null
                          ? `${resultat.valeurNormaleMin} - ${resultat.valeurNormaleMax}`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Patient</p>
                      <p className="text-slate-700 dark:text-slate-300 truncate">
                        {analyse.patient?.name || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {resultat.commentaire && (
                    <div className="mt-3 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                        {resultat.commentaire}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  iconName="ChevronRight"
                  className="ml-2 flex-shrink-0"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CriticalAlerts;

