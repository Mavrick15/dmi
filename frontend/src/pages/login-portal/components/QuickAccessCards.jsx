import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const QuickAccessCards = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const systemStatus = {
    status: 'operational',
    uptime: '99.99%',
    lastUpdate: 'Maintenant',
    version: 'v2.4.0'
  };

  // Informations clés des activités du système
  const keyActivities = [
    {
      icon: 'Users',
      title: 'Gestion des Patients',
      description: 'Enregistrement, suivi et historique médical complet'
    },
    {
      icon: 'Calendar',
      title: 'Rendez-vous',
      description: 'Planification, suivi et gestion des consultations'
    },
    {
      icon: 'Stethoscope',
      title: 'Console Clinique',
      description: 'Outils de diagnostic et protocoles médicaux'
    },
    {
      icon: 'Pill',
      title: 'Pharmacie',
      description: 'Gestion des stocks, prescriptions et commandes'
    },
    {
      icon: 'DollarSign',
      title: 'Finances',
      description: 'Facturation, paiements et rapports financiers'
    },
    {
      icon: 'FileText',
      title: 'Documents',
      description: 'Gestion sécurisée des dossiers médicaux'
    },
    {
      icon: 'BarChart3',
      title: 'Analyses',
      description: 'Statistiques et rapports détaillés'
    },
    {
      icon: 'Shield',
      title: 'Conformité',
      description: 'Audit et conformité réglementaire'
    }
  ];

  return (
    <div className="w-full max-w-sm mx-auto mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
      
      {/* Status Card */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
           <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Système Opérationnel</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Uptime {systemStatus.uptime}</p>
            </div>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
            {systemStatus.version}
        </span>
      </div>

      {/* Support Link avec Tooltip */}
      <div className="relative">
        <button 
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
        >
          <Icon name="HelpCircle" size={14} />
          Besoin d'aide pour vous connecter ?
        </button>

        {/* Tooltip avec aperçu des activités */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 z-[100]"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              {/* Flèche */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-900 border-r border-b border-slate-200 dark:border-slate-800 rotate-45"></div>
              
              {/* Header */}
              <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Icon name="Info" size={16} className="text-primary" />
                  Aperçu des Activités
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Modules disponibles dans la plateforme
                </p>
              </div>

              {/* Liste des activités */}
              <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-3">
                {keyActivities.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                      <Icon name={activity.icon} size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                        {activity.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {activity.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
                  Connectez-vous pour accéder à tous les modules
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuickAccessCards;