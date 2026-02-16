import { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActions = ({ onActionSelect }) => {
  const [activeCategory, setActiveCategory] = useState('common');

  const actionCategories = [
    { id: 'common', label: 'Fréquent', icon: 'Star' },
    { id: 'emergency', label: 'Urgence', icon: 'AlertTriangle' },
    { id: 'prescriptions', label: 'Ordonnances', icon: 'Pill' },
    { id: 'referrals', label: 'Orientations', icon: 'UserCheck' }
  ];

  const quickActions = {
    common: [
      { id: 'vital-signs', title: 'Signes Vitaux', description: 'Tension, pouls, temp.', icon: 'Activity', color: 'from-blue-500 to-blue-600', shortcut: 'Ctrl+V' },
      { id: 'prescription', title: 'Nouvelle Ordonnance', description: 'Prescription rapide', icon: 'FileText', color: 'from-emerald-500 to-emerald-600', shortcut: 'Ctrl+P' },
      { id: 'lab-order', title: 'Analyses Bio.', description: 'Prescrire laboratoire', icon: 'TestTube', color: 'from-purple-500 to-purple-600', shortcut: 'Ctrl+L' },
      { id: 'imaging', title: 'Imagerie', description: 'Radio, Echo, IRM', icon: 'Scan', color: 'from-orange-500 to-orange-600', shortcut: 'Ctrl+I' }
    ],
    emergency: [
      { id: 'emergency-protocol', title: 'Protocole Urgence', description: 'Activer procédure', icon: 'Siren', color: 'from-rose-500 to-rose-600', shortcut: 'F1' },
      { id: 'cardiac-arrest', title: 'Arrêt Cardiaque', description: 'Protocole RCP', icon: 'Heart', color: 'from-red-600 to-red-700', shortcut: 'F2' },
      { id: 'anaphylaxis', title: 'Anaphylaxie', description: 'Choc allergique', icon: 'AlertCircle', color: 'from-amber-500 to-amber-600', shortcut: 'F3' }
    ],
    prescriptions: [
      { id: 'antibiotics', title: 'Antibiotiques', description: 'Prescription courante', icon: 'Pill', color: 'from-teal-500 to-teal-600', shortcut: 'Alt+A' },
      { id: 'analgesics', title: 'Antalgiques', description: 'Gestion douleur', icon: 'Shield', color: 'from-indigo-500 to-indigo-600', shortcut: 'Alt+D' },
      { id: 'chronic-meds', title: 'Renouvellement', description: 'Traitements chroniques', icon: 'RefreshCw', color: 'from-cyan-500 to-cyan-600', shortcut: 'Alt+C' }
    ],
    referrals: [
      { id: 'specialist', title: 'Spécialiste', description: 'Avis confrère', icon: 'UserCheck', color: 'from-violet-500 to-violet-600', shortcut: 'Ctrl+S' },
      { id: 'physiotherapy', title: 'Kinésithérapie', description: 'Rééducation', icon: 'Dumbbell', color: 'from-emerald-500 to-emerald-600', shortcut: 'Ctrl+K' },
      { id: 'psychology', title: 'Psychologie', description: 'Soutien mental', icon: 'Brain', color: 'from-pink-500 to-pink-600', shortcut: 'Ctrl+Y' }
    ]
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
              <Icon name="Zap" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Actions Rapides</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Raccourcis cliniques</p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl overflow-x-auto custom-scrollbar gap-1">
          {actionCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap
                ${activeCategory === category.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }
              `}
            >
              <Icon name={category.icon} size={16} className={activeCategory === category.id ? 'text-primary' : 'opacity-70'} />
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions[activeCategory]?.map((action) => (
            <motion.button
              key={action.id}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onActionSelect(action)}
              className="group relative p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-primary/20 dark:hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="flex items-start gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                  <Icon name={action.icon} size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-1 group-hover:text-primary transition-colors">{action.title}</h3>
                    {action.shortcut && (
                        <span className="hidden lg:inline-block text-[10px] font-mono bg-slate-100 dark:bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {action.shortcut}
                        </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{action.description}</p>
                </div>
              </div>
              {/* Hover Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-700/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Footer Emergency */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-rose-50/30 dark:bg-rose-900/10">
        <Button
          variant="destructive"
          fullWidth
          iconName="AlertTriangle"
          iconPosition="left"
          className="bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/20 h-12 rounded-xl text-base font-semibold"
          onClick={() => onActionSelect({ id: 'emergency', title: 'Urgence Médicale' })}
        >
          Urgence Médicale
        </Button>
      </div>
    </div>
  );
};

export default QuickActions;