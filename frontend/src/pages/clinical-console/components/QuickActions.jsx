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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[780px]">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <Icon name="Zap" size={20} className="text-primary dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Actions Rapides</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Raccourcis et accès directs</p>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          {actionCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeCategory === category.id
                  ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon name={category.icon} size={16} />
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille d'actions */}
      <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions[activeCategory]?.map((action) => (
            <motion.button
              key={action.id}
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onActionSelect(action)}
              className="group p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-sm transition-all text-left flex items-start gap-3"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shrink-0`}>
                <Icon name={action.icon} size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-800 dark:text-white text-sm group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                    {action.title}
                  </h3>
                  {action.shortcut && (
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {action.shortcut}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{action.description}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Urgence */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <Button
          variant="outline"
          fullWidth
          iconName="AlertTriangle"
          iconPosition="left"
          className="border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-semibold"
          onClick={() => onActionSelect({ id: 'emergency', title: 'Urgence Médicale' })}
        >
          Urgence Médicale
        </Button>
      </div>
    </div>
  );
};

export default QuickActions;