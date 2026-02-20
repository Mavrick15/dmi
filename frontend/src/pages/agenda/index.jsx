import { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { useEstablishments } from '../../hooks/useAdmin';
import { useAppointments, useDoctors, useAppointmentMutations } from '../../hooks/useAppointments';
import AppointmentScheduler from '../patient-management/components/AppointmentScheduler';
import { useToast } from '../../contexts/ToastContext';
import { usePatientModal } from '../../contexts/PatientModalContext';
import {
  formatDateInBusinessTimezone,
  formatTimeInBusinessTimezone,
  getTodayInBusinessTimezone,
  toBusinessDateKey,
} from '../../utils/dateTime';

const STATUTS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'programme', label: 'Programmé' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Terminé' },
  { value: 'annule', label: 'Annulé' },
];
const formatDate = (dateStr) => {
  return formatDateInBusinessTimezone(dateStr);
};

const formatTime = (dateStr) => {
  return formatTimeInBusinessTimezone(dateStr);
};

const isToday = (dateKey) => {
  const today = getTodayInBusinessTimezone();
  return dateKey === today;
};

const getStatutStyle = (statut) => {
  const s = (statut || '').toLowerCase();
  if (s === 'programme') return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';
  if (s === 'en_cours') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
  if (s === 'termine') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
  if (s === 'annule') return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
};

const getConsultationProgressLabel = (statut) => {
  const s = (statut || '').toLowerCase();
  if (s === 'en_cours') return 'En cours';
  if (s === 'termine') return 'Terminée';
  if (s === 'annule') return 'Annulé';
  return 'En attente';
};

const APPOINTMENTS_PER_PAGE = 10;

