import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';

const PatientCard = React.memo(({ patient, onViewDetails, onScheduleAppointment }) => {
  const { hasPermission } = usePermissions();
  

  // Formater l'âge pour l'affichage (le backend envoie maintenant juste le nombre)
  // Mémoriser pour éviter les recalculs
  const formatAge = useCallback((age) => {
    if (age === null || age === undefined || age === '--') return null;
    
    // Le backend envoie maintenant juste le nombre, on ajoute "ans"
    const ageNum = typeof age === 'number' ? age : parseInt(age);
    if (!isNaN(ageNum)) {
      return `${ageNum} ans`;
    }
    
    return null;
  }, []);

  const displayAge = useMemo(() => formatAge(patient?.age), [patient?.age, formatAge]);
  
  // Mémoriser les valeurs calculées
  const name = useMemo(() => patient?.name || 'Inconnu', [patient?.name]);
  const displayId = useMemo(() => patient?.numeroPatient || patient?.id?.substring(0, 8), [patient?.numeroPatient, patient?.id]);
  const status = useMemo(() => patient?.status === 'Active' ? 'active' : 'inactive', [patient?.status]);
  const initials = useMemo(() => {
    return name && typeof name === 'string'
      ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : '??';
  }, [name]);
  const conditions = useMemo(() => patient?.conditions || [], [patient?.conditions]);
  
  // Mémoriser les handlers pour éviter les re-renders
  const handleViewDetails = useCallback(() => {
    onViewDetails(patient);
  }, [patient, onViewDetails]);
  
  const handleScheduleAppointment = useCallback(() => {
    onScheduleAppointment(patient);
  }, [patient, onScheduleAppointment]);

  return (
    <motion.div 
      onClick={handleViewDetails}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`group relative bg-gradient-to-br ${status === 'active' ? 'from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/20' : 'from-slate-50 via-white to-slate-50/50 dark:from-slate-950/30 dark:via-slate-900 dark:to-slate-950/20'} border ${status === 'active' ? 'border-emerald-100 dark:border-emerald-900/50' : 'border-slate-200 dark:border-slate-800'} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full overflow-hidden`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Barre de statut supérieure */}
      <div className={`absolute top-0 left-0 w-full h-1 ${status === 'active' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}></div>

      {/* Header Carte */}
      <div className="flex items-start justify-between mb-4 mt-1">
        <div className="flex gap-3">
            <div className="relative">
                {patient.avatar ? (
                    <Image src={patient.avatar} alt={name} className="w-12 h-12 rounded-xl object-cover shadow-sm border border-slate-100 dark:border-slate-700" />
                ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-lg border border-slate-200 dark:border-slate-700">
                        {initials}
                    </div>
                )}
            </div>
            <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight group-hover:text-primary transition-colors line-clamp-1" title={name}>
                    {name}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5 bg-slate-50 dark:bg-slate-800 px-1 rounded w-fit">{displayId}</p>
            </div>
        </div>
        
        {/* Badge Sexe/Age */}
        {(displayAge || patient.gender) && (
          <div className="flex flex-col items-end">
              {displayAge && (
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{displayAge}</span>
              )}
              {patient.gender && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase mt-0.5">
                    {patient.gender === 'masculin' ? <Icon name="Mars" size={10} className="text-blue-400" /> : patient.gender === 'feminin' ? <Icon name="Venus" size={10} className="text-rose-400" /> : <Icon name="User" size={10} />}
                    <span>{patient.gender === 'masculin' ? 'Hom' : patient.gender === 'feminin' ? 'Fem' : 'Aut'}</span>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Info Rapides */}
      <div className="grid grid-cols-2 gap-2 mb-4 relative z-10">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/50 shadow-sm group-hover:shadow-md transition-all"
        >
            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide font-bold"><Icon name="Phone" size={10} /> Tél</div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate" title={patient.phone || 'N/A'}>
              {patient.phone || 'N/A'}
            </div>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900/50 shadow-sm group-hover:shadow-md transition-all"
        >
            <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 mb-1 uppercase tracking-wide font-bold"><Icon name="Calendar" size={10} /> Visite</div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
              {patient.lastVisit || 'N/A'}
            </div>
        </motion.div>
      </div>

      {/* Conditions / Tags */}
      <div className="flex-1 mb-4 min-h-[24px]">
         {Array.isArray(conditions) && conditions.length > 0 ? (
            <div className="flex flex-wrap gap-1">
                {conditions.slice(0, 2).map((c, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-[10px] font-bold rounded border border-blue-100 dark:border-blue-900/30 truncate max-w-full">
                        {c}
                    </span>
                ))}
                {conditions.length > 2 && <span className="text-[10px] text-slate-400 self-center font-medium">+{conditions.length - 2}</span>}
            </div>
         ) : (
            <p className="text-xs text-slate-400 italic pl-1">Aucune note particulière</p>
         )}
      </div>

      {/* Footer Actions (Apparition au survol) */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center opacity-80 group-hover:opacity-100 transition-opacity relative z-10">
         <motion.span 
           initial={{ scale: 0.8 }}
           animate={{ scale: 1 }}
           className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
         >
            <motion.span 
              animate={status === 'active' ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}
            ></motion.span>
            {status}
         </motion.span>

         <div className="flex gap-2">
            <PermissionGuard requiredPermission="appointment_create">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button 
                    variant="default" 
                    size="icon" 
                    className="h-8 w-8 rounded-full shadow-md shadow-primary/20 bg-gradient-to-br from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white"
                    onClick={(e) => { e.stopPropagation(); handleScheduleAppointment(); }}
                    disabled={!hasPermission('appointment_create')}
                    title="Rendez-vous"
                >
                    <Icon name="CalendarPlus" size={16} />
                </Button>
              </motion.div>
            </PermissionGuard>
         </div>
      </div>
    </motion.div>
  );
});

// Ajouter un displayName pour le debugging
PatientCard.displayName = 'PatientCard';

export default PatientCard;