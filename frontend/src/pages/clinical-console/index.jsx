import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppointments, useAppointmentMutations } from '../../hooks/useAppointments';
import { usePatientStats } from '../../hooks/usePatients';
import { useDashboardData } from '../../hooks/useDashboard';
import { useNotifications, useNotificationMutations } from '../../hooks/useNotifications';
import api from '../../lib/axios';
import AnimatedModal from '../../components/ui/AnimatedModal';
import {
  formatDateInBusinessTimezone,
  formatDateTimeInBusinessTimezone,
  formatTimeInBusinessTimezone,
  getTodayInBusinessTimezone,
} from '../../utils/dateTime';
import { formatNotificationMessage, parseNotificationMessage, normalizeAllergiesList } from '../../utils/notificationMessage';

// Sous-composants
import PatientSelector from './components/PatientSelector';
import ConsultationWorkflow from './components/ConsultationWorkflow';
import ClinicalKnowledgeBase from './components/ClinicalKnowledgeBase';
import QuickActions from './components/QuickActions';
import DoctorCalendar from './components/DoctorCalendar';

const ClinicalConsole = () => {
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: appointmentsToday } = useAppointments({ 
    date: getTodayInBusinessTimezone()
  });
  const { updateAppointmentStatus } = useAppointmentMutations();
  const { data: patientStats } = usePatientStats();
  const { data: dashboardData } = useDashboardData();
  
  // --- ÉTATS ---
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentAppointmentId, setCurrentAppointmentId] = useState(null);
  const viewFromUrl = searchParams.get('view');
  const [activeView, setActiveView] = useState(
    ['consultation', 'calendar', 'knowledge', 'actions'].includes(viewFromUrl || '') ? viewFromUrl : 'consultation'
  );
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isNotificationDetailsOpen, setIsNotificationDetailsOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loadingAppointmentDetails, setLoadingAppointmentDetails] = useState(false);
  const normalizeAppointmentStatus = useCallback((status) => {
    if (status === 'pending') return 'programme';
    if (status === 'consulted') return 'en_cours';
    if (status === 'completed') return 'termine';
    if (status === 'cancelled') return 'annule';
    return status;
  }, []);

  const markAppointmentInProgress = useCallback(async (appointmentId, currentStatus = null) => {
    if (!appointmentId) return true;
    const normalizedStatus = normalizeAppointmentStatus(currentStatus);
    // Si le statut est inconnu, on tente quand même le passage à en_cours.
    // On évite seulement les transitions inutiles/invalides.
    if (normalizedStatus === 'en_cours' || normalizedStatus === 'termine' || normalizedStatus === 'annule') {
      return normalizedStatus === 'en_cours';
    }

    try {
      await updateAppointmentStatus.mutateAsync({
        id: appointmentId,
        status: 'en_cours',
        silent: true,
      });
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur mise à jour statut rendez-vous:', error);
      }
      return false;
    }
  }, [normalizeAppointmentStatus, updateAppointmentStatus]);

  
  // --- NOTIFICATIONS CRITIQUES ---
  const [isCriticalNotificationsOpen, setIsCriticalNotificationsOpen] = useState(false);
  const criticalNotificationsRef = useRef(null);
  const { data: notificationsData, isLoading: loadingNotifications, error: notificationsError } = useNotifications({ limit: 500 });
  const { markAsRead, markAllAsRead, archive } = useNotificationMutations();

  // Filtrer les notifications qui concernent le médecin
  // - Toutes les notifications critiques
  // - Toutes les notifications de rendez-vous (appointment)
  // - Toutes les notifications cliniques (clinical)
  // - Toutes les notifications de patients si le médecin est concerné
  const doctorRelatedNotifications = useMemo(() => {
    const allNotifications = Array.isArray(notificationsData?.data) ? notificationsData.data : [];
    const isDoctor = user?.role === 'docteur_clinique';
    
    if (!isDoctor) {
      // Si ce n'est pas un médecin, retourner seulement les critiques
      return allNotifications.filter(n => n && n.type === 'critical');
    }
    
    // Pour les médecins, inclure toutes les notifications pertinentes
    return allNotifications.filter(n => {
      if (!n || typeof n !== 'object') return false;
      // Notifications critiques
      if (n.type === 'critical') return true;
      
      // Notifications de rendez-vous (nouveaux, annulés, urgents)
      if (n.category === 'appointment') return true;
      
      // Notifications cliniques (consultations)
      if (n.category === 'clinical') return true;
      
      // Notifications de patients si elles concernent le médecin
      if (n.category === 'patient' && (n.type === 'critical' || n.type === 'warning')) return true;
      
      return false;
    });
  }, [notificationsData, user?.role]);
  
  // Parser les allergies (string JSON, array, string simple) en liste propre
  const parseAllergiesList = useCallback((input) => {
    if (!input) return [];
    if (Array.isArray(input)) {
      return input.map(a => typeof a === 'string' ? a.trim() : (a?.name || a)?.toString?.() || '').filter(Boolean);
    }
    if (typeof input === 'string') {
      const s = input.trim();
      if (!s) return [];
      try {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? parsed.map(a => String(a).trim()).filter(Boolean) : [s];
      } catch {
        return s.split(/[,;]| et /).map(a => a.replace(/^["\[\]\s]+|["\[\]\s]+$/g, '').trim()).filter(Boolean);
      }
    }
    return [];
  }, []);

  // Calculer les alertes critiques cliniques (basées sur le patient et la consultation en cours)
  const calculateClinicalCriticalAlerts = useMemo(() => {
    if (!selectedPatient) return [];
    
    const alertList = [];
    
    // Vérifier les allergies du patient (si disponibles) - une seule notification avec toutes les allergies
    const allergiesList = parseAllergiesList(selectedPatient?.allergies);
    if (allergiesList.length > 0) {
      const allergiesFormatted = allergiesList.join(', ');
      alertList.push({
        id: 'clinical-allergies',
        type: 'critical',
        title: allergiesList.length > 1 ? 'Allergies connues' : 'Allergie connue',
        message: `Le patient présente ${allergiesList.length > 1 ? 'des allergies' : 'une allergie'} : ${allergiesFormatted}`,
        category: 'clinical',
        isClinical: true,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        allergies: allergiesList
      });
    }
    
    // Vérifier les conditions critiques du patient (si disponibles)
    if (selectedPatient?.medicalHistory) {
      const criticalConditions = ['diabète', 'hypertension', 'asthme', 'épilepsie', 'cardiopathie'];
      const history = typeof selectedPatient.medicalHistory === 'string' 
        ? selectedPatient.medicalHistory.toLowerCase() 
        : '';
      
      criticalConditions.forEach(condition => {
        if (history.includes(condition.toLowerCase())) {
          alertList.push({
            id: `clinical-condition-${condition}`,
            type: 'critical',
            title: 'Condition médicale critique',
            message: `Le patient présente une condition médicale: ${condition}`,
            category: 'clinical',
            isClinical: true,
            patientId: selectedPatient.id,
            patientName: selectedPatient.name
          });
        }
      });
    }
    
    return alertList;
  }, [selectedPatient, parseAllergiesList]);
  
  // Combiner les notifications du médecin et les alertes cliniques
  const allDoctorNotifications = [
    ...(Array.isArray(doctorRelatedNotifications) ? doctorRelatedNotifications.map(n => ({ ...n, isClinical: false })) : []),
    ...(Array.isArray(calculateClinicalCriticalAlerts) ? calculateClinicalCriticalAlerts : [])
  ];
  
  const doctorUnreadCount = Array.isArray(allDoctorNotifications) ? allDoctorNotifications.filter(n => {
    if (!n || typeof n !== 'object') return false;
    if (n.isClinical) return true; // Les alertes cliniques sont toujours considérées comme non lues
    const isRead = n.isRead !== undefined ? n.isRead : (n.is_read || false);
    return !isRead;
  }).length : 0;

  // Temps relatif pour affichage (il y a 5 min, Hier, etc.)
  const formatRelativeTime = (dateStr) => {
    if (dateStr === undefined || dateStr === null) return 'À l\'instant';
    try {
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return 'À l\'instant';
      const now = new Date();
      const diffMs = now - date;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMin < 1) return 'À l\'instant';
      if (diffMin < 60) return `Il y a ${diffMin} min`;
      if (diffHours < 24) return `Il y a ${diffHours} h`;
      if (diffDays === 1) return 'Hier';
      if (diffDays < 7) return `Il y a ${diffDays} j`;
      return formatDateInBusinessTimezone(date);
    } catch {
      return 'À l\'instant';
    }
  };

  // Regrouper les notifications par période (Aujourd'hui, Hier, Cette semaine, Plus ancien)
  const groupedNotifications = useMemo(() => {
    const list = Array.isArray(allDoctorNotifications) ? allDoctorNotifications : [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const groups = { today: [], yesterday: [], week: [], older: [] };
    list.forEach((n) => {
      const raw = n.createdAt || n.created_at || n.time;
      const d = raw ? new Date(raw) : new Date();
      if (d >= todayStart) groups.today.push({ ...n, _relativeTime: formatRelativeTime(raw), _date: d });
      else if (d >= yesterdayStart) groups.yesterday.push({ ...n, _relativeTime: formatRelativeTime(raw), _date: d });
      else if (d >= weekStart) groups.week.push({ ...n, _relativeTime: formatRelativeTime(raw), _date: d });
      else groups.older.push({ ...n, _relativeTime: formatRelativeTime(raw), _date: d });
    });
    return groups;
  }, [allDoctorNotifications]);

  // Synchroniser l'onglet actif avec l'URL (?view=consultation)
  useEffect(() => {
    if (searchParams.get('view') === activeView) return;
    const next = new URLSearchParams(searchParams);
    next.set('view', activeView);
    setSearchParams(next, { replace: true });
  }, [activeView]);

  // Charger le patient depuis les paramètres URL si présent
  useEffect(() => {
    const patientId = searchParams.get('patientId');
    const appointmentId = searchParams.get('appointmentId');
    const startConsultation = searchParams.get('startConsultation') === 'true';

    if (patientId && startConsultation) {
      setLoadingPatient(true);
      api.get(`/patients/${patientId}`)
        .then(async (response) => {
          if (response.data.success) {
            if (appointmentId) {
              const started = await markAppointmentInProgress(appointmentId);
              if (!started) {
                return;
              }
            }
            setSelectedPatient(response.data.data);
            setCurrentAppointmentId(appointmentId || null);
            setActiveView('consultation');
            // Nettoyer les paramètres URL après chargement
            setSearchParams({});
            showToast('Consultation démarrée pour ' + (response.data.data.name || 'le patient'), 'success');
          }
        })
        .catch(error => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Erreur lors du chargement du patient:', error);
          }
          showToast('Erreur lors du chargement du patient', 'error');
        })
        .finally(() => {
          setLoadingPatient(false);
        });
    }
  }, [searchParams, setSearchParams, showToast, markAppointmentInProgress]);


  const viewOptions = [
    { id: 'consultation', label: 'Consultation', icon: 'Stethoscope' },
    { id: 'calendar', label: 'Mon Agenda', icon: 'Calendar' },
    { id: 'knowledge', label: 'Base de Connaissances', icon: 'BookOpen' },
    { id: 'actions', label: 'Actions Rapides', icon: 'Zap' }
  ];

  // --- HANDLERS ---

  /**
   * Appelé quand on sélectionne un patient dans la colonne de gauche
   */
  const handlePatientSelect = async (patient) => {
    // Si l'objet patient contient un ID de rendez-vous (ex: via une liste de RDV du jour), on le capture.
    // Sinon, on le remet à null pour éviter de lier une consult à un vieux RDV.
    if (patient && patient.appointmentId) {
        const started = await markAppointmentInProgress(
          patient.appointmentId,
          patient.appointmentStatus || patient.statut || patient.status
        );
        if (!started) {
          return;
        }
        setCurrentAppointmentId(patient.appointmentId);
    } else {
        setCurrentAppointmentId(null);
    }
    setSelectedPatient(patient);
    
    // On bascule automatiquement sur la vue consultation
    setActiveView('consultation');
  };

  /**
   * Réinitialise pour une nouvelle consultation vierge
   */
  const handleNewConsultation = () => {
    setSelectedPatient(null);
    setCurrentAppointmentId(null);
    setActiveView('consultation');
  };

  /**
   * Appelé après le succès de l'enregistrement dans ConsultationWorkflow
   */
  const handleSaveConsultation = (consultationData) => {
    // Réinitialiser complètement pour une nouvelle consultation
    // Comme si on ouvrait la console clinique pour la première fois
    handleNewConsultation();
    // Le toast de succès est déjà affiché par le hook useClinicalMutations
  };

  const handleActionSelect = (action) => {
    // Action pour prescrire des analyses
    if (action.id === 'lab-order') {
      if (selectedPatient) {
        // Ouvrir le module Analyses Labo avec le patient pré-sélectionné
        window.location.href = `/analyses-laboratoire?patientId=${selectedPatient.id}&prescribe=true`;
      } else {
        showToast('Veuillez d\'abord sélectionner un patient', 'warning');
      }
      return;
    }
    
    showToast(`Action rapide: "${action.title}" lancée.`, 'info');
    
    // Si l'action est une prescription, on force la vue consultation
    if (action.id === 'prescription' || action.id === 'vital-signs') {
        setActiveView('consultation');
    }
  };


  // --- ANIMATIONS ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  
  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.19, 1, 0.22, 1] } }
  };
  
  const menuVariants = { 
    hidden: { opacity: 0, y: -10 }, 
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }, 
    exit: { opacity: 0, y: -10, transition: { duration: 0.15, ease: 'easeIn' } } 
  };
  
  // Gérer le clic extérieur pour fermer le dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (criticalNotificationsRef.current && !criticalNotificationsRef.current.contains(event.target)) {
        setIsCriticalNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Charger les détails du rendez-vous si c'est une notification de rendez-vous
  useEffect(() => {
    const loadAppointmentDetails = async () => {
      if (selectedNotification && selectedNotification.category === 'appointment' && selectedNotification.targetId) {
        setLoadingAppointmentDetails(true);
        try {
          const response = await api.get(`/appointments/${selectedNotification.targetId}`);
          if (response.data?.success && response.data?.data) {
            setSelectedAppointment(response.data.data);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Erreur lors du chargement des détails du rendez-vous:', error);
          }
          setSelectedAppointment(null);
        } finally {
          setLoadingAppointmentDetails(false);
        }
      } else {
        setSelectedAppointment(null);
      }
    };

    loadAppointmentDetails();
  }, [selectedNotification]);

  // Fonction pour vérifier si le rendez-vous est valide pour consultation
  const isAppointmentValidForConsultation = (appointment) => {
    if (!appointment) return false;
    
    // Vérifier si le rendez-vous est annulé
    if (appointment.statut === 'annule' || appointment.status === 'cancelled') {
      return false;
    }
    
    // Vérifier si le rendez-vous est dépassé
    if (appointment.dateHeure) {
      const appointmentDate = new Date(appointment.dateHeure);
      const appointmentEnd = new Date(appointmentDate);
      const durationMinutes = appointment.dureeMinutes || appointment.duration || 30;
      appointmentEnd.setMinutes(appointmentEnd.getMinutes() + durationMinutes);
      const now = new Date();
      
      if (appointmentEnd < now) {
        return false;
      }
    }
    
    return true;
  };

  // --- RENDU DYNAMIQUE DE LA ZONE PRINCIPALE ---
  const renderMainContent = () => {
    switch (activeView) {
      case 'consultation':
        return (
            <ConsultationWorkflow 
                patient={selectedPatient} 
                appointmentId={currentAppointmentId} // <-- Transmission de l'ID cruciale ici
                onSaveConsultation={handleSaveConsultation} 
            />
        );
      case 'calendar':
        return (
          <DoctorCalendar 
            onSelectAppointment={(appointment) => {
              // Quand on clique sur un rendez-vous, charger le patient et démarrer la consultation
              if (appointment.patientId || appointment.patient?.id) {
                const patientId = appointment.patientId || appointment.patient.id;
                setLoadingPatient(true);
                api.get(`/patients/${patientId}`)
                  .then(async (response) => {
                    if (response.data.success) {
                      const started = await markAppointmentInProgress(
                        appointment.id,
                        appointment.statut || appointment.status
                      );
                      if (!started) {
                        return;
                      }
                      setSelectedPatient(response.data.data);
                      setCurrentAppointmentId(appointment.id);
                      setActiveView('consultation');
                      showToast('Consultation démarrée', 'success');
                    }
                  })
                  .catch(error => {
                    if (process.env.NODE_ENV === 'development') {
                      console.error('Erreur lors du chargement du patient:', error);
                    }
                    showToast('Erreur lors du chargement du patient', 'error');
                  })
                  .finally(() => {
                    setLoadingPatient(false);
                  });
              }
            }}
          />
        );
      case 'knowledge':
        return <ClinicalKnowledgeBase />;
      case 'actions':
        return <QuickActions onActionSelect={handleActionSelect} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>Console Clinique - MediCore DMI</title>
        <meta name="description" content="Espace de travail clinique pour la gestion des consultations." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 dark:from-slate-950 dark:via-slate-900/80 dark:to-slate-950 font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">
        <Header />

        <main className="pt-24 w-full max-w-[1600px] mx-auto px-6 lg:px-8 pb-12">
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible"
            className="space-y-6"
          >
            {/* En-tête Page */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center text-primary border border-white/20 dark:border-white/10">
                  <Icon name="Stethoscope" size={18} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">Console Clinique</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Espace de travail médical unifié</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Notifications Médicales */}
                <div className="relative" ref={criticalNotificationsRef}>
                  <motion.button
                    onClick={() => setIsCriticalNotificationsOpen(!isCriticalNotificationsOpen)}
                    className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 group ${
                      isCriticalNotificationsOpen
                        ? 'bg-primary/15 dark:bg-primary/25 text-primary dark:text-blue-400 ring-2 ring-primary/30 dark:ring-primary/40 shadow-lg shadow-primary/10'
                        : doctorUnreadCount > 0
                          ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 ring-2 ring-rose-200 dark:ring-rose-800'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-blue-400'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon name="Bell" size={18} className="group-hover:scale-110 transition-transform" />
                    {doctorUnreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 flex items-center justify-center bg-gradient-to-r from-rose-500 to-pink-500 rounded-full border-2 border-white dark:border-slate-900 shadow-md text-[11px] font-bold text-white leading-none"
                      >
                        {doctorUnreadCount > 99 ? '99+' : doctorUnreadCount}
                      </motion.span>
                    )}
                  </motion.button>
                  <AnimatePresence>
                    {isCriticalNotificationsOpen && (
                      <motion.div 
                        variants={menuVariants} 
                        initial="hidden" 
                        animate="visible" 
                        exit="exit" 
                        className="absolute top-full right-0 mt-3 w-[420px] backdrop-blur-xl bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-white/20 dark:border-white/10 bg-slate-50/80 dark:bg-slate-800/50">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="relative w-11 h-11 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center border border-primary/20 dark:border-primary/30 shrink-0">
                                <Icon name="Bell" size={20} className="text-primary dark:text-blue-400" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Notifications médicales</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                  {doctorUnreadCount > 0 ? `${doctorUnreadCount} non lue${doctorUnreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}
                                </p>
                              </div>
                            </div>
                          </div>
                          {doctorUnreadCount > 0 && (
                            <button
                              type="button"
                              onClick={() => markAllAsRead.mutate()}
                              disabled={markAllAsRead.isPending}
                              className="mt-3 w-full py-2 px-3 rounded-lg text-xs font-semibold text-primary dark:text-blue-400 bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 border border-primary/20 dark:border-primary/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {markAllAsRead.isPending ? (
                                <Icon name="Loader2" size={14} className="animate-spin" />
                              ) : (
                                <Icon name="CheckCheck" size={14} />
                              )}
                              Tout marquer comme lu
                            </button>
                          )}
                        </div>
                        <div className="max-h-[650px] overflow-y-auto custom-scrollbar">
                          {loadingNotifications ? (
                            <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-white/20 dark:border-white/10 glass-surface mx-2">
                              <Icon name="Loader2" size={24} className="animate-spin text-primary mb-3" />
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Chargement…</span>
                            </div>
                          ) : notificationsError ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-900/30 mb-3">
                                <Icon name="AlertCircle" size={24} className="text-rose-500 dark:text-rose-400" />
                              </div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Erreur de chargement</p>
                              <p className="text-xs text-slate-600 dark:text-slate-300">Veuillez réessayer</p>
                            </div>
                          ) : Array.isArray(allDoctorNotifications) && allDoctorNotifications.length > 0 ? (
                            <div className="p-3 space-y-4">
                              {[
                                { key: 'today', label: 'Aujourd\'hui', items: groupedNotifications.today },
                                { key: 'yesterday', label: 'Hier', items: groupedNotifications.yesterday },
                                { key: 'week', label: 'Cette semaine', items: groupedNotifications.week },
                                { key: 'older', label: 'Plus ancien', items: groupedNotifications.older },
                              ].map(({ key, label, items }) =>
                                items.length === 0 ? null : (
                                  <div key={key} className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 px-1 sticky top-0 backdrop-blur-xl bg-white/50 dark:bg-white/10 py-0.5 z-10">
                                      {label}
                                    </p>
                                    {items.map((n, index) => {
                                      if (!n || typeof n !== 'object') return null;
                                      const isRead = n.isClinical ? false : (n.isRead !== undefined ? n.isRead : (n.is_read || false));
                                      const handleNotificationClick = (e) => {
                                        e.stopPropagation();
                                        setSelectedNotification(n);
                                        setIsNotificationDetailsOpen(true);
                                        if (!n.isClinical && n.id && !isRead) markAsRead.mutate(n.id);
                                      };
                                      const handleArchiveNotification = (e, id) => {
                                        e.stopPropagation();
                                        if (!n.isClinical && id) archive.mutate(id);
                                      };
                                      const getNotificationStyles = () => {
                                        if (n.type === 'critical') return { bg: !isRead ? 'bg-rose-50 dark:bg-rose-950/30' : 'backdrop-blur-xl bg-white/50 dark:bg-white/10', border: !isRead ? 'border-rose-200 dark:border-rose-800/50' : 'border-white/20 dark:border-white/10', iconBg: 'from-rose-500 to-pink-500', icon: 'AlertTriangle', dot: 'bg-rose-500' };
                                        if (n.type === 'warning') return { bg: !isRead ? 'bg-amber-50 dark:bg-amber-950/30' : 'backdrop-blur-xl bg-white/50 dark:bg-white/10', border: !isRead ? 'border-amber-200 dark:border-amber-800/50' : 'border-white/20 dark:border-white/10', iconBg: 'from-amber-500 to-orange-500', icon: 'AlertCircle', dot: 'bg-amber-500' };
                                        if (n.type === 'error') return { bg: !isRead ? 'bg-red-50 dark:bg-red-950/30' : 'backdrop-blur-xl bg-white/50 dark:bg-white/10', border: !isRead ? 'border-red-200 dark:border-red-800/50' : 'border-white/20 dark:border-white/10', iconBg: 'from-red-500 to-rose-500', icon: 'XCircle', dot: 'bg-red-500' };
                                        if (n.type === 'success') return { bg: !isRead ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'backdrop-blur-xl bg-white/50 dark:bg-white/10', border: !isRead ? 'border-emerald-200 dark:border-emerald-800/50' : 'border-white/20 dark:border-white/10', iconBg: 'from-emerald-500 to-teal-500', icon: 'CheckCircle', dot: 'bg-emerald-500' };
                                        return { bg: !isRead ? 'bg-blue-50 dark:bg-blue-950/30' : 'backdrop-blur-xl bg-white/50 dark:bg-white/10', border: !isRead ? 'border-blue-200 dark:border-blue-800/50' : 'border-white/20 dark:border-white/10', iconBg: 'from-blue-500 to-indigo-500', icon: 'Info', dot: 'bg-blue-500' };
                                      };
                                      const styles = getNotificationStyles();
                                      return (
                                        <motion.div
                                          key={n.id || `${key}-${index}`}
                                          onClick={handleNotificationClick}
                                          className={`group relative p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${styles.bg} ${styles.border} hover:shadow-md ${!isRead ? 'ring-1 ring-offset-1 ring-primary/20' : ''}`}
                                          initial={{ opacity: 0, y: 4 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: index * 0.02 }}
                                          whileHover={{ x: 2 }}
                                        >
                                          <div className="flex items-start gap-3">
                                            <div className={`relative p-2.5 rounded-xl bg-gradient-to-br ${styles.iconBg} shadow-sm flex-shrink-0`}>
                                              <Icon name={styles.icon} size={16} className="text-white" />
                                              {!isRead && <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${styles.dot} animate-pulse border border-white dark:border-slate-900`} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                  <div className="flex items-center gap-2 flex-wrap">
                                                    <p className={`text-sm font-semibold truncate ${!isRead ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                      {n.title || 'Notification'}
                                                    </p>
                                                    {!isRead && <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${styles.dot}`}>Nouveau</span>}
                                                    {n.isClinical && <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Clinique</span>}
                                                  </div>
                                                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-2">{formatNotificationMessage(n.message) || 'Aucun message'}</p>
                                                </div>
                                                {!n.isClinical && (
                                                  <button type="button" onClick={(e) => handleArchiveNotification(e, n.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 shrink-0" title="Supprimer"><Icon name="Trash2" size={12} /></button>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                <Icon name="Clock" size={10} className="text-slate-400" />
                                                <span className="text-xs text-slate-600 dark:text-slate-400">{n._relativeTime || formatRelativeTime(n.createdAt || n.created_at)}</span>
                                                {n.category && (
                                                  <>
                                                    <span className="text-slate-300 dark:text-slate-600">·</span>
                                                    <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">{n.category === 'appointment' ? 'Rendez-vous' : n.category}</span>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <Icon name="Bell" size={32} className="text-slate-400 dark:text-slate-500" />
                              </div>
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Aucune notification</p>
                              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-[200px]">Les alertes et rappels médicaux apparaîtront ici.</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Sélecteur de Vue */}
                <div className="flex backdrop-blur-xl bg-white/50 dark:bg-white/10 p-0.5 rounded-lg border border-white/20 dark:border-white/10 shadow-sm">
                  {Array.isArray(viewOptions) && viewOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setActiveView(option.id)}
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-normal transition-all duration-200 ${
                        activeView === option.id 
                          ? 'bg-slate-100 dark:bg-slate-800 text-primary dark:text-blue-400 shadow-sm font-medium' 
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon name={option.icon} size={14} />
                      <span className="hidden md:inline">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Cartes Métriques (style PatientStatsOverview) */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 1, title: 'Consultations Aujourd\'hui', value: Array.isArray(appointmentsToday) ? appointmentsToday.length : (typeof dashboardData?.metrics?.appointments === 'number' ? dashboardData.metrics.appointments : 0), icon: 'Users', theme: 'blue' },
                { id: 2, title: 'Patients Actifs', value: patientStats?.activePatients || dashboardData?.metrics?.patients || 0, icon: 'FileText', theme: 'emerald' },
                { id: 3, title: 'Nouveaux Patients', value: patientStats?.newPatients || 0, icon: 'UserPlus', theme: 'amber' },
                { id: 4, title: 'Alertes', value: dashboardData?.metrics?.alerts || 0, icon: 'Bell', theme: 'violet' }
              ].map((stat) => {
                const themeStyles = {
                  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
                  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
                  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
                  violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800', icon: 'bg-violet-500/20 text-violet-600 dark:text-violet-400' }
                };
                const style = themeStyles[stat.theme] || themeStyles.blue;
                return (
                  <motion.div
                    key={stat.id}
                    variants={itemVariants}
                    className={`rounded-xl border p-4 ${style.bg} ${style.border} hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                          {stat.value}
                        </p>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.icon}`}>
                        <Icon name={stat.icon} size={20} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Layout Principal : 2 Colonnes */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              
              {/* Colonne Gauche : Sélecteur Patient */}
              <motion.div variants={itemVariants} className="lg:col-span-1 sticky top-24">
                <PatientSelector
                  selectedPatient={selectedPatient}
                  onPatientSelect={handlePatientSelect}
                />
              </motion.div>

              {/* Colonne Droite : Workflow / Contenu */}
              <motion.div variants={itemVariants} className="lg:col-span-3">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="glass-panel shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden h-[780px]"
                >
                   {renderMainContent()}
                </motion.div>
              </motion.div>

            </div>

            {/* Footer */}
            <motion.div variants={itemVariants} className="px-3 py-1.5 border-t border-white/20 dark:border-white/10 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center space-x-4">
                <span>Dernière synchro: {formatTimeInBusinessTimezone(new Date())}</span>
                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                   <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    En ligne
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <PermissionGuard requiredPermission="audit_view">
                  <Button variant="outline" size="sm" disabled={!hasPermission('audit_view')} className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                    <Icon name="Download" size={16} className="mr-2" />
                    Exporter
                  </Button>
                </PermissionGuard>
                <Button variant="ghost" size="sm" className="dark:text-slate-400 dark:hover:bg-slate-800">
                  <Icon name="Settings" size={16} />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>

      {/* Modal de détails de notification */}
      <AnimatedModal
        isOpen={isNotificationDetailsOpen}
        onClose={() => {
          setIsNotificationDetailsOpen(false);
          setSelectedNotification(null);
          setSelectedAppointment(null);
        }}
        className="max-w-2xl w-full"
      >
        {selectedNotification && (
          <div className="glass-panel shadow-2xl overflow-hidden">
            {/* Header */}
            <div className={`p-6 border-b-2 ${
              selectedNotification.type === 'critical' ? 'bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950 border-rose-200 dark:border-rose-800' :
              selectedNotification.type === 'warning' ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800' :
              selectedNotification.type === 'error' ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-red-200 dark:border-red-800' :
              selectedNotification.type === 'success' ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200 dark:border-emerald-800' :
              'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br shadow-lg ${
                    selectedNotification.type === 'critical' ? 'from-rose-500 to-pink-500' :
                    selectedNotification.type === 'warning' ? 'from-amber-500 to-orange-500' :
                    selectedNotification.type === 'error' ? 'from-red-500 to-rose-500' :
                    selectedNotification.type === 'success' ? 'from-emerald-500 to-teal-500' :
                    'from-blue-500 to-indigo-500'
                  }`}>
                    <Icon name={
                      selectedNotification.type === 'critical' ? 'AlertTriangle' :
                      selectedNotification.type === 'warning' ? 'AlertCircle' :
                      selectedNotification.type === 'error' ? 'XCircle' :
                      selectedNotification.type === 'success' ? 'CheckCircle' :
                      'Info'
                    } size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {selectedNotification.title || 'Notification'}
                    </h2>
                    <div className="flex items-center gap-3 flex-wrap">
                      {selectedNotification.isClinical && (
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase rounded-full border border-white/20 dark:border-white/10">
                          Alerte Clinique
                        </span>
                      )}
                      {selectedNotification.category && (
                        <span className="px-3 py-1 bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-full capitalize">
                          {selectedNotification.category === 'appointment' ? 'Rendez-vous' :
                           selectedNotification.category === 'clinical' ? 'Clinique' :
                           selectedNotification.category === 'patient' ? 'Patient' :
                           selectedNotification.category === 'document' ? 'Document' :
                           selectedNotification.category === 'pharmacy' ? 'Pharmacie' :
                           selectedNotification.category}
                        </span>
                      )}
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        selectedNotification.type === 'critical' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' :
                        selectedNotification.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                        selectedNotification.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        selectedNotification.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      }`}>
                        {selectedNotification.type === 'critical' ? 'Critique' :
                         selectedNotification.type === 'warning' ? 'Avertissement' :
                         selectedNotification.type === 'error' ? 'Erreur' :
                         selectedNotification.type === 'success' ? 'Succès' :
                         'Information'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsNotificationDetailsOpen(false);
                    setSelectedNotification(null);
                    setSelectedAppointment(null);
                  }}
                  className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <Icon name="X" size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Message principal (sans les tableaux bruts - affichés en badges ci-dessous) */}
              {(() => {
                const { cleanMessage } = parseNotificationMessage(selectedNotification.message);
                return cleanMessage ? (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Message</h3>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {cleanMessage}
                    </p>
                  </div>
                ) : null;
              })()}

              {/* Informations spécifiques selon le type */}
              {selectedNotification.isClinical && selectedNotification.patientName && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="User" size={16} className="text-rose-600 dark:text-rose-400" />
                    <h3 className="text-sm font-bold text-rose-900 dark:text-rose-300">Patient concerné</h3>
                  </div>
                  <p className="text-rose-700 dark:text-rose-400 font-semibold">
                    {selectedNotification.patientName}
                  </p>
                  {(() => {
                    const { extractedItems } = parseNotificationMessage(selectedNotification.message);
                    const allergiesFromField = normalizeAllergiesList(selectedNotification.allergies);
                    const allergies = allergiesFromField.length > 0 ? allergiesFromField : extractedItems;
                    return allergies.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5 flex items-center gap-1.5">
                          <Icon name="AlertTriangle" size={12} />
                          Allergies
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {allergies.map((a, i) => (
                            <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-medium border border-rose-200 dark:border-rose-800/50">
                              {typeof a === 'string' ? a : (a?.name || a)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                  {selectedNotification.conditions && (
                    <div className="mt-2">
                      <p className="text-xs text-rose-600 dark:text-rose-400">
                        Conditions: {selectedNotification.conditions}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Métadonnées enrichies */}
              {selectedNotification.metadata && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Détails supplémentaires</h3>
                  <div className="space-y-2">
                    {selectedNotification.metadata.patientIdDisplay && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <Icon name="User" size={14} className="text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">Patient:</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {selectedNotification.metadata.patientIdDisplay}
                        </span>
                      </div>
                    )}
                    {selectedNotification.metadata.doctorIdDisplay && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <Icon name="UserCheck" size={14} className="text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">Médecin:</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {selectedNotification.metadata.doctorIdDisplay}
                        </span>
                      </div>
                    )}
                    {selectedNotification.metadata.uploadedByDisplay && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <Icon name="Upload" size={14} className="text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">Uploadé par:</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {selectedNotification.metadata.uploadedByDisplay}
                        </span>
                      </div>
                    )}
                    {selectedNotification.metadata.appointmentDate && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <Icon name="Calendar" size={14} className="text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">Date du rendez-vous:</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {selectedNotification.metadata.appointmentDate}
                        </span>
                      </div>
                    )}
                    {selectedNotification.metadata.reason && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <Icon name="FileText" size={14} className="text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">Raison:</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {(selectedNotification.metadata.reason || '').replace(/^Annulé automatiquement\s*:\s*/i, '').trim() || selectedNotification.metadata.reason}
                        </span>
                      </div>
                    )}
                    {selectedNotification.metadata.documentName && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <Icon name="File" size={14} className="text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">Document:</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {selectedNotification.metadata.documentName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Informations temporelles */}
              <div className="pt-4 border-t border-white/20 dark:border-white/10">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Icon name="Clock" size={14} />
                    <span>{formatRelativeTime(selectedNotification.createdAt || selectedNotification.created_at || selectedNotification.time)}</span>
                    {(() => {
                      const raw = selectedNotification.createdAt || selectedNotification.created_at;
                      if (!raw) return null;
                      try {
                        const d = new Date(raw);
                        if (Number.isNaN(d.getTime())) return null;
                        return (
                          <span className="text-slate-400 dark:text-slate-500">
                            · {formatDateTimeInBusinessTimezone(d)}
                          </span>
                        );
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                  {selectedNotification.isRead !== undefined && !selectedNotification.isClinical && (
                    <div className={`px-2 py-1 rounded-full ${
                      selectedNotification.isRead ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                      'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                    }`}>
                      {selectedNotification.isRead ? 'Lue' : 'Non lue'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer avec actions */}
            {!selectedNotification.isClinical && (
              <div className="px-3 py-1.5 border-t border-white/20 dark:border-white/10 glass-surface flex items-center justify-end gap-3">
                {selectedNotification.category === 'appointment' && selectedNotification.targetId ? (
                  <>
                    {loadingAppointmentDetails ? (
                      <button
                        disabled
                        className="px-4 py-2 bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl cursor-not-allowed font-semibold text-sm flex items-center gap-2"
                      >
                        <Icon name="Loader2" size={16} className="animate-spin" />
                        <span>Chargement...</span>
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          if (!isAppointmentValidForConsultation(selectedAppointment)) {
                            return;
                          }
                          
                          try {
                            setLoadingPatient(true);
                            const appointment = selectedAppointment;
                            const patientId = appointment.patientId || appointment.patient?.id;
                            
                            if (patientId) {
                              // Charger les détails du patient
                              const patientResponse = await api.get(`/patients/${patientId}`);
                              if (patientResponse.data?.success && patientResponse.data?.data) {
                                const patient = patientResponse.data.data;
                                const started = await markAppointmentInProgress(
                                  selectedNotification.targetId,
                                  appointment.statut || appointment.status
                                );
                                if (!started) {
                                  return;
                                }
                                // Sélectionner le patient et ouvrir la consultation
                                setSelectedPatient(patient);
                                setCurrentAppointmentId(selectedNotification.targetId);
                                setActiveView('consultation');
                                setIsNotificationDetailsOpen(false);
                                setSelectedNotification(null);
                                setSelectedAppointment(null);
                                showToast(`Consultation démarrée pour ${patient.name || patient.nomComplet || 'le patient'}`, 'success');
                              } else {
                                showToast('Impossible de charger les informations du patient', 'error');
                              }
                            } else {
                              showToast('Informations du patient introuvables dans le rendez-vous', 'error');
                            }
                          } catch (error) {
                            if (process.env.NODE_ENV === 'development') {
                              console.error('Erreur lors du chargement du patient:', error);
                            }
                            const errorMessage = error.response?.data?.message || 'Erreur lors du chargement du patient';
                            showToast(errorMessage, 'error');
                          } finally {
                            setLoadingPatient(false);
                          }
                        }}
                        disabled={!isAppointmentValidForConsultation(selectedAppointment) || loadingPatient}
                        className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 flex items-center gap-2"
                        title={
                          !isAppointmentValidForConsultation(selectedAppointment)
                            ? selectedAppointment?.statut === 'annule' || selectedAppointment?.status === 'cancelled'
                              ? 'Impossible de consulter : rendez-vous annulé'
                              : 'Impossible de consulter : rendez-vous dépassé'
                            : ''
                        }
                      >
                        {loadingPatient ? (
                          <>
                            <Icon name="Loader2" size={16} className="animate-spin" />
                            <span>Chargement...</span>
                          </>
                        ) : (
                          <>
                            <Icon name="Stethoscope" size={16} />
                            <span>Consulter</span>
                          </>
                        )}
                      </button>
                    )}
                    {!loadingAppointmentDetails && !isAppointmentValidForConsultation(selectedAppointment) && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                        {selectedAppointment?.statut === 'annule' || selectedAppointment?.status === 'cancelled'
                          ? 'Ce rendez-vous a été annulé'
                          : 'Ce rendez-vous est dépassé'}
                      </p>
                    )}
                  </>
                ) : selectedNotification.actionUrl ? (
                  <button
                    onClick={() => {
                      if (selectedNotification.actionUrl) {
                        window.location.href = selectedNotification.actionUrl;
                      }
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-semibold text-sm"
                  >
                    Voir les détails
                  </button>
                ) : null}
                {selectedNotification.id && (
                  <button
                    onClick={() => {
                      archive.mutate(selectedNotification.id);
                      setIsNotificationDetailsOpen(false);
                      setSelectedNotification(null);
                      setSelectedAppointment(null);
                    }}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-semibold text-sm"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </AnimatedModal>
    </>
  );
};

export default ClinicalConsole;