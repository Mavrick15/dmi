import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const WelcomeHeader = () => {
  const date = new Date();
  const hour = date.getHours();
  
  let greeting = 'Bonsoir';
  let icon = 'MoonStar';
  let gradient = 'from-indigo-500 to-violet-500';

  if (hour >= 5 && hour < 12) {
    greeting = 'Bonjour';
    icon = 'Sun';
    gradient = 'from-amber-400 to-orange-500';
  } else if (hour >= 12 && hour < 18) {
    greeting = 'Bon après-midi';
    icon = 'SunMedium';
    gradient = 'from-orange-400 to-rose-500';
  }

  const formattedDate = date.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  return (
    <div className="space-y-4 text-center">
      {/* Animated Greeting Icon */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="inline-flex relative"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20 blur-xl rounded-full`}></div>
        <div className={`relative p-3 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
           <Icon name={icon} size={28} strokeWidth={2.5} />
        </div>
      </motion.div>

      <div>
        <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight"
        >
          {greeting}
        </motion.h2>
        
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 mt-2 text-sm font-medium text-slate-500 dark:text-slate-400"
        >
            <span className="capitalize">{formattedDate}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
            <span className="text-primary font-semibold">Portail Sécurisé</span>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomeHeader;