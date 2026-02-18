import Icon from '../../../components/AppIcon';

/**
 * Carte de statistique inspirée du style des cartes du module Pharmacie (InventoryOverview).
 * Fond coloré léger, icône dans un carré thématique, valeur + libellé.
 */
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
  const themeStyles = {
    primary: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      bar: 'bg-blue-500'
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      bar: 'bg-emerald-500'
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      bar: 'bg-amber-500'
    },
    error: {
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      border: 'border-rose-200 dark:border-rose-800',
      icon: 'bg-rose-500/20 text-rose-600 dark:text-rose-400',
      bar: 'bg-rose-500'
    },
    purple: {
      bg: 'bg-violet-50 dark:bg-violet-900/20',
      border: 'border-violet-200 dark:border-violet-800',
      icon: 'bg-violet-500/20 text-violet-600 dark:text-violet-400',
      bar: 'bg-violet-500'
    }
  };

  const style = themeStyles[color] || themeStyles.primary;
  const isPositive = changeType === 'positive';

  const changeBadgeClass = changeType === 'positive'
    ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30'
    : changeType === 'negative'
      ? 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/30'
      : 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800';

  return (
    <div
      className={`rounded-xl border p-4 ${style.bg} ${style.border} shadow-sm hover:shadow-md transition-shadow flex flex-col h-full ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.icon}`}>
          <Icon name={icon} size={20} />
        </div>
        {change != null && change !== '' && (
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${changeBadgeClass}`}>
            <Icon name={isPositive ? 'TrendingUp' : 'TrendingDown'} size={12} />
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight mb-1">
        {value}
      </p>
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {title}
      </p>
      {/* Mini barres de tendance (optionnel, discret) */}
      {Array.isArray(trend) && trend.length > 0 && (
        <div className="flex items-end gap-0.5 h-6 mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
          {trend.map((point, index) => {
            const heightPercent = Math.max(15, Math.min(100, point));
            return (
              <div
                key={index}
                className={`flex-1 min-w-[3px] rounded-full ${style.bar} opacity-70`}
                style={{ height: `${heightPercent}%` }}
                title={`${point}%`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
