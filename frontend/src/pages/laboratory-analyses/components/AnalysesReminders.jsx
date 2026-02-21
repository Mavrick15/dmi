import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import Icon from '../../../components/AppIcon';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { useAnalysesList } from '../../../hooks/useAnalyses';
import { useNavigate } from 'react-router-dom';

/**
 * Composant pour afficher les rappels d'analyses en attente
 */
const AnalysesReminders = () => {
  const navigate = useNavigate();

  // Récupérer les analyses en attente
  const { data: analysesData, isLoading } = useAnalysesList({ 
    statut: 'en_cours',
    limit: 100 
  });

  const analyses = analysesData?.data || analysesData || [];

  // Filtrer les analyses nécessitant un rappel
  const reminders = useMemo(() => {
    const now = new Date();
    const remindersList = [];

    analyses.forEach(analyse => {
      if (!analyse.datePrescription) return;

      const datePrescription = new Date(analyse.datePrescription);
      const daysSincePrescription = Math.floor((now - datePrescription) / (1000 * 60 * 60 * 24));

      // Rappel si l'analyse est en cours depuis plus de 2 jours sans résultats
      if (daysSincePrescription >= 2 && !analyse.resultats?.length) {
        remindersList.push({
          analyse,
          daysSince: daysSincePrescription,
          priority: daysSincePrescription >= 5 ? 'high' : daysSincePrescription >= 3 ? 'medium' : 'low',
          type: 'no_results'
        });
      }

      // Rappel si date de prélèvement prévue est passée
      if (analyse.datePrelevement) {
        const datePrelevement = new Date(analyse.datePrelevement);
        if (datePrelevement < now && !analyse.resultats?.length) {
          remindersList.push({
            analyse,
            daysSince: Math.floor((now - datePrelevement) / (1000 * 60 * 60 * 24)),
            priority: 'high',
            type: 'overdue_collection'
          });
        }
      }

      // Rappel si priorité urgente et pas de résultats après 24h
      if (analyse.priorite === 'urgente' && daysSincePrescription >= 1 && !analyse.resultats?.length) {
        remindersList.push({
          analyse,
          daysSince: daysSincePrescription,
          priority: 'high',
          type: 'urgent'
        });
      }

      // Rappel si priorité critique et pas de résultats après 12h
      if (analyse.priorite === 'critique' && daysSincePrescription >= 0.5 && !analyse.resultats?.length) {
        remindersList.push({
          analyse,
          daysSince: daysSincePrescription,
          priority: 'critical',
          type: 'critical'
        });
      }
    });

    // Trier par priorité et date
    return remindersList.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.daysSince - a.daysSince;
    });
  }, [analyses]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/20 dark:border-white/10 glass-surface border-l-4 border-l-primary flex flex-col items-center justify-center py-8">
        <Icon name="Loader2" size={24} className="animate-spin text-primary mb-2" />
        <span className="text-sm text-slate-500 dark:text-slate-400">Chargement…</span>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
        <div className="glass-panel rounded-xl p-4 text-center">
        <Icon name="CheckCircle" size={48} className="mx-auto text-emerald-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Aucun rappel
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Toutes les analyses sont à jour
        </p>
      </div>
    );
  }

  const getPriorityConfig = (priority) => {
    const configs = {
      critical: {
        color: 'bg-rose-500',
        bg: 'bg-rose-50 dark:bg-rose-900/20',
        border: 'border-rose-200 dark:border-rose-700',
        text: 'text-rose-700 dark:text-rose-300',
        label: 'CRITIQUE'
      },
      high: {
        color: 'bg-orange-500',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-700',
        text: 'text-orange-700 dark:text-orange-300',
        label: 'ÉLEVÉE'
      },
      medium: {
        color: 'bg-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-700',
        text: 'text-amber-700 dark:text-amber-300',
        label: 'MOYENNE'
      },
      low: {
        color: 'bg-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-700',
        text: 'text-blue-700 dark:text-blue-300',
        label: 'FAIBLE'
      }
    };
    return configs[priority] || configs.low;
  };

  const getTypeLabel = (type) => {
    const labels = {
      no_results: 'Pas de résultats',
      overdue_collection: 'Prélèvement en retard',
      urgent: 'Priorité urgente',
      critical: 'Priorité critique'
    };
    return labels[type] || 'Rappel';
  };

  return (
    <div className="space-y-4">
      {/* Résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['critical', 'high', 'medium', 'low'].map((priority) => {
          const count = reminders.filter(r => r.priority === priority).length;
          const config = getPriorityConfig(priority);
          if (count === 0) return null;
          
          return (
            <motion.div
              key={priority}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${config.bg} rounded-xl p-4 border ${config.border} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{config.label}</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{count}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.color} text-white`}>
                  <Icon name="Bell" size={20} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Liste des rappels */}
      <div className="space-y-3">
        {reminders.map((reminder, idx) => {
          const { analyse, daysSince, priority, type } = reminder;
          const config = getPriorityConfig(priority);

          return (
            <motion.div
              key={`${analyse.id}-${type}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded-xl p-3 border transition-all cursor-pointer hover:shadow-md ${config.bg} ${config.border}`}
              onClick={() => navigate(`/analyses-laboratoire?analyseId=${analyse.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.color} text-white`}>
                      <Icon name="Bell" size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {analyse.numeroAnalyse}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                        {analyse.typeAnalyse?.replace('_', ' ')}
                      </p>
                    </div>
                    <Badge variant={priority === 'critical' ? 'error' : priority === 'high' ? 'warning' : 'info'} size="sm">
                      {config.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Type de rappel</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {getTypeLabel(type)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Délai</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {daysSince} jour{daysSince > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Patient</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {analyse.patient?.name || analyse.patient?.numeroPatient || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {analyse.priorite && (
                    <div className="mt-3 flex items-center gap-2">
                      <Icon name="AlertCircle" size={14} className={config.text} />
                      <p className={`text-xs font-semibold ${config.text} capitalize`}>
                        Priorité: {analyse.priorite}
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

export default AnalysesReminders;

