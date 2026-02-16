import { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { useExportMutations } from '../../../hooks/useExport';

const AuditTrailMonitor = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { hasPermission } = usePermissions();
  const { exportAudit } = useExportMutations();

  const auditActivities = [
    { id: 1, timestamp: new Date(Date.now() - 300000), user: "Dr. Sarah Chen", role: "Médecin", action: "Accès Dossier", resource: "Patient: PAT-2024-1847", level: "low", ip: "192.168.1.45" },
    { id: 2, timestamp: new Date(Date.now() - 900000), user: "Maria Rodriguez", role: "Infirmière", action: "Création Prescription", resource: "RX-2024-5632", level: "medium", ip: "192.168.1.67" },
    { id: 3, timestamp: new Date(Date.now() - 1800000), user: "Admin System", role: "SysAdmin", action: "Modification Droits", resource: "User: USR-2024-0892", level: "high", ip: "192.168.1.10" },
    { id: 4, timestamp: new Date(Date.now() - 3600000), user: "Jennifer Park", role: "Admin", action: "Export Données", resource: "Rapport Mensuel", level: "medium", ip: "192.168.1.23" },
    { id: 5, timestamp: new Date(Date.now() - 7200000), user: "Dr. Michael Torres", role: "Spécialiste", action: "Échec Connexion", resource: "Portail Login", level: "high", ip: "203.45.67.89" }
  ];

  const filterOptions = [
    { value: 'all', label: 'Tout' },
    { value: 'access', label: 'Accès' },
    { value: 'modifications', label: 'Modifs' },
    { value: 'security', label: 'Sécurité' }
  ];

  const getRiskStyle = (level) => {
    switch (level) {
      case 'low': return 'bg-emerald-500';
      case 'medium': return 'bg-amber-500';
      case 'high': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Piste d'Audit</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Traçabilité complète des actions système</p>
        </div>
        <div className="flex gap-2">
            {Array.isArray(filterOptions) && filterOptions.map(opt => {
              if (!opt || typeof opt !== 'object') return null;
              return (
                <button 
                    key={opt.value}
                    onClick={() => setSelectedFilter(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedFilter === opt.value ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                >
                    {opt.label}
                </button>
              );
            }).filter(Boolean)}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {Array.isArray(auditActivities) && auditActivities.map((activity) => {
          if (!activity || typeof activity !== 'object') return null;
          return (
          <div key={activity.id} className="group border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-stretch">
              {/* Risk Indicator Strip */}
              <div className={`w-1 ${getRiskStyle(activity.level)}`}></div>
              
              <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Time & User */}
                <div className="sm:w-48 flex-shrink-0">
                   <div className="text-xs font-mono text-slate-400 dark:text-slate-500 mb-1">
                      {activity.timestamp.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                   </div>
                   <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">{activity.user}</div>
                   <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">{activity.role}</div>
                </div>

                {/* Action & Resource */}
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                          {activity.action}
                      </span>
                   </div>
                   <div className="text-sm text-slate-600 dark:text-slate-300 font-mono truncate">
                      {activity.resource}
                   </div>
                </div>

                {/* Metadata (IP) */}
                <div className="sm:text-right flex flex-col sm:items-end gap-2">
                   <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                      <Icon name="Globe" size={10} /> {activity.ip}
                   </div>
                   <Button variant="ghost" size="xs" className="opacity-0 group-hover:opacity-100 transition-opacity h-6 text-xs">
                      Détails
                   </Button>
                </div>
              </div>
            </div>
          </div>
          );
        }).filter(Boolean)}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-center">
         <PermissionGuard requiredPermission="audit_view">
           <Button variant="outline" size="sm" iconName="Download" className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" disabled={!hasPermission('audit_view') || exportAudit.isPending} onClick={() => exportAudit.mutate({})}>
              {exportAudit.isPending ? 'Export...' : 'Exporter les logs (CSV)'}
           </Button>
         </PermissionGuard>
      </div>
    </div>
  );
};

export default AuditTrailMonitor;