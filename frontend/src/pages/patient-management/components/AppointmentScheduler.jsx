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

const AppointmentScheduler = ({ isOpen, onClose, patient, onSchedule }) => {
  const { hasPermission } = usePermissions();
  // États
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  
  const [appointmentData, setAppointmentData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: '30',
    type: 'Consultation',
    provider: '', // Stockera l'ID du médecin
    notes: '',
    priority: 'normale'
  });

  const { showToast } = useToast();
  const { createAppointment } = useAppointmentMutations();
  const { data: doctorsData } = useDoctors();

  // Charger les médecins à l'ouverture de la modale
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
        // On appelle l'endpoint spécifique qu'on a créé dans RendezVousController
        api.get('/doctors')
            .then(res => {
                if(res.data.success && Array.isArray(res.data.data)) {
                    // Mapping vers l'objet docteur de la base de données (si existant)
                    const doctors = res.data.data.map(d => ({
                        value: d.value,
                        label: d.label
                    }));
                    setProviders(doctors);
                }
            })
            .catch(err => {
                // Erreur gérée - affichée via toast
                showToast("Erreur: Impossible de charger la liste des médecins.", 'error'); // <--- FEEDBACK ERREUR
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
    { value: 'faible', label: 'Basse', color: 'bg-blue-50 text-blue-700' },
    { value: 'normale', label: 'Normale', color: 'bg-emerald-50 text-emerald-700' },
    { value: 'elevee', label: 'Haute', color: 'bg-amber-50 text-amber-700' },
    { value: 'urgente', label: 'Urgente', color: 'bg-rose-50 text-rose-700' }
  ];

  const timeSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

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
        if(onSchedule) onSchedule(); 
        onClose();
        
    } catch (error) {
        // L'erreur est gérée par le hook
        // Erreur gérée par le hook
    } finally {
        setLoading(false);
    }
  };

  const inputStyle = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Nouveau Rendez-vous</h2>
            <p className="text-sm text-slate-500">Patient : <span className="font-bold text-primary">{patient?.name || 'Inconnu'}</span></p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><Icon name="X" /></Button>
        </div>

        <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <Input label="Date" type="date" value={appointmentData.date} onChange={e => setAppointmentData({...appointmentData, date: e.target.value})} className={inputStyle} />
                <Select label="Type" options={appointmentTypes} value={appointmentData.type} onChange={v => setAppointmentData({...appointmentData, type: v})} buttonClassName={inputStyle} />
            </div>

            <div>
                <Select 
                    label="Médecin" 
                    options={providers} 
                    value={appointmentData.provider} 
                    onChange={v => setAppointmentData({...appointmentData, provider: v})} 
                    placeholder={loadingDoctors ? "Chargement..." : "Choisir un médecin..."} 
                    buttonClassName={inputStyle}
                    disabled={loadingDoctors}
                />
                {providers.length === 0 && !loadingDoctors && (
                    <div className="mt-2 p-3 bg-amber-50 text-amber-700 text-xs rounded-lg border border-amber-100">
                        Attention : Aucun médecin disponible. Veuillez créer un utilisateur avec le rôle "Docteur" dans l'administration.
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Horaire</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {timeSlots.map(slot => (
                        <button 
                            key={slot} 
                            type="button" 
                            onClick={() => setAppointmentData({...appointmentData, time: slot})} 
                            className={`px-2 py-1.5 text-sm rounded-lg border transition-colors ${appointmentData.time === slot ? 'bg-primary text-white border-primary' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary'}`}
                        >
                            {slot}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Priorité</label>
                <div className="flex gap-2 flex-wrap">
                    {priorities.map(p => (
                        <button key={p.value} type="button" onClick={() => setAppointmentData({...appointmentData, priority: p.value})} className={`px-3 py-1 text-xs font-bold rounded-full border ${appointmentData.priority === p.value ? 'ring-2 ring-offset-1 ring-primary' : 'opacity-60'} ${p.color}`}>
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                <textarea 
                    className={`w-full rounded-lg p-3 text-sm ${inputStyle}`}
                    rows={2}
                    value={appointmentData.notes}
                    onChange={e => setAppointmentData({...appointmentData, notes: e.target.value})}
                    placeholder="Symptômes, instructions supplémentaires..."
                />
            </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <Button variant="ghost" onClick={onClose} disabled={loading}>Annuler</Button>
            <Button onClick={handleSubmit} loading={loading} disabled={!hasPermission('appointment_create')} iconName="Check">Confirmer</Button>
        </div>

      </div>
    </div>
  );
};

export default AppointmentScheduler;