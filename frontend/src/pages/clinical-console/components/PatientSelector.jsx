// frontend/src/pages/clinical-console/components/PatientSelector.jsx

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import api from '../../../lib/axios';
import { useAuth } from '../../../contexts/AuthContext';

const PatientSelector = React.memo(({ selectedPatient, onPatientSelect }) => {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const isDoctor = user?.role === 'docteur_clinique';

  const fetchPatients = useCallback(async () => {
    const params = { limit: 1000 };
    if (isDoctor) params.forMyAppointments = 1;
    const [patientsResponse, appointmentsResponse] = await Promise.all([
      api.get('/patients', { params }),
      isDoctor
        ? api.get('/appointments', { params: { includeAutoCancelled: 1 } })
        : Promise.resolve({ data: { data: [] } }),
    ]);

    const list = patientsResponse.data?.data ?? [];
    if (!Array.isArray(list)) return [];

    const appointmentsByPatient = new Map();
    const appointmentsList = appointmentsResponse?.data?.data;
    if (Array.isArray(appointmentsList)) {
      appointmentsList.forEach((appointment) => {
        if (!appointment || typeof appointment !== 'object' || !appointment.patientId) return;
        if (!appointmentsByPatient.has(appointment.patientId)) {
          appointmentsByPatient.set(appointment.patientId, []);
        }
        appointmentsByPatient.get(appointment.patientId).push(appointment);
      });
    }

    return list.map((p) => {
      if (!p || typeof p !== 'object') return null;
      const fallbackAppointments = Array.isArray(p.appointments) ? p.appointments : [];
      // Pour un médecin, utiliser uniquement /appointments (source de vérité des statuts RDV).
      const appointments = isDoctor
        ? (appointmentsByPatient.get(p.id) || [])
        : (appointmentsByPatient.get(p.id) || fallbackAppointments);
      const normalizeStatus = (status) => {
        if (status === 'pending') return 'programme';
        if (status === 'confirmed') return 'en_cours';
        if (status === 'consulted') return 'en_cours';
        if (status === 'completed') return 'termine';
        if (status === 'cancelled') return 'annule';
        return status;
      };
      const appointmentForStatus =
        appointments.find((a) => a && normalizeStatus(a.statut || a.status) === 'en_cours') ||
        appointments.find((a) => a && normalizeStatus(a.statut || a.status) === 'programme') ||
        appointments.find((a) => a && normalizeStatus(a.statut || a.status) === 'termine') ||
        appointments.find((a) => a && normalizeStatus(a.statut || a.status) === 'annule') ||
        appointments[0] ||
        null;

      return {
        ...p,
        condition: p.medicalHistory?.substring(0, 30) || 'Dossier sans antécédent',
        urgency: appointments.some((a) => a && (a.priority === 'urgente' || a.priorite === 'urgente'))
          ? 'urgent'
          : appointments.some((a) => a && (a.priority === 'elevee' || a.priorite === 'elevee'))
            ? 'priority'
            : 'routine',
        appointmentId: appointmentForStatus?.id || null,
        appointmentStatus: normalizeStatus(appointmentForStatus?.statut || appointmentForStatus?.status) || 'programme',
      };
    }).filter(Boolean);
  }, [isDoctor]);

  const {
    data: patientsForList = [],
    isLoading: loadingList,
    isError,
  } = useQuery({
    queryKey: ['patients', 'clinical', isDoctor ? 'forMyAppointments' : 'all'],
    queryFn: fetchPatients,
    enabled: !authLoading && !!user,
    refetchInterval: isDoctor ? 10000 : false,
    refetchOnWindowFocus: true,
  });

  // Filtrage par recherche (nom, n° patient, id)
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patientsForList;
    const query = searchQuery.toLowerCase();
    return patientsForList.filter((patient) => {
      if (!patient || typeof patient !== 'object') return false;
      const name = (typeof patient.name === 'string' ? patient.name : patient.nomComplet || '').toLowerCase();
      const numeroPatient = (typeof patient.numeroPatient === 'string' ? patient.numeroPatient : '').toLowerCase();
      const id = (typeof patient.id === 'string' ? patient.id : '').toLowerCase();
      return name.includes(query) || numeroPatient.includes(query) || id.includes(query);
    });
  }, [patientsForList, searchQuery]);

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
             onPatientSelect({
               ...response.data.data,
               appointmentId: patient.appointmentId || null,
               appointmentStatus: patient.appointmentStatus || null,
               urgency: patient.urgency || 'routine',
               condition: patient.condition || response.data.data?.condition,
             });
        }
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Erreur chargement détails patient:", error);
        }
    } finally {
        setLoadingDetails(false);
    }
  }, [onPatientSelect]);

  const getUrgencyStyles = useCallback((urgency) => {
    switch (urgency) {
      case 'urgent': 
        return {
          border: 'border-rose-400 dark:border-rose-500',
          borderStrong: 'border-rose-500 dark:border-rose-400',
          dot: 'bg-rose-500'
        };
      case 'priority': 
        return {
          border: 'border-amber-400 dark:border-amber-500',
          borderStrong: 'border-amber-500 dark:border-amber-400',
          dot: 'bg-amber-500'
        };
      default: 
        return {
          border: 'border-emerald-400 dark:border-emerald-500',
          borderStrong: 'border-emerald-500 dark:border-emerald-400',
          dot: 'bg-emerald-500'
        };
    }
  }, []);

  const getConsultationStatusStyles = useCallback((status) => {
    switch (status) {
      case 'en_cours':
        return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/50';
      case 'termine':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/50';
      case 'annule':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700';
      default:
        return 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-900/50';
    }
  }, []);

  const getConsultationStatusLabel = useCallback((status) => {
    switch (status) {
      case 'en_cours':
        return 'En cours';
      case 'termine':
        return 'Terminée';
      case 'annule':
        return 'Annulé';
      default:
        return 'En attente';
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col h-[780px]"
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
        {authLoading || loadingList ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 mx-2 border-l-4 border-l-primary">
            <Icon name="Loader2" size={28} className="animate-spin text-primary mb-3" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Chargement des dossiers…</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 mx-2 border-l-4 border-l-rose-500 text-rose-600 dark:text-rose-400">
            <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-2">
              <Icon name="AlertCircle" size={24} />
            </div>
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
                    p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 group relative overflow-hidden
                    ${isSelected
                      ? `bg-primary/10 dark:bg-primary/20 ${styles.borderStrong} shadow-sm ring-1 ring-primary/20`
                      : `bg-white dark:bg-slate-800/80 ${styles.border} hover:brightness-[0.98] dark:hover:brightness-110`
                    }
                  `}
                >
                  {loadingDetails && isSelected && (
                    <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
                      <Icon name="Loader2" size={22} className="animate-spin text-primary" />
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
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${getConsultationStatusStyles(patient.appointmentStatus)}`}>
                          {getConsultationStatusLabel(patient.appointmentStatus)}
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
            <Icon name={isDoctor && patientsForList.length === 0 ? 'Calendar' : 'SearchX'} size={36} className="mb-3 text-slate-300 dark:text-slate-600" />
            {isDoctor && patientsForList.length === 0 ? (
              <>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Aucun rendez-vous programmé</p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Les patients apparaîtront ici lorsqu&apos;ils auront un rendez-vous avec vous</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Aucun patient trouvé</p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Vérifiez l&apos;orthographe ou créez un nouveau dossier</p>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

PatientSelector.displayName = 'PatientSelector';

export default PatientSelector;