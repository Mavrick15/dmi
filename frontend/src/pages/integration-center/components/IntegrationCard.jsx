import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';

const IntegrationCard = ({ integration, onConnect, onDisconnect, onConfigure }) => {
  const { hasPermission } = usePermissions();
  const getStatusConfig = (status) => {
    switch (status) {
      case 'connected':
        return { 
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50', 
          label: 'Connecté', 
          icon: 'CheckCircle2' 
        };
      case 'error':
        return { 
          badge: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/50', 
          label: 'Erreur', 
          icon: 'AlertCircle' 
        };
      case 'pending':
        return { 
          badge: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50', 
          label: 'En attente', 
          icon: 'Loader2' 
        };
      default:
        return { 
          badge: 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700', 
          label: 'Déconnecté', 
          icon: 'Power' 
        };
    }
  };

  const getCategoryIcon = (cat) => {
    if (cat === 'medical-device') return { icon: 'Activity', gradient: 'from-blue-500 to-blue-600' };
    if (cat === 'laboratory') return { icon: 'TestTube', gradient: 'from-violet-500 to-violet-600' };
    return { icon: 'Server', gradient: 'from-slate-500 to-slate-600' };
  };

  const getGradientBg = () => {
    const cat = integration?.category;
    if (cat === 'medical-device') return 'from-blue-50 via-white to-blue-50/50 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/20';
    if (cat === 'laboratory') return 'from-violet-50 via-white to-violet-50/50 dark:from-violet-950/30 dark:via-slate-900 dark:to-violet-950/20';
    return 'from-slate-50 via-white to-slate-50/50 dark:from-slate-950/30 dark:via-slate-900 dark:to-slate-950/20';
  };

  const getBorderColor = () => {
    const cat = integration?.category;
    if (cat === 'medical-device') return 'border-blue-100 dark:border-blue-900/50';
    if (cat === 'laboratory') return 'border-violet-100 dark:border-violet-900/50';
    return 'border-white/20 dark:border-white/10';
  };

  const statusConfig = getStatusConfig(integration?.status);
  const catStyle = getCategoryIcon(integration?.category);

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className={`group relative bg-gradient-to-br ${getGradientBg()} border ${getBorderColor()} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Header */}
      <div className="relative flex items-start justify-between mb-4 z-10">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className={`w-14 h-14 bg-gradient-to-br ${catStyle.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
          >
            <Icon name={integration?.icon || catStyle.icon} size={24} className="text-white" />
          </motion.div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{integration?.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{integration?.provider}</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${statusConfig.badge}`}>
          <Icon name={statusConfig.icon} size={12} className={integration?.status === 'pending' ? 'animate-spin' : ''} />
          {statusConfig.label}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex-1 leading-relaxed">
        {integration?.description}
      </p>

      {/* Stats */}
      <div className="relative grid grid-cols-2 gap-4 mb-6 p-3 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/50 dark:to-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm z-10">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Dernière Synchro</span>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 flex items-center gap-1">
             <Icon name="Clock" size={10} /> {integration?.lastSync}
          </p>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Données</span>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 flex items-center gap-1">
             <Icon name="Database" size={10} /> {integration?.dataPoints} pts
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        {integration?.status === 'connected' ? (
          <>
            <PermissionGuard requiredPermission="settings_manage">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onConfigure(integration?.id)}
                className="flex-1 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                disabled={!hasPermission('settings_manage')}
              >
                <Icon name="Settings" size={16} className="mr-2" />
                Configurer
              </Button>
            </PermissionGuard>
            <PermissionGuard requiredPermission="settings_manage">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onDisconnect(integration?.id)}
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                title="Déconnecter"
                disabled={!hasPermission('settings_manage')}
              >
                <Icon name="Unlink" size={18} />
              </Button>
            </PermissionGuard>
          </>
        ) : (
          <PermissionGuard requiredPermission="settings_manage">
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => onConnect(integration?.id)}
              className="w-full shadow-lg shadow-primary/20"
              disabled={!hasPermission('settings_manage')}
            >
              <Icon name="Link" size={16} className="mr-2" />
              Connecter
            </Button>
          </PermissionGuard>
        )}
      </div>
    </motion.div>
  );
};

export default IntegrationCard;