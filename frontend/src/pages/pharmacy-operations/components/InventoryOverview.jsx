import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import { useCurrency } from '../../../contexts/CurrencyContext';

const InventoryOverview = ({ data, loading }) => {
  const { formatCurrency } = useCurrency();
  const overviewStats = [
    {
      id: 1,
      title: "Total Médicaments",
      value: data?.totalMedications || 0,
      change: "+12", // Simulé pour l'instant
      changeType: "increase",
      icon: "Pill",
      theme: "blue"
    },
    {
      id: 2,
      title: "Stock Faible",
      value: data?.lowStock || 0,
      change: "-5",
      changeType: "decrease",
      icon: "AlertTriangle",
      theme: "amber"
    },
    {
      id: 3,
      title: "Expire Bientôt",
      value: data?.expiringSoon || 0, // Assure-toi que le backend renvoie ça, sinon 0
      change: "+3",
      changeType: "increase",
      icon: "Clock",
      theme: "rose"
    },
    {
      id: 4,
      title: "Valeur Totale",
      value: data?.totalValue || 0,
      isCurrency: true,
      change: "+1.2%",
      changeType: "increase",
      icon: "DollarSign",
      theme: "emerald"
    }
  ];

  const getThemeStyles = (theme) => {
    const styles = {
      blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-800' },
      amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-800' },
      rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-100 dark:border-rose-800' },
      emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-800' }
    };
    return styles[theme] || styles.blue;
  };

  const getGradientBg = (theme) => {
    const gradients = {
      blue: 'from-blue-50 via-white to-blue-50/50 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/20',
      amber: 'from-amber-50 via-white to-amber-50/50 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/20',
      rose: 'from-rose-50 via-white to-rose-50/50 dark:from-rose-950/30 dark:via-slate-900 dark:to-rose-950/20',
      emerald: 'from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/20'
    };
    return gradients[theme] || gradients.blue;
  };

  const getIconGradient = (theme) => {
    const gradients = {
      blue: 'from-blue-500 to-blue-600',
      amber: 'from-amber-500 to-amber-600',
      rose: 'from-rose-500 to-rose-600',
      emerald: 'from-emerald-500 to-emerald-600'
    };
    return gradients[theme] || gradients.blue;
  };

  const getValueGradient = (theme) => {
    const gradients = {
      blue: 'from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500',
      amber: 'from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-500',
      rose: 'from-rose-600 to-rose-700 dark:from-rose-400 dark:to-rose-500',
      emerald: 'from-emerald-600 to-emerald-700 dark:from-emerald-400 dark:to-emerald-500'
    };
    return gradients[theme] || gradients.blue;
  };

  const getBorderColor = (theme) => {
    const borders = {
      blue: 'border-blue-100 dark:border-blue-900/50',
      amber: 'border-amber-100 dark:border-amber-900/50',
      rose: 'border-rose-100 dark:border-rose-900/50',
      emerald: 'border-emerald-100 dark:border-emerald-900/50'
    };
    return borders[theme] || borders.blue;
  };

  const getTextColor = (theme) => {
    const colors = {
      blue: 'text-blue-600 dark:text-blue-400',
      amber: 'text-amber-600 dark:text-amber-400',
      rose: 'text-rose-600 dark:text-rose-400',
      emerald: 'text-emerald-600 dark:text-emerald-400'
    };
    return colors[theme] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.isArray(overviewStats) && overviewStats.map((stat, index) => {
        if (!stat || typeof stat !== 'object') return null;
        const isPositive = stat.changeType === 'increase';
        const gradientBg = getGradientBg(stat.theme);
        const iconGradient = getIconGradient(stat.theme);
        const valueGradient = getValueGradient(stat.theme);
        const borderColor = getBorderColor(stat.theme);
        const textColor = getTextColor(stat.theme);

        return (
          <motion.div 
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`relative bg-gradient-to-br ${gradientBg} border ${borderColor} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative flex items-center justify-between mb-4">
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.1 }}
                className={`w-14 h-14 bg-gradient-to-br ${iconGradient} rounded-2xl flex items-center justify-center shadow-lg`}
              >
                <Icon name={stat.icon} size={24} className="text-white" />
              </motion.div>
              
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 + 0.2 }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                  isPositive 
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                    : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                }`}
              >
                <Icon name={isPositive ? 'TrendingUp' : 'TrendingDown'} size={12} strokeWidth={2.5} />
                {stat.change}
              </motion.div>
            </div>

            <div className="relative">
              {loading ? (
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2"></div>
              ) : (
                <motion.h3 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`text-3xl font-extrabold bg-gradient-to-r ${valueGradient} bg-clip-text text-transparent tracking-tight leading-none mb-2`}
                >
                  {stat.isCurrency ? formatCurrency(stat.value) : stat.value}
                </motion.h3>
              )}
              <p className={`text-xs font-bold ${textColor} uppercase tracking-wider`}>
                {stat.title}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default InventoryOverview;