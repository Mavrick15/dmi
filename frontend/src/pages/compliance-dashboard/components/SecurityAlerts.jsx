import { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';

const SecurityAlerts = () => {
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const { hasPermission } = usePermissions();

  const securityAlerts = [
    {
      id: 1,
      title: "Échec Authentification Multiple",
      description: "Le compte 'dr.torres' a dépassé le seuil de tentatives (IP: 203.45.67.89)",
      severity: "high",
      category: "Auth",
      timestamp: "Il y a 5 min",
      status: "active",
      action: "Verrouiller le compte"
    },
    {
      id: 2,
      title: "Accès Données Inhabituel",
      description: "47 dossiers patients consultés en 15 min par 'nurse.martinez'",
      severity: "medium",
      category: "Data",
      timestamp: "Il y a 30 min",
      status: "investigating",
      action: "Contacter l'utilisateur"
    },
    {
      id: 3,
      title: "Tentative Export Non Autorisé",
      description: "Exportation bloquée depuis le poste WS-045",
      severity: "critical",
      category: "DLP",
      timestamp: "Il y a 1h",
      status: "blocked",
      action: "Revue des permissions"
    }
  ];

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'critical': return { bg: 'bg-rose-50 dark:bg-rose-900/10', border: 'border-rose-200 dark:border-rose-900/40', icon: 'text-rose-600', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200' };
      case 'high': return { bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-200 dark:border-orange-900/40', icon: 'text-orange-600', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' };
      default: return { bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-900/40', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
    }
  };

  return (
    <div className="glass-panel rounded-3xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/20 rounded-xl text-rose-600 dark:text-rose-400">
                <Icon name="Siren" size={24} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Alertes de Sécurité</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Menaces et anomalies détectées</p>
            </div>
        </div>
        <PermissionGuard requiredPermission="settings_manage">
          <Button variant="outline" size="sm" className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" disabled={!hasPermission('settings_manage')}>
             Configurer
          </Button>
        </PermissionGuard>
      </div>

      <div className="space-y-4">
        {Array.isArray(securityAlerts) && securityAlerts.map((alert) => {
            if (!alert || typeof alert !== 'object') return null;
            const style = getSeverityStyles(alert.severity);
            return (
                <div key={alert.id} className={`p-4 rounded-2xl border ${style.bg} ${style.border} transition-all hover:shadow-md`}>
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Icon name="AlertTriangle" size={18} className={style.icon} />
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">{alert.title}</h3>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${style.badge}`}>{alert.severity}</span>
                    </div>
                    
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 ml-6 leading-relaxed">
                        {alert.description}
                    </p>

                    <div className="flex items-center justify-between ml-6 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                            <span>{alert.timestamp}</span>
                            <span>•</span>
                            <span className="font-mono">{alert.category}</span>
                        </div>
                        <div className="flex gap-2">
                            <PermissionGuard requiredPermission="settings_manage">
                              <Button variant="ghost" size="xs" className="h-7 text-[10px] hover:bg-white/50 dark:hover:bg-black/20" disabled={!hasPermission('settings_manage')}>Ignorer</Button>
                            </PermissionGuard>
                            <PermissionGuard requiredPermission="settings_manage">
                              <Button variant="default" size="xs" className="h-7 text-[10px] bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 shadow-sm" disabled={!hasPermission('settings_manage')}>{alert.action}</Button>
                            </PermissionGuard>
                        </div>
                    </div>
                </div>
            );
        }).filter(Boolean)}
      </div>
    </div>
  );
};

export default SecurityAlerts;