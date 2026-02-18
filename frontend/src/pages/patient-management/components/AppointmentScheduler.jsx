// openclinic/frontend/src/pages/patient-management/components/AppointmentScheduler.jsx

import React, { useState, useEffect } from 'react';
import api from '../../../lib/axios';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { usePermissions } from '../../../hooks/usePermissions';
import { useToast } from '../../../contexts/ToastContext';
import { useAppointmentMutations, useDoctors } from '../../../hooks/useAppointments';

const TIME_SLOTS_MORNING = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const TIME_SLOTS_AFTERNOON = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];

const DURATION_OPTIONS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 h' }
];

const AppointmentScheduler = ({ isOpen, onClose, patient, onSchedule }) => {
  const { hasPermission } = usePermissions();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const [appointmentData, setAppointmentData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: '30',
    type: 'Consultation',
    provider: '',
    notes: '',
    priority: 'normale'
  });

  const { showToast } = useToast();
  const { createAppointment } = useAppointmentMutations();
  const { data: doctorsData } = useDoctors();

  useEffect(() => {
    if (doctorsData && Array.isArray(doctorsData)) {
      const formattedDoctors = doctorsData.map(d => ({
        value: d.id,
        label: d.name || d.nomComplet || 'Médecin'
      }));
      setProviders(formattedDoctors);
      setLoadingDoctors(false);
    }
  }, [doctorsData]);

  useEffect(() => {
    if (isOpen) {
      setLoadingDoctors(true);
      api.get('/doctors')
        .then(res => {
          if (res.data.success && Array.isArray(res.data.data)) {
            const doctors = res.data.data.map(d => ({
              value: d.value,
              label: d.label
            }));
            setProviders(doctors);
          }
        })
        .catch(() => {
          showToast("Impossible de charger la liste des médecins.", 'error');
          setProviders([]);
        })
        .finally(() => setLoadingDoctors(false));
    }
  }, [isOpen, showToast]);

  const appointmentTypes = [
    { value: 'Consultation', label: 'Consultation générale' },
    { value: 'Suivi', label: 'Suivi médical' },
    { value: 'Urgence', label: 'Urgence' },
    { value: 'Vaccination', label: 'Vaccination' }
  ];

  const priorities = [
    { value: 'faible', label: 'Basse', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    { value: 'normale', label: 'Normale', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    { value: 'elevee', label: 'Haute', color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    { value: 'urgente', label: 'Urgente', color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800' }
  ];

  const handleSubmit = async (e) => {
    e?.preventDefault();

    // Validation basique
    if (!appointmentData.provider) {
      showToast("Veuillez sélectionner un médecin.", 'error'); // <--- FEEDBACK ERREUR
      return;
    }
    if (!appointmentData.time) {
      showToast("Veuillez choisir une heure.", 'error'); // <--- FEEDBACK ERREUR
      return;
    }
    if (!patient || !patient.id) {
      showToast("Erreur: Aucun patient sélectionné.", 'error'); // <--- FEEDBACK ERREUR
      return;
    }

    setLoading(true);
    try {
      const payload = {
        patientId: patient.id,
        medecinId: appointmentData.provider,
        date: appointmentData.date,
        time: appointmentData.time,
        type: appointmentData.type,
        duration: parseInt(appointmentData.duration),
        priority: appointmentData.priority,
        notes: appointmentData.notes
      };

      await createAppointment.mutateAsync(payload);

      // Succès - Le toast et l'invalidation sont gérés par le hook
      if (onSchedule) onSchedule();
      onClose();

    } catch (error) {
      // L'erreur est gérée par le hook
      // Erreur gérée par le hook
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  if (!isOpen) return null;

  const patientName = patient?.user?.nomComplet || patient?.name || 'Patient';

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête avec patient */}
        <div className="shrink-0 px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 flex justify-between items-start gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Icon name="CalendarPlus" size={24} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nouveau rendez-vous</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Icon name="User" size={14} className="text-slate-400" />
                <span className="font-medium text-primary truncate">{patientName}</span>
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 text-slate-500 hover:text-slate-700 dark:hover:text-white rounded-xl">
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Date, type et durée */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Icon name="Calendar" size={18} className="text-primary" />
              <span className="text-sm font-semibold">Date et type</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Date"
                type="date"
                value={appointmentData.date}
                onChange={e => setAppointmentData({ ...appointmentData, date: e.target.value })}
                className={inputStyle}
              />
              <Select
                label="Type"
                options={appointmentTypes}
                value={appointmentData.type}
                onChange={v => setAppointmentData({ ...appointmentData, type: v })}
                buttonClassName={inputStyle}
              />
              <Select
                label="Durée"
                options={DURATION_OPTIONS}
                value={appointmentData.duration}
                onChange={v => setAppointmentData({ ...appointmentData, duration: v })}
                buttonClassName={inputStyle}
              />
            </div>
          </section>

          {/* Médecin */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Icon name="Stethoscope" size={18} className="text-primary" />
              <span className="text-sm font-semibold">Médecin</span>
            </div>
            <Select
              label=""
              options={providers}
              value={appointmentData.provider}
              onChange={v => setAppointmentData({ ...appointmentData, provider: v })}
              placeholder={loadingDoctors ? "Chargement..." : "Choisir un médecin..."}
              buttonClassName={inputStyle}
              disabled={loadingDoctors}
            />
            {providers.length === 0 && !loadingDoctors && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-xs border border-amber-200 dark:border-amber-800">
                <Icon name="AlertCircle" size={16} className="shrink-0 mt-0.5" />
                <span>Aucun médecin disponible. Créez un utilisateur avec le rôle &quot;Docteur&quot; dans l&apos;administration.</span>
              </div>
            )}
          </section>

          {/* Horaires */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Icon name="Clock" size={18} className="text-primary" />
              <span className="text-sm font-semibold">Horaire</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Matin</p>
                <div className="flex flex-wrap gap-1.5">
                  {TIME_SLOTS_MORNING.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setAppointmentData({ ...appointmentData, time: slot })}
                      className={`min-w-[3.5rem] py-2 px-2 text-sm rounded-lg border transition-all ${appointmentData.time === slot
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10'
                        }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Après-midi</p>
                <div className="flex flex-wrap gap-1.5">
                  {TIME_SLOTS_AFTERNOON.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setAppointmentData({ ...appointmentData, time: slot })}
                      className={`min-w-[3.5rem] py-2 px-2 text-sm rounded-lg border transition-all ${appointmentData.time === slot
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10'
                        }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Priorité */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Icon name="Flag" size={18} className="text-primary" />
              <span className="text-sm font-semibold">Priorité</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {priorities.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setAppointmentData({ ...appointmentData, priority: p.value })}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${appointmentData.priority === p.value ? 'ring-2 ring-offset-2 ring-primary ring-offset-white dark:ring-offset-slate-900' : 'opacity-80 hover:opacity-100'} ${p.color}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </section>

          {/* Notes */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Icon name="FileText" size={18} className="text-primary" />
              <span className="text-sm font-semibold">Notes</span>
            </div>
            <textarea
              className={`w-full rounded-xl p-3 text-sm border ${inputStyle}`}
              rows={3}
              value={appointmentData.notes}
              onChange={e => setAppointmentData({ ...appointmentData, notes: e.target.value })}
              placeholder="Symptômes, instructions, remarques..."
            />
          </section>
        </div>

        {/* Pied */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-slate-50/80 dark:bg-slate-800/30 rounded-b-2xl">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!hasPermission('appointment_create')} iconName="Check">
            Confirmer le rendez-vous
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentScheduler;