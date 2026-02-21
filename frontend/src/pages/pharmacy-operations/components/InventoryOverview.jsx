import Icon from '../../../components/AppIcon';
import { useCurrency } from '../../../contexts/CurrencyContext';

const InventoryOverview = ({ data, loading }) => {
  const { formatCurrency } = useCurrency();
  const overviewStats = [
    { id: 1, title: 'Total médicaments', value: data?.totalMedications || 0, icon: 'Pill', theme: 'blue' },
    { id: 2, title: 'Stock faible', value: data?.lowStock || 0, icon: 'AlertTriangle', theme: 'amber' },
    { id: 3, title: 'Expire bientôt', value: data?.expiringSoon || 0, icon: 'Clock', theme: 'rose' },
    { id: 4, title: 'Valeur totale', value: data?.totalValue ?? 0, isCurrency: true, icon: 'DollarSign', theme: 'emerald' }
  ];

  const themeStyles = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', icon: 'bg-rose-500/20 text-rose-600 dark:text-rose-400' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {overviewStats.map((stat) => {
        if (!stat || typeof stat !== 'object') return null;
        const style = themeStyles[stat.theme] || themeStyles.blue;
        return (
          <div
            key={stat.id}
            className={`rounded-xl border p-4 ${style.bg} ${style.border} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  {stat.title}
                </p>
                {loading ? (
                  <div className="h-8 w-20 rounded bg-slate-200 dark:bg-slate-600 animate-pulse" />
                ) : (
                  <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                    {stat.isCurrency ? formatCurrency(stat.value) : stat.value}
                  </p>
                )}
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.icon}`}>
                <Icon name={stat.icon} size={20} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InventoryOverview;
