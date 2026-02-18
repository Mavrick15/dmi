import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';

const SystemAlertsWidget = ({ alerts = [] }) => {
  const navigate = useNavigate();
  const alertsArray = Array.isArray(alerts) ? alerts : [];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden flex h-full">
      <div className="w-1.5 shrink-0 bg-amber-500 self-stretch" aria-hidden />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
              <Icon name="AlertTriangle" size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Alertes système</h3>
            {alertsArray.length > 0 && (
              <Badge variant="error" className="text-xs">{alertsArray.length}</Badge>
            )}
          </div>
          {alertsArray.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl dark:text-slate-400 dark:hover:bg-slate-800"
              onClick={() => navigate('/operations-pharmacie')}
            >
              Voir tout
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
          {alertsArray.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 border border-slate-200 dark:border-slate-700">
                <Icon name="CheckCircle" size={24} className="text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Aucune alerte</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tout fonctionne correctement.</p>
            </div>
          ) : (
            alertsArray.map((alert, idx) => {
              if (!alert || typeof alert !== 'object') return null;
              return (
                <motion.div
                  key={alert.id || idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
                >
                  <div className="w-1 rounded-full self-stretch min-h-[2rem] shrink-0 bg-amber-500" />
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 flex-shrink-0">
                    <Icon name="Package" size={16} className="text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {alert.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                        Stock : {alert.stockActuel}
                      </span>
                      <span className="text-[10px] text-slate-400">•</span>
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        Minimum : {alert.stockMinimum}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemAlertsWidget;
