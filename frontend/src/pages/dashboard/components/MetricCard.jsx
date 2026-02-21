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
      : 'text-slate-600 bg-slate-50/80 dark:text-slate-400 dark:bg-slate-800/50 border-white/30 dark:border-white/10';

  return (
    <div className={`rounded-xl border p-4 ${style.bg} ${style.border} hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {title}
            {change && (
              <span className={`ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${changeBadgeClass}`}>
                <Icon name={isPositive ? 'TrendingUp' : isNegative ? 'TrendingDown' : 'Minus'} size={9} />
                {change}
              </span>
            )}
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {value}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.icon}`}>
          <Icon name={icon} size={20} />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
