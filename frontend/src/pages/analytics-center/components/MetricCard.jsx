import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon, 
  trend = [], 
  color = "primary",
  className = "" 
}) => {

  // Configuration des thèmes (Couleurs harmonisées avec le reste de l'app)
  const themes = {
    primary: { 
      bg: 'bg-blue-50 dark:bg-blue-900/20', 
      text: 'text-blue-600 dark:text-blue-400', 
      border: 'border-blue-100 dark:border-blue-900/50',
      bar: 'bg-blue-500 dark:bg-blue-400'
    },
    success: { 
      bg: 'bg-emerald-50 dark:bg-emerald-900/20', 
      text: 'text-emerald-600 dark:text-emerald-400', 
      border: 'border-emerald-100 dark:border-emerald-900/50',
      bar: 'bg-emerald-500 dark:bg-emerald-400'
    },
    warning: { 
      bg: 'bg-amber-50 dark:bg-amber-900/20', 
      text: 'text-amber-600 dark:text-amber-400', 
      border: 'border-amber-100 dark:border-amber-900/50',
      bar: 'bg-amber-500 dark:bg-amber-400'
    },
    error: { 
      bg: 'bg-rose-50 dark:bg-rose-900/20', 
      text: 'text-rose-600 dark:text-rose-400', 
      border: 'border-rose-100 dark:border-rose-900/50',
      bar: 'bg-rose-500 dark:bg-rose-400'
    },
    purple: {
      bg: 'bg-violet-50 dark:bg-violet-900/20',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-100 dark:border-violet-900/50',
      bar: 'bg-violet-500 dark:bg-violet-400'
    }
  };

  const style = themes[color] || themes.primary;
  const isPositive = changeType === 'positive';
  
  // Badge de changement (Vert/Rouge indépendant du thème principal pour la sémantique)
  const changeBadgeClass = changeType === 'positive' 
    ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30'
    : changeType === 'negative'
      ? 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/30'
      : 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800';

  const getGradientBg = (color) => {
    const gradients = {
      primary: 'from-blue-50 via-white to-blue-50/50 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/20',
      success: 'from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/20',
      warning: 'from-amber-50 via-white to-amber-50/50 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/20',
      error: 'from-rose-50 via-white to-rose-50/50 dark:from-rose-950/30 dark:via-slate-900 dark:to-rose-950/20',
      purple: 'from-violet-50 via-white to-violet-50/50 dark:from-violet-950/30 dark:via-slate-900 dark:to-violet-950/20'
    };
    return gradients[color] || gradients.primary;
  };

  const getIconGradient = (color) => {
    const gradients = {
      primary: 'from-blue-500 to-blue-600',
      success: 'from-emerald-500 to-emerald-600',
      warning: 'from-amber-500 to-amber-600',
      error: 'from-rose-500 to-rose-600',
      purple: 'from-violet-500 to-violet-600'
    };
    return gradients[color] || gradients.primary;
  };

  const getValueGradient = (color) => {
    const gradients = {
      primary: 'from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500',
      success: 'from-emerald-600 to-emerald-700 dark:from-emerald-400 dark:to-emerald-500',
      warning: 'from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-500',
      error: 'from-rose-600 to-rose-700 dark:from-rose-400 dark:to-rose-500',
      purple: 'from-violet-600 to-violet-700 dark:from-violet-400 dark:to-violet-500'
    };
    return gradients[color] || gradients.primary;
  };

  const getBorderColor = (color) => {
    const borders = {
      primary: 'border-blue-100 dark:border-blue-900/50',
      success: 'border-emerald-100 dark:border-emerald-900/50',
      warning: 'border-amber-100 dark:border-amber-900/50',
      error: 'border-rose-100 dark:border-rose-900/50',
      purple: 'border-violet-100 dark:border-violet-900/50'
    };
    return borders[color] || borders.primary;
  };

  const getTextColor = (color) => {
    const colors = {
      primary: 'text-blue-600 dark:text-blue-400',
      success: 'text-emerald-600 dark:text-emerald-400',
      warning: 'text-amber-600 dark:text-amber-400',
      error: 'text-rose-600 dark:text-rose-400',
      purple: 'text-violet-600 dark:text-violet-400'
    };
    return colors[color] || colors.primary;
  };

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative bg-gradient-to-br ${getGradientBg(color)} border ${getBorderColor(color)} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col h-full ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* En-tête : Icône + Badge */}
      <div className="relative flex items-center justify-between mb-4">
        <motion.div 
          whileHover={{ rotate: 10, scale: 1.1 }}
          className={`w-14 h-14 bg-gradient-to-br ${getIconGradient(color)} rounded-2xl flex items-center justify-center shadow-lg`}
        >
          <Icon name={icon} size={24} className="text-white" />
        </motion.div>

        {change && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${changeBadgeClass}`}
          >
            <Icon 
              name={isPositive ? 'TrendingUp' : 'TrendingDown'} 
              size={14} 
            />
            {change}
          </motion.div>
        )}
      </div>

      {/* Corps : Valeur + Titre + Mini Graphique */}
      <div className="relative mt-auto flex items-end justify-between">
        <div className="flex-1">
          <motion.h3 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-3xl font-extrabold bg-gradient-to-r ${getValueGradient(color)} bg-clip-text text-transparent tracking-tight leading-none mb-2`}
          >
            {value}
          </motion.h3>
          <p className={`text-xs font-bold ${getTextColor(color)} uppercase tracking-wider`}>
            {title}
          </p>
        </div>

        {/* Visualisation de la tendance (Mini Bar Chart) */}
        {Array.isArray(trend) && trend.length > 0 && (
          <div className="flex items-end gap-1 h-8 pb-1">
            {trend.map((point, index) => {
              // Calcul de la hauteur relative (max 100%)
              const heightPercent = Math.max(15, Math.min(100, point)); 
              return (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ delay: index * 0.05 }}
                  className={`w-1.5 rounded-full transition-all duration-500 ${style.bar} opacity-80 group-hover:opacity-100`}
                  title={`${point}%`}
                />
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MetricCard;