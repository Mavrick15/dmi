import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const BiometricLogin = ({ onBiometricLogin, isLoading }) => {
  const [scanningId, setScanningId] = useState(null);

  // Données simulées (Mocks)
  const availableUsers = [
    { id: 'u1', name: 'Dr. Sarah Chen', role: 'Médecin Généraliste', type: 'faceid', avatar: null, initials: 'SC' },
    { id: 'u2', name: 'Admin Johnson', role: 'Administrateur', type: 'fingerprint', avatar: null, initials: 'AJ' }
  ];

  const handleLogin = (user) => {
    if (isLoading || scanningId) return;
    setScanningId(user.id);
    
    // Simulation du délai biométrique
    setTimeout(() => {
      setScanningId(null);
      onBiometricLogin({ ...user, authMethod: 'biometric' });
    }, 2000);
  };

  return (
    <div className="space-y-6 w-full max-w-sm mx-auto animate-fade-in">
      
      {/* Séparateur */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/20 dark:border-white/10"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="backdrop-blur-xl bg-white/50 dark:bg-white/10 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Comptes détectés
          </span>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="space-y-3">
        {availableUsers.map((user) => {
          const isScanning = scanningId === user.id;
          
          return (
            <motion.button
              key={user.id}
              onClick={() => handleLogin(user)}
              disabled={isLoading || scanningId !== null}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative w-full group flex items-center p-3 rounded-xl border transition-all duration-300 outline-none overflow-hidden text-left
                ${isScanning 
                  ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/20' 
                  : 'border-white/20 dark:border-white/10 glass-surface hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-md'
                }
              `}
            >
              {/* Avatar / Initiales */}
              <div className={`
                w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm mr-4 transition-colors flex-shrink-0
                ${isScanning 
                  ? 'bg-primary text-white' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-primary'}
              `}>
                {user.initials}
              </div>

              {/* Info Utilisateur */}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-bold transition-colors truncate ${isScanning ? 'text-primary' : 'text-slate-900 dark:text-white group-hover:text-primary'}`}>
                  {user.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.role}
                </div>
              </div>

              {/* Icone Biométrique */}
              <div className="relative flex items-center justify-center w-10 h-10 ml-2">
                {isScanning ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative flex items-center justify-center"
                  >
                    <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></span>
                    <Icon name="ScanLine" size={20} className="text-primary relative z-10" />
                  </motion.div>
                ) : (
                  <Icon 
                    name={user.type === 'faceid' ? 'ScanFace' : 'Fingerprint'} 
                    size={24} 
                    className="text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors" 
                  />
                )}
              </div>

              {/* Barre de progression (Scan) */}
              {isScanning && (
                <motion.div 
                  className="absolute bottom-0 left-0 h-1 bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "linear" }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Note de sécurité */}
      <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30 transition-colors">
        <div className="flex items-start gap-3">
          <Icon name="ShieldCheck" size={18} className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide mb-1">
              Sécurité Hardware
            </h4>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400/80 leading-relaxed">
              L'authentification s'effectue localement via la puce de sécurité (TPM). Aucune donnée biométrique n'est transmise.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiometricLogin;