import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';

const QuickActionGrid = ({ onActionClick }) => {
  const { hasPermission } = usePermissions();
  const quickActions = [
    {
      id: 'emergency-lookup',
      icon: 'AlertTriangle',
      title: 'Urgence',
      description: 'Recherche patient rapide',
      theme: 'rose',
      urgent: true
    },
    {
      id: 'scan-document',
      icon: 'Camera',
      title: 'Scanner',
      description: 'Capturer un document',
      theme: 'blue'
    },
    {
      id: 'voice-note',
      icon: 'Mic',
      title: 'Note vocale',
      description: 'Dictée clinique',
      theme: 'violet'
    },
    {
      id: 'medication-check',
      icon: 'Pill',
      title: 'Vérif. Médoc',
      description: 'Interactions médicamenteuses',
      theme: 'amber'
    },
    {
      id: 'patient-lookup',
      icon: 'Search',
      title: 'Recherche',
      description: 'Dossier patient',
      theme: 'slate'
    },
    {
      id: 'vital-signs',
      icon: 'Activity',
      title: 'Constantes',
      description: 'Saisie rapide',
      theme: 'emerald'
    }
  ];

  const getThemeStyles = (theme) => {
    const themes = {
      rose: { 
        bg: 'bg-rose-50 dark:bg-rose-900/20', 
        border: 'border-rose-100 dark:border-rose-900/50', 
        iconBg: 'bg-rose-100 dark:bg-rose-900/40',
        iconText: 'text-rose-600 dark:text-rose-400'
      },
      blue: { 
        bg: 'bg-blue-50 dark:bg-blue-900/20', 
        border: 'border-blue-100 dark:border-blue-900/50', 
        iconBg: 'bg-blue-100 dark:bg-blue-900/40',
        iconText: 'text-blue-600 dark:text-blue-400'
      },
      violet: { 
        bg: 'bg-violet-50 dark:bg-violet-900/20', 
        border: 'border-violet-100 dark:border-violet-900/50', 
        iconBg: 'bg-violet-100 dark:bg-violet-900/40',
        iconText: 'text-violet-600 dark:text-violet-400'
      },
      amber: { 
        bg: 'bg-amber-50 dark:bg-amber-900/20', 
        border: 'border-amber-100 dark:border-amber-900/50', 
        iconBg: 'bg-amber-100 dark:bg-amber-900/40',
        iconText: 'text-amber-600 dark:text-amber-400'
      },
      emerald: { 
        bg: 'bg-emerald-50 dark:bg-emerald-900/20', 
        border: 'border-emerald-100 dark:border-emerald-900/50', 
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
        iconText: 'text-emerald-600 dark:text-emerald-400'
      },
      slate: { 
        bg: 'glass-surface', 
        border: 'border-white/20 dark:border-white/10', 
        iconBg: 'bg-slate-100 dark:bg-slate-700',
        iconText: 'text-slate-600 dark:text-slate-400'
      }
    };
    return themes[theme] || themes.slate;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Actions Rapides</h3>
        <PermissionGuard requiredPermission="settings_manage">
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400 hover:text-primary" disabled={!hasPermission('settings_manage')}>
            Personnaliser
          </Button>
        </PermissionGuard>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {Array.isArray(quickActions) && quickActions.map((action) => {
          if (!action || typeof action !== 'object') return null;
          const style = getThemeStyles(action.theme);
          
          return (
            <button
              key={action.id}
              onClick={() => onActionClick(action.id)}
              className={`
                relative p-4 rounded-2xl text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm border
                ${style.bg} ${style.border}
                ${action.urgent ? 'ring-1 ring-rose-500/30 shadow-rose-500/10' : 'hover:shadow-md'}
              `}
            >
              {/* Pulse pour action urgente */}
              {action.urgent && (
                <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              )}
              
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${style.iconBg} ${style.iconText}`}>
                <Icon name={action.icon} size={20} />
              </div>
              
              <div>
                <h4 className={`font-bold text-sm mb-0.5 ${action.urgent ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-white'}`}>
                  {action.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-medium opacity-90">
                  {action.description}
                </p>
              </div>
            </button>
          );
        }).filter(Boolean)}
      </div>
    </div>
  );
};

export default QuickActionGrid;