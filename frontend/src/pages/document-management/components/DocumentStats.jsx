import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon'; // Assurez-vous que ce chemin est correct

const DocumentStats = ({ stats }) => {
  // Sécurisation des valeurs pour éviter l'affichage "vide"
  const safeStats = {
    totalDocuments: stats?.totalDocuments || 0,
    pendingSignatures: stats?.pendingSignatures || 0,
    signedToday: stats?.signedToday || 0,
    totalSigned: stats?.totalSigned || 0,
    storageUsed: stats?.storageUsed || '0 MB',
    archivedDocuments: stats?.archivedDocuments || 0,
    totalViews: stats?.totalViews || 0
  };

  // Calculer les statistiques dynamiques
  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return { value: 'N/A', type: 'neutral' };
    const change = ((current - previous) / previous) * 100;
    return {
      value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
      type: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'
    };
  };

  const statCards = [
    {
      id: 'total',
      title: 'Total des documents',
      value: safeStats.totalDocuments,
      icon: 'FileText',
      theme: 'blue',
      change: safeStats.totalDocumentsChange || '+0%',
      changeType: safeStats.totalDocumentsChangeType || 'neutral'
    },
    {
      id: 'pending',
      title: 'En attente de signature',
      value: safeStats.pendingSignatures,
      icon: 'PenTool',
      theme: 'amber',
      change: safeStats.pendingSignaturesChange || '+0',
      changeType: safeStats.pendingSignaturesChangeType || 'neutral'
    },
    {
      id: 'totalSigned',
      title: 'Documents signés',
      value: safeStats.totalSigned,
      icon: 'CheckCircle',
      theme: 'emerald',
      change: safeStats.totalSignedChange || '+0',
      changeType: safeStats.totalSignedChangeType || 'positive'
    },
    {
      id: 'signed',
      title: "Signés aujourd'hui",
      value: safeStats.signedToday,
      icon: 'FileCheck',
      theme: 'green',
      change: safeStats.signedTodayChange || '+0',
      changeType: safeStats.signedTodayChangeType || 'positive'
    },
    {
      id: 'storage',
      title: 'Stockage utilisé',
      value: safeStats.storageUsed,
      icon: 'HardDrive',
      theme: 'violet',
      change: safeStats.storageChange || '0 MB',
      changeType: safeStats.storageChangeType || 'neutral'
    },
    {
      id: 'archived',
      title: 'Archivés',
      value: safeStats.archivedDocuments || 0,
      icon: 'Archive',
      theme: 'slate',
      change: safeStats.archivedChange || '+0',
      changeType: safeStats.archivedChangeType || 'neutral'
    },
    {
      id: 'views',
      title: 'Vues totales',
      value: safeStats.totalViews || 0,
      icon: 'Eye',
      theme: 'indigo',
      change: safeStats.viewsChange || '+0',
      changeType: safeStats.viewsChangeType || 'positive'
    }
  ];

  const getThemeStyles = (theme) => {
    const themes = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-100 dark:border-blue-800'
      },
      amber: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-100 dark:border-amber-800'
      },
      emerald: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-100 dark:border-emerald-800'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-600 dark:text-green-400',
        border: 'border-green-100 dark:border-green-800'
      },
      violet: {
        bg: 'bg-violet-50 dark:bg-violet-900/20',
        text: 'text-violet-600 dark:text-violet-400',
        border: 'border-violet-100 dark:border-violet-800'
      },
      slate: {
        bg: 'bg-slate-50 dark:bg-slate-800/20',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-100 dark:border-slate-700'
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        text: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-100 dark:border-indigo-800'
      }
    };
    return themes[theme] || themes.blue;
  };

  const getGradientBg = (theme) => {
    const gradients = {
      blue: 'from-blue-50 via-white to-blue-50/50 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/20',
      amber: 'from-amber-50 via-white to-amber-50/50 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/20',
      emerald: 'from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/20',
      green: 'from-green-50 via-white to-green-50/50 dark:from-green-950/30 dark:via-slate-900 dark:to-green-950/20',
      violet: 'from-violet-50 via-white to-violet-50/50 dark:from-violet-950/30 dark:via-slate-900 dark:to-violet-950/20',
      slate: 'from-slate-50 via-white to-slate-50/50 dark:from-slate-950/30 dark:via-slate-900 dark:to-slate-950/20',
      indigo: 'from-indigo-50 via-white to-indigo-50/50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-indigo-950/20'
    };
    return gradients[theme] || gradients.blue;
  };

  const getIconGradient = (theme) => {
    const gradients = {
      blue: 'from-blue-500 to-blue-600',
      amber: 'from-amber-500 to-amber-600',
      emerald: 'from-emerald-500 to-emerald-600',
      green: 'from-green-500 to-green-600',
      violet: 'from-violet-500 to-violet-600',
      slate: 'from-slate-500 to-slate-600',
      indigo: 'from-indigo-500 to-indigo-600'
    };
    return gradients[theme] || gradients.blue;
  };

  const getTextColor = (theme) => {
    const colors = {
      blue: 'text-blue-600 dark:text-blue-400',
      amber: 'text-amber-600 dark:text-amber-400',
      emerald: 'text-emerald-600 dark:text-emerald-400',
      green: 'text-green-600 dark:text-green-400',
      violet: 'text-violet-600 dark:text-violet-400',
      slate: 'text-slate-600 dark:text-slate-400',
      indigo: 'text-indigo-600 dark:text-indigo-400'
    };
    return colors[theme] || colors.blue;
  };

  const getBorderColor = (theme) => {
    const borders = {
      blue: 'border-blue-100 dark:border-blue-900/50',
      amber: 'border-amber-100 dark:border-amber-900/50',
      emerald: 'border-emerald-100 dark:border-emerald-900/50',
      green: 'border-green-100 dark:border-green-900/50',
      violet: 'border-violet-100 dark:border-violet-900/50',
      slate: 'border-slate-100 dark:border-slate-900/50',
      indigo: 'border-indigo-100 dark:border-indigo-900/50'
    };
    return borders[theme] || borders.blue;
  };

  const getValueGradient = (theme) => {
    const gradients = {
      blue: 'from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500',
      amber: 'from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-500',
      emerald: 'from-emerald-600 to-emerald-700 dark:from-emerald-400 dark:to-emerald-500',
      green: 'from-green-600 to-green-700 dark:from-green-400 dark:to-green-500',
      violet: 'from-violet-600 to-violet-700 dark:from-violet-400 dark:to-violet-500',
      slate: 'from-slate-600 to-slate-700 dark:from-slate-400 dark:to-slate-500',
      indigo: 'from-indigo-600 to-indigo-700 dark:from-indigo-400 dark:to-indigo-500'
    };
    return gradients[theme] || gradients.blue;
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.4 } } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 w-full">
      {Array.isArray(statCards) && statCards.map((stat, index) => {
        if (!stat || typeof stat !== 'object') return null;
        const isPositive = stat.changeType === 'positive';
        const isNegative = stat.changeType === 'negative';
        const gradientBg = getGradientBg(stat.theme);
        const iconGradient = getIconGradient(stat.theme);
        const textColor = getTextColor(stat.theme);
        const borderColor = getBorderColor(stat.theme);
        const valueGradient = getValueGradient(stat.theme);

        return (
          <motion.div 
            key={stat.id}
            variants={itemVariants}
            whileHover={{ y: -2, scale: 1.01 }}
            className={`relative bg-gradient-to-br ${gradientBg} border ${borderColor} rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group`}
          >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative flex items-center justify-between">
                <div className="flex-1">
                  <p className={`text-[10px] font-bold ${textColor} uppercase tracking-wider mb-1.5`}>
                    {stat.title}
                  </p>
                  <motion.p 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`${stat.id === 'storage' ? 'text-lg' : 'text-2xl'} font-extrabold bg-gradient-to-r ${valueGradient} bg-clip-text text-transparent`}
                  >
                    {stat.value}
                  </motion.p>
                  {stat.change && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                      className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                        isPositive 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                          : isNegative
                            ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon name={isPositive ? 'TrendingUp' : isNegative ? 'TrendingDown' : 'Minus'} size={9} />
                      {stat.change}
                    </motion.div>
                  )}
                </div>
                <motion.div 
                  whileHover={{ rotate: 5, scale: 1.05 }}
                  className={`w-12 h-12 bg-gradient-to-br ${iconGradient} rounded-xl flex items-center justify-center shadow-md flex-shrink-0`}
                >
                  <Icon name={stat.icon} size={20} className="text-white" />
                </motion.div>
              </div>
            </motion.div>
          );
        }).filter(Boolean)}
    </motion.div>
  );
};

export default DocumentStats;