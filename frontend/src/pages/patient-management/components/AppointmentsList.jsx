import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import api from '../../../lib/axios';
import { useToast } from '../../../contexts/ToastContext';
import { useAppointments, useDoctors, useAppointmentMutations } from '../../../hooks/useAppointments';
import { Loader2 } from 'lucide-react';

const AppointmentsList = ({ patient, onSelectAppointment }) => {
  const { hasPermission } = usePermissions();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: '30',
    type: 'Consultation',
    provider: '',
    notes: '',
    priority: 'normale'
  });
  const { showToast } = useToast();
  const { data: doctors = [] } = useDoctors();
  const { createAppointment, updateAppointmentStatus } = useAppointmentMutations();

  // Fetch appointments
  const { data: appointmentsData, isLoading: loadingAppointments, refetch } = useAppointments({
    date: selectedDate,
    patientId: patient?.id,
  });

  const appointments = appointmentsData || [];

  const handleCreateAppointment = async () => {
    if (!patient?.id) {
      showToast('Veuillez sélectionner un patient', 'error');
      return;
    }

    if (!newAppointment.provider) {
      showToast('Veuillez sélectionner un médecin', 'error');
      return;
    }

    try {
      await createAppointment.mutateAsync({
        patientId: patient.id,
        medecinId: newAppointment.provider,
        date: newAppointment.date,
        time: newAppointment.time,
        duration: parseInt(newAppointment.duration),
        type: newAppointment.type,
        priority: newAppointment.priority,
        notes: newAppointment.notes,
      });

      // Le toast et l'invalidation sont gérés par le hook createAppointment
      setIsCreateModalOpen(false);
      setNewAppointment({
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        duration: '30',
        type: 'Consultation',
        provider: '',
        notes: '',
        priority: 'normale'
      });
      // Pas besoin de refetch(), React Query invalide automatiquement les queries
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur création rendez-vous:', error);
      }
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await updateAppointmentStatus.mutateAsync({ id: appointmentId, status: newStatus });
      // Le toast et l'invalidation sont gérés par le hook updateAppointmentStatus
      // Pas besoin de refetch(), React Query invalide automatiquement les queries
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur mise à jour statut:', error);
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgente':
        return 'error';
      case 'elevee':
        return 'warning';
      case 'faible':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'en_cours':
        return 'success';
      case 'programme':
        return 'info';
      case 'annule':
        return 'error';
      case 'termine':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loadingAppointments) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Icon name="Calendar" size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Rendez-vous</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Gestion des rendez-vous du patient</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-48"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="border border-slate-200 dark:border-slate-700"
          >
            <Icon name="Calendar" size={14} className="mr-1.5" />
            Aujourd'hui
          </Button>
          <PermissionGuard requiredPermission="appointment_create">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              iconName="Plus"
              disabled={!patient || !hasPermission('appointment_create')}
              size="sm"
              className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/20"
            >
              Nouveau RDV
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Content */}
      <div className="w-full">
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 border border-slate-200 dark:border-slate-700">
              <Icon name="CalendarX" size={32} className="text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Aucun rendez-vous
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
              Aucun rendez-vous trouvé pour le {formatDate(selectedDate)}.
            </p>
            <PermissionGuard requiredPermission="appointment_create">
              {patient && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  variant="outline"
                  size="sm"
                  disabled={!hasPermission('appointment_create')}
                  className="mt-4"
                >
                  Créer un rendez-vous
                </Button>
              )}
            </PermissionGuard>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(appointments) && appointments.map((appointment, idx) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/10 transition-all cursor-pointer overflow-hidden"
                onClick={() => onSelectAppointment && onSelectAppointment(appointment)}
              >
                {/* Gradient overlay au hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/3 group-hover:to-primary/0 transition-all duration-500 pointer-events-none rounded-2xl" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                          <Icon name="Clock" size={20} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xl text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                            {appointment.time} - {appointment.type}
                          </h4>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant={getPriorityColor(appointment.priority)} size="sm" className="shadow-sm">
                              <Icon name={appointment.priority === 'urgente' ? 'AlertTriangle' : 'Info'} size={12} className="mr-1" />
                              {appointment.priority}
                            </Badge>
                            <Badge variant={getStatusColor(appointment.status)} size="sm" className="shadow-sm">
                              {appointment.status === 'programme' && <Icon name="Clock" size={12} className="mr-1" />}
                              {appointment.status === 'en_cours' && <Icon name="CheckCircle" size={12} className="mr-1" />}
                              {appointment.status === 'termine' && <Icon name="Check" size={12} className="mr-1" />}
                              {appointment.status === 'annule' && <Icon name="X" size={12} className="mr-1" />}
                              {appointment.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 ml-16">
                        <div className="flex items-center gap-2">
                          <Icon name="User" size={14} className="text-slate-400" />
                          <span className="font-semibold">Patient:</span> {appointment.patientName}
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="UserCheck" size={14} className="text-slate-400" />
                          <span className="font-semibold">Médecin:</span> {appointment.medecinName}
                        </div>
                        {appointment.notes && (
                          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <p className="text-slate-500 dark:text-slate-400 italic text-xs">
                              {appointment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {appointment.status === 'programme' && (
                        <PermissionGuard requiredPermission="appointment_edit">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(appointment.id, 'en_cours');
                            }}
                            disabled={!hasPermission('appointment_edit')}
                            className="border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          >
                            <Icon name="CheckCircle" size={14} className="mr-1.5" />
                            Confirmer
                          </Button>
                        </PermissionGuard>
                      )}
                      {appointment.status !== 'annule' && appointment.status !== 'termine' && (
                        <PermissionGuard requiredPermission="appointment_edit">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(appointment.id, 'annule');
                            }}
                            disabled={!hasPermission('appointment_edit')}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                          >
                            <Icon name="X" size={14} className="mr-1.5" />
                            Annuler
                          </Button>
                        </PermissionGuard>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Appointment Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nouveau Rendez-vous"
        icon="CalendarPlus"
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreateAppointment}
              loading={createAppointment.isPending}
              disabled={!hasPermission('appointment_create')}
            >
              Créer
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon name="Calendar" size={18} className="text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Informations de base</span>
            </div>
            <div className="space-y-4">
              <Input
                label="Date"
                type="date"
                value={newAppointment.date}
                onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                className="bg-white dark:bg-slate-900"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Heure"
                  type="time"
                  value={newAppointment.time}
                  onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                  className="bg-white dark:bg-slate-900"
                />
                <Input
                  label="Durée (minutes)"
                  type="number"
                  value={newAppointment.duration}
                  onChange={(e) => setNewAppointment({ ...newAppointment, duration: e.target.value })}
                  className="bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800"
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon name="UserCheck" size={18} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Médecin & Priorité</span>
            </div>
            <div className="space-y-4">
              <div className="w-full">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Médecin *
                </label>
                <select
                  value={newAppointment.provider}
                  onChange={(e) => setNewAppointment({ ...newAppointment, provider: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                >
                  <option value="">Sélectionner un médecin</option>
                  {doctors.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Type / Motif"
                value={newAppointment.type}
                onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value })}
                placeholder="Consultation, Suivi, etc."
                className="bg-white dark:bg-slate-900"
              />
              <div className="w-full">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Priorité
                </label>
                <select
                  value={newAppointment.priority}
                  onChange={(e) => setNewAppointment({ ...newAppointment, priority: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                >
                  <option value="faible">Faible</option>
                  <option value="normale">Normale</option>
                  <option value="elevee">Élevée</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800"
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon name="FileText" size={18} className="text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">Notes</span>
            </div>
            <textarea
              value={newAppointment.notes}
              onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
              placeholder="Notes optionnelles..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-sm"
              rows={3}
            />
          </motion.div>
        </div>
      </Modal>
    </div>
  );
};

export default AppointmentsList;

