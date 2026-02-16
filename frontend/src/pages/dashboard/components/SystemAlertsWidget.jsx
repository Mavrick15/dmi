import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';

const SystemAlertsWidget = ({ alerts = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="relative bg-gradient-to-br from-amber-50 via-white to-amber-50/50 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-3xl shadow-lg p-6 h-full flex flex-col overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-center justify-between mb-6 z-10">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <Icon name="AlertTriangle" size={20} className="text-white" />
          </motion.div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Alertes système
          </h3>
          {alerts.length > 0 && (
            <Badge variant="error" className="text-xs">
              {alerts.length}
            </Badge>
          )}
        </div>
        {alerts.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="dark:text-slate-400 dark:hover:bg-slate-800"
            onClick={() => navigate('/operations-pharmacie')}
          >
            Voir tout
          </Button>
        )}
      </div>

      <div className="relative flex-1 overflow-y-auto -mx-2 px-2 space-y-2 custom-scrollbar z-10">
        {Array.isArray(alerts) && alerts.length > 0 ? (
          alerts.map((alert, idx) => {
            if (!alert || typeof alert !== 'object') return null;
            return (
            <motion.div
              key={alert.id || idx}
              whileHover={{ scale: 1.02, x: 4 }}
              className="w-full flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 border border-amber-200 dark:border-amber-800/30 shadow-sm hover:shadow-md transition-all"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white flex-shrink-0 shadow-sm"
              >
                <Icon name="Package" size={16} />
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {alert.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    Stock: {alert.stockActuel}
                  </span>
                  <span className="text-[10px] text-amber-300 dark:text-amber-700">•</span>
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    Minimum: {alert.stockMinimum}
                  </span>
                </div>
              </div>
            </motion.div>
            );
          }).filter(Boolean)
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400 dark:text-slate-500">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
              <Icon name="CheckCircle" size={24} className="opacity-50" />
            </div>
            <p className="text-sm">Aucune alerte</p>
            <p className="text-xs mt-1">Tout fonctionne correctement</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemAlertsWidget;

