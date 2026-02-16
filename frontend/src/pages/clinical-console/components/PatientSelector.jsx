// frontend/src/pages/clinical-console/components/PatientSelector.jsx

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col h-[780px]"
    >
      
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-slate-50/50 dark:from-slate-800/50 dark:via-slate-900 dark:to-slate-800/30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-12 h-12 bg-gradient-to-br from-primary/10 to-blue-500/10 dark:from-primary/20 dark:to-blue-500/20 rounded-2xl flex items-center justify-center border border-primary/20 dark:border-primary/30 shadow-sm"
            >
              <Icon name="Users" size={22} className="text-primary dark:text-blue-400" />
            </motion.div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Patients</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sélection & Recherche</p>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={isSearchOpen ? "bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}
            >
              <Icon name={isSearchOpen ? "X" : "Search"} size={20} />
            </Button>
          </motion.div>
        </div>

        <AnimatePresence>
          {isSearchOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Input
                type="search"
                placeholder="Rechercher par nom ou ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 focus:ring-primary/20"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Liste des Patients */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-white dark:bg-slate-900">
        
        {loadingList ? (
             <div className="flex justify-center py-10">
               <Loader2 className="animate-spin text-primary" size={24} />
               <span className="ml-3 text-sm text-slate-500 dark:text-slate-400">Chargement des dossiers...</span>
             </div>
        ) : isError ? (
             <div className="flex flex-col items-center justify-center py-10 text-rose-500">
                <AlertCircle size={24} className="mb-2"/>
                <p className="text-sm">Erreur de chargement</p>
             </div>
        ) : filteredPatients.length > 0 ? (
          <>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">
              Patients Récents ({filteredPatients.length})
            </h3>
            
            {filteredPatients.map((patient, index) => {
              const styles = getUrgencyStyles(patient.urgency);
              const isSelected = selectedPatient?.id === patient.id;

              return (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ y: -2, scale: 1.01 }}
                  onClick={() => handleSelect(patient)} 
                  className={`
                    p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 group relative overflow-hidden
                    ${isSelected 
                      ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-blue-50/50 dark:from-primary/20 dark:via-primary/10 dark:to-blue-950/30 border-primary/50 dark:border-primary/40 shadow-lg shadow-primary/10' 
                      : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-primary/40 dark:hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'
                    }
                  `}
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {loadingDetails && isSelected && (
                     <motion.div 
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10"
                     >
                        <Loader2 className="animate-spin text-primary" size={24} />
                     </motion.div>
                  )}

                  <div className="relative flex items-start space-x-4 z-10">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className="relative flex-shrink-0"
                    >
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-700 shadow-md">
                        <Image
                          src={patient.avatar}
                          alt={patient.name}
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 shadow-lg ${styles.dot}`} 
                      />
                    </motion.div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-bold text-sm truncate transition-colors ${isSelected ? 'text-primary dark:text-blue-400' : 'text-slate-800 dark:text-slate-100 group-hover:text-primary dark:group-hover:text-blue-400'}`}>
                          {patient.name}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          {patient.numeroPatient}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                        <span className="font-medium">{patient.age}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span>{patient.gender}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span className="truncate">Visite: {patient.lastVisit}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          {patient.condition}
                        </span>
                        <motion.span 
                          whileHover={{ scale: 1.05 }}
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-lg border shadow-sm ${styles.badge}`}
                        >
                          {patient.urgency === 'urgent' ? 'Urgent' : patient.urgency === 'priority' ? 'Priorité' : 'Routine'}
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 dark:text-slate-500">
             <Icon name="SearchX" size={32} className="mb-2 opacity-50" />
             <p className="text-sm">Aucun patient trouvé</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50/50 via-white to-slate-50/30 dark:from-slate-900/50 dark:via-slate-900 dark:to-slate-800/30">
        <PermissionGuard requiredPermission="consultation_create">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="primary"
              fullWidth
              iconName="UserPlus"
              iconPosition="left"
              onClick={onNewConsultation}
              className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-lg shadow-primary/20 font-semibold"
            >
              Nouvelle Consultation
            </Button>
          </motion.div>
        </PermissionGuard>
      </div>
    </motion.div>
  );
});

PatientSelector.displayName = 'PatientSelector';

export default PatientSelector;