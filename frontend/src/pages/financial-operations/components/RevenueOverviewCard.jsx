import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import { useCurrency } from '../../../contexts/CurrencyContext';

const RevenueOverviewCard = ({ title, amount, change, changeType, icon, color = "primary", isCount = false }) => {
  const { formatCurrency, getSymbol } = useCurrency();
  
  const themes = {
    primary: { // Bleu (Revenu)
      bg: 'bg-white dark:bg-slate-900',
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      border: 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
    },
    success: { // Vert (Factures)
      bg: 'bg-white dark:bg-slate-900',
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
    },
    warning: { // Orange (Impayés)
      bg: 'bg-white dark:bg-slate-900',
      iconBg: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      border: 'border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700'
    },
    secondary: { // Violet (Bénéfice)
      bg: 'bg-gradient-to-br from-violet-600 to-indigo-700',
      iconBg: 'bg-white/20',
      iconColor: 'text-white',
      border: 'border-transparent',
      text: 'text-white',
      subText: 'text-violet-100'
    }
  };

  const theme = themes[color] || themes.primary;
  const isSecondary = color === 'secondary';

  // Badge de tendance
  const getChangeBadge = () => {
    if (isSecondary) {
      return (
        <span className="flex items-center text-xs font-medium text-white bg-white/20 px-2 py-0.5 rounded-full">
          {changeType === 'increase' ? '↑' : '↓'} {change}
        </span>
      );
    }
    
    const colors = changeType === 'increase' 
      ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30' 
      : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/30';
      
    return (
      <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${colors}`}>
        {changeType === 'increase' ? '+' : ''}{change}
      </span>
    );
  };

  const getGradientBg = () => {
    if (isSecondary) return 'from-violet-600 to-indigo-700';
    const gradients = {
      primary: 'from-blue-50 via-white to-blue-50/50 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/20',
      success: 'from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/20',
      warning: 'from-amber-50 via-white to-amber-50/50 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/20',
      secondary: 'from-violet-600 to-indigo-700'
    };
    return gradients[color] || gradients.primary;
  };

  const getIconGradient = () => {
    if (isSecondary) return 'from-white/20 to-white/10';
    const gradients = {
      primary: 'from-blue-500 to-blue-600',
      success: 'from-emerald-500 to-emerald-600',
      warning: 'from-amber-500 to-amber-600',
      secondary: 'from-white/20 to-white/10'
    };
    return gradients[color] || gradients.primary;
  };

  const getValueGradient = () => {
    if (isSecondary) return 'text-white';
    const gradients = {
      primary: 'from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500',
      success: 'from-emerald-600 to-emerald-700 dark:from-emerald-400 dark:to-emerald-500',
      warning: 'from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-500',
      secondary: 'text-white'
    };
    return gradients[color] || gradients.primary;
  };

  const getBorderColor = () => {
    if (isSecondary) return 'border-transparent';
    const borders = {
      primary: 'border-blue-100 dark:border-blue-900/50',
      success: 'border-emerald-100 dark:border-emerald-900/50',
      warning: 'border-amber-100 dark:border-amber-900/50',
      secondary: 'border-transparent'
    };
    return borders[color] || borders.primary;
  };

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className={`
        relative bg-gradient-to-br ${getGradientBg()} border ${getBorderColor()} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group
        ${isSecondary ? 'text-white' : ''}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-center justify-between mb-4">
        <motion.div 
          whileHover={{ rotate: 10, scale: 1.1 }}
          className={`w-14 h-14 bg-gradient-to-br ${getIconGradient()} rounded-2xl flex items-center justify-center shadow-lg`}
        >
          <Icon name={icon} size={24} className={isSecondary ? 'text-white' : 'text-white'} />
        </motion.div>
        {getChangeBadge()}
      </div>
      
      <div className="relative">
        <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isSecondary ? 'text-violet-100' : 'text-slate-500 dark:text-slate-400'}`}>
          {title}
        </p>
        <motion.h3 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-3xl font-extrabold tracking-tight ${isSecondary ? 'text-white' : `bg-gradient-to-r ${getValueGradient()} bg-clip-text text-transparent`}`}
        >
          {isCount 
            ? (typeof amount === 'number' ? amount.toLocaleString('fr-FR') : amount)
            : formatCurrency(typeof amount === 'number' ? amount : parseFloat(amount) || 0, { maximumFractionDigits: 0 })
          }
        </motion.h3>
      </div>

      {/* Decorative Pattern for secondary card */}
      {isSecondary && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      )}
    </motion.div>
  );
};

export default RevenueOverviewCard;