const Agenda = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'day'
  const [selectedDate, setSelectedDate] = useState(() => getTodayInBusinessTimezone());
  const [establishmentId, setEstablishmentId] = useState('');
  const [medecinId, setMedecinId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [listPage, setListPage] = useState(1);
  const [dayViewPage, setDayViewPage] = useState(1);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);

  const { data: establishmentsData } = useEstablishments({ limit: 100 });
  const establishmentsList = useMemo(() => {
    const list = establishmentsData?.data || [];
    return [{ value: '', label: 'Tous les établissements' }, ...list.map((e) => ({ value: e.id, label: e.nom || e.name || 'Établissement' }))];
  }, [establishmentsData]);

  const dateRange = useMemo(() => {
    const d = new Date(selectedDate);
    const start = new Date(d);
    start.setDate(1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return {
      startDate: toBusinessDateKey(start),
      endDate: toBusinessDateKey(end),
    };
  }, [selectedDate]);

  const params = useMemo(() => ({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    ...(establishmentId ? { establishmentId } : {}),
    ...(medecinId ? { medecinId } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  }), [dateRange, establishmentId, medecinId, statusFilter]);

  const doctorsParams = useMemo(() => (establishmentId ? { establishmentId } : {}), [establishmentId]);
  const { data: appointmentsData, isLoading, refetch: refetchAppointments } = useAppointments(params, { refetchInterval: 10000 });
  const { data: doctorsData } = useDoctors(doctorsParams);
  const { updateAppointmentStatus, deleteAppointment } = useAppointmentMutations();

  const appointments = Array.isArray(appointmentsData) ? appointmentsData : [];
  const doctors = useMemo(() => {
    const list = Array.isArray(doctorsData) ? doctorsData : [];
    return [{ value: '', label: 'Tous les médecins' }, ...list.map((d) => ({
      value: d.id,
      label: d.name || d.nomComplet || 'Médecin',
    }))];
  }, [doctorsData]);

  const { openPatientModal } = usePatientModal();

  const setToday = () => setSelectedDate(getTodayInBusinessTimezone());
  const setTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setSelectedDate(toBusinessDateKey(d));
  };
  const shiftMonth = (delta) => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + delta);
    setSelectedDate(toBusinessDateKey(d));
  };

  const goToPatient = (patientId) => {
    if (patientId) openPatientModal(patientId);
  };

  const handleStatusChange = (id, newStatus) => {
    updateAppointmentStatus.mutate(
      { id, status: newStatus },
      {
        onError: () => {},
      }
    );
  };

  const handleDelete = (id) => {
    if (!window.confirm('Annuler ce rendez-vous ?')) return;
    deleteAppointment.mutate(id);
  };

  const handleOpenConsultation = (appointment) => {
    const patientId = appointment?.patientId || appointment?.patient?.id;
    if (!patientId) {
      showToast('Patient introuvable pour ce rendez-vous.', 'error');
      return;
    }
    navigate(`/console-clinique?patientId=${patientId}&appointmentId=${appointment.id}&startConsultation=true`);
  };

  useEffect(() => {
    setListPage(1);
  }, [viewMode, establishmentId, medecinId, statusFilter, selectedDate, appointments.length]);

  useEffect(() => {
    setDayViewPage(1);
  }, [selectedDate, appointments.length]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <Helmet>
        <title>Agenda | MediCore</title>
        <meta name="description" content="Agenda des rendez-vous - Vue globale par date, médecin et statut." />
      </Helmet>
      <Header />

      <main className="pt-24 w-full max-w-[1400px] mx-auto px-6 lg:px-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-slate-200 dark:border-slate-700">
              <Icon name="CalendarDays" size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Agenda</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Rendez-vous par date, médecin et statut</p>
            </div>
          </div>
          <PermissionGuard requiredPermission="appointment_create">
            <Button
              variant="default"
              size="lg"
              iconName="CalendarPlus"
              onClick={() => setIsSchedulerOpen(true)}
              className="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
            >
              Nouveau rendez-vous
            </Button>
          </PermissionGuard>
        </motion.div>

        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm mb-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap w-full sm:w-auto">Période</label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                title="Mois précédent"
              >
                <Icon name="ChevronLeft" size={18} />
              </button>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-[160px] sm:w-[180px]"
              />
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                title="Mois suivant"
              >
                <Icon name="ChevronRight" size={18} />
              </button>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={setToday}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isToday(selectedDate) ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                Aujourd'hui
              </button>
              <button
                type="button"
                onClick={setTomorrow}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Demain
              </button>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          {establishmentsList.length > 1 && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">Établissement</label>
                <Select
                  options={establishmentsList}
                  value={establishmentId}
                  onChange={setEstablishmentId}
                  placeholder="Tous"
                  className="min-w-[200px]"
                />
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            </>
          )}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">Médecin</label>
            <Select
              options={doctors}
              value={medecinId}
              onChange={setMedecinId}
              placeholder="Tous"
              className="min-w-[200px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">Statut</label>
            <Select
              options={STATUTS}
              value={statusFilter}
              onChange={setStatusFilter}
              className="min-w-[160px]"
            />
          </div>
          <div className="flex gap-1 ml-auto rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Icon name="List" size={16} />
              Liste
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'day' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Icon name="CalendarDays" size={16} />
              Jour
            </button>
          </div>
        </motion.div>

        {/* Compteur */}
        {!isLoading && appointments.length > 0 && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            <span className="font-semibold text-slate-900 dark:text-white">{appointments.length}</span>
            {appointments.length === 1 ? ' rendez-vous' : ' rendez-vous'} pour la période
          </p>
        )}

        {/* Contenu */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 border-l-4 border-l-primary">
            <Icon name="Loader2" size={32} className="animate-spin text-primary mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Chargement…</p>
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState
            icon="CalendarX"
            title="Aucun rendez-vous"
            description="Aucun rendez-vous pour la période et les filtres sélectionnés."
            actionLabel={hasPermission('appointment_create') ? 'Créer un rendez-vous' : undefined}
            action={hasPermission('appointment_create') ? () => setIsSchedulerOpen(true) : undefined}
          />
        ) : viewMode === 'day' ? (
          <DayView
            appointments={appointments}
            selectedDate={selectedDate}
            onPatientClick={goToPatient}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onOpenConsultation={handleOpenConsultation}
            getStatutStyle={getStatutStyle}
            getConsultationProgressLabel={getConsultationProgressLabel}
            pageSize={APPOINTMENTS_PER_PAGE}
            currentPage={dayViewPage}
            onPageChange={setDayViewPage}
          />
        ) : (
          <ListView
            appointments={appointments}
            onPatientClick={goToPatient}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onOpenConsultation={handleOpenConsultation}
            getStatutStyle={getStatutStyle}
            getConsultationProgressLabel={getConsultationProgressLabel}
            sortByLastFirst
            pageSize={APPOINTMENTS_PER_PAGE}
            currentPage={listPage}
            onPageChange={setListPage}
          />
        )}
      </main>

      <AppointmentScheduler
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        patient={null}
        onSchedule={refetchAppointments}
      />
    </div>
  );
};

function AppointmentCard({ apt, onPatientClick, onStatusChange, onDelete, onOpenConsultation, getStatutStyle, getConsultationProgressLabel, compact }) {
  const patientName = apt.patient?.user?.nomComplet || apt.patientName || '—';
  const medecinName = apt.medecin?.user?.nomComplet || apt.medecinName || '—';
  const motif = apt.motif || apt.type || null;
  return (
    <div className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden ${compact ? 'p-3' : 'p-4'} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-slate-900 dark:text-white">{formatDate(apt.dateHeure)}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{formatTime(apt.dateHeure)} • {apt.dureeMinutes || 30} min</div>
          <button
            type="button"
            onClick={() => onPatientClick(apt.patientId || apt.patient?.id)}
            className="text-primary font-medium hover:underline mt-1 block truncate"
          >
            {patientName}
          </button>
          <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{medecinName}</p>
          {motif && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{motif}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={getStatutStyle(apt.statut)}>{getConsultationProgressLabel(apt.statut)}</Badge>
          {apt.statut === 'programme' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onStatusChange(apt.id, 'en_cours')}>Démarrer</Button>
              <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => onDelete(apt.id)}>Annuler</Button>
            </>
          )}
          {apt.statut === 'en_cours' && (
            <Button variant="ghost" size="sm" onClick={() => onOpenConsultation(apt)}>Reprendre</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ListView({ appointments, onPatientClick, onStatusChange, onDelete, onOpenConsultation, getStatutStyle, getConsultationProgressLabel, sortByLastFirst = true, title, pageSize = 12, currentPage = 1, onPageChange }) {
  const sorted = useMemo(() => {
    const list = [...appointments].sort((a, b) => {
      const dateA = a?.dateHeure ? new Date(a.dateHeure).getTime() : 0;
      const dateB = b?.dateHeure ? new Date(b.dateHeure).getTime() : 0;
      return dateB - dateA;
    });
    return sortByLastFirst ? list : list.reverse();
  }, [appointments, sortByLastFirst]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const start = (currentPage - 1) * pageSize;
  const paginated = useMemo(() => sorted.slice(start, start + pageSize), [sorted, start, pageSize]);

  return (
    <>
      <div className="mb-4 flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Icon name="Clock" size={16} className="text-primary" />
        <span className="text-xs font-medium">Les plus récents en premier</span>
      </div>
      {title && (
        <div className="mb-4 flex items-center gap-2">
          <Icon name="Clock" size={18} className="text-primary" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
        </div>
      )}
      {/* Tableau : visible à partir de md */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="hidden md:block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Date & Heure</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Médecin</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Motif</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((apt) => (
                <tr
                  key={apt.id}
                  className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">{formatDate(apt.dateHeure)}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{formatTime(apt.dateHeure)} • {apt.dureeMinutes || 30} min</div>
                  </td>
                  <td className="px-6 py-4">
                    <button type="button" onClick={() => onPatientClick(apt.patientId || apt.patient?.id)} className="text-primary font-medium hover:underline">
                      {apt.patient?.user?.nomComplet || apt.patientName || '—'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{apt.medecin?.user?.nomComplet || apt.medecinName || '—'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 hidden lg:table-cell max-w-[180px] truncate">{apt.motif || apt.type || '—'}</td>
                  <td className="px-6 py-4">
                    <Badge className={getStatutStyle(apt.statut)}>{getConsultationProgressLabel(apt.statut)}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    {apt.statut === 'programme' && (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onStatusChange(apt.id, 'en_cours')}>Démarrer</Button>
                        <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => onDelete(apt.id)}>Annuler</Button>
                      </div>
                    )}
                    {apt.statut === 'en_cours' && (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onOpenConsultation(apt)}>Reprendre</Button>
                      </div>
                    )}
                    {apt.statut === 'termine' && (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Terminée</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
      {/* Cartes : mobile */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="md:hidden space-y-3">
        {paginated.map((apt) => (
          <AppointmentCard
            key={apt.id}
            apt={apt}
            onPatientClick={onPatientClick}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onOpenConsultation={onOpenConsultation}
            getStatutStyle={getStatutStyle}
            getConsultationProgressLabel={getConsultationProgressLabel}
            compact
          />
        ))}
      </motion.div>

      {/* Pagination : toujours visible dès qu'il y a au moins un rendez-vous */}
      {sorted.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-b-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 order-2 sm:order-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{start + 1}</span>
            {' – '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.min(start + pageSize, sorted.length)}</span>
            {' sur '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{sorted.length}</span>
            {sorted.length > 0 && ' (10 par page)'}
          </p>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange && onPageChange((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded-xl"
            >
              <Icon name="ChevronLeft" size={16} className="mr-1" />
              Précédent
            </Button>
            <span className="px-3 py-1.5 text-sm font-medium bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
              Page {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange && onPageChange((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-xl"
            >
              Suivant
              <Icon name="ChevronRight" size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

const TIMELINE_START_H = 7;
const TIMELINE_END_H = 20;
const SLOT_HEIGHT_PX = 52;

function DayView({ appointments, selectedDate, onPatientClick, onStatusChange, onDelete, onOpenConsultation, getStatutStyle, getConsultationProgressLabel, pageSize = 12, currentPage = 1, onPageChange }) {
  const dayAppointments = useMemo(() => {
    const key = selectedDate;
    return appointments
      .filter((apt) => {
        const d = apt.dateHeure ? toBusinessDateKey(apt.dateHeure) : apt.date;
        return d === key;
      })
      .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));
  }, [appointments, selectedDate]);

  const totalDayPages = Math.max(1, Math.ceil(dayAppointments.length / pageSize));
  const startDay = (currentPage - 1) * pageSize;
  const paginatedDayAppointments = useMemo(
    () => dayAppointments.slice(startDay, startDay + pageSize),
    [dayAppointments, startDay, pageSize]
  );

  const blocks = useMemo(() => {
    return paginatedDayAppointments.map((apt) => {
      const start = new Date(apt.dateHeure);
      const duration = apt.dureeMinutes || 30;
      const startH = start.getHours() + start.getMinutes() / 60 + start.getSeconds() / 3600;
      const endH = startH + duration / 60;
      const top = Math.max(0, (startH - TIMELINE_START_H) * SLOT_HEIGHT_PX);
      const endY = (TIMELINE_END_H - TIMELINE_START_H) * SLOT_HEIGHT_PX;
      const height = Math.min(
        (duration / 60) * SLOT_HEIGHT_PX,
        endY - top
      );
      return { apt, top, height: Math.max(20, height) };
    });
  }, [paginatedDayAppointments]);

  const totalHeight = (TIMELINE_END_H - TIMELINE_START_H + 1) * SLOT_HEIGHT_PX;
  const hours = Array.from({ length: TIMELINE_END_H - TIMELINE_START_H + 1 }, (_, i) => TIMELINE_START_H + i);

  if (dayAppointments.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
          <Icon name="Calendar" size={28} className="text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Aucun rendez-vous ce jour-là.</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sélectionnez une autre date ou créez un rendez-vous.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
    >
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {formatDate(dayAppointments[0]?.dateHeure)} — Vue timeline
        </p>
        {dayAppointments.length > pageSize && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {startDay + 1} – {Math.min(startDay + pageSize, dayAppointments.length)} sur {dayAppointments.length}
          </span>
        )}
      </div>
      <div className="flex">
        <div className="w-14 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 py-1">
          {hours.map((h) => (
            <div
              key={h}
              className="text-xs text-slate-500 dark:text-slate-400 pr-2 text-right"
              style={{ height: SLOT_HEIGHT_PX, lineHeight: `${SLOT_HEIGHT_PX}px` }}
            >
              {h.toString().padStart(2, '0')}h
            </div>
          ))}
        </div>
        <div className="flex-1 relative min-h-[200px]" style={{ height: totalHeight }}>
          {hours.slice(0, -1).map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-slate-100 dark:border-slate-700"
              style={{ top: (h - TIMELINE_START_H) * SLOT_HEIGHT_PX }}
            />
          ))}
          {blocks.map(({ apt, top, height }) => (
            <div
              key={apt.id}
              className="absolute left-2 right-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col"
              style={{ top: `${top}px`, height: `${height}px`, minHeight: 40 }}
            >
              <div
                className={`flex-1 px-2 py-1 flex flex-col justify-center border-l-4 ${
                  apt.statut === 'programme'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500'
                    : apt.statut === 'en_cours'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500'
                    : apt.statut === 'termine'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                    <span className="font-semibold shrink-0">
                      {formatTime(apt.dateHeure)} — {(apt.dureeMinutes || 30)} min
                    </span>
                    <span className="text-slate-300 dark:text-slate-600 shrink-0">|</span>
                    <button
                      type="button"
                      onClick={() => onPatientClick(apt.patientId || apt.patient?.id)}
                      className="text-primary hover:underline min-w-0 flex-1 text-left truncate"
                      title={apt.patient?.user?.nomComplet || apt.patientName || '—'}
                    >
                      Patient: {apt.patient?.user?.nomComplet || apt.patientName || '—'}
                    </button>
                    <span className="text-slate-300 dark:text-slate-600 shrink-0">|</span>
                    <span
                      className="min-w-0 flex-1 text-center truncate"
                      title={apt.medecin?.user?.nomComplet || apt.medecinName || '—'}
                    >
                      Docteur: {apt.medecin?.user?.nomComplet || apt.medecinName || '—'}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600 shrink-0">|</span>
                    <span
                      className="min-w-0 flex-1 text-right truncate"
                      title={apt.motif || apt.type || '—'}
                    >
                      Motif: {apt.motif || apt.type || '—'}
                    </span>
                  </div>
                  <Badge className={`text-[9px] px-1 py-0 shrink-0 ${getStatutStyle(apt.statut)}`}>
                    {getConsultationProgressLabel(apt.statut)}
                  </Badge>
                </div>
                {apt.statut === 'programme' && height >= 56 && (
                  <div className="flex gap-1 mt-1">
                    <Button variant="default" size="sm" className="h-6 text-xs" onClick={() => onStatusChange(apt.id, 'en_cours')}>
                      Démarrer
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-rose-600" onClick={() => onDelete(apt.id)}>
                      Annuler
                    </Button>
                  </div>
                )}
                {apt.statut === 'en_cours' && height >= 56 && (
                  <div className="flex gap-1 mt-1">
                    <Button variant="default" size="sm" className="h-6 text-xs" onClick={() => onOpenConsultation(apt)}>
                      Reprendre
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {dayAppointments.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
          <p className="text-xs text-slate-500 dark:text-slate-400 order-2 sm:order-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{startDay + 1}</span>
            {' – '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.min(startDay + pageSize, dayAppointments.length)}</span>
            {' sur '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{dayAppointments.length}</span>
          </p>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="rounded-xl">
              <Icon name="ChevronLeft" size={16} className="mr-1" />
              Précédent
            </Button>
            <span className="px-3 py-1.5 text-sm font-medium bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
              Page {currentPage} / {totalDayPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => onPageChange((p) => Math.min(totalDayPages, p + 1))} disabled={currentPage >= totalDayPages} className="rounded-xl">
              Suivant
              <Icon name="ChevronRight" size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default Agenda;
