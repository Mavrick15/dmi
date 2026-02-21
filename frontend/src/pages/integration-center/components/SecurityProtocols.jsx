import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';

const SecurityProtocols = ({ protocols }) => {
  const { hasPermission } = usePermissions();
  const protocolsArray = Array.isArray(protocols) ? protocols : [];
  const getLevelStyle = (level) => {
    switch (level) {
      case 'high': return { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/50' };
      case 'medium': return { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/50' };
      default: return { badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', border: 'border-white/20 dark:border-white/10' };
    }
  };

  return (
    <div className="glass-panel rounded-3xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
         <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Icon name="ShieldCheck" className="text-emerald-500" /> Protocoles de Sécurité
         </h3>
         <PermissionGuard requiredPermission="audit_view">
           <Button variant="outline" size="sm" iconName="FileSearch" disabled={!hasPermission('audit_view')}>Audit Sécurité</Button>
         </PermissionGuard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {protocolsArray.map((protocol) => {
            if (!protocol || typeof protocol !== 'object') return null;
            const style = getLevelStyle(protocol.level);
            return (
                <div key={protocol.id} className={`p-5 rounded-2xl border bg-slate-50/50 dark:bg-slate-950/50 ${style.border} transition-shadow hover:shadow-md`}>
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 backdrop-blur-xl bg-white/50 dark:bg-white/10 rounded-lg shadow-sm text-slate-700 dark:text-slate-300">
                                <Icon name={protocol.icon} size={20} />
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white">{protocol.name}</h4>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${style.badge}`}>
                            {protocol.level}
                        </span>
                    </div>
                    
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                        {protocol.description}
                    </p>

                    <div className="space-y-2 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Chiffrement</span>
                            <span className="font-mono font-medium text-slate-600 dark:text-slate-300">{protocol.encryption || 'AES-256'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Authentification</span>
                            <span className="font-medium text-slate-600 dark:text-slate-300">{protocol.authentication || 'OAuth2 / JWT'}</span>
                        </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <PermissionGuard requiredPermission="settings_manage">
                        <Button variant="ghost" size="xs" className="w-full backdrop-blur-xl bg-white/50 dark:bg-white/10 border border-white/20 dark:border-white/10" disabled={!hasPermission('settings_manage')}>Configurer</Button>
                      </PermissionGuard>
                      <PermissionGuard requiredPermission="audit_view">
                        <Button variant="ghost" size="xs" className="w-full backdrop-blur-xl bg-white/50 dark:bg-white/10 border border-white/20 dark:border-white/10" disabled={!hasPermission('audit_view')}>Logs</Button>
                      </PermissionGuard>
                    </div>
                </div>
            );
        }).filter(Boolean)}
      </div>
    </div>
  );
};

export default SecurityProtocols;