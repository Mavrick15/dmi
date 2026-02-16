import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const MobileFeatureCard = ({ 
  icon, 
  title, 
  description, 
  status, 
  lastSync, 
  onClick,
  badge,
  gradient = false 
}) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'active': return 'text-emerald-500';
      case 'syncing': return 'text-blue-500 animate-spin';
      case 'offline': return 'text-slate-400';
      case 'error': return 'text-rose-500';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return 'CheckCircle';
      case 'syncing': return 'RefreshCw';
      case 'offline': return 'WifiOff';
      case 'error': return 'AlertCircle';
      default: return 'Circle';
    }
  };

  return (
    <motion.div 
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`
        relative bg-gradient-to-br ${gradient 
          ? 'from-indigo-50 via-white to-indigo-50/50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-indigo-950/20 border-indigo-100 dark:border-indigo-900/50' 
          : 'from-slate-50 via-white to-slate-50/50 dark:from-slate-950/30 dark:via-slate-900 dark:to-slate-950/20 border-slate-200 dark:border-slate-800'
        } border rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      
      {badge && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-gradient-to-br from-rose-500 to-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg ring-2 ring-white dark:ring-slate-950 z-10"
        >
          {badge}
        </motion.div>
      )}
      
      <div className="relative flex items-start space-x-4 z-10">
        <motion.div 
          whileHover={{ rotate: 10, scale: 1.1 }}
          className={`
            flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg
            ${gradient ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white' : 'bg-gradient-to-br from-slate-500 to-slate-600 text-white'}
          `}
        >
          <Icon name={icon} size={22} />
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-slate-900 dark:text-white truncate text-sm">{title}</h3>
            <Icon 
              name={getStatusIcon(status)} 
              size={14} 
              className={getStatusStyle(status)}
            />
          </div>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2 leading-relaxed">
            {description}
          </p>
          
          {lastSync && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              <Icon name="Clock" size={10} />
              <span>Sync: {lastSync}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MobileFeatureCard;