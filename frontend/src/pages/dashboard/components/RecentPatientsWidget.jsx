import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import { usePatientModal } from '../../../contexts/PatientModalContext';
import {
  formatDateInBusinessTimezone,
  formatTimeInBusinessTimezone,
} from '../../../utils/dateTime';

const RecentPatientsWidget = ({ patients = [] }) => {
  const { openPatientModal } = usePatientModal();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      const dateStr = formatDateInBusinessTimezone(date);
      const timeStr = formatTimeInBusinessTimezone(date);
      return `${dateStr} à ${timeStr}`;
    } catch {
      return 'N/A';
    }
  };

  const handlePatientClick = (patient) => {
    if (!patient?.id) return;
    openPatientModal(patient.id);
  };

  return (
    <div className="rounded-2xl border border-white/40 dark:border-white/10 backdrop-blur-xl bg-white/60 dark:bg-white/10 overflow-hidden flex h-full shadow-[0_4px_16px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
      <div className="w-1.5 shrink-0 bg-primary self-stretch" aria-hidden />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl backdrop-blur-md bg-primary/20 text-primary border border-primary/30 flex items-center justify-center">
              <Icon name="Users" size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Patients récents</h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
          {!Array.isArray(patients) || patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <div className="w-14 h-14 rounded-2xl glass-surface flex items-center justify-center mb-3">
                <Icon name="Users" size={24} className="text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Aucun patient récent</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Les nouveaux patients apparaîtront ici.</p>
            </div>
          ) : (
            patients.map((patient, idx) => {
              if (!patient || typeof patient !== 'object') return null;
              return (
                <motion.div
                  key={patient.id || idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl glass-surface hover:shadow-md transition-shadow cursor-pointer border border-white/30 dark:border-white/10"
                  onClick={() => handlePatientClick(patient)}
                >
                  <div className="w-1 rounded-full self-stretch min-h-[2rem] shrink-0 bg-primary" />
                  <div className="p-2 rounded-lg glass-surface flex-shrink-0">
                    <Icon name="User" size={16} className="text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {patient.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {patient.numeroPatient && (
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {patient.numeroPatient}
                        </span>
                      )}
                      {patient.createdAt && (
                        <span className="text-xs text-slate-500 dark:text-slate-500">
                          {formatDate(patient.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentPatientsWidget;
