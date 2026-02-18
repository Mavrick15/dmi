import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Modal from '../../../components/ui/Modal';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import api from '../../../lib/axios';
import { useAuth } from '../../../contexts/AuthContext';

const AppointmentDetailsModal = ({ isOpen, onClose, appointment: initialAppointment }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Vérifier si l'utilisateur peut lancer une consultation (seulement docteur)
  // Les infirmières peuvent voir les informations mais ne peuvent pas créer de consultations
  const canStartConsultation = user?.role === 'docteur';

  useEffect(() => {
    if (isOpen && initialAppointment) {
      // Si on a déjà les données de base, on peut les utiliser directement
      // Sinon, on peut essayer de récupérer plus de détails depuis l'API
      setAppointment(initialAppointment);
      setError(null);
      
      // Optionnel : récupérer plus de détails depuis l'API si nécessaire
      if (initialAppointment.id && (!initialAppointment.notes || !initialAppointment.priorite)) {
        fetchFullDetails(initialAppointment.id);
      }
    } else {
      setAppointment(null);
      setError(null);
    }
  }, [isOpen, initialAppointment]);

  const fetchFullDetails = async (appointmentId) => {
    setLoading(true);
    try {
      const response = await api.get('/appointments');
      if (response.data.success && Array.isArray(response.data.data)) {
        const dataArray = Array.isArray(response.data.data) ? response.data.data : [];
        const fullAppointment = dataArray.find(apt => apt && apt.id === appointmentId);
        if (fullAppointment) {
          setAppointment({ ...initialAppointment, ...fullAppointment });
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors du chargement des détails:', err);
      }
      // On garde les données initiales même en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'programme': { variant: 'warning', label: 'Programmé' },
      'en_cours': { variant: 'info', label: 'En cours' },
      'termine': { variant: 'success', label: 'Terminé' },
      'annule': { variant: 'error', label: 'Annulé' },
      'pending': { variant: 'warning', label: 'En attente' },
      'confirmed': { variant: 'success', label: 'Confirmé' },
      'cancelled': { variant: 'error', label: 'Annulé' },
      'completed': { variant: 'default', label: 'Terminé' }
    };
    const statusInfo = statusMap[status] || { variant: 'default', label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Détails du rendez-vous"
      icon="Calendar"
      size="lg"
    >
      {loading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-8 flex flex-col items-center justify-center gap-3">
          <Icon name="Loader2" size={32} className="animate-spin text-primary" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement des détails…</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/20 p-8 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <Icon name="AlertCircle" size={28} className="text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 text-center">{error}</p>
        </div>
      ) : appointment ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* En-tête avec statut */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {appointment.patientName || appointment.patient?.name || 'Patient inconnu'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Icon name="Clock" size={14} className="text-slate-400" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {appointment.time || formatTime(appointment.dateHeure)} - {formatDate(appointment.date || appointment.dateHeure)}
                </p>
              </div>
            </div>
            {getStatusBadge(appointment.status || appointment.statut)}
          </div>

          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex">
              <div className="w-1 rounded-full self-stretch min-h-[3rem] shrink-0 bg-primary mr-3" />
              <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="User" size={16} className="text-primary" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Patient</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {appointment.patientName || appointment.patient?.name || 'N/A'}
              </p>
              {appointment.patient?.numeroPatient && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  N° {appointment.patient.numeroPatient}
                </p>
              )}
              </div>
            </div>

            {/* Médecin */}
            {(appointment.medecinName || appointment.medecin?.name) && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Stethoscope" size={16} className="text-primary" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Médecin</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {appointment.medecinName || appointment.medecin?.name || 'N/A'}
                </p>
              </div>
            )}

            {/* Type/Motif */}
            {(appointment.type || appointment.motif) && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="FileText" size={16} className="text-primary" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Type</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {appointment.type || appointment.motif || 'N/A'}
                </p>
              </div>
            )}

            {/* Priorité */}
            {(appointment.priority || appointment.priorite) && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="AlertCircle" size={16} className="text-primary" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Priorité</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                  {appointment.priority || appointment.priorite || 'Normale'}
                </p>
              </div>
            )}

            {/* Durée */}
            {(appointment.duration || appointment.dureeMinutes) && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Clock" size={16} className="text-primary" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Durée</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {appointment.duration || appointment.dureeMinutes || 30} minutes
                </p>
              </div>
            )}

            {/* Salle */}
            {appointment.room && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="MapPin" size={16} className="text-primary" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Salle</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Salle {appointment.room}
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="FileText" size={16} className="text-primary" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Notes</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {appointment.notes}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
              Fermer
            </Button>
            {/* Seuls les docteurs et infirmières peuvent démarrer une consultation */}
            {canStartConsultation && (appointment.status === 'programme' || appointment.status === 'pending' || appointment.statut === 'programme') && (
              <Button 
                variant="default" 
                onClick={() => {
                  // Navigation vers la console clinique avec le patient et le rendez-vous
                  const patientId = appointment.patientId || appointment.patient?.id;
                  const appointmentId = appointment.id;
                  
                  if (patientId) {
                    navigate(`/console-clinique?patientId=${patientId}&appointmentId=${appointmentId}&startConsultation=true`);
                    onClose();
                  }
                }}
                className="flex-1 rounded-xl"
                iconName="Stethoscope"
              >
                Démarrer consultation
              </Button>
            )}
          </div>
        </motion.div>
      ) : null}
    </Modal>
  );
};

export default AppointmentDetailsModal;

