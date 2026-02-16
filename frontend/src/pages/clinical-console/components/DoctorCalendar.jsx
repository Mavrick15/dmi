import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import { useAppointments, useAppointmentMutations } from '../../../hooks/useAppointments';
import { useAuth } from '../../../contexts/AuthContext';
import { Loader2, ChevronLeft, ChevronRight, Clock, User, MapPin } from 'lucide-react';

const DoctorCalendar = ({ onSelectAppointment }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [draggedAppointment, setDraggedAppointment] = useState(null);
  const { updateAppointment } = useAppointmentMutations();

  // Calculer le début et la fin du mois
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return { start, end };
  }, [currentDate]);

  // Récupérer les rendez-vous du médecin connecté
  // Le backend filtre automatiquement par le médecin connecté
  const { data: appointmentsData, isLoading } = useAppointments({
    startDate: dateRange.start.toISOString().split('T')[0],
    endDate: dateRange.end.toISOString().split('T')[0],
  }, {
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  const allAppointments = appointmentsData || [];

  // Filtrer les rendez-vous pour n'afficher que ceux du médecin connecté
  // (comme pour les notifications)
  const appointments = useMemo(() => {
    const isDoctor = user?.role === 'docteur';
    
    if (!isDoctor) {
      // Si ce n'est pas un médecin, retourner un tableau vide
      return [];
    }
    
    // Le backend filtre déjà par médecin connecté, mais on ajoute une vérification supplémentaire
    // pour être sûr (comme pour les notifications)
    return allAppointments.filter(appointment => {
      if (!appointment || typeof appointment !== 'object') return false;
      
      // Vérifier si le rendez-vous appartient au médecin connecté
      // En comparant le userId du médecin avec l'ID de l'utilisateur connecté
      const appointmentMedecinUserId = appointment.medecin?.userId || appointment.medecin?.user?.id;
      
      // Si on a un userId dans le médecin, on compare avec l'utilisateur connecté
      if (appointmentMedecinUserId && user?.id) {
        return appointmentMedecinUserId === user.id;
      }
      
      // Si on n'a pas de userId mais que le backend a déjà filtré, on garde le rendez-vous
      // (le backend filtre automatiquement par le médecin connecté)
      return true;
    });
  }, [allAppointments, user]);

  // Grouper les rendez-vous par date
  const appointmentsByDate = useMemo(() => {
    const grouped = {};
    appointments.forEach(appointment => {
      let dateKey;
      if (appointment.dateHeure) {
        // Utiliser les méthodes locales pour éviter les problèmes de fuseau horaire
        // new Date() convertit automatiquement la chaîne ISO en heure locale
        const date = new Date(appointment.dateHeure);
        // Utiliser getFullYear(), getMonth(), getDate() qui retournent les valeurs locales
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        dateKey = `${year}-${month}-${day}`;
      } else if (appointment.date) {
        dateKey = appointment.date;
      } else {
        return; // Ignorer si aucune date n'est disponible
      }
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(appointment);
    });
    return grouped;
  }, [appointments]);

  // Générer les jours du mois
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    // Convertir pour que lundi = 0, dimanche = 6
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

    const days = [];
    
    // Jours du mois précédent (pour compléter la première semaine)
    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Jours du mois actuel
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
      });
    }

    // Jours du mois suivant (pour compléter la dernière semaine)
    const remainingDays = 42 - days.length; // 6 semaines * 7 jours
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [currentDate]);

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  // Formater la date
  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Formater l'heure
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtenir les styles de couleur selon le statut
  const getAppointmentStyles = (appointment) => {
    const status = appointment.statut || appointment.status || 'programme';
    const statusMap = {
      'programme': { 
        bg: 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700',
        text: 'text-white',
        border: 'border-blue-400 dark:border-blue-500',
        shadow: 'shadow-blue-500/20',
        label: 'Planifié'
      },
      'confirme': { 
        bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700',
        text: 'text-white',
        border: 'border-emerald-400 dark:border-emerald-500',
        shadow: 'shadow-emerald-500/20',
        label: 'Confirmé'
      },
      'en_cours': { 
        bg: 'bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700',
        text: 'text-white',
        border: 'border-purple-400 dark:border-purple-500',
        shadow: 'shadow-purple-500/20',
        label: 'En cours'
      },
      'termine': { 
        bg: 'bg-gradient-to-r from-slate-400 to-slate-500 dark:from-slate-600 dark:to-slate-700',
        text: 'text-white',
        border: 'border-slate-300 dark:border-slate-500',
        shadow: 'shadow-slate-500/20',
        label: 'Terminé'
      },
      'annule': { 
        bg: 'bg-gradient-to-r from-red-400 to-red-500 dark:from-red-600 dark:to-red-700',
        text: 'text-white',
        border: 'border-red-300 dark:border-red-500',
        shadow: 'shadow-red-500/20',
        label: 'Annulé',
        opacity: 'opacity-60'
      },
      'absent': { 
        bg: 'bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700',
        text: 'text-white',
        border: 'border-amber-400 dark:border-amber-500',
        shadow: 'shadow-amber-500/20',
        label: 'Absent'
      },
    };
    return statusMap[status] || statusMap['programme'];
  };

  // Obtenir le statut du rendez-vous pour le badge
  const getStatusBadge = (appointment) => {
    const status = appointment.statut || appointment.status || 'programme';
    const statusMap = {
      'programme': { label: 'Planifié', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
      'confirme': { label: 'Confirmé', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
      'en_cours': { label: 'En cours', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
      'termine': { label: 'Terminé', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
      'annule': { label: 'Annulé', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800' },
      'absent': { label: 'Absent', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    };
    const statusInfo = statusMap[status] || statusMap['programme'];
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  // Obtenir les rendez-vous d'une date
  const getAppointmentsForDate = (date) => {
    // Utiliser les méthodes locales pour éviter les problèmes de fuseau horaire
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    return appointmentsByDate[dateKey] || [];
  };

  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  // Handlers pour le drag and drop
  const handleDragStart = (e, appointment) => {
    setDraggedAppointment(appointment);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', appointment.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetDate) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedAppointment || !targetDate) {
      setDraggedAppointment(null);
      return;
    }

    // Obtenir les composants de la date cible
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1; // getMonth() retourne 0-11
    const targetDay = targetDate.getDate();
    
    // Obtenir la date actuelle du rendez-vous
    const currentDateTime = new Date(draggedAppointment.dateHeure || draggedAppointment.date);
    const currentYear = currentDateTime.getFullYear();
    const currentMonth = currentDateTime.getMonth() + 1;
    const currentDay = currentDateTime.getDate();
    
    // Si c'est la même date, ne rien faire
    if (targetYear === currentYear && targetMonth === currentMonth && targetDay === currentDay) {
      setDraggedAppointment(null);
      return;
    }

    try {
      // Conserver l'heure existante du rendez-vous
      const currentHours = currentDateTime.getHours();
      const currentMinutes = currentDateTime.getMinutes();
      
      // Créer une date locale avec la date cible et l'heure actuelle
      const newDateLocal = new Date(targetYear, targetMonth - 1, targetDay, currentHours, currentMinutes, 0, 0);
      
      // Obtenir le décalage de fuseau horaire en minutes (négatif si en avance sur UTC)
      const timezoneOffset = -newDateLocal.getTimezoneOffset(); // Inverser le signe
      
      // Calculer les heures et minutes du décalage
      const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
      const offsetMinutes = Math.abs(timezoneOffset) % 60;
      const offsetSign = timezoneOffset >= 0 ? '+' : '-';
      const offsetStr = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
      
      // Construire la chaîne ISO avec le décalage de fuseau horaire
      const yearStr = targetYear.toString().padStart(4, '0');
      const monthStr = targetMonth.toString().padStart(2, '0');
      const dayStr = targetDay.toString().padStart(2, '0');
      const hoursStr = currentHours.toString().padStart(2, '0');
      const minutesStr = currentMinutes.toString().padStart(2, '0');
      
      // Format: YYYY-MM-DDTHH:mm:ss+HH:mm (avec décalage de fuseau horaire)
      const dateTimeStr = `${yearStr}-${monthStr}-${dayStr}T${hoursStr}:${minutesStr}:00${offsetStr}`;

      if (process.env.NODE_ENV === 'development') {
        console.log('Déplacement rendez-vous:', {
          targetDate: `${targetYear}-${targetMonth}-${targetDay}`,
          currentTime: `${currentHours}:${currentMinutes}`,
          dateTimeStr,
          timezoneOffset,
          offsetStr
        });
      }

      // Mettre à jour le rendez-vous avec la nouvelle date
      await updateAppointment.mutateAsync({
        id: draggedAppointment.id,
        data: {
          dateHeure: dateTimeStr,
        }
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors du déplacement du rendez-vous:', error);
      }
    } finally {
      setDraggedAppointment(null);
    }
  };

  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  if (isLoading && !appointments.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[780px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      {/* Header avec navigation */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-800 border-b-2 border-slate-200/50 dark:border-slate-800/50 shadow-sm p-4 backdrop-blur-sm flex-shrink-0">
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800/50 [mask-image:linear-gradient(0deg,white,transparent)] opacity-50"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-blue-500 to-blue-600 dark:from-primary dark:via-blue-600 dark:to-blue-700 flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-white/20 dark:border-slate-700/30"
            >
              <Icon name="Calendar" size={20} className="text-white drop-shadow-sm" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent"></div>
            </motion.div>
            <div>
              <h2 className="text-xl font-extrabold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-white bg-clip-text text-transparent">
                Mon Agenda
              </h2>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize mt-0.5">
                {monthName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-lg p-1 border-2 border-slate-200/50 dark:border-slate-700/50 shadow-md">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="ChevronLeft"
                  onClick={goToPreviousMonth}
                  className="h-7 w-7 p-0 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-md"
                />
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="ChevronRight"
                  onClick={goToNextMonth}
                  className="h-7 w-7 p-0 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-md"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {/* Légende des couleurs - sticky */}
        <div className="sticky top-0 z-10 overflow-hidden bg-gradient-to-br from-white/80 via-slate-50/80 to-white/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl rounded-xl border-2 border-slate-200/50 dark:border-slate-800/50 shadow-lg p-3 flex-shrink-0 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5"></div>
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { color: 'from-blue-500 to-blue-600', label: 'Planifié' },
              { color: 'from-emerald-500 to-emerald-600', label: 'Confirmé' },
              { color: 'from-purple-500 to-purple-600', label: 'En cours' },
              { color: 'from-slate-400 to-slate-500', label: 'Terminé' },
              { color: 'from-red-400 to-red-500', label: 'Annulé', opacity: 'opacity-60' },
              { color: 'from-amber-500 to-amber-600', label: 'Absent' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.1, y: -2 }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all ${item.opacity || ''}`}
              >
                <div className={`w-3 h-3 rounded-md bg-gradient-to-r ${item.color} shadow-sm ring-1 ring-white/50 dark:ring-slate-700/50`}></div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

        {/* Calendrier avec transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentDate.getFullYear()}-${currentDate.getMonth()}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden flex-shrink-0"
          >
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className="p-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Jours du calendrier */}
        <div className="relative grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day.date);
            const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
            const appointmentCount = dayAppointments.length;
            
            return (
              <motion.div
                key={index}
                onClick={() => {
                  if (day.isCurrentMonth) {
                    const dayAppointments = getAppointmentsForDate(day.date);
                    // Ouvrir le modal seulement s'il y a des rendez-vous
                    if (dayAppointments.length > 0) {
                      setSelectedDate(day.date);
                    }
                  }
                }}
                onDragOver={day.isCurrentMonth ? handleDragOver : undefined}
                onDrop={day.isCurrentMonth ? (e) => handleDrop(e, day.date) : undefined}
                whileHover={day.isCurrentMonth ? { scale: 1.03, zIndex: 10 } : {}}
                className={`
                  min-h-[120px] p-2 border-r border-b border-slate-200 dark:border-slate-800 relative
                  ${day.isCurrentMonth ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-950/30'}
                  ${day.isToday ? 'bg-blue-50 dark:bg-blue-950/20' : ''}
                  ${isSelected ? 'ring-2 ring-primary ring-offset-1 dark:ring-offset-slate-900 z-20 bg-primary/5 dark:bg-primary/10' : ''}
                  ${day.isCurrentMonth ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'cursor-default'}
                  ${draggedAppointment && day.isCurrentMonth ? 'ring-2 ring-dashed ring-primary/50 bg-primary/5 dark:bg-primary/10' : ''}
                  transition-all duration-200
                `}
              >
                {/* Numéro du jour */}
                <div className="flex items-center justify-between mb-2">
                  <div 
                    className={`
                      w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold
                      ${day.isCurrentMonth 
                        ? day.isToday 
                          ? 'bg-primary text-white shadow-md' 
                          : 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-600'
                      }
                      transition-all duration-200
                    `}
                  >
                    {day.date.getDate()}
                  </div>
                  {appointmentCount > 0 && day.isCurrentMonth && (
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  )}
                </div>
                
                {/* Rendez-vous du jour */}
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((appointment, idx) => {
                    const styles = getAppointmentStyles(appointment);
                    return (
                      <motion.div
                        key={appointment.id || idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, appointment)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectAppointment) {
                            onSelectAppointment(appointment);
                          }
                        }}
                        whileHover={{ scale: 1.05, zIndex: 10 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                          text-xs p-1.5 rounded-md cursor-move border shadow-sm
                          ${styles.bg} ${styles.text} ${styles.border}
                          ${styles.opacity || ''}
                          hover:shadow-md
                          ${draggedAppointment?.id === appointment.id ? 'opacity-50 scale-95' : ''}
                          transition-all duration-200
                        `}
                      >
                        <div className="font-bold truncate flex items-center gap-1 text-xs">
                          <Clock size={10} className="flex-shrink-0" />
                          {formatTime(appointment.dateHeure || appointment.date)}
                        </div>
                        <div className="truncate text-xs font-medium opacity-90 mt-0.5">
                          {appointment.patient?.nomComplet || appointment.patient?.name || appointment.patientName || 'Patient'}
                        </div>
                      </motion.div>
                    );
                  })}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-center">
                      +{dayAppointments.length - 3}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        </motion.div>
        </AnimatePresence>
      </div>

      {/* Modal des rendez-vous de la date sélectionnée */}
      <Modal
        isOpen={selectedDate !== null && selectedDateAppointments.length > 0}
        onClose={() => setSelectedDate(null)}
        className="max-w-3xl w-full"
        showCloseButton={true}
        headerClassName="relative"
      >
        {/* Date en haut à gauche */}
        {selectedDate && (
          <style>{`
            .modal-header-date {
              position: absolute;
              top: 1.5rem;
              left: 1.5rem;
              font-size: 1.125rem;
              font-weight: 700;
              color: rgb(71 85 105);
            }
            .dark .modal-header-date {
              color: rgb(148 163 184);
            }
          `}</style>
        )}
        {selectedDate && (
          <div className="modal-header-date">
            {formatDate(selectedDate)}
          </div>
        )}
        <div className="space-y-2">
          {selectedDateAppointments.map((appointment, idx) => {
            const styles = getAppointmentStyles(appointment);
            return (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, x: -30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                draggable
                onDragStart={(e) => handleDragStart(e, appointment)}
                onClick={() => {
                  if (onSelectAppointment) {
                    onSelectAppointment(appointment);
                    setSelectedDate(null); // Fermer le modal après sélection
                  }
                }}
                whileHover={{ scale: 1.01 }}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all duration-200
                  ${styles.border}
                  bg-white dark:bg-slate-800/50
                  hover:shadow-md hover:border-primary/30 dark:hover:border-primary/20
                  ${draggedAppointment?.id === appointment.id ? 'opacity-50 scale-95' : ''}
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-md ${styles.bg} flex items-center justify-center shadow-sm`}>
                      <Clock size={14} className="text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {formatTime(appointment.dateHeure || appointment.date)}
                      </div>
                      {appointment.dureeMinutes && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {appointment.dureeMinutes} min
                        </span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(appointment)}
                </div>
                
                <div className="space-y-1.5 pl-10">
                  <div className="flex items-center gap-2 text-sm">
                    <User size={14} className="text-slate-500 dark:text-slate-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {appointment.patient?.nomComplet || appointment.patient?.name || appointment.patientName || 'Patient inconnu'}
                    </span>
                  </div>
                  
                  {(appointment.motif || appointment.type) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="FileText" size={14} className="text-slate-500 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">
                        {appointment.motif || appointment.type || 'Consultation'}
                      </span>
                    </div>
                  )}
                  
                  {appointment.notes && (
                    <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                        {appointment.notes}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default DoctorCalendar;

