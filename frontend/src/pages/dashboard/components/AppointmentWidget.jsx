import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import AppointmentDetailsModal from './AppointmentDetailsModal';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { useToast } from '../../../contexts/ToastContext';
import { X } from 'lucide-react';

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
      case 'confirmed':
        return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', label: 'Confirmé' };
      case 'pending':
        return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', label: 'En attente' };
      case 'consulted':
        return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', label: 'Consulter' };
      case 'cancelled':
        return { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-400', label: 'Annulé' };
      case 'completed':
        return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', label: 'Terminé' };
      default:
        return { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400', label: status };
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
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="w-full flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 border border-primary/20 dark:border-primary/30 shadow-sm hover:shadow-md transition-all cursor-pointer relative group"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0 }}
                >
                  {/* Heure */}
                  <motion.div 
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className="p-2 rounded-lg bg-gradient-to-br from-primary to-blue-600 text-white flex-shrink-0 shadow-sm"
                  >
                    <Icon name="Clock" size={16} />
                  </motion.div>

                  {/* Détails */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {appointment?.patient?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-primary/70 dark:text-primary/60 font-medium">
                        {appointment?.time}
                      </span>
                      {appointment?.type && (
                        <>
                          <span className="text-[10px] text-primary/40 dark:text-primary/50">•</span>
                          <span className="text-xs text-primary/60 dark:text-primary/50">
                            {appointment?.type}
                          </span>
                        </>
                      )}
                      {appointment?.room && (
                        <>
                          <span className="text-[10px] text-primary/40 dark:text-primary/50">•</span>
                          <span className="text-xs text-primary/60 dark:text-primary/50">
                            Salle {appointment.room}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Badge Statut */}
                  <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${style.bg} ${style.text}`}>
                    {style.label}
                  </div>

                  {/* Bouton de suppression pour les rendez-vous consultés */}
                  {appointment?.status === 'consulted' && (
                    <button
                      onClick={(e) => handleRemoveAppointment(e, appointment.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Retirer de l'agenda"
                    >
                      <X size={14} />
                    </button>
                  )}
                </motion.div>
              );
            }).filter(Boolean)}
          </div>
        ) : (
          // État Vide
          <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400 dark:text-slate-500">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
              <Icon name="CalendarOff" size={24} className="opacity-50" />
            </div>
            <p className="text-sm">Aucun rendez-vous aujourd'hui</p>
            <p className="text-xs mt-1">Profitez-en pour mettre à jour vos dossiers.</p>
            <PermissionGuard requiredPermission="appointment_create">
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={onAddAppointment}
                disabled={!hasPermission('appointment_create')}
              >
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