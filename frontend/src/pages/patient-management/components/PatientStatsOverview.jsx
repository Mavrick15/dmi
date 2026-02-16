import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const PatientStatsOverview = ({ stats }) => {
  const statCards = [
    { title: 'Total Patients', value: stats?.totalPatients || 0, change: '+12', changeType: 'increase', icon: 'Users', theme: 'blue' },
    { title: 'Patients Actifs', value: stats?.activePatients || 0, change: '+8', changeType: 'increase', icon: 'UserCheck', theme: 'emerald' },
    { title: 'RDV Aujourd\'hui', value: stats?.todayAppointments || 0, change: '-2', changeType: 'decrease', icon: 'Calendar', theme: 'amber' },
    { title: 'Cas Critiques', value: stats?.criticalPatients || 0, change: '+1', changeType: 'increase', icon: 'Activity', theme: 'rose' },
    { title: 'Nouveaux', value: stats?.newPatients || 0, change: '+5', changeType: 'increase', icon: 'UserPlus', theme: 'violet' }
  ];

  const themes = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900/50' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/50' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900/50' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-100 dark:border-rose-900/50' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-100 dark:border-violet-900/50' },
    cyan: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-100 dark:border-cyan-900/50' },
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.4 } } };

  const getGradientBg = (theme) => {
    const gradients = {
      blue: 'from-blue-50 via-white to-blue-50/50 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/20',
      emerald: 'from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/20',
      amber: 'from-amber-50 via-white to-amber-50/50 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/20',
      rose: 'from-rose-50 via-white to-rose-50/50 dark:from-rose-950/30 dark:via-slate-900 dark:to-rose-950/20',
      violet: 'from-violet-50 via-white to-violet-50/50 dark:from-violet-950/30 dark:via-slate-900 dark:to-violet-950/20',
      cyan: 'from-cyan-50 via-white to-cyan-50/50 dark:from-cyan-950/30 dark:via-slate-900 dark:to-cyan-950/20'
    };
    return gradients[theme] || gradients.blue;
  };

  const getIconGradient = (theme) => {
    const gradients = {
      blue: 'from-blue-500 to-blue-600',
      emerald: 'from-emerald-500 to-emerald-600',
      amber: 'from-amber-500 to-amber-600',
      rose: 'from-rose-500 to-rose-600',
      violet: 'from-violet-500 to-violet-600',
      cyan: 'from-cyan-500 to-cyan-600'
    };
    return gradients[theme] || gradients.blue;
  };

  const getTextColor = (theme) => {
    const colors = {
      blue: 'text-blue-600 dark:text-blue-400',
      emerald: 'text-emerald-600 dark:text-emerald-400',
      amber: 'text-amber-600 dark:text-amber-400',
      rose: 'text-rose-600 dark:text-rose-400',
      violet: 'text-violet-600 dark:text-violet-400',
      cyan: 'text-cyan-600 dark:text-cyan-400'
    };
    return colors[theme] || colors.blue;
  };

  const getBorderColor = (theme) => {
    const borders = {
      blue: 'border-blue-100 dark:border-blue-900/50',
      emerald: 'border-emerald-100 dark:border-emerald-900/50',
      amber: 'border-amber-100 dark:border-amber-900/50',
      rose: 'border-rose-100 dark:border-rose-900/50',
      violet: 'border-violet-100 dark:border-violet-900/50',
      cyan: 'border-cyan-100 dark:border-cyan-900/50'
    };
    return borders[theme] || borders.blue;
  };

  const getValueGradient = (theme) => {
    const gradients = {
      blue: 'from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500',
      emerald: 'from-emerald-600 to-emerald-700 dark:from-emerald-400 dark:to-emerald-500',
      amber: 'from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-500',
      rose: 'from-rose-600 to-rose-700 dark:from-rose-400 dark:to-rose-500',
      violet: 'from-violet-600 to-violet-700 dark:from-violet-400 dark:to-violet-500',
      cyan: 'from-cyan-600 to-cyan-700 dark:from-cyan-400 dark:to-cyan-500'
    };
    return gradients[theme] || gradients.blue;
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
      {statCards.map((stat, index) => {
        const isPositive = stat.changeType === 'increase';
        const gradientBg = getGradientBg(stat.theme);
        const iconGradient = getIconGradient(stat.theme);
        const textColor = getTextColor(stat.theme);
        const borderColor = getBorderColor(stat.theme);
        const valueGradient = getValueGradient(stat.theme);
        
        return (
          <motion.div 
            key={index} 
            variants={itemVariants} 
            whileHover={{ y: -4, scale: 1.02 }}
            className={`relative bg-gradient-to-br ${gradientBg} border ${borderColor} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className={`text-xs font-bold ${textColor} uppercase tracking-wider mb-2`}>
                  {stat.title}
                </p>
                <motion.p 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`text-3xl font-extrabold bg-gradient-to-r ${valueGradient} bg-clip-text text-transparent`}
                >
                  {stat.value}
                </motion.p>
                {stat.change && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-lg text-[10px] font-bold ${isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'}`}
                  >
                    <Icon name={isPositive ? 'TrendingUp' : 'TrendingDown'} size={10} />
                    {stat.change}
                  </motion.div>
                )}
              </div>
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.1 }}
                className={`w-14 h-14 bg-gradient-to-br ${iconGradient} rounded-2xl flex items-center justify-center shadow-lg`}
              >
                <Icon name={stat.icon} size={24} className="text-white" />
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default PatientStatsOverview;