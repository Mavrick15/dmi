import Icon from '../../../components/AppIcon';
import { useCurrency } from '../../../contexts/CurrencyContext';

/**
 * Carte de statistique inspirée du style des cartes du module Pharmacie (InventoryOverview).
 * Fond coloré léger, icône dans un carré thématique, valeur + libellé.
 */
const RevenueOverviewCard = ({ title, amount, change, changeType, icon, color = "primary", isCount = false }) => {
  const { formatCurrency } = useCurrency();

  const themeStyles = {
    primary: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
    },
    secondary: {
      bg: 'bg-violet-50 dark:bg-violet-900/20',
      border: 'border-violet-200 dark:border-violet-800',
      icon: 'bg-violet-500/20 text-violet-600 dark:text-violet-400'
    }
  };

  const style = themeStyles[color] || themeStyles.primary;

  const changeBadgeClass = changeType === 'increase'
    ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30'
    : changeType === 'decrease'
      ? 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/30'
      : 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800';

  return (
    <div
      className={`rounded-xl border p-4 ${style.bg} ${style.border} shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.icon}`}>
          <Icon name={icon} size={20} />
        </div>
        {change != null && change !== '' && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${changeBadgeClass}`}>
            {changeType === 'increase' ? '+' : ''}{change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight mb-1">
        {isCount
          ? (typeof amount === 'number' ? amount.toLocaleString('fr-FR') : amount)
          : formatCurrency(typeof amount === 'number' ? amount : parseFloat(amount) || 0, { maximumFractionDigits: 0 })
        }
      </p>
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {title}
      </p>
    </div>
  );
};

export default RevenueOverviewCard;
