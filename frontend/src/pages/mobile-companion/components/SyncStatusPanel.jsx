import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { formatTimeInBusinessTimezone } from '../../../utils/dateTime';

const SyncStatusPanel = () => {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSyncTime, setLastSyncTime] = useState(new Date(Date.now() - 120000));
  const [syncProgress, setSyncProgress] = useState(0);

  const syncData = [
    { type: 'Dossiers Patients', count: 247, synced: 247, status: 'completed' },
    { type: 'Rendez-vous', count: 89, synced: 89, status: 'completed' },
    { type: 'Ordonnances', count: 156, synced: 143, status: 'syncing' },
    { type: 'Résultats Labo', count: 67, synced: 67, status: 'completed' },
    { type: 'Documents', count: 234, synced: 220, status: 'pending' },
    { type: 'Notes Cliniques', count: 445, synced: 445, status: 'completed' }
  ];

  const handleManualSync = () => {
    setSyncStatus('syncing');
    setSyncProgress(0);
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setSyncStatus('completed');
          setLastSyncTime(new Date());
          setTimeout(() => setSyncStatus('idle'), 2000);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed': return { icon: 'CheckCircle', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
      case 'syncing': return { icon: 'RefreshCw', color: 'text-blue-500 animate-spin', bg: 'bg-blue-50 dark:bg-blue-900/20' };
      case 'pending': return { icon: 'Clock', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' };
      case 'error': return { icon: 'AlertCircle', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' };
      default: return { icon: 'Circle', color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' };
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    return formatTimeInBusinessTimezone(date);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Synchronisation</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
            <Icon name="Clock" size={12} />
            Dernière : {formatTime(lastSyncTime)}
          </p>
        </div>
        <Button
          variant={syncStatus === 'syncing' ? 'ghost' : 'default'}
          size="sm"
          onClick={handleManualSync}
          disabled={syncStatus === 'syncing'}
          iconName={syncStatus === 'syncing' ? 'Loader2' : 'RefreshCw'}
          className={syncStatus === 'syncing' ? 'animate-pulse' : 'shadow-md shadow-primary/20'}
        >
          {syncStatus === 'syncing' ? 'En cours...' : 'Sync'}
        </Button>
      </div>

      {/* Progress Bar Global */}
      {syncStatus === 'syncing' && (
        <div className="px-6 py-4 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30">
          <div className="flex justify-between text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
            <span>Synchronisation des données...</span>
            <span>{syncProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-1.5">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* List */}
      <div className="p-4 space-y-3">
        {Array.isArray(syncData) && syncData.map((item, index) => {
          if (!item || typeof item !== 'object') return null;
          const status = getStatusConfig(item.status);
          return (
            <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${status.bg}`}>
                  <Icon name={status.icon} size={16} className={status.color} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">{item.type}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {item.synced}/{item.count} éléments
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {Math.round((item.synced / item.count) * 100)}%
                </div>
                {item.status === 'pending' && (
                  <span className="text-[10px] font-medium text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">En attente</span>
                )}
              </div>
            </div>
          );
        }).filter(Boolean)}
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="p-4 text-center">
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">1,238</div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Synchronisés</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-lg font-bold text-amber-500">14</div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">En attente</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-lg font-bold text-slate-700 dark:text-slate-300">2.3 MB</div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Cache</div>
        </div>
      </div>
    </div>
  );
};

export default SyncStatusPanel;