import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useToast } from '../../../contexts/ToastContext';

const SecuritySettings = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // État initial (Mocks pour l'instant, pourrait venir d'une API)
  const [settings, setSettings] = useState({
    mfaEnabled: true,
    mfaSms: true,
    mfaApp: true,
    passwordMinLength: 12,
    passwordExpiry: 90,
    passwordSpecialChars: true,
    passwordRotation: true,
    sessionTimeout: 15,
    maxLoginAttempts: 5,
    ipWhitelistEnabled: false
  });

  // Gestion des changements
  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    // Simulation d'appel API
    setTimeout(() => {
        setLoading(false);
        setHasChanges(false);
        showToast("Paramètres de sécurité mis à jour avec succès.", 'success');
    }, 1000);
  };

  const ToggleSwitch = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex-1 pr-4">
            <h5 className="text-sm font-bold text-slate-900 dark:text-white">{label}</h5>
            {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
        </div>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
                ${checked ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}
            `}
            role="switch"
            aria-checked={checked}
        >
            <span className="sr-only">Utiliser ce paramètre</span>
            <span
                aria-hidden="true"
                className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                    transition duration-200 ease-in-out
                    ${checked ? 'translate-x-5' : 'translate-x-0'}
                `}
            />
        </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
         <div>
             <h2 className="text-xl font-bold text-slate-900 dark:text-white">Paramètres de Sécurité</h2>
             <p className="text-sm text-slate-500 dark:text-slate-400">Politiques globales d'accès et de protection.</p>
         </div>
         <Button 
            onClick={handleSave} 
            disabled={!hasChanges || loading} 
            loading={loading}
            iconName="Save" 
            className="shadow-lg shadow-primary/20 bg-primary hover:bg-blue-600 text-white"
         >
            Enregistrer les modifications
         </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Carte MFA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg"><Icon name="Shield" size={20} /></div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Authentification (MFA)</h3>
                    <p className="text-xs text-slate-500">Double authentification</p>
                </div>
            </div>
            <div className="space-y-4">
                <ToggleSwitch 
                    label="Activer MFA (Global)" 
                    description="Force la double authentification pour tout le personnel" 
                    checked={settings.mfaEnabled} 
                    onChange={(val) => handleChange('mfaEnabled', val)} 
                />
                <div className={`space-y-4 pl-4 border-l-2 border-slate-100 dark:border-slate-800 transition-opacity duration-300 ${!settings.mfaEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <ToggleSwitch 
                        label="SMS autorisés" 
                        description="Permettre l'envoi de codes par SMS" 
                        checked={settings.mfaSms} 
                        onChange={(val) => handleChange('mfaSms', val)} 
                    />
                    <ToggleSwitch 
                        label="App Authenticator" 
                        description="Support Google/Microsoft Authenticator" 
                        checked={settings.mfaApp} 
                        onChange={(val) => handleChange('mfaApp', val)} 
                    />
                </div>
            </div>
        </div>

        {/* Carte Mots de Passe */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg"><Icon name="Lock" size={20} /></div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Politique Mots de Passe</h3>
                    <p className="text-xs text-slate-500">Règles de complexité</p>
                </div>
            </div>
            <div className="space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Longueur min.</label>
                        <Input 
                            type="number" 
                            value={settings.passwordMinLength} 
                            onChange={(e) => handleChange('passwordMinLength', parseInt(e.target.value))} 
                            className="dark:bg-slate-950 dark:border-slate-800" 
                            min="8"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Expiration (jours)</label>
                        <Input 
                            type="number" 
                            value={settings.passwordExpiry} 
                            onChange={(e) => handleChange('passwordExpiry', parseInt(e.target.value))} 
                            className="dark:bg-slate-950 dark:border-slate-800" 
                            min="30"
                        />
                    </div>
                 </div>
                 <ToggleSwitch 
                    label="Caractères spéciaux" 
                    description="Exiger au moins un symbole (@, #, $, %)" 
                    checked={settings.passwordSpecialChars} 
                    onChange={(val) => handleChange('passwordSpecialChars', val)} 
                />
                 <ToggleSwitch 
                    label="Rotation forcée" 
                    description="Interdire la réutilisation des 3 derniers mots de passe" 
                    checked={settings.passwordRotation} 
                    onChange={(val) => handleChange('passwordRotation', val)} 
                />
            </div>
        </div>

        {/* Carte Sessions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm lg:col-span-2 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg"><Icon name="Clock" size={20} /></div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Gestion des Sessions</h3>
                    <p className="text-xs text-slate-500">Déconnexion et verrouillage</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Slider Timeout */}
                <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Timeout Inactivité</label>
                    <div className="flex items-end gap-2 mt-2 mb-4">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{settings.sessionTimeout}</span>
                        <span className="text-sm text-slate-500 font-medium mb-1">minutes</span>
                    </div>
                    <input 
                        type="range" 
                        min="5" 
                        max="60" 
                        step="5"
                        value={settings.sessionTimeout} 
                        onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary" 
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                        <span>5m</span>
                        <span>60m</span>
                    </div>
                </div>

                {/* Slider Tentatives */}
                <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tentatives Max</label>
                    <div className="flex items-end gap-2 mt-2 mb-4">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{settings.maxLoginAttempts}</span>
                        <span className="text-sm text-slate-500 font-medium mb-1">échecs</span>
                    </div>
                     <input 
                        type="range" 
                        min="3" 
                        max="10" 
                        value={settings.maxLoginAttempts}
                        onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary" 
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                        <span>3</span>
                        <span>10</span>
                    </div>
                </div>

                {/* IP Whitelist */}
                <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Verrouillage IP</label>
                        <p className="text-xs text-slate-500 mt-2 mb-4 leading-relaxed">
                            Restreindre l'accès à l'administration uniquement aux adresses IP approuvées (VPN/Bureau).
                        </p>
                    </div>
                    <ToggleSwitch 
                        label="Activer Whitelist" 
                        checked={settings.ipWhitelistEnabled} 
                        onChange={(val) => handleChange('ipWhitelistEnabled', val)} 
                    />
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SecuritySettings;