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
      <div className="flex flex-col items-center justify-center h-96 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 mx-4 border-l-4 border-l-primary">
        <Icon name="Loader2" size={32} className="animate-spin text-primary mb-2" />
        <span className="text-sm text-slate-500 dark:text-slate-400">Chargement…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[780px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Icon name="Calendar" size={20} className="text-primary dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Mon Agenda</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{monthName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" iconName="ChevronLeft" onClick={goToPreviousMonth} className="h-8 w-8 p-0 rounded-lg" />
            <Button variant="outline" size="sm" onClick={goToToday} className="text-xs font-medium px-3 rounded-lg">Aujourd'hui</Button>
            <Button variant="ghost" size="sm" iconName="ChevronRight" onClick={goToNextMonth} className="h-8 w-8 p-0 rounded-lg" />
          </div>
        </div>
        {/* Légende compacte */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {[
            { color: 'bg-blue-500', label: 'Planifié' },
            { color: 'bg-emerald-500', label: 'Confirmé' },
            { color: 'bg-purple-500', label: 'En cours' },
            { color: 'bg-slate-400', label: 'Terminé' },
            { color: 'bg-red-400', label: 'Annulé' },
            { color: 'bg-amber-500', label: 'Absent' },
          ].map((item, idx) => (
            <span key={idx} className="flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
              <span className={`w-2 h-2 rounded-full ${item.color}`} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">

        {/* Calendrier */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentDate.getFullYear()}-${currentDate.getMonth()}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900/50"
          >
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              {weekDays.map((day, index) => (
                <div key={index} className="py-2 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dayAppointments = getAppointmentsForDate(day.date);
                const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
                const appointmentCount = dayAppointments.length;

                return (
                  <motion.div
                    key={index}
                    onClick={() => {
                      if (day.isCurrentMonth && getAppointmentsForDate(day.date).length > 0) setSelectedDate(day.date);
                    }}
                    onDragOver={day.isCurrentMonth ? handleDragOver : undefined}
                    onDrop={day.isCurrentMonth ? (e) => handleDrop(e, day.date) : undefined}
                    className={`
                      min-h-[100px] p-1.5 border-r border-b border-slate-100 dark:border-slate-800 last:border-r-0
                      ${day.isCurrentMonth ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-950/50'}
                      ${day.isToday ? 'bg-primary/5 dark:bg-primary/10' : ''}
                      ${isSelected ? 'ring-2 ring-inset ring-primary bg-primary/10 dark:bg-primary/20' : ''}
                      ${day.isCurrentMonth ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'cursor-default'}
                      ${draggedAppointment && day.isCurrentMonth ? 'ring-2 ring-dashed ring-primary/40 bg-primary/5' : ''}
                      transition-colors
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`
                          w-6 h-6 flex items-center justify-center rounded-md text-xs font-semibold
                          ${day.isCurrentMonth
                            ? day.isToday
                              ? 'bg-primary text-white'
                              : 'text-slate-700 dark:text-slate-300'
                            : 'text-slate-400 dark:text-slate-600'}
                        `}
                      >
                        {day.date.getDate()}
                      </span>
                      {appointmentCount > 0 && day.isCurrentMonth && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary dark:bg-blue-400" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayAppointments.slice(0, 3).map((appointment, idx) => {
                        const styles = getAppointmentStyles(appointment);
                        return (
                          <motion.div
                            key={appointment.id || idx}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            draggable
                            onDragStart={(e) => handleDragStart(e, appointment)}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectAppointment?.(appointment);
                            }}
                            className={`
                              px-1.5 py-1 rounded text-[10px] cursor-move border truncate
                              ${styles.bg} ${styles.text} ${styles.border} ${styles.opacity || ''}
                              hover:opacity-95
                              ${draggedAppointment?.id === appointment.id ? 'opacity-50' : ''}
                            `}
                          >
                            <span className="font-semibold">{formatTime(appointment.dateHeure || appointment.date)}</span>
                            <span className="block truncate opacity-90">
                              {appointment.patient?.nomComplet || appointment.patient?.name || appointment.patientName || 'Patient'}
                            </span>
                          </motion.div>
                        );
                      })}
                      {dayAppointments.length > 3 && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium text-center py-0.5">
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

      {/* Modal rendez-vous du jour */}
      <Modal
        isOpen={selectedDate !== null && selectedDateAppointments.length > 0}
        onClose={() => setSelectedDate(null)}
        className="max-w-2xl w-full"
        showCloseButton
        title={selectedDate ? formatDate(selectedDate) : ''}
      >
        <div className="space-y-2 pt-2">
          {selectedDateAppointments.map((appointment, idx) => {
            const styles = getAppointmentStyles(appointment);
            return (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                draggable
                onDragStart={(e) => handleDragStart(e, appointment)}
                onClick={() => {
                  onSelectAppointment?.(appointment);
                  setSelectedDate(null);
                }}
                className={`
                  p-4 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer
                  bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
                  ${draggedAppointment?.id === appointment.id ? 'opacity-50' : ''}
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg ${styles.bg} flex items-center justify-center shrink-0`}>
                      <Icon name="Clock" size={18} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {formatTime(appointment.dateHeure || appointment.date)}
                        {appointment.dureeMinutes && (
                          <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">({appointment.dureeMinutes} min)</span>
                        )}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                        {appointment.patient?.nomComplet || appointment.patient?.name || appointment.patientName || 'Patient'}
                      </p>
                      {(appointment.motif || appointment.type) && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {appointment.motif || appointment.type || 'Consultation'}
                        </p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(appointment)}
                </div>
                {appointment.notes && (
                  <p className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 italic">
                    {appointment.notes}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default DoctorCalendar;

