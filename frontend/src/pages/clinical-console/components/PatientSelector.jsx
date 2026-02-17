// frontend/src/pages/clinical-console/components/PatientSelector.jsx

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query'; // <--- IMPORT REACT QUERY
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import Input from '../../../components/ui/Input';
import Image from '../../../components/AppImage';
import api from '../../../lib/axios'; 
import { Loader2, AlertCircle } from 'lucide-react';

const PatientSelector = React.memo(({ selectedPatient, onPatientSelect, onNewConsultation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);

  // --- FONCTION DE FETCH DÉPORTÉE (Pour React Query) ---
  const fetchRecentPatients = async () => {
    const response = await api.get('/patients', {
      params: { limit: 1000 } // Récupérer un grand nombre de patients pour affichage complet
    });
    
    if (response.data.success && Array.isArray(response.data.data)) {
      // Enrichissement des données
      return response.data.data.map(p => {
        if (!p || typeof p !== 'object') return null;
        return {
          ...p,
          condition: p.medicalHistory?.substring(0, 30) || 'Dossier sans antécédent',
          urgency: Array.isArray(p.appointments) && p.appointments.some(a => a && a.priority === 'urgente') ? 'urgent' : 
                   (Array.isArray(p.appointments) && p.appointments.some(a => a && a.priority === 'elevee') ? 'priority' : 'routine')
        };
      }).filter(p => p !== null);
    }
    return [];
  };

  // --- UTILISATION DU HOOK USEQUERY ---
  const { 
    data: dynamicPatients = [], 
    isLoading: loadingList, 
    isError 
  } = useQuery({
    queryKey: ['patients', 'recent'], // Clé unique pour le cache
    queryFn: fetchRecentPatients,
  });

  // Filtrage local - Afficher tous les patients correspondants (memoized)
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return dynamicPatients;
    const query = searchQuery.toLowerCase();
    return Array.isArray(dynamicPatients) ? dynamicPatients.filter((patient) => {
      if (!patient || typeof patient !== 'object') return false;
      const name = typeof patient.name === 'string' ? patient.name.toLowerCase() : '';
      const numeroPatient = typeof patient.numeroPatient === 'string' ? patient.numeroPatient.toLowerCase() : '';
      const id = typeof patient.id === 'string' ? patient.id.toLowerCase() : '';
      return name.includes(query) || numeroPatient.includes(query) || id.includes(query);
    }) : [];
  }, [dynamicPatients, searchQuery]);

  const handleSelect = useCallback(async (patient) => {
    if (selectedPatient?.id === patient.id) {
       onPatientSelect(null);
       return;
    }
    
    onPatientSelect(null);
    setLoadingDetails(true);
    try {
        const response = await api.get(`/patients/${patient.id}`);
        if (response.data.success) {
             onPatientSelect(response.data.data);
        }
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          if (process.env.NODE_ENV === 'development') {
            console.error("Erreur chargement détails patient:", error);
          }
        }
    } finally {
        setLoadingDetails(false);
    }
  }, [onPatientSelect]);

  const getUrgencyStyles = useCallback((urgency) => {
    switch (urgency) {
      case 'urgent': 
        return {
          badge: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/50',
          dot: 'bg-rose-500'
        };
      case 'priority': 
        return {
          badge: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50',
          dot: 'bg-amber-500'
        };
      default: 
        return {
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50',
          dot: 'bg-emerald-500'
        };
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[780px]"
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <Icon name="Users" size={20} className="text-primary dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Sélection du patient</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Recherchez ou choisissez un dossier</p>
          </div>
        </div>
        <div className="relative">
          <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Nom, n° patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white placeholder-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400"
            >
              <span className="sr-only">Effacer</span>
              <Icon name="X" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Liste des patients */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 bg-slate-50/30 dark:bg-slate-900">
        {loadingList ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary mb-3" size={28} />
            <span className="text-sm text-slate-500 dark:text-slate-400">Chargement des dossiers...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12 text-rose-600 dark:text-rose-400">
            <AlertCircle size={28} className="mb-2" />
            <p className="text-sm font-medium">Erreur de chargement</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Réessayez plus tard</p>
          </div>
        ) : filteredPatients.length > 0 ? (
          <>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1 mb-2">
              {filteredPatients.length} patient{filteredPatients.length > 1 ? 's' : ''}
            </p>
            {filteredPatients.map((patient, index) => {
              const styles = getUrgencyStyles(patient.urgency);
              const isSelected = selectedPatient?.id === patient.id;

              return (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.15) }}
                  onClick={() => handleSelect(patient)}
                  className={`
                    p-3 rounded-xl border cursor-pointer transition-all duration-200 group relative overflow-hidden
                    ${isSelected
                      ? 'bg-primary/10 dark:bg-primary/20 border-primary dark:border-primary/50 shadow-sm ring-1 ring-primary/20'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-primary/30 dark:hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }
                  `}
                >
                  {loadingDetails && isSelected && (
                    <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
                      <Loader2 className="animate-spin text-primary" size={22} />
                    </div>
                  )}

                  <div className="relative flex items-center gap-3 z-10">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <Image src={patient.avatar} alt={patient.name} className="w-full h-full object-cover" />
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${styles.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`font-semibold text-sm truncate ${isSelected ? 'text-primary dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'}`}>
                          {patient.name}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">{patient.numeroPatient}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{patient.age}</span>
                        <span>·</span>
                        <span className="truncate">{patient.gender}</span>
                        {patient.lastVisit && (
                          <>
                            <span>·</span>
                            <span className="truncate">{patient.lastVisit}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[100px]" title={patient.condition}>
                          {patient.condition}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-md ${styles.badge}`}>
                          {patient.urgency === 'urgent' ? 'Urgent' : patient.urgency === 'priority' ? 'Priorité' : 'Routine'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Icon name="SearchX" size={36} className="mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Aucun patient trouvé</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Vérifiez l'orthographe ou créez un nouveau dossier</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <PermissionGuard requiredPermission="consultation_create">
          <Button
            variant="primary"
            fullWidth
            iconName="UserPlus"
            iconPosition="left"
            onClick={onNewConsultation}
            className="font-semibold"
          >
            Nouvelle consultation
          </Button>
        </PermissionGuard>
      </div>
    </motion.div>
  );
});

PatientSelector.displayName = 'PatientSelector';

export default PatientSelector;