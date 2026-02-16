import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState({
    cachedPatients: 247,
    pendingSync: 12,
    lastSync: '2 min'
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Icon name="Wifi" size={16} />
          </div>
          <div>
            <h4 className="font-bold text-emerald-900 dark:text-emerald-100 text-sm">Connecté</h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">Sync temps réel active</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-900/50 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
           <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-200">LIVE</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Icon name="WifiOff" size={16} />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm">Mode Hors-ligne</h4>
            <p className="text-xs text-amber-700 dark:text-amber-300">Données en cache disponibles</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-amber-100 dark:border-amber-900/30">
        <div className="text-center">
          <span className="block text-xs text-amber-600 dark:text-amber-400/80">Patients</span>
          <span className="font-bold text-amber-900 dark:text-amber-100">{offlineData.cachedPatients}</span>
        </div>
        <div className="text-center border-l border-amber-200 dark:border-amber-800/50">
          <span className="block text-xs text-amber-600 dark:text-amber-400/80">En attente</span>
          <span className="font-bold text-amber-900 dark:text-amber-100">{offlineData.pendingSync}</span>
        </div>
        <div className="text-center border-l border-amber-200 dark:border-amber-800/50">
          <span className="block text-xs text-amber-600 dark:text-amber-400/80">Sync</span>
          <span className="font-bold text-amber-900 dark:text-amber-100">{offlineData.lastSync}</span>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;