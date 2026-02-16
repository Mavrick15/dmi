import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';

const RegulatoryReports = () => {
  const { hasPermission } = usePermissions();
  const reportCategories = [
    {
      id: 'hipaa',
      title: 'Conformité HIPAA',
      description: 'Documentation de sécurité et confidentialité',
      icon: 'Shield',
      theme: 'blue',
      reports: [
        { name: 'Audit Mensuel', status: 'ready', date: '01 Nov 2024' },
        { name: 'Impact Vie Privée', status: 'due', date: '15 Nov 2024' }
      ]
    },
    {
      id: 'security',
      title: 'Sécurité & Accès',
      description: 'Analyse des permissions et incidents',
      icon: 'Lock',
      theme: 'indigo',
      reports: [
        { name: 'Revue Contrôle Accès', status: 'ready', date: '30 Oct 2024' },
        { name: 'Log Incidents', status: 'ready', date: 'Live' }
      ]
    }
  ];

  const getStatusColor = (status) => status === 'ready' ? 'text-emerald-500' : 'text-amber-500';
  const getStatusIcon = (status) => status === 'ready' ? 'CheckCircle' : 'Clock';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Icon name="FileText" className="text-slate-400" /> Rapports Réglementaires
        </h3>
        <PermissionGuard requiredPermission="audit_view">
          <Button variant="default" size="sm" iconName="Plus" className="shadow-sm" disabled={!hasPermission('audit_view')}>Nouveau</Button>
        </PermissionGuard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.isArray(reportCategories) && reportCategories.map((category) => {
          if (!category || typeof category !== 'object') return null;
          return (
          <div key={category.id} className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-3 mb-4">
               <div className={`p-2 rounded-lg ${category.theme === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'}`}>
                  <Icon name={category.icon} size={20} />
               </div>
               <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{category.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{category.description}</p>
               </div>
            </div>

            <div className="space-y-2">
                {Array.isArray(category.reports) && category.reports.map((report, idx) => {
                  if (!report || typeof report !== 'object') return null;
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Icon name={getStatusIcon(report.status)} size={16} className={getStatusColor(report.status)} />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{report.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-400 font-mono">{report.date}</span>
                            <PermissionGuard requiredPermission="audit_view">
                              <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-primary" disabled={!hasPermission('audit_view')}><Icon name="Download" size={14} /></Button>
                            </PermissionGuard>
                        </div>
                    </div>
                  );
                }).filter(Boolean)}
            </div>
          </div>
          );
        }).filter(Boolean)}
      </div>
    </div>
  );
};

export default RegulatoryReports;