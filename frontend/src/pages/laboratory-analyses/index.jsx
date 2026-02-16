import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../contexts/ToastContext';
import { Loader2 } from 'lucide-react';
import { useAnalysesList, useAnalysesStats, useAnalysesMutations } from '../../hooks/useAnalyses';
import api from '../../lib/axios';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

// Composants critiques (loaded immediately)
import AnalysesList from './components/AnalysesList';
import AnalysesStats from './components/AnalysesStats';
import AnalysesFilters from './components/AnalysesFilters';

// Composants lazy-loaded
const AnalysesKanban = lazy(() => import('./components/AnalysesKanban'));
const AnalysesAdvancedStats = lazy(() => import('./components/AnalysesAdvancedStats'));
const CriticalAlerts = lazy(() => import('./components/CriticalAlerts'));
const AnalysesReminders = lazy(() => import('./components/AnalysesReminders'));
const AnalysesCalendar = lazy(() => import('./components/AnalysesCalendar'));
const PrescribeAnalyseModal = lazy(() => import('./components/PrescribeAnalyseModal'));
const AnalyseDetailsModal = lazy(() => import('./components/AnalyseDetailsModal'));

const LaboratoryAnalyses = () => {
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isPrescribeModalOpen, setIsPrescribeModalOpen] = useState(false);
  const [selectedAnalyse, setSelectedAnalyse] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState(localStorage.getItem('analysesViewMode') || 'list'); // 'list', 'kanban' ou 'calendar'
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [showCriticalAlerts, setShowCriticalAlerts] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [analyseToCancel, setAnalyseToCancel] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [analyseToDelete, setAnalyseToDelete] = useState(null);
  
  // Gérer les query params pour ouvrir directement le modal avec un patient
  useEffect(() => {
    const patientId = searchParams.get('patientId');
    const prescribe = searchParams.get('prescribe');
    const analyseId = searchParams.get('analyseId');
    
    if (patientId && prescribe === 'true') {
      setIsPrescribeModalOpen(true);
      // Nettoyer les params après ouverture
      setSearchParams({});
    }
    
    if (analyseId) {
      // Charger l'analyse et ouvrir le modal de détails
      const loadAnalyse = async () => {
        try {
          const response = await api.get(`/analyses/${analyseId}`);
          if (response.data.success) {
            setSelectedAnalyse(response.data.data);
            setIsDetailsModalOpen(true);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Erreur lors du chargement de l\'analyse:', error);
          }
        } finally {
          setSearchParams({});
        }
      };
      loadAnalyse();
    }
  }, [searchParams, setSearchParams]);

  // --- HOOKS ---
  // Mémoriser les paramètres de requête pour éviter les re-renders inutiles
  const queryParams = useMemo(() => ({ ...filters, page: currentPage }), [filters, currentPage]);
  const { data: analysesData, isLoading, isError } = useAnalysesList(queryParams);
  const { data: stats } = useAnalysesStats();
  const { cancelAnalyse, deleteAnalyse } = useAnalysesMutations();

  const analyses = analysesData?.data || analysesData || [];
  const meta = analysesData?.meta;

  // --- HANDLERS (mémorisés pour optimiser les performances) ---
  const handlePrescribe = useCallback(() => {
    setIsPrescribeModalOpen(true);
  }, []);

  const handleViewDetails = useCallback((analyse) => {
    setSelectedAnalyse(analyse);
    setIsDetailsModalOpen(true);
  }, []);

  const handleCancel = useCallback((analyse) => {
    setAnalyseToCancel(analyse);
    setIsConfirmModalOpen(true);
  }, []);

  const handleConfirmCancel = useCallback(async () => {
    if (!analyseToCancel) return;
    
    try {
      await cancelAnalyse.mutateAsync({
        id: analyseToCancel.id,
        numeroAnalyse: analyseToCancel.numeroAnalyse,
        reason: 'Annulation demandée par l\'utilisateur'
      });
      setIsConfirmModalOpen(false);
      setAnalyseToCancel(null);
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  }, [analyseToCancel, cancelAnalyse]);

  const handleDelete = useCallback((analyse) => {
    setAnalyseToDelete(analyse);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!analyseToDelete) return;
    
    try {
      await deleteAnalyse.mutateAsync({
        id: analyseToDelete.id,
        numeroAnalyse: analyseToDelete.numeroAnalyse
      });
      setIsDeleteModalOpen(false);
      setAnalyseToDelete(null);
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  }, [analyseToDelete, deleteAnalyse]);

  const handleFiltersChange = useCallback((newFilters) => {
    // Utiliser une fonction de mise à jour pour éviter les dépendances
    setFilters(prevFilters => {
      // Vérifier si les filtres ont vraiment changé
      const hasChanged = JSON.stringify(prevFilters) !== JSON.stringify(newFilters);
      return hasChanged ? newFilters : prevFilters;
    });
    setCurrentPage(1); // Reset à la première page lors du changement de filtres
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Mémoriser les analyses pour éviter les re-renders inutiles
  const memoizedAnalyses = useMemo(() => analyses, [analyses]);
  
  // Mémoriser les filtres pour éviter les re-renders inutiles
  const memoizedFilters = useMemo(() => filters, [filters]);

  // --- RENDER ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center pt-20">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Chargement des analyses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans relative overflow-hidden">
      {/* Effets de fond décoratifs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
      </div>
      
      <Helmet>
        <title>Analyses - MediCore</title>
        <meta name="description" content="Gestion des analyses et résultats de laboratoire." />
      </Helmet>

      <Header />
      
      <main className="relative z-10 pt-28 w-full max-w-[1600px] mx-auto px-6 lg:px-8 pb-16">
        <div className="space-y-10">
          {/* En-tête */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-xl border border-slate-200/50 dark:border-slate-800/50"
          >
            <div className="flex items-center gap-4 md:gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center text-primary dark:text-blue-400 border border-primary/10 dark:border-primary/20 shadow-sm"
              >
                <Icon name="Activity" size={24} />
              </motion.div>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                  Analyses
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
                  Gestion des prescriptions et résultats
                </p>
              </div>
            </div>

            <PermissionGuard requiredPermission="analyses_create">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="primary"
                  iconName="FilePlus"
                  onClick={handlePrescribe}
                  disabled={!hasPermission('analyses_create')}
                >
                  Analyse
                </Button>
              </motion.div>
            </PermissionGuard>
          </motion.div>

          {/* Statistiques */}
          <div className="space-y-4">
            {stats && (
              <>
                <AnalysesStats stats={stats} />
                <div className="flex justify-between items-center gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName={showReminders ? "ChevronUp" : "ChevronDown"}
                      onClick={() => setShowReminders(!showReminders)}
                      className="text-xs"
                    >
                      {showReminders ? 'Masquer' : 'Afficher'} rappels
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName={showCriticalAlerts ? "ChevronUp" : "ChevronDown"}
                      onClick={() => setShowCriticalAlerts(!showCriticalAlerts)}
                      className="text-xs"
                    >
                      {showCriticalAlerts ? 'Masquer' : 'Afficher'} alertes
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName={showAdvancedStats ? "ChevronUp" : "ChevronDown"}
                    onClick={() => setShowAdvancedStats(!showAdvancedStats)}
                    className="text-xs"
                  >
                    {showAdvancedStats ? 'Masquer' : 'Afficher'} statistiques
                  </Button>
                </div>
                {showReminders && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Icon name="Bell" size={20} className="text-amber-500" />
                      Rappels Automatiques
                    </h3>
                    <AnalysesReminders />
                  </div>
                )}
                {showCriticalAlerts && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Icon name="AlertCircle" size={20} className="text-rose-500" />
                      Alertes Critiques
                    </h3>
                    <CriticalAlerts />
                  </div>
                )}
                {showAdvancedStats && (
                  <AnalysesAdvancedStats analyses={memoizedAnalyses} stats={stats} />
                )}
              </>
            )}
          </div>

          {/* Filtres */}
          <AnalysesFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          {/* Toggle View Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setViewMode('list');
                  localStorage.setItem('analysesViewMode', 'list');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === 'list'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon name="List" size={16} className="inline mr-2" />
                Liste
              </button>
              <button
                onClick={() => {
                  setViewMode('kanban');
                  localStorage.setItem('analysesViewMode', 'kanban');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon name="LayoutGrid" size={16} className="inline mr-2" />
                Kanban
              </button>
              <button
                onClick={() => {
                  setViewMode('calendar');
                  localStorage.setItem('analysesViewMode', 'calendar');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon name="Calendar" size={16} className="inline mr-2" />
                Calendrier
              </button>
            </div>
          </div>

          {/* Liste, Kanban ou Calendrier des analyses */}
          {viewMode === 'list' ? (
            <AnalysesList
              analyses={memoizedAnalyses}
              meta={meta}
              isLoading={isLoading}
              onViewDetails={handleViewDetails}
              onCancel={handleCancel}
              onDelete={handleDelete}
              onPageChange={handlePageChange}
            />
          ) : viewMode === 'kanban' ? (
            <Suspense fallback={
              <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            }>
              <AnalysesKanban
                analyses={memoizedAnalyses}
                isLoading={isLoading}
                onViewDetails={handleViewDetails}
                onCancel={handleCancel}
                onDelete={handleDelete}
              />
            </Suspense>
          ) : (
            <Suspense fallback={
              <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            }>
              <AnalysesCalendar />
            </Suspense>
          )}

          {/* Modales */}
          <Suspense fallback={null}>
            {isPrescribeModalOpen && (
              <PrescribeAnalyseModal
                isOpen={isPrescribeModalOpen}
                onClose={() => {
                  setIsPrescribeModalOpen(false);
                  setSearchParams({});
                }}
                defaultPatientId={searchParams.get('patientId') || null}
              />
            )}

            {isDetailsModalOpen && (
              <AnalyseDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedAnalyse(null);
                }}
                analyse={selectedAnalyse}
              />
            )}
          </Suspense>

          {/* Modal de confirmation pour l'annulation */}
          <ConfirmationModal
            isOpen={isConfirmModalOpen}
            onClose={() => {
              setIsConfirmModalOpen(false);
              setAnalyseToCancel(null);
            }}
            onConfirm={handleConfirmCancel}
            isLoading={cancelAnalyse.isPending}
            title="Annuler l'analyse ?"
            message={`Êtes-vous sûr de vouloir annuler l'analyse <strong>${analyseToCancel?.numeroAnalyse}</strong> ? Cette action ne peut être annulée.`}
            confirmLabel="Oui, Annuler"
            cancelLabel="Non, Garder"
            iconName="XCircle"
            iconColor="text-rose-500"
          />

          {/* Modal de confirmation pour la suppression */}
          <ConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setAnalyseToDelete(null);
            }}
            onConfirm={handleConfirmDelete}
            isLoading={deleteAnalyse.isPending}
            title="Supprimer l'analyse ?"
            message={`Êtes-vous sûr de vouloir supprimer définitivement l'analyse <strong>${analyseToDelete?.numeroAnalyse}</strong> ? Cette action est irréversible et supprimera également tous les résultats associés.`}
            confirmLabel="Oui, Supprimer"
            cancelLabel="Non, Annuler"
            iconName="Trash2"
            iconColor="text-rose-500"
          />
        </div>
      </main>
    </div>
  );
};

export default LaboratoryAnalyses;

