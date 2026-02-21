import { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const iconBoxClasses = {
  blue: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200/50 dark:border-blue-800/50',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200/50 dark:border-emerald-800/50',
  purple: 'bg-purple-100 dark:bg-purple-900/30 border-purple-200/50 dark:border-purple-800/50',
  orange: 'bg-orange-100 dark:bg-orange-900/30 border-orange-200/50 dark:border-orange-800/50',
  rose: 'bg-rose-100 dark:bg-rose-900/30 border-rose-200/50 dark:border-rose-800/50',
  red: 'bg-red-100 dark:bg-red-900/30 border-red-200/50 dark:border-red-800/50',
  amber: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200/50 dark:border-amber-800/50',
  teal: 'bg-teal-100 dark:bg-teal-900/30 border-teal-200/50 dark:border-teal-800/50',
  indigo: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200/50 dark:border-indigo-800/50',
  cyan: 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-200/50 dark:border-cyan-800/50',
  violet: 'bg-violet-100 dark:bg-violet-900/30 border-violet-200/50 dark:border-violet-800/50',
  pink: 'bg-pink-100 dark:bg-pink-900/30 border-pink-200/50 dark:border-pink-800/50',
};
const getIconBoxClass = (color) => iconBoxClasses[color] || iconBoxClasses.blue;
const getIconClass = (color) => {
  const map = { blue: 'text-blue-600 dark:text-blue-400', emerald: 'text-emerald-600 dark:text-emerald-400', purple: 'text-purple-600 dark:text-purple-400', orange: 'text-orange-600 dark:text-orange-400', rose: 'text-rose-600 dark:text-rose-400', red: 'text-red-600 dark:text-red-400', amber: 'text-amber-600 dark:text-amber-400', teal: 'text-teal-600 dark:text-teal-400', indigo: 'text-indigo-600 dark:text-indigo-400', cyan: 'text-cyan-600 dark:text-cyan-400', violet: 'text-violet-600 dark:text-violet-400', pink: 'text-pink-600 dark:text-pink-400' };
  return map[color] || map.blue;
};

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
      { id: 'vital-signs', title: 'Signes Vitaux', description: 'Tension, pouls, temp.', icon: 'Activity', color: 'blue', shortcut: 'Ctrl+V' },
      { id: 'prescription', title: 'Nouvelle Ordonnance', description: 'Prescription rapide', icon: 'FileText', color: 'emerald', shortcut: 'Ctrl+P' },
      { id: 'lab-order', title: 'Analyses Bio.', description: 'Prescrire laboratoire', icon: 'TestTube', color: 'purple', shortcut: 'Ctrl+L' },
      { id: 'imaging', title: 'Imagerie', description: 'Radio, Echo, IRM', icon: 'Scan', color: 'orange', shortcut: 'Ctrl+I' }
    ],
    emergency: [
      { id: 'emergency-protocol', title: 'Protocole Urgence', description: 'Activer procédure', icon: 'Siren', color: 'rose', shortcut: 'F1' },
      { id: 'cardiac-arrest', title: 'Arrêt Cardiaque', description: 'Protocole RCP', icon: 'Heart', color: 'red', shortcut: 'F2' },
      { id: 'anaphylaxis', title: 'Anaphylaxie', description: 'Choc allergique', icon: 'AlertCircle', color: 'amber', shortcut: 'F3' }
    ],
    prescriptions: [
      { id: 'antibiotics', title: 'Antibiotiques', description: 'Prescription courante', icon: 'Pill', color: 'teal', shortcut: 'Alt+A' },
      { id: 'analgesics', title: 'Antalgiques', description: 'Gestion douleur', icon: 'Shield', color: 'indigo', shortcut: 'Alt+D' },
      { id: 'chronic-meds', title: 'Renouvellement', description: 'Traitements chroniques', icon: 'RefreshCw', color: 'cyan', shortcut: 'Alt+C' }
    ],
    referrals: [
      { id: 'specialist', title: 'Spécialiste', description: 'Avis confrère', icon: 'UserCheck', color: 'violet', shortcut: 'Ctrl+S' },
      { id: 'physiotherapy', title: 'Kinésithérapie', description: 'Rééducation', icon: 'Dumbbell', color: 'emerald', shortcut: 'Ctrl+K' },
      { id: 'psychology', title: 'Psychologie', description: 'Soutien mental', icon: 'Brain', color: 'pink', shortcut: 'Ctrl+Y' }
    ]
  };

  return (
    <div className="glass-panel rounded-xl shadow-sm overflow-hidden flex flex-col h-[780px]">
      {/* Header */}
      <div className="p-5 border-b border-white/20 dark:border-white/10 flex-shrink-0">
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
              className="group p-4 glass-panel rounded-xl/50 hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-sm transition-all text-left flex items-start gap-3"
            >
              <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border ${getIconBoxClass(action.color)}`}>
                <Icon name={action.icon} size={20} className={getIconClass(action.color)} />
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
      <div className="p-4 border-t border-white/20 dark:border-white/10 backdrop-blur-xl bg-white/50 dark:bg-white/10">
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