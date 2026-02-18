import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const PatientStatsOverview = ({ stats }) => {
  const statCards = [
    { title: 'Total patients', value: stats?.totalPatients ?? 0, icon: 'Users', theme: 'blue' },
    { title: 'Patients actifs', value: stats?.activePatients ?? 0, icon: 'UserCheck', theme: 'emerald' },
    { title: "RDV aujourd'hui", value: stats?.todayAppointments ?? 0, icon: 'Calendar', theme: 'amber' },
    { title: 'Cas critiques', value: stats?.criticalPatients ?? 0, icon: 'Activity', theme: 'rose' },
    { title: 'Nouveaux', value: stats?.newPatients ?? 0, icon: 'UserPlus', theme: 'violet' }
  ];

  const themeStyles = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', icon: 'bg-rose-500/20 text-rose-600 dark:text-rose-400' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800', icon: 'bg-violet-500/20 text-violet-600 dark:text-violet-400' }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
      {statCards.map((stat, index) => {
        const style = themeStyles[stat.theme] || themeStyles.blue;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.25 }}
            className={`rounded-xl border p-4 ${style.bg} ${style.border} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {stat.value}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.icon}`}>
                <Icon name={stat.icon} size={20} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PatientStatsOverview;