import Icon from '../../../components/AppIcon';
import { formatNumberInFrenchLocale } from '../../../utils/dateTime';

const PerformanceIndicator = ({ 
  title, 
  current, 
  target, 
  unit = '',
  trend = 'stable',
  benchmark,
  evolution,
  className = ""
}) => {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  
  // Styles dynamiques basés sur la performance
  const getPerformanceStyle = (pct) => {
    if (pct >= 90) return { 
      bar: 'bg-emerald-500', 
      text: 'text-emerald-600 dark:text-emerald-400', 
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      label: 'Excellent'
    };
    if (pct >= 70) return { 
      bar: 'bg-amber-500', 
      text: 'text-amber-600 dark:text-amber-400', 
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      label: 'Bon'
    };
    return { 
      bar: 'bg-rose-500', 
      text: 'text-rose-600 dark:text-rose-400', 
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      label: 'Faible'
    };
  };

  const getTrendStyle = (direction) => {
    if (direction === 'up') return { icon: 'TrendingUp', color: 'text-emerald-600 dark:text-emerald-400' };
    if (direction === 'down') return { icon: 'TrendingDown', color: 'text-rose-600 dark:text-rose-400' };
    return { icon: 'Minus', color: 'text-slate-400' };
  };

  const style = getPerformanceStyle(percentage);
  const trendStyle = getTrendStyle(trend);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      
      {/* Header : Titre et Badge de statut */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
            {title}
        </h3>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>
          {style.label}
        </div>
      </div>

      {/* Corps : Valeurs principales */}
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
              {formatNumberInFrenchLocale(current)}<span className="text-lg text-slate-400 ml-0.5 font-medium">{unit}</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              Objectif : {formatNumberInFrenchLocale(target)}{unit}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xl font-bold ${style.text}`}>
              {percentage?.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="relative w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${style.bar}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Comparaison Benchmark */}
        {benchmark && (
          <div className="flex items-center justify-between text-xs font-medium pt-1">
            <span className="text-slate-400 dark:text-slate-500">Secteur : {formatNumberInFrenchLocale(benchmark)}{unit}</span>
            <span className={`flex items-center gap-1 ${current >= benchmark ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              <Icon name={current >= benchmark ? 'Check' : 'AlertCircle'} size={12} />
              {current >= benchmark ? 'Supérieur' : 'Inférieur'}
            </span>
          </div>
        )}
      </div>

      {/* Footer : Métriques détaillées */}
      <div className="grid grid-cols-3 gap-2 pt-5 mt-5 border-t border-slate-200 dark:border-slate-700">
        
        {/* KPI 1 : Écart Objectif */}
        <div className="text-center">
          <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {((current - target) / target * 100)?.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">Objectif</div>
        </div>
        
        {/* KPI 2 : Écart Référence */}
        {benchmark && (
          <div className="text-center border-l border-slate-200 dark:border-slate-700">
            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {((current - benchmark) / benchmark * 100)?.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">Référence</div>
          </div>
        )}
        
        {/* KPI 3 : Évolution (Trend) */}
        <div className="text-center border-l border-slate-200 dark:border-slate-700">
          <div className={`text-sm font-bold flex items-center justify-center gap-1 ${trendStyle.color}`}>
            {trend === 'up' ? '+' : ''}{evolution ? `${evolution.toFixed(1)}%` : '-'}
            <Icon name={trendStyle.icon} size={14} />
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">Évolution</div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceIndicator;