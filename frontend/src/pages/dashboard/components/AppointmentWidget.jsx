import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import AppointmentDetailsModal from './AppointmentDetailsModal';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { useToast } from '../../../contexts/ToastContext';

const STORAGE_KEY = 'hidden_appointments';

const AppointmentWidget = ({ appointments = [], onAddAppointment }) => {
  const { hasPermission } = usePermissions();
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hiddenAppointments, setHiddenAppointments] = useState(() => {
    // Charger depuis localStorage au démarrage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const { showToast } = useToast();

  // Filtrer uniquement les rendez-vous masqués manuellement
  // Le filtrage des rendez-vous passés se fait côté backend
  const visibleAppointments = useMemo(() => {
    const appointmentsArray = Array.isArray(appointments) ? appointments : [];
    const hiddenArray = Array.isArray(hiddenAppointments) ? hiddenAppointments : [];
    return appointmentsArray.filter(apt => {
      if (!apt || typeof apt !== 'object') return false;
      // Exclure uniquement les rendez-vous masqués manuellement
      return !hiddenArray.includes(apt.id);
    });
  }, [appointments, hiddenAppointments]);
  
  const getStatusStyle = (status) => {
    switch (status) {
      case 'programme':
      case 'pending':
        return { accent: 'bg-amber-500', card: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', label: 'En attente' };
      case 'en_cours':
      case 'consulted':
      case 'confirmed':
        return { accent: 'bg-blue-500', card: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', label: 'En cours' };
      case 'termine':
      case 'completed':
        return { accent: 'bg-emerald-500', card: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', label: 'Terminée' };
      case 'annule':
      case 'cancelled':
        return { accent: 'bg-rose-500', card: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800', label: 'Annulé' };
      default:
        return { accent: 'bg-slate-400', card: 'bg-slate-50 dark:bg-slate-800 border-white/20 dark:border-white/10', label: status };
    }
  };

  const handleRemoveAppointment = (e, appointmentId) => {
    e.stopPropagation(); // Empêcher l'ouverture du modal
    try {
      // Ajouter l'ID à la liste des rendez-vous masqués
      const updated = [...hiddenAppointments, appointmentId];
      setHiddenAppointments(updated);
      // Sauvegarder dans localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      showToast('Rendez-vous retiré de l\'agenda', 'success');
    } catch (error) {
      showToast('Erreur lors du masquage du rendez-vous', 'error');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Liste des rendez-vous */}
      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 min-h-0">
        {Array.isArray(visibleAppointments) && visibleAppointments.length > 0 ? (
          <div className="space-y-2">
            {visibleAppointments.map((appointment) => {
              if (!appointment || typeof appointment !== 'object') return null;
              const style = getStatusStyle(appointment?.status);
              
              return (
                <motion.div
                  key={appointment?.id}
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setIsModalOpen(true);
                  }}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border ${style.card} hover:shadow-md transition-all cursor-pointer relative group`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0 }}
                >
                  <div className={`w-1 rounded-full self-stretch min-h-[2.5rem] shrink-0 ${style.accent}`} />
                  <div className="p-2 rounded-lg glass-surface flex-shrink-0">
                    <Icon name="Clock" size={16} className="text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {appointment?.patient?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {appointment?.time}
                      </span>
                      {appointment?.type && (
                        <>
                          <span className="text-[10px] text-slate-400">•</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{appointment?.type}</span>
                        </>
                      )}
                      {appointment?.room && (
                        <>
                          <span className="text-[10px] text-slate-400">•</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">Salle {appointment.room}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide flex-shrink-0 text-slate-600 dark:text-slate-400">
                    {style.label}
                  </span>
                  {(appointment?.status === 'en_cours' || appointment?.status === 'consulted') && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveAppointment(e, appointment.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-xl glass-surface text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Retirer de l'agenda"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  )}
                </motion.div>
              );
            }).filter(Boolean)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <div className="w-14 h-14 rounded-xl glass-surface flex items-center justify-center mb-3">
              <Icon name="CalendarOff" size={24} className="text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Aucun rendez-vous aujourd'hui</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Profitez-en pour mettre à jour vos dossiers.</p>
            <PermissionGuard requiredPermission="appointment_create">
              <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={onAddAppointment} disabled={!hasPermission('appointment_create')}>
                Ajouter un RDV
              </Button>
            </PermissionGuard>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      <AppointmentDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
      />
    </div>
  );
};

export default AppointmentWidget;