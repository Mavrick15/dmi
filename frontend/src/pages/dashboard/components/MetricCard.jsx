import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const MetricCard = ({ title, value, change, changeType, icon, color = 'primary' }) => {
  
  // Configuration des thèmes de couleurs (Light & Dark)
  const themeStyles = {
    primary: {
      wrapper: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    },
    emerald: {
      wrapper: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    },
    success: {
      wrapper: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    },
    warning: {
      wrapper: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    },
    error: {
      wrapper: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
    },
    secondary: {
      wrapper: 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800',
    }
  };

  const style = themeStyles[color] || themeStyles.primary;
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  // Badge de tendance dynamique
  const changeBadgeClass = isPositive 
    ? 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800' 
    : isNegative 
      ? 'text-rose-700 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-900/30 dark:border-rose-800' 
      : 'text-slate-600 bg-slate-50 border-slate-100 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700';

  const getGradientBg = (color) => {
    const gradients = {
      primary: 'from-blue-50 via-white to-blue-50/50 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/20',
      emerald: 'from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/20',
      success: 'from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/20',
      warning: 'from-amber-50 via-white to-amber-50/50 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/20',
      error: 'from-rose-50 via-white to-rose-50/50 dark:from-rose-950/30 dark:via-slate-900 dark:to-rose-950/20',
      secondary: 'from-violet-50 via-white to-violet-50/50 dark:from-violet-950/30 dark:via-slate-900 dark:to-violet-950/20'
    };
    return gradients[color] || gradients.primary;
  };

  const getIconGradient = (color) => {
    const gradients = {
      primary: 'from-blue-500 to-blue-600',
      emerald: 'from-emerald-500 to-emerald-600',
      success: 'from-emerald-500 to-emerald-600',
      warning: 'from-amber-500 to-amber-600',
      error: 'from-rose-500 to-rose-600',
      secondary: 'from-violet-500 to-violet-600'
    };
    return gradients[color] || gradients.primary;
  };

  const getValueGradient = (color) => {
    const gradients = {
      primary: 'from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500',
      emerald: 'from-emerald-600 to-emerald-700 dark:from-emerald-400 dark:to-emerald-500',
      success: 'from-emerald-600 to-emerald-700 dark:from-emerald-400 dark:to-emerald-500',
      warning: 'from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-500',
      error: 'from-rose-600 to-rose-700 dark:from-rose-400 dark:to-rose-500',
      secondary: 'from-violet-600 to-violet-700 dark:from-violet-400 dark:to-violet-500'
    };
    return gradients[color] || gradients.primary;
  };

  const getBorderColor = (color) => {
    const borders = {
      primary: 'border-blue-100 dark:border-blue-900/50',
      emerald: 'border-emerald-100 dark:border-emerald-900/50',
      success: 'border-emerald-100 dark:border-emerald-900/50',
      warning: 'border-amber-100 dark:border-amber-900/50',
      error: 'border-rose-100 dark:border-rose-900/50',
      secondary: 'border-violet-100 dark:border-violet-900/50'
    };
    return borders[color] || borders.primary;
  };

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative bg-gradient-to-br ${getGradientBg(color)} border ${getBorderColor(color)} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col justify-between h-full cursor-default`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-center justify-between mb-4">
        <motion.div 
          whileHover={{ rotate: 10, scale: 1.1 }}
          className={`w-14 h-14 bg-gradient-to-br ${getIconGradient(color)} rounded-2xl flex items-center justify-center shadow-lg`}
        >
          <Icon name={icon} size={24} className="text-white" />
        </motion.div>

        {/* Badge de pourcentage */}
        {change && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${changeBadgeClass}`}
          >
            <Icon 
              name={isPositive ? 'TrendingUp' : isNegative ? 'TrendingDown' : 'Minus'} 
              size={14} 
            />
            {change}
          </motion.div>
        )}
      </div>

      <div className="relative z-10">
        <motion.h3 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-3xl font-extrabold bg-gradient-to-r ${getValueGradient(color)} bg-clip-text text-transparent tracking-tight mb-2`}
        >
          {value}
        </motion.h3>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </p>
      </div>
    </motion.div>
  );
};

export default MetricCard;