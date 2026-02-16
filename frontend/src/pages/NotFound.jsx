import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Icon from '../components/AppIcon';

const NotFound = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div 
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 transition-colors duration-300 font-sans relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 dark:bg-primary/30 rounded-full blur-sm"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0.3,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              x: `+=${Math.random() * 200 - 100}`,
              y: `+=${Math.random() * 200 - 100}`,
              opacity: [0.2, 0.5, 0.2],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-6">
        {/* Logo avec animation */}
        <motion.div 
          className="relative mb-8"
          variants={floatingVariants}
          animate="animate"
        >
          <div className="relative w-32 h-32 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 rounded-3xl shadow-2xl shadow-primary/30 flex items-center justify-center border border-slate-100 dark:border-slate-800 z-10 overflow-hidden group">
            {/* Effet de brillance animé */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "linear",
                repeatDelay: 1
              }}
            />
            
            {/* Logo avec serpent qui entoure le + */}
            <svg 
              width="64" 
              height="64" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="text-white relative z-10"
            >
              <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.15)" />
              <path d="M12 6V18M6 12H18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white" />
              <path 
                d="M8 8 Q10 6.5, 12 8.5 Q14 6.5, 16 8.5 Q16.5 10.5, 14.5 11.5 Q16.5 13, 16 15 Q14 17, 12 15.5 Q10 17, 8 15 Q7.5 13, 9.5 11.5 Q7.5 10, 8 8" 
                stroke="currentColor" 
                strokeWidth="1.6" 
                fill="none" 
                strokeLinecap="round" 
                className="text-white"
              />
              <ellipse cx="8" cy="8" rx="1.4" ry="1.1" fill="currentColor" className="text-white" />
              <circle cx="7.7" cy="7.8" r="0.4" fill="rgba(255,255,255,0.95)" />
              <path 
                d="M16 15 Q17 16, 16.5 17" 
                stroke="currentColor" 
                strokeWidth="1.6" 
                fill="none" 
                strokeLinecap="round" 
                className="text-white"
              />
            </svg>
          </div>
          
          {/* Anneau de pulsation */}
          <motion.div
            className="absolute inset-0 rounded-3xl border-2 border-primary/40"
            animate={{ 
              scale: [1, 1.3, 1.6],
              opacity: [0.6, 0.3, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeOut" 
            }}
          />
        </motion.div>

        {/* Gros texte 404 avec animation */}
        <motion.div 
          className="relative mb-6"
          variants={itemVariants}
        >
          <h1 className="text-[12rem] md:text-[16rem] font-black bg-gradient-to-r from-primary via-blue-600 to-indigo-700 bg-clip-text text-transparent leading-none select-none tracking-tighter">
            404
          </h1>
          <div className="absolute inset-0 text-[12rem] md:text-[16rem] font-black text-slate-900/5 dark:text-white/5 leading-none select-none tracking-tighter blur-sm -z-10">
            404
          </div>
        </motion.div>

        {/* Titre et description */}
        <motion.div 
          className="text-center mb-8"
          variants={itemVariants}
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
            Page introuvable
          </h2>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-2 max-w-lg mx-auto leading-relaxed">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          
          <p className="text-sm text-slate-500 dark:text-slate-500 max-w-md mx-auto">
            Vérifiez l'URL ou utilisez les boutons ci-dessous pour naviguer.
          </p>
        </motion.div>

        {/* Boutons d'action */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 w-full max-w-md mb-12"
          variants={itemVariants}
        >
          <Button
            variant="outline"
            iconName="ArrowLeft"
            iconPosition="left"
            onClick={() => navigate(-1)}
            className="w-full justify-center dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 hover:scale-105 transition-transform"
          >
            Retour
          </Button>
          
          <Button
            variant="default"
            iconName="Home"
            iconPosition="left"
            onClick={() => navigate('/')}
            className="w-full justify-center shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-transform"
          >
            Accueil
          </Button>
        </motion.div>

        {/* Suggestions de navigation */}
        <motion.div 
          className="w-full max-w-md"
          variants={itemVariants}
        >
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Compass" size={20} className="text-primary" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Navigation rapide
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm text-slate-700 dark:text-slate-300"
              >
                <Icon name="LayoutDashboard" size={16} />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => navigate('/patients')}
                className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm text-slate-700 dark:text-slate-300"
              >
                <Icon name="Users" size={16} />
                <span>Patients</span>
              </button>
              <button
                onClick={() => navigate('/clinical')}
                className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm text-slate-700 dark:text-slate-300"
              >
                <Icon name="Stethoscope" size={16} />
                <span>Clinique</span>
              </button>
              <button
                onClick={() => navigate('/pharmacy')}
                className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm text-slate-700 dark:text-slate-300"
              >
                <Icon name="Pill" size={16} />
                <span>Pharmacie</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="mt-12 text-center"
          variants={itemVariants}
        >
          <p className="text-xs text-slate-400 dark:text-slate-600 font-medium">
            MediCore DMI &copy; {new Date().getFullYear()}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NotFound;