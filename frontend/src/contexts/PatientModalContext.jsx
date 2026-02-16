import { createContext, useContext, useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';

// Chargement différé : le modal et ses dépendances (PatientDetailsModal, hooks, sous-composants)
// sont dans un chunk séparé, chargé uniquement à la première ouverture du modal.
const PatientDetailsModal = lazy(() =>
  import('../pages/patient-management/components/PatientDetailsModal').then((m) => ({ default: m.default }))
);

const PatientModalContext = createContext(null);

export function PatientModalProvider({ children }) {
  const navigate = useNavigate();
  const [patientForModal, setPatientForModal] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const openPatientModal = useCallback((patientIdOrPatient) => {
    const id = typeof patientIdOrPatient === 'object' && patientIdOrPatient?.id != null
      ? patientIdOrPatient.id
      : patientIdOrPatient;
    if (!id) return;
    setPatientForModal({ id });
    setIsOpen(true);
  }, []);

  const closePatientModal = useCallback(() => {
    setIsOpen(false);
    setPatientForModal(null);
  }, []);

  const handleEdit = useCallback(() => {
    const id = patientForModal?.id;
    closePatientModal();
    if (id) navigate(`/gestion-patients?action=edit&patientId=${id}`);
  }, [patientForModal?.id, closePatientModal, navigate]);

  const handleSchedule = useCallback(() => {
    const id = patientForModal?.id;
    closePatientModal();
    if (id) navigate(`/gestion-patients?action=rdv&patientId=${id}`);
  }, [patientForModal?.id, closePatientModal, navigate]);

  return (
    <PatientModalContext.Provider value={{ openPatientModal, closePatientModal }}>
      {children}
      {isOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" aria-hidden="true">
            <div className="bg-white dark:bg-slate-900 rounded-xl px-6 py-4 shadow-xl text-slate-600 dark:text-slate-400 text-sm">
              Chargement…
            </div>
          </div>
        }>
          <PatientDetailsModal
            isOpen={isOpen}
            onClose={closePatientModal}
            patient={patientForModal}
            onEdit={handleEdit}
            onSchedule={handleSchedule}
          />
        </Suspense>
      )}
    </PatientModalContext.Provider>
  );
}

export function usePatientModal() {
  const ctx = useContext(PatientModalContext);
  if (!ctx) {
    throw new Error('usePatientModal must be used within PatientModalProvider');
  }
  return ctx;
}
