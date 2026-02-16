import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { useDashboardData } from '../../../hooks/useDashboard';
import { Loader2 } from 'lucide-react';

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

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      </div>
    );
  }

  const getStatusColor = (statut) => {
    const colors = {
      'prescrite': 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20',
      'en_cours': 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
      'terminee': 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20',
      'en_attente_validation': 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
      'annulee': 'text-slate-400 bg-slate-50 dark:text-slate-500 dark:bg-slate-800'
    };
    return colors[statut] || colors['prescrite'];
  };

  const getStatusLabel = (statut) => {
    const labels = {
      'prescrite': 'Prescrite',
      'en_cours': 'En cours',
      'terminee': 'Terminée',
      'en_attente_validation': 'En attente',
      'annulee': 'Annulée'
    };
    return labels[statut] || statut;
  };

  return (
    <div className="relative bg-gradient-to-br from-cyan-50 via-white to-cyan-50/50 dark:from-cyan-950/30 dark:via-slate-900 dark:to-cyan-950/20 border border-cyan-100 dark:border-cyan-900/50 rounded-3xl shadow-lg p-6 h-full flex flex-col overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-center justify-between mb-6 z-10">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <Icon name="TestTube" size={20} className="text-white" />
          </motion.div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Analyses médicales
          </h3>
          {(pendingCount > 0 || criticalCount > 0) && (
            <Badge variant={criticalCount > 0 ? "error" : "warning"} className="text-xs">
              {criticalCount > 0 ? criticalCount : pendingCount}
            </Badge>
          )}
        </div>
        {(pendingCount > 0 || criticalCount > 0) && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="dark:text-slate-400 dark:hover:bg-slate-800"
            onClick={() => navigate('/analyses-laboratoire')}
          >
            Voir tout
          </Button>
        )}
      </div>

      <div className="relative flex-1 overflow-y-auto -mx-2 px-2 space-y-2 custom-scrollbar z-10">
        {Array.isArray(analyses) && analyses.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400 dark:text-slate-500">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
              <Icon name="CheckCircle" size={24} className="opacity-50" />
            </div>
            <p className="text-sm">Aucune analyse en attente</p>
            <p className="text-xs mt-1">Tout est à jour</p>
          </div>
        ) : (
          <div className="space-y-2">
          {Array.isArray(analyses) && analyses.slice(0, 3).map((analyse, idx) => {
            if (!analyse || typeof analyse !== 'object') return null;
            return (
            <motion.div
              key={analyse.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02, x: 4 }}
              className="w-full flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/20 dark:to-cyan-800/10 border border-cyan-200 dark:border-cyan-800/30 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => navigate(`/analyses-laboratoire?analyseId=${analyse.id}`)}
            >
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.1 }}
                className={`p-2 rounded-lg ${getStatusColor(analyse.statut)} flex-shrink-0 shadow-sm`}
              >
                <Icon name="TestTube" size={16} />
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {analyse.typeAnalyse || 'Analyse'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {analyse.patient?.name && (
                    <span className="text-xs text-cyan-700 dark:text-cyan-300 font-medium truncate">
                      {analyse.patient.name}
                    </span>
                  )}
                  {analyse.numeroAnalyse && (
                    <>
                      <span className="text-[10px] text-cyan-300 dark:text-cyan-700">•</span>
                      <span className="text-xs text-cyan-600 dark:text-cyan-400 font-mono">
                        {analyse.numeroAnalyse}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
            );
          }).filter(Boolean)}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysesWidget;

