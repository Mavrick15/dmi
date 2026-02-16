import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';

const APIEndpoints = ({ endpoints }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const { hasPermission } = usePermissions();
  const endpointsArray = Array.isArray(endpoints) ? endpoints : [];

  const getMethodStyle = (method) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'POST': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'PUT': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'DELETE': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Endpoints API</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Points d'entrée publics et sécurisés</p>
        </div>
        <PermissionGuard requiredPermission="settings_manage">
          <Button variant="outline" size="sm" iconName="Plus" disabled={!hasPermission('settings_manage')}>Ajouter</Button>
        </PermissionGuard>
      </div>
      
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {endpointsArray.map((endpoint) => {
          if (!endpoint || typeof endpoint !== 'object') return null;
          return (
          <div key={endpoint.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${getMethodStyle(endpoint.method)}`}>
                  {endpoint.method}
                </span>
                <code className="text-sm font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                  {endpoint.path}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className={`flex h-2 w-2 rounded-full ${endpoint.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">{endpoint.status}</span>
              </div>
            </div>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 ml-1">{endpoint.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-xs text-slate-400 dark:text-slate-500">
                 <span className="flex items-center gap-1"><Icon name="Activity" size={12} /> {endpoint.requestsPerHour || '0'} req/h</span>
                 <span className="flex items-center gap-1"><Icon name="Check" size={12} /> {endpoint.successRate || '100'}% succès</span>
                 <span className="flex items-center gap-1"><Icon name="Clock" size={12} /> {endpoint.avgResponse || '0'}ms</span>
              </div>
              
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <PermissionGuard requiredPermission="audit_view">
                  <Button variant="ghost" size="xs" iconName="BarChart2" disabled={!hasPermission('audit_view')}>Analytics</Button>
                </PermissionGuard>
                <PermissionGuard requiredPermission="settings_manage">
                  <Button variant="ghost" size="xs" iconName="Edit2" disabled={!hasPermission('settings_manage')}>Editer</Button>
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

export default APIEndpoints;