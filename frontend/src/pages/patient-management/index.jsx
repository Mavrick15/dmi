import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import PermissionGuard from '../../components/PermissionGuard';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import { useToast } from '../../contexts/ToastContext';
import { usePatientMutations, usePatientsList, usePatientStats } from '../../hooks/usePatients';
import { useExportMutations } from '../../hooks/useExport';
import { usePermissions } from '../../hooks/usePermissions';
import api from '../../lib/axios';

// Composants
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import AppointmentScheduler from './components/AppointmentScheduler';
import PatientCard from './components/PatientCard';
import PatientDetailsModal from './components/PatientDetailsModal';
import PatientRegistrationModal from './components/PatientRegistrationModal';
import PatientSearchFilters from './components/PatientSearchFilters';
import PatientStatsOverview from './components/PatientStatsOverview';

const PatientManagement = () => {
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // États UI
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); 
  const [viewMode, setViewMode] = useState('grid');

  // Données
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});

  // Hooks
  const limit = 12; // 12 patients par page pour tous les modes
  const { data: patientsData, isLoading: isLoadingPatients, refetch: refetchPatients } = usePatientsList({
    page: currentPage,
    limit,
    search: searchTerm,
    ...filters
  });
  
  const { data: stats } = usePatientStats();
  const { createPatient, updatePatient, deletePatient } = usePatientMutations();
  const { exportPatients } = useExportMutations();

  // Extraction des données
  // Le hook retourne maintenant toujours { data: [...], meta: {...} }
  const patients = patientsData?.data || [];
  const lastPage = patientsData?.meta?.last_page || patientsData?.meta?.lastPage || 1;
  const totalPatients = patientsData?.meta?.total || patients?.length || 0;
  const loading = isLoadingPatients;

  // Fonction utilitaire pour charger un patient (factorisée)
  const loadPatientById = useCallback(async (id, onSuccess) => {
    try {
      const response = await api.get(`/patients/${id}`);
      if (response.data && response.data.success) {
        onSuccess(response.data.data);
        setSearchParams({});
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors du chargement du patient:', error);
      }
      showToast('Erreur lors du chargement du patient', 'error');
      setSearchParams({});
    }
  }, [setSearchParams, showToast]);

  // Détecter les paramètres URL pour ouvrir automatiquement le modal de détails
  useEffect(() => {
    const view = searchParams.get('view');
    const patientId = searchParams.get('id');
    const action = searchParams.get('action');
    const actionPatientId = searchParams.get('patientId');
    
    // Si on a view=details et un id, ouvrir le modal de détails
    if (view === 'details' && patientId) {
      loadPatientById(patientId, (patient) => {
        setSelectedPatient(patient);
        setIsDetailsModalOpen(true);
      });
    }
    
    // Si on a action=edit et un patientId, ouvrir le modal d'édition
    if (action === 'edit' && actionPatientId) {
      loadPatientById(actionPatientId, (patient) => {
        setSelectedPatient(patient);
        setIsRegistrationModalOpen(true);
      });
    }
    
    // Si on a action=rdv et un patientId, ouvrir le modal de rendez-vous
    if (action === 'rdv' && actionPatientId) {
      loadPatientById(actionPatientId, (patient) => {
        setSelectedPatient(patient);
        setIsAppointmentModalOpen(true);
      });
    }
  }, [searchParams, loadPatientById]);

  // Animations (mémorisées pour éviter les re-créations)
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }), []);
  
  const itemVariants = useMemo(() => ({
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }), []);

  // --- HANDLERS D'ACTION (mémorisés pour éviter les re-renders) ---
  const handleFilter = useCallback((newFilters) => { 
    setFilters(newFilters); 
    setCurrentPage(1); 
  }, []);

  const handleResetFilters = useCallback(() => { 
    setFilters({}); 
    setSearchTerm(''); 
    setCurrentPage(1); 
  }, []);

  // Fonction appelée par le RegistrationModal
  const handlePatientRegistration = async (payload) => {
      try {
        // Vérifier si c'est un FormData (upload de fichier)
        const isFormData = payload instanceof FormData;
        
        // Extraire l'ID du payload (FormData ou objet)
        let patientId = null;
        if (isFormData) {
          // Pour FormData, on doit extraire l'id depuis le FormData
          patientId = payload.get('id');
        } else {
          patientId = payload.id;
        }
        
        if (patientId) {
            // C'est une mise à jour
            await updatePatient.mutateAsync({ id: patientId, data: payload });
            
            // Si le modal de détails est ouvert pour ce patient, recharger les données
            if (isDetailsModalOpen && selectedPatient && selectedPatient.id === patientId) {
              await loadPatientById(patientId, (updatedPatient) => {
                setSelectedPatient(updatedPatient);
              });
            }
        } else {
            // C'est une création
            await createPatient.mutateAsync(payload);
        }
        
        setSearchTerm(''); 
        setCurrentPage(1); 
        setIsRegistrationModalOpen(false);
        // Ne pas réinitialiser selectedPatient si le modal de détails est ouvert
        if (!isDetailsModalOpen) {
          setSelectedPatient(null);
        }
      } catch (error) {
        // L'erreur est déjà gérée par le hook avec Toast
        throw error; // Relaunch the error so the modal knows to stay open
      }
  };
  
  // Fonction pour déclencher la modale de confirmation (MISE À JOUR)
  const initiateDelete = (patient) => {
      // 1. Trouver l'objet patient complet par son ID
      
      // 2. Stocker l'objet simplifié { id, name }
      setPatientToDelete({ 
          id: patient.id, 
          name: patient?.name || 'ce dossier'
      });
      
      // 3. Ouvrir la modale
      setIsConfirmModalOpen(true);
  };
  
  // Fonction appelée par le ConfirmationModal (MISE À JOUR)
  const handleConfirmDelete = async () => { 
    if (!patientToDelete) return;

    try { 
        await deletePatient.mutateAsync(patientToDelete.id);
        
        // Optimisation de l'affichage
        if (patients.length === 1 && currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
        
        setIsConfirmModalOpen(false);
        setPatientToDelete(null);
    } catch(e) { 
        // L'erreur est déjà gérée par le hook
    }
  };

  // --- GESTION MODALES (mémorisées pour éviter les re-renders) ---
  const openDetails = useCallback((patient) => { 
    setSelectedPatient(patient); 
    setIsDetailsModalOpen(true); 
  }, []);

  const openAppointment = useCallback((patient) => {
    setSelectedPatient(patient);
    setIsAppointmentModalOpen(true);
  }, []);

  const openEdit = useCallback((patient) => {
    setSelectedPatient(patient); 
    setIsRegistrationModalOpen(true); 
    setIsDetailsModalOpen(false); 
  }, []);

  const openCreate = useCallback(() => {
    setSelectedPatient(null); 
    setIsRegistrationModalOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <Helmet>
        <title>Gestion des Patients - MediCore</title>
        <meta name="description" content="Gérez les dossiers patients, consultez les informations médicales et planifiez les rendez-vous." />
      </Helmet>
      <Header />
      <main className="pt-24 w-full max-w-[1600px] mx-auto px-6 lg:px-8 pb-12">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
              <Icon name="Users" size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Gestion des patients</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 flex items-center gap-2">
                <Icon name="Database" size={14} />
                <span className="font-semibold text-primary">{totalPatients}</span> dossiers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-800 text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="Vue grille"
              >
                <Icon name="Grid3X3" size={18} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-800 text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="Vue liste"
              >
                <Icon name="List" size={18} />
              </button>
            </div>
            <PermissionGuard requiredPermission="patient_view">
              <Button variant="outline" size="sm" onClick={() => exportPatients.mutate({})} disabled={exportPatients.isPending || !hasPermission('patient_view')} className="rounded-xl" iconName="Download">
                Exporter
              </Button>
            </PermissionGuard>
            <PermissionGuard requiredPermission="patient_create">
              <Button variant="primary" size="sm" onClick={openCreate} disabled={!hasPermission('patient_create')} className="rounded-xl" iconName="UserPlus">
                Nouveau patient
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {loading && totalPatients === 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4 animate-pulse">
                  <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-600 mb-3" />
                  <div className="h-8 w-12 rounded bg-slate-200 dark:bg-slate-600" />
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4 h-14 animate-pulse">
              <div className="h-10 w-full max-w-md rounded-lg bg-slate-200 dark:bg-slate-600" />
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden flex">
              <div className="w-1.5 shrink-0 bg-primary" />
              <div className="flex-1 p-8 flex flex-col items-center justify-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center border border-primary/20">
                  <Icon name="Loader2" className="animate-spin text-primary" size={28} />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-base font-semibold text-slate-900 dark:text-white">Chargement des patients</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Récupération des dossiers en cours…</p>
                </div>
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden animate-pulse">
                  <div className="h-2 w-full bg-primary/30" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-600" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-600" />
                        <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-600" />
                      </div>
                    </div>
                    <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-600" />
                    <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible" 
            className="space-y-8"
          >
            <PatientStatsOverview stats={stats || {}} />
            <PatientSearchFilters onSearch={setSearchTerm} onFilter={handleFilter} onReset={handleResetFilters} />

            <AnimatePresence mode="wait">
              {Array.isArray(patients) && patients.length > 0 ? (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-3"}>
                  {patients.map((patient) => (
                    <motion.div 
                      key={patient.id} 
                      variants={itemVariants} 
                      className="relative group"
                    >
                      <PatientCard 
                        patient={patient} 
                        onViewDetails={() => openDetails(patient)} 
                        onScheduleAppointment={() => openAppointment(patient)} 
                      />
                      <PermissionGuard requiredPermission="patient_delete">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); initiateDelete(patient); }}
                          className="absolute top-2 right-2 p-2 bg-white dark:bg-slate-800 rounded-xl text-slate-400 opacity-0 group-hover:opacity-100 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 shadow-md border border-slate-200 dark:border-slate-700 transition-all"
                          disabled={deletePatient.isPending || !hasPermission('patient_delete')}
                          title="Supprimer le dossier"
                        >
                          <Icon name="Trash2" size={14} />
                        </button>
                      </PermissionGuard>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
                    <Icon name="UserX" size={28} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Aucun patient trouvé</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Modifiez les filtres ou la recherche.</p>
                  <Button variant="outline" size="sm" onClick={handleResetFilters} className="rounded-xl" iconName="RotateCcw">
                    Réinitialiser
                  </Button>
                </div>
              )}
            </AnimatePresence>
            
            {patients.length > 0 && lastPage > 1 && (
              <div className="flex flex-wrap justify-center items-center gap-3 mt-6">
                <Button variant="outline" size="sm" disabled={currentPage === 1 || loading} onClick={() => setCurrentPage(p => p - 1)} className="rounded-xl">
                  <Icon name="ChevronLeft" size={16} className="mr-1" />
                  Précédent
                </Button>
                <span className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  Page <span className="font-bold text-primary">{currentPage}</span> / {lastPage}
                </span>
                <Button variant="outline" size="sm" disabled={currentPage === lastPage || loading} onClick={() => setCurrentPage(p => p + 1)} className="rounded-xl">
                  Suivant
                  <Icon name="ChevronRight" size={16} className="ml-1" />
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </main>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deletePatient.isPending}
        title={`Suppression du dossier patient ?`} 
        message={`Vous allez supprimer définitivement le dossier de <strong><u>${patientToDelete?.name || 'ce patient'}</u></strong>. Cette action est irréversible.`}
        confirmLabel="Oui, Supprimer"
        iconName="Trash2"
        iconColor="text-rose-500"
      />
      
      <PatientRegistrationModal 
        isOpen={isRegistrationModalOpen} 
        onClose={() => setIsRegistrationModalOpen(false)} 
        onSubmit={handlePatientRegistration} 
        patient={selectedPatient} 
      />
      
      <AppointmentScheduler 
        isOpen={isAppointmentModalOpen} 
        onClose={() => setIsAppointmentModalOpen(false)} 
        patient={selectedPatient} 
        onSchedule={() => {
            refetchPatients();
            // Le toast est géré par le hook useAppointments
        }} 
      />
      
      <PatientDetailsModal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        patient={selectedPatient}
        onEdit={openEdit}        
        onSchedule={openAppointment} 
      />
    </div>
  );
};

export default PatientManagement;