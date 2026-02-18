import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import { usePatientModal } from '../../../contexts/PatientModalContext';

const RecentPatientsWidget = ({ patients = [] }) => {
  const { openPatientModal } = usePatientModal();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden flex h-full">
      <div className="w-1.5 shrink-0 bg-primary self-stretch" aria-hidden />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary border border-primary/20 flex items-center justify-center">
              <Icon name="Users" size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Patients récents</h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
          {!Array.isArray(patients) || patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 border border-slate-200 dark:border-slate-700">
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
                  className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handlePatientClick(patient)}
                >
                  <div className="w-1 rounded-full self-stretch min-h-[2rem] shrink-0 bg-primary" />
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0">
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
