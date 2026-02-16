import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';

const DeviceIntegrationPanel = () => {
  const [isListening, setIsListening] = useState(false);
  const { hasPermission } = usePermissions();

  const deviceFeatures = [
    { id: 'camera', icon: 'Camera', title: 'Caméra', desc: 'Scanner docs & codes', status: 'active' },
    { id: 'location', icon: 'MapPin', title: 'GPS', desc: 'Visites à domicile', status: 'active' },
    { id: 'notifications', icon: 'Bell', title: 'Alertes', desc: 'Notifications push', status: 'active' },
    { id: 'biometric', icon: 'Fingerprint', title: 'Biométrie', desc: 'Sécurité accès', status: 'active' }
  ];

  const connectedDevices = [
    { id: 1, name: 'Tensiomètre Omron', status: 'connected', value: '120/80 mmHg', battery: 85, icon: 'Activity' },
    { id: 2, name: 'Oxymètre Nonin', status: 'connected', value: '98% SpO2', battery: 92, icon: 'Heart' },
    { id: 3, name: 'Thermomètre Braun', status: 'disconnected', value: '--', battery: null, icon: 'Thermometer' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Features Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Fonctionnalités Appareil</h3>
        <div className="grid grid-cols-1 gap-3">
          {Array.isArray(deviceFeatures) && deviceFeatures.map((feature) => {
            if (!feature || typeof feature !== 'object') return null;
            return (
            <div key={feature.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center text-primary shadow-sm">
                <Icon name={feature.icon} size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{feature.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{feature.desc}</p>
              </div>
              <div className="w-8 h-5 bg-emerald-500 rounded-full p-1 cursor-pointer">
                <div className="w-3 h-3 bg-white rounded-full ml-auto shadow-sm"></div>
              </div>
            </div>
            );
          }).filter(Boolean)}
        </div>
      </div>

      {/* Connected Devices */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Appareils Connectés</h3>
          <PermissionGuard requiredPermission="settings_manage">
            <Button variant="outline" size="sm" iconName="Plus" className="h-8 text-xs" disabled={!hasPermission('settings_manage')}>Ajouter</Button>
          </PermissionGuard>
        </div>
        
        <div className="space-y-3">
          {Array.isArray(connectedDevices) && connectedDevices.map((device) => {
            if (!device || typeof device !== 'object') return null;
            return (
            <div key={device.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${device.status === 'connected' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                  <Icon name={device.icon} size={20} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{device.name}</h4>
                    {device.status === 'connected' && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Icon name="Battery" size={10} /> {device.battery}%
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-medium ${device.status === 'connected' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                      {device.value}
                    </span>
                    {device.status === 'connected' && (
                      <button className="text-primary hover:text-primary/80 transition-colors">
                        <Icon name="RefreshCw" size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            );
          }).filter(Boolean)}
        </div>
      </div>

      {/* Voice Assistant */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
            <Icon name="Mic" size={24} className="text-white" />
          </div>
          <div>
            <h4 className="font-bold text-lg">Assistant Vocal</h4>
            <p className="text-indigo-100 text-sm">Dites "Hey MediCore"</p>
          </div>
        </div>
        
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/10">
          <p className="text-xs text-indigo-200 mb-2 uppercase font-bold tracking-wider">Suggestions</p>
          <ul className="text-sm space-y-1.5 text-white/90">
            <li>"Cherche le dossier de Martin"</li>
            <li>"Prends les constantes"</li>
            <li>"Lance le mode urgence"</li>
          </ul>
        </div>
        
        <Button 
          onClick={() => setIsListening(!isListening)}
          className={`w-full bg-white text-indigo-700 hover:bg-indigo-50 border-transparent font-bold transition-all ${isListening ? 'animate-pulse' : ''}`}
          iconName={isListening ? 'Loader2' : 'Mic'}
          iconPosition="left"
        >
          {isListening ? 'Écoute en cours...' : 'Démarrer l\'écoute'}
        </Button>
      </div>
    </div>
  );
};

export default DeviceIntegrationPanel;