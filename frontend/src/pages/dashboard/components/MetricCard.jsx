import Icon from '../../../components/AppIcon';

const MetricCard = ({ title, value, change, changeType, icon, color = 'primary' }) => {
  const themeStyles = {
    primary: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
    success: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
    error: { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', icon: 'bg-rose-500/20 text-rose-600 dark:text-rose-400' },
    secondary: { bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800', icon: 'bg-violet-500/20 text-violet-600 dark:text-violet-400' }
  };

  const style = themeStyles[color] || themeStyles.primary;
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  const changeBadgeClass = isPositive
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800'
    : isNegative
      ? 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-900/30 dark:border-rose-800'
      : 'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700';

  return (
    <div className={`rounded-xl border p-5 ${style.bg} ${style.border} shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.icon}`}>
          <Icon name={icon} size={22} />
        </div>
        {change && (
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border ${changeBadgeClass}`}>
            <Icon name={isPositive ? 'TrendingUp' : isNegative ? 'TrendingDown' : 'Minus'} size={12} />
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
    </div>
  );
};

export default MetricCard;
