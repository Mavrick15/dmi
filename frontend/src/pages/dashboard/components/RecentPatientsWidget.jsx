import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { usePatientModal } from '../../../contexts/PatientModalContext';

const RecentPatientsWidget = ({ patients = [] }) => {
  const { openPatientModal } = usePatientModal();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      return `${dateStr} à ${timeStr}`;
    } catch (error) {
      return 'N/A';
    }
  };

  const handlePatientClick = (patient) => {
    if (!patient || !patient.id) return;
    openPatientModal(patient.id);
  };

  return (
    <div className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50/50 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-3xl shadow-lg p-6 h-full flex flex-col overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-center justify-between mb-6 z-10">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <Icon name="Users" size={20} className="text-white" />
          </motion.div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Patients récents
          </h3>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto -mx-2 px-2 space-y-2 custom-scrollbar z-10">
        {Array.isArray(patients) && patients.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400 dark:text-slate-500">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
              <Icon name="Users" size={24} className="opacity-50" />
            </div>
            <p className="text-sm">Aucun patient récent</p>
            <p className="text-xs mt-1">Les nouveaux patients apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-2">
          {Array.isArray(patients) && patients.map((patient, idx) => {
            if (!patient || typeof patient !== 'object') return null;
            return (
            <motion.div
              key={patient.id || idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02, x: 4 }}
              className="w-full flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200 dark:border-blue-800/30 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => handlePatientClick(patient)}
            >
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex-shrink-0 shadow-sm"
              >
                <Icon name="User" size={16} />
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {patient.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {patient.numeroPatient && (
                    <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                      {patient.numeroPatient}
                    </span>
                  )}
                  {patient.createdAt && (
                    <>
                      {patient.numeroPatient && <span className="text-[10px] text-blue-300 dark:text-blue-700">•</span>}
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        {formatDate(patient.createdAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
            );
          }).filter(Boolean)}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentPatientsWidget;

