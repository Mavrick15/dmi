import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { useDashboardData } from '../../../hooks/useDashboard';

const AnalysesWidget = () => {
  const navigate = useNavigate();
  const { data: dashboardData, isLoading } = useDashboardData();

  const analyses = Array.isArray(dashboardData?.widgets?.analyses?.recent)
    ? dashboardData.widgets.analyses.recent
    : Array.isArray(dashboardData?.recentAnalyses)
      ? dashboardData.recentAnalyses
      : [];
  const pendingCount = dashboardData?.metrics?.analysesPending || dashboardData?.statistics?.analysesPending || 0;
  const criticalCount = dashboardData?.metrics?.analysesCritical || dashboardData?.statistics?.analysesCritical || 0;

  const getStatusColor = (statut) => {
    const map = {
      prescrite: 'amber',
      en_cours: 'blue',
      terminee: 'emerald',
      en_attente_validation: 'violet',
      annulee: 'slate'
    };
    return map[statut] || 'amber';
  };

  const getStatusLabel = (statut) => {
    const labels = {
      prescrite: 'Prescrite',
      en_cours: 'En cours',
      terminee: 'Terminée',
      en_attente_validation: 'En attente',
      annulee: 'Annulée'
    };
    return labels[statut] || statut;
  };

  const accentStyles = {
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    violet: 'bg-violet-500',
    slate: 'bg-slate-400'
  };

  const cardBgStyles = {
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    violet: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',
    slate: 'bg-slate-50 dark:bg-slate-800 border-white/20 dark:border-white/10'
  };

  if (isLoading) {
    return (
      <div className="glass-panel rounded-xl overflow-hidden flex">
        <div className="w-1.5 shrink-0 bg-cyan-500" />
        <div className="flex-1 p-6 flex flex-col items-center justify-center gap-3 min-h-[200px]">
          <Icon name="Loader2" size={28} className="animate-spin text-primary" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Chargement des analyses…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl overflow-hidden flex h-full">
      <div className="w-1.5 shrink-0 bg-cyan-500 self-stretch" aria-hidden />
      <div className="flex-1 flex flex-col min-w-0">
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-200 dark:border-cyan-800">
            <Icon name="TestTube" size={20} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Analyses médicales</h3>
          {(pendingCount > 0 || criticalCount > 0) && (
            <Badge variant={criticalCount > 0 ? 'error' : 'warning'} className="text-xs">
              {criticalCount > 0 ? criticalCount : pendingCount}
            </Badge>
          )}
        </div>
        {(pendingCount > 0 || criticalCount > 0) && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl dark:text-slate-400 dark:hover:bg-slate-800"
            onClick={() => navigate('/analyses-laboratoire')}
          >
            Voir tout
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
        {!Array.isArray(analyses) || analyses.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <div className="w-14 h-14 rounded-xl glass-surface flex items-center justify-center mb-3">
              <Icon name="CheckCircle" size={24} className="text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Aucune analyse récente</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tout est à jour</p>
          </div>
        ) : (
          <div className="space-y-2">
            {analyses.slice(0, 3).map((analyse, idx) => {
              if (!analyse || typeof analyse !== 'object') return null;
              const color = getStatusColor(analyse.statut);
              const accent = accentStyles[color] || accentStyles.amber;
              const cardBg = cardBgStyles[color] || cardBgStyles.amber;
              return (
                <motion.div
                  key={analyse.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${cardBg} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => navigate(`/analyses-laboratoire?analyseId=${analyse.id}`)}
                >
                  <div className={`w-1 rounded-full self-stretch min-h-[2rem] shrink-0 ${accent}`} />
                  <div className="p-2 rounded-lg glass-surface flex-shrink-0">
                    <Icon name="TestTube" size={16} className="text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {analyse.typeAnalyse || 'Analyse'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {analyse.patient?.name && (
                        <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                          {analyse.patient.name}
                        </span>
                      )}
                      {analyse.numeroAnalyse && (
                        <span className="text-xs text-slate-500 dark:text-slate-500 font-mono">
                          {analyse.numeroAnalyse}
                        </span>
                      )}
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">
                        {getStatusLabel(analyse.statut)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default AnalysesWidget;
