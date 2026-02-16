import { useState, useEffect, useRef, useMemo } from 'react';
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
import { useAppointments } from '../../hooks/useAppointments';
import { usePatientStats } from '../../hooks/usePatients';
import { useDashboardData } from '../../hooks/useDashboard';
import { useNotifications, useNotificationMutations } from '../../hooks/useNotifications';
import api from '../../lib/axios';
import { Loader2 } from 'lucide-react';
import AnimatedModal from '../../components/ui/AnimatedModal';

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
    date: new Date().toISOString().split('T')[0] 
  });
  const { data: patientStats } = usePatientStats();
  const { data: dashboardData } = useDashboardData();
  
  // --- ÉTATS ---
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentAppointmentId, setCurrentAppointmentId] = useState(null);
  const [activeView, setActiveView] = useState('consultation');
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isNotificationDetailsOpen, setIsNotificationDetailsOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loadingAppointmentDetails, setLoadingAppointmentDetails] = useState(false);
  
  // --- NOTIFICATIONS CRITIQUES ---
  const [isCriticalNotificationsOpen, setIsCriticalNotificationsOpen] = useState(false);
  const criticalNotificationsRef = useRef(null);
  const { data: notificationsData, isLoading: loadingNotifications, error: notificationsError } = useNotifications({ limit: 500 });
  const { markAsRead, archive } = useNotificationMutations();
  
  // Filtrer les notifications qui concernent le médecin
  // - Toutes les notifications critiques
  // - Toutes les notifications de rendez-vous (appointment)
  // - Toutes les notifications cliniques (clinical)
  // - Toutes les notifications de patients si le médecin est concerné
  const doctorRelatedNotifications = useMemo(() => {
    const allNotifications = Array.isArray(notificationsData?.data) ? notificationsData.data : [];
    const isDoctor = user?.role === 'docteur';
    
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
  
  // Calculer les alertes critiques cliniques (basées sur le patient et la consultation en cours)
  const calculateClinicalCriticalAlerts = useMemo(() => {
    if (!selectedPatient) return [];
    
    const alertList = [];
    const consultationData = {}; // On pourrait récupérer les données de consultation si disponibles
    
    // Vérifier les allergies du patient (si disponibles)
    if (selectedPatient?.allergies && Array.isArray(selectedPatient.allergies) && selectedPatient.allergies.length > 0) {
      selectedPatient.allergies.forEach(allergy => {
        if (!allergy) return;
        const allergyName = typeof allergy === 'string' ? allergy : (allergy.name || allergy);
        alertList.push({
          id: `clinical-allergy-${allergyName}`,
          type: 'critical',
          title: 'Allergie connue',
          message: `Le patient présente une allergie: ${allergyName}`,
          category: 'clinical',
          isClinical: true,
          patientId: selectedPatient.id,
          patientName: selectedPatient.name
        });
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
  }, [selectedPatient]);
  
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

  // Charger le patient depuis les paramètres URL si présent
  useEffect(() => {
    const patientId = searchParams.get('patientId');
    const appointmentId = searchParams.get('appointmentId');
    const startConsultation = searchParams.get('startConsultation') === 'true';

    if (patientId && startConsultation) {
      setLoadingPatient(true);
      api.get(`/patients/${patientId}`)
        .then(response => {
          if (response.data.success) {
            setSelectedPatient(response.data.data);
            if (appointmentId) {
              setCurrentAppointmentId(appointmentId);
            }
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
  }, [searchParams, setSearchParams, showToast]);


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
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    
    // Si l'objet patient contient un ID de rendez-vous (ex: via une liste de RDV du jour), on le capture.
    // Sinon, on le remet à null pour éviter de lier une consult à un vieux RDV.
    if (patient && patient.appointmentId) {
        setCurrentAppointmentId(patient.appointmentId);
    } else {
        setCurrentAppointmentId(null);
    }
    
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
                  .then(response => {
                    if (response.data.success) {
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

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">
        <Header />

        <main className="pt-24 w-full max-w-[1600px] mx-auto px-6 lg:px-8 pb-12">
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible"
            className="space-y-8"
          >
            {/* En-tête Page */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center text-primary dark:text-blue-400 border border-primary/10 dark:border-primary/20 shadow-sm"
                >
                  <Icon name="Stethoscope" size={24} />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">Console Clinique</h1>
                  <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Espace de travail médical unifié</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Notifications Critiques */}
                <div className="relative" ref={criticalNotificationsRef}>
                  <motion.button
                    onClick={() => setIsCriticalNotificationsOpen(!isCriticalNotificationsOpen)}
                    className="relative flex items-center justify-center w-10 h-10 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-800/50 transition-all duration-200 hover:text-rose-500 dark:hover:text-rose-400 group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon name="Bell" size={20} className="group-hover:scale-110 transition-transform" />
                    {doctorUnreadCount > 0 && (
                      <motion.span 
                        initial={{scale:0}} 
                        animate={{scale:1}} 
                        className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-gradient-to-r from-rose-500 to-pink-500 rounded-full border-2 border-white dark:border-slate-950 shadow-lg shadow-rose-500/50 text-[10px] font-bold text-white leading-none"
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
                        className="absolute top-full right-0 mt-3 w-[420px] bg-white dark:bg-slate-900 backdrop-blur-xl border-2 border-slate-200/80 dark:border-slate-700/80 rounded-3xl shadow-2xl z-50 overflow-hidden ring-2 ring-slate-200/50 dark:ring-slate-700/50"
                      >
                        <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-br from-slate-50 via-white to-slate-50/50 dark:from-slate-800/50 dark:via-slate-900/50 dark:to-slate-800/30">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <div className="relative flex-shrink-0">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-blue-500/10 dark:from-primary/20 dark:to-blue-500/20 border border-primary/20 dark:border-primary/30 shadow-sm">
                                  <Icon name="Bell" size={18} className="text-primary dark:text-blue-400" />
                                </div>
                                {doctorUnreadCount > 0 && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-gradient-to-r from-rose-500 to-pink-500 rounded-full border-2 border-white dark:border-slate-900 shadow-lg shadow-rose-500/50 text-[10px] font-bold text-white leading-none"
                                  >
                                    {doctorUnreadCount > 99 ? '99+' : doctorUnreadCount}
                                  </motion.div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight whitespace-nowrap">Notifications Médicales</h3>
                              </div>
                            </div>
                            {doctorUnreadCount > 0 && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center gap-2 flex-shrink-0"
                              >
                                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                  {doctorUnreadCount} non lue{doctorUnreadCount > 1 ? 's' : ''}
                                </span>
                                <div className="h-1 w-10 bg-rose-100 dark:bg-rose-900/30 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${allDoctorNotifications.length > 0 ? (doctorUnreadCount / allDoctorNotifications.length) * 100 : 0}%` }}
                                    transition={{ duration: 0.5 }}
                                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"
                                  />
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                        <div className="max-h-[650px] overflow-y-auto custom-scrollbar">
                          {loadingNotifications ? (
                            <div className="flex flex-col items-center justify-center py-12">
                              <div className="p-3 rounded-full bg-rose-500/10 dark:bg-rose-500/20 mb-3">
                                <Loader2 className="animate-spin text-rose-500" size={24} />
                              </div>
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement...</span>
                            </div>
                          ) : notificationsError ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-900/30 mb-3">
                                <Icon name="AlertCircle" size={24} className="text-rose-500 dark:text-rose-400" />
                              </div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Erreur de chargement</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Veuillez réessayer</p>
                            </div>
                          ) : Array.isArray(allDoctorNotifications) && allDoctorNotifications.length > 0 ? (
                            <div className="p-3 space-y-2">
                              {allDoctorNotifications.map((n, index) => {
                                if (!n || typeof n !== 'object') return null;
                                const isRead = n.isClinical ? false : (n.isRead !== undefined ? n.isRead : (n.is_read || false));
                                const handleNotificationClick = (e) => {
                                  e.stopPropagation();
                                  setSelectedNotification(n);
                                  setIsNotificationDetailsOpen(true);
                                  // Marquer comme lu si ce n'est pas une alerte clinique
                                  if (!n.isClinical && n.id && !isRead) {
                                    markAsRead.mutate(n.id);
                                  }
                                };
                                const handleArchiveNotification = (e, id) => {
                                  e.stopPropagation();
                                  if (!n.isClinical && id) {
                                    archive.mutate(id);
                                  }
                                };
                                
                                const getNotificationStyles = () => {
                                  if (n.type === 'critical') {
                                    return {
                                      bg: !isRead ? 'bg-gradient-to-br from-rose-50 via-rose-50/80 to-pink-50/60 dark:from-rose-950/40 dark:via-rose-900/30 dark:to-pink-900/20' : 'bg-white dark:bg-slate-900',
                                      border: !isRead ? 'border-rose-200/60 dark:border-rose-800/40' : 'border-slate-200 dark:border-slate-800',
                                      iconBg: 'from-rose-500 to-pink-500',
                                      icon: 'AlertTriangle',
                                      dot: 'bg-rose-500',
                                      shadow: !isRead ? 'shadow-md shadow-rose-500/10' : 'shadow-sm'
                                    };
                                  } else if (n.type === 'warning') {
                                    return {
                                      bg: !isRead ? 'bg-gradient-to-br from-amber-50 via-amber-50/80 to-orange-50/60 dark:from-amber-950/40 dark:via-amber-900/30 dark:to-orange-900/20' : 'bg-white dark:bg-slate-900',
                                      border: !isRead ? 'border-amber-200/60 dark:border-amber-800/40' : 'border-slate-200 dark:border-slate-800',
                                      iconBg: 'from-amber-500 to-orange-500',
                                      icon: 'AlertCircle',
                                      dot: 'bg-amber-500',
                                      shadow: !isRead ? 'shadow-md shadow-amber-500/10' : 'shadow-sm'
                                    };
                                  } else if (n.type === 'error') {
                                    return {
                                      bg: !isRead ? 'bg-gradient-to-br from-red-50 via-red-50/80 to-rose-50/60 dark:from-red-950/40 dark:via-red-900/30 dark:to-rose-900/20' : 'bg-white dark:bg-slate-900',
                                      border: !isRead ? 'border-red-200/60 dark:border-red-800/40' : 'border-slate-200 dark:border-slate-800',
                                      iconBg: 'from-red-500 to-rose-500',
                                      icon: 'XCircle',
                                      dot: 'bg-red-500',
                                      shadow: !isRead ? 'shadow-md shadow-red-500/10' : 'shadow-sm'
                                    };
                                  } else if (n.type === 'success') {
                                    return {
                                      bg: !isRead ? 'bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-teal-50/60 dark:from-emerald-950/40 dark:via-emerald-900/30 dark:to-teal-900/20' : 'bg-white dark:bg-slate-900',
                                      border: !isRead ? 'border-emerald-200/60 dark:border-emerald-800/40' : 'border-slate-200 dark:border-slate-800',
                                      iconBg: 'from-emerald-500 to-teal-500',
                                      icon: 'CheckCircle',
                                      dot: 'bg-emerald-500',
                                      shadow: !isRead ? 'shadow-md shadow-emerald-500/10' : 'shadow-sm'
                                    };
                                  } else {
                                    return {
                                      bg: !isRead ? 'bg-gradient-to-br from-blue-50 via-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:via-blue-900/30 dark:to-indigo-900/20' : 'bg-white dark:bg-slate-900',
                                      border: !isRead ? 'border-blue-200/60 dark:border-blue-800/40' : 'border-slate-200 dark:border-slate-800',
                                      iconBg: 'from-blue-500 to-indigo-500',
                                      icon: 'Info',
                                      dot: 'bg-blue-500',
                                      shadow: !isRead ? 'shadow-md shadow-blue-500/10' : 'shadow-sm'
                                    };
                                  }
                                };
                                
                                const styles = getNotificationStyles();
                                
                                return (
                                  <motion.div 
                                    key={n.id} 
                                    onClick={handleNotificationClick} 
                                    className={`group relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${styles.bg} ${styles.border} ${styles.shadow} ${
                                      !isRead ? 'ring-2 ring-offset-1 ring-opacity-20' : 'hover:border-slate-300 dark:hover:border-slate-700'
                                    }`} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03, type: "spring", stiffness: 200 }}
                                    whileHover={{ x: 4, scale: 1.01 }}
                                  >
                                    <div className="flex items-start gap-4">
                                      <div className={`relative p-3 rounded-2xl bg-gradient-to-br ${styles.iconBg} shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon name={styles.icon} size={18} className="text-white" />
                                        {!isRead && (
                                          <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-1 -right-1 w-3 h-3 bg-white dark:bg-slate-900 rounded-full border-2 border-current"
                                          >
                                            <div className={`w-full h-full rounded-full ${styles.dot} animate-pulse`} />
                                          </motion.div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <p className={`text-sm font-bold leading-tight ${!isRead ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {n.title || 'Notification'}
                                              </p>
                                              {!isRead && (
                                                <motion.span
                                                  initial={{ scale: 0 }}
                                                  animate={{ scale: 1 }}
                                                  className={`px-2 py-0.5 ${styles.dot} text-white text-[9px] font-bold uppercase rounded-full shadow-sm`}
                                                >
                                                  Nouveau
                                                </motion.span>
                                              )}
                                              {n.isClinical && (
                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-bold uppercase rounded-full border border-slate-200 dark:border-slate-700">
                                                  Clinique
                                                </span>
                                              )}
                                            </div>
                                            <p className={`text-xs leading-relaxed ${!isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-500'}`}>
                                              {n.message || 'Aucun message'}
                                            </p>
                                          </div>
                                          {!n.isClinical && (
                                            <motion.button
                                              onClick={(e) => handleArchiveNotification(e, n.id)}
                                              className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-all duration-200 flex-shrink-0"
                                              whileHover={{ scale: 1.1, rotate: 5 }}
                                              whileTap={{ scale: 0.9 }}
                                              title="Supprimer cette notification"
                                            >
                                              <Icon name="Trash2" size={14} />
                                            </motion.button>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                          {n.isClinical ? (
                                            <>
                                              <div className="flex items-center gap-1.5">
                                                <Icon name="User" size={12} className="text-slate-400 dark:text-slate-500" />
                                                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                                  {n.patientName || 'Patient actuel'}
                                                </p>
                                              </div>
                                            </>
                                          ) : (
                                            <>
                                              <div className="flex items-center gap-1.5">
                                                <Icon name="Clock" size={12} className="text-slate-400 dark:text-slate-500" />
                                                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                                  {n.time || n.createdAt || 'Maintenant'}
                                                </p>
                                              </div>
                                              {n.category && (
                                                <div className="flex items-center gap-1.5">
                                                  <Icon name={
                                                    n.category === 'appointment' ? 'Calendar' :
                                                    n.category === 'clinical' ? 'Stethoscope' :
                                                    n.category === 'patient' ? 'User' :
                                                    'FileText'
                                                  } size={12} className="text-slate-400 dark:text-slate-500" />
                                                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 capitalize">
                                                    {n.category}
                                                  </p>
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                                <Icon name="Bell" size={28} className="text-slate-400 opacity-50" />
                              </div>
                              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Aucune notification médicale</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">Vous êtes à jour</p>
                  </div>
                )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Sélecteur de Vue */}
                <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  {Array.isArray(viewOptions) && viewOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setActiveView(option.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeView === option.id 
                          ? 'bg-slate-100 dark:bg-slate-800 text-primary dark:text-blue-400 shadow-sm' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon name={option.icon} size={16} />
                      <span className="hidden md:inline">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Cartes Métriques (Dynamiques) */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div 
                whileHover={{ y: -4, scale: 1.02 }}
                className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50/50 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Consultations Aujourd'hui</p>
                    <motion.p 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent"
                    >
                      {Array.isArray(appointmentsToday) ? appointmentsToday.length : (typeof dashboardData?.metrics?.appointments === 'number' ? dashboardData.metrics.appointments : 0)}
                    </motion.p>
                  </div>
                  <motion.div 
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-500 dark:to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30"
                  >
                    <Icon name="Users" size={24} className="text-white" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -4, scale: 1.02 }}
                className="relative bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Patients Actifs</p>
                    <motion.p 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-400 dark:to-emerald-500 bg-clip-text text-transparent"
                    >
                      {patientStats?.activePatients || dashboardData?.metrics?.patients || 0}
                    </motion.p>
                  </div>
                  <motion.div 
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-500 dark:to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30"
                  >
                    <Icon name="FileText" size={24} className="text-white" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -4, scale: 1.02 }}
                className="relative bg-gradient-to-br from-amber-50 via-white to-amber-50/50 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">Nouveaux Patients</p>
                    <motion.p 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-3xl font-extrabold bg-gradient-to-r from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-500 bg-clip-text text-transparent"
                    >
                      {patientStats?.newPatients || 0}
                    </motion.p>
                  </div>
                  <motion.div 
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-500 dark:to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30"
                  >
                    <Icon name="TestTube" size={24} className="text-white" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -4, scale: 1.02 }}
                className="relative bg-gradient-to-br from-violet-50 via-white to-violet-50/50 dark:from-violet-950/30 dark:via-slate-900 dark:to-violet-950/20 border border-violet-100 dark:border-violet-900/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2">Alertes</p>
                    <motion.p 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-3xl font-extrabold bg-gradient-to-r from-violet-600 to-violet-700 dark:from-violet-400 dark:to-violet-500 bg-clip-text text-transparent"
                    >
                      {dashboardData?.metrics?.alerts || 0}
                    </motion.p>
                  </div>
                  <motion.div 
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className="w-14 h-14 bg-gradient-to-br from-violet-500 to-violet-600 dark:from-violet-500 dark:to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30"
                  >
                    <Icon name="Clock" size={24} className="text-white" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>

            {/* Layout Principal : 2 Colonnes */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              
              {/* Colonne Gauche : Sélecteur Patient */}
              <motion.div variants={itemVariants} className="lg:col-span-1 sticky top-24">
                <PatientSelector
                  selectedPatient={selectedPatient}
                  onPatientSelect={handlePatientSelect}
                  onNewConsultation={handleNewConsultation}
                />
              </motion.div>

              {/* Colonne Droite : Workflow / Contenu */}
              <motion.div variants={itemVariants} className="lg:col-span-3">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden h-[780px]"
                >
                   {renderMainContent()}
                </motion.div>
              </motion.div>

            </div>

            {/* Footer */}
            <motion.div variants={itemVariants} className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-4">
                <span>Dernière synchro: {new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span>
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
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
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase rounded-full border border-slate-200 dark:border-slate-700">
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
              {/* Message principal */}
              <div>
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Message</h3>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedNotification.message || 'Aucun message disponible'}
                </p>
              </div>

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
                  {selectedNotification.allergies && (
                    <div className="mt-2">
                      <p className="text-xs text-rose-600 dark:text-rose-400">
                        Allergies: {selectedNotification.allergies}
                      </p>
                    </div>
                  )}
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
                          {selectedNotification.metadata.reason}
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
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Icon name="Clock" size={14} />
                    <span>Reçue le {selectedNotification.time || selectedNotification.createdAt || 'Date inconnue'}</span>
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
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-end gap-3">
                {selectedNotification.category === 'appointment' && selectedNotification.targetId ? (
                  <>
                    {loadingAppointmentDetails ? (
                      <button
                        disabled
                        className="px-4 py-2 bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl cursor-not-allowed font-semibold text-sm flex items-center gap-2"
                      >
                        <Loader2 className="animate-spin" size={16} />
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
                            <Loader2 className="animate-spin" size={16} />
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