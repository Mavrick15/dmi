import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext'; 
import { useDocuments, useDocumentMutations, useDocumentStats } from '../../hooks/useDocuments';
import tokenService from '../../services/tokenService';

// Composants
import DocumentCard from './components/DocumentCard';
import DocumentStats from './components/DocumentStats';
import DocumentUploadModal from './components/DocumentUploadModal';
import DocumentSigningModal from './components/DocumentSigningModal';
import DocumentViewer from './components/DocumentViewer';
import DocumentVersionsModal from './components/DocumentVersionsModal';
import DocumentCommentsPanel from './components/DocumentCommentsPanel';
import DocumentShareModal from './components/DocumentShareModal';
import DocumentApprovalWorkflow from './components/DocumentApprovalWorkflow';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

const DocumentManagement = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // --- ÉTATS UI ---
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false); 
  const [isViewerOpen, setIsViewerOpen] = useState(false); 
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
  const [isCommentsPanelOpen, setIsCommentsPanelOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedDocumentsForExport, setSelectedDocumentsForExport] = useState([]);

  // Données sélectionnées
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);

  // Debounce de la recherche (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset à la page 1 lors d'une nouvelle recherche
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- HOOKS ---
  const limit = 12; // 12 documents par page
  const { data: documentsData, isLoading, error: documentsError } = useDocuments({ 
    search: debouncedSearch.trim() || undefined, 
    page: currentPage, 
    limit 
  });
  
  // Statistiques complètes depuis le backend
  const { data: statsData } = useDocumentStats();
      
  const { 
    uploadDocument, 
    deleteDocument, 
    signDocument, 
    downloadDocument,
    shareDocument,
    addComment,
    toggleArchive,
    restoreVersion,
    exportBulk: exportBulkMutation,
    trackView
  } = useDocumentMutations();
  
  // Extraction des documents et métadonnées depuis la réponse paginée
  const documents = useMemo(() => {
    if (!documentsData) return [];
    if (Array.isArray(documentsData)) return documentsData;
    if (documentsData.data) return documentsData.data;
    if (documentsData.all) return documentsData.all;
    return [];
  }, [documentsData]);

  // Métadonnées de pagination
  const paginationMeta = useMemo(() => {
    if (!documentsData || Array.isArray(documentsData)) return null;
    return documentsData.meta || null;
  }, [documentsData]);

  const totalPages = paginationMeta?.last_page || paginationMeta?.lastPage || 1;
  const totalDocuments = paginationMeta?.total || documents.length;

  // --- 2. STATISTIQUES (depuis le backend) ---
  const computedStats = useMemo(() => {
    // Utiliser les statistiques du backend si disponibles, sinon valeurs par défaut
    if (statsData) {
      return {
        totalDocuments: statsData.totalDocuments || 0,
        pendingSignatures: statsData.pendingSignatures || 0,
        signedToday: statsData.signedToday || 0,
        totalSigned: statsData.totalSigned || 0,
        storageUsed: statsData.storageUsed || '0 MB',
        archivedDocuments: statsData.archivedDocuments || 0,
        totalViews: statsData.totalViews || 0
      };
    }
    
    // Fallback: utiliser les métadonnées de pagination pour le total
    return {
      totalDocuments: totalDocuments || 0,
      pendingSignatures: 0,
      signedToday: 0,
      totalSigned: 0,
      storageUsed: '0 MB',
      archivedDocuments: 0,
      totalViews: 0
    };
  }, [statsData, totalDocuments]);

  // --- 3. ACTIONS ---

  // Upload
  const handleUpload = async (formData) => {
    try {
      await uploadDocument.mutateAsync(formData);
      setSearchTerm(''); // Reset recherche pour voir le nouveau doc
      setCurrentPage(1); // Retourner à la première page
      setIsModalOpen(false);
    } catch (err) {
      // L'erreur est déjà gérée par le hook avec Toast
    }
  };

  // Gestion de la recherche avec reset de pagination
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Retourner à la première page lors d'une nouvelle recherche
  };

  // Téléchargement (nouvel onglet : le token doit être dans l'URL car le navigateur n'envoie pas les headers)
  const handleDownload = async (doc) => {
    if (!doc) return;
    try {
      const baseUrl = downloadDocument(doc.id);
      const token = tokenService.getAccessToken();
      const url = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
      window.open(url, '_blank');
      showToast(`Téléchargement de "${doc.title || doc.originalName}" lancé.`, 'info');
    } catch (err) {
      showToast('Impossible de télécharger le fichier.', 'error');
    }
  };

  // Suppression (Initier)
  const initiateDelete = (doc) => {
      setDocToDelete({ id: doc.id, title: doc.title });
      setIsConfirmModalOpen(true);
  };
  
  // Suppression (Confirmer)
  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    
    try {
      await deleteDocument.mutateAsync(docToDelete.id);
      
      // Si le document supprimé était ouvert dans le viewer, on le ferme
      if (selectedDoc?.id === docToDelete.id) {
          setIsViewerOpen(false);
          setSelectedDoc(null);
      }
    } catch (err) {
      // L'erreur est déjà gérée par le hook
    } finally {
      setIsConfirmModalOpen(false);
      setDocToDelete(null);
    }
  };

  // --- LOGIQUE VISUALISATION & SIGNATURE ---

  // Ouvrir le viewer
  const openViewer = (doc) => {
    setSelectedDoc(doc);
    setIsViewerOpen(true);
    // Track view
    if (doc?.id) {
      trackView.mutate(doc.id);
    }
  };

  // Ouvrir la modale de signature
  const openSigning = (doc) => {
    // Vérification de sécurité côté front
    if (!doc || doc.mimeType !== 'application/pdf') { 
        showToast("Seuls les fichiers PDF peuvent être signés.", 'warning');
        return;
    }
    
    // Vérifier que seul un médecin clinique peut signer
    const isDoctor = user?.role === 'docteur_clinique' || user?.role === 'admin';
    if (!isDoctor) {
        showToast("Seuls les docteurs peuvent signer des documents.", 'error');
        return;
    }
    
    setSelectedDoc(doc);
    setIsSigningModalOpen(true);
    // On ferme le viewer pour laisser place à la modale de signature
    setIsViewerOpen(false); 
  };

  // Soumettre la signature
  const processSignature = async (signatureDataURL) => {
    if (!selectedDoc) return;
    
    try {
        const response = await signDocument.mutateAsync({
            id: selectedDoc.id,
            signatureImage: signatureDataURL
        });
        
        setIsSigningModalOpen(false);
        
        // Mettre à jour l'objet sélectionné avec les données retournées par le backend
        // La réponse est dans response.data (ApiResponse.success contient { success: true, data: {...} })
        const updatedDocument = response?.data || response;
        if (updatedDocument) {
            setSelectedDoc(updatedDocument);
        } else if (selectedDoc) {
            // Fallback si les données ne sont pas disponibles
            setSelectedDoc(prev => ({ ...prev, isSigned: true }));
        }
    } catch (err) {
        // L'erreur est déjà gérée par le hook
    }
  };

  // Handlers pour les nouvelles fonctionnalités
  const handleShare = (doc) => {
    setSelectedDoc(doc);
    setIsShareModalOpen(true);
  };

  const handleViewVersions = (doc) => {
    setSelectedDoc(doc);
    setIsVersionsModalOpen(true);
  };

  const handleViewComments = (doc) => {
    setSelectedDoc(doc);
    setIsCommentsPanelOpen(true);
  };

  const handleViewApproval = (doc) => {
    setSelectedDoc(doc);
    setIsApprovalModalOpen(true);
  };

  const handleExportBulk = async () => {
    if (selectedDocumentsForExport.length === 0) {
      showToast('Veuillez sélectionner au moins un document', 'warning');
      return;
    }
    try {
      await exportBulkMutation.mutateAsync(Array.isArray(selectedDocumentsForExport) ? selectedDocumentsForExport.map(d => {
        if (!d || typeof d !== 'object') return null;
        return d.id;
      }).filter(Boolean) : []);
      setSelectedDocumentsForExport([]);
    } catch (error) {
      // Erreur gérée par le hook
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 dark:from-slate-950 dark:via-slate-900/80 dark:to-slate-950 font-sans text-slate-900 dark:text-slate-50 transition-colors">
      <Header />

      <main className="pt-24 max-w-[1600px] mx-auto px-6 lg:px-8 pb-12">
        {/* En-tête de page */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl glass-surface flex items-center justify-center text-primary">
              <Icon name="FileText" size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Gestion documentaire</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Archivage, consultation et signature des dossiers médicaux</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['documents'], exact: false });
                showToast('Documents actualisés', 'success');
              }}
              className="gap-2 border-white/20 dark:border-white/10"
            >
              <Icon name="RefreshCw" size={16} className={isLoading ? 'animate-spin' : ''} />
              Actualiser
            </Button>
            {selectedDocumentsForExport.length > 0 && (
              <PermissionGuard requiredPermission="audit_view">
                <Button
                  variant="outline"
                  onClick={handleExportBulk}
                  disabled={exportBulkMutation.isPending || !hasPermission('audit_view')}
                  className="gap-2 text-primary border-primary/30 hover:bg-primary/10 dark:hover:bg-primary/20"
                >
                  <Icon name="Download" size={16} className={exportBulkMutation.isPending ? 'animate-spin' : ''} />
                  Exporter ({selectedDocumentsForExport.length})
                </Button>
              </PermissionGuard>
            )}
            <PermissionGuard requiredPermission="document_upload">
              <Button
                onClick={() => setIsModalOpen(true)}
                disabled={!hasPermission('document_upload')}
                className="gap-2"
              >
                <Icon name="Plus" size={20} />
                Nouveau document
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Statistiques */}
        <div className="mb-6 w-full">
          <DocumentStats stats={computedStats} />
        </div>

        {/* Zone d'erreur globale */}
        {documentsError && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-l-4 border-l-red-500">
            <Icon name="AlertCircle" size={20} className="shrink-0" />
            <p className="text-sm">{documentsError.userMessage || documentsError.message || 'Impossible de charger les documents.'}</p>
          </div>
        )}

        {/* Conteneur principal */}
        <div className="rounded-2xl glass-panel min-h-[400px] overflow-hidden">
          <div className="p-6">
            {/* Barre de recherche */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/20 dark:border-white/10">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Fichiers ({totalDocuments})
              </h2>
              <div className="relative w-full sm:w-72">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Rechercher (titre, patient)..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  maxLength={100}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-white/20 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white placeholder:text-slate-400"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                    aria-label="Effacer la recherche"
                  >
                    <Icon name="X" size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Grille de documents */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 rounded-2xl glass-panel border-l-4 border-l-primary">
                <Icon name="Loader2" size={32} className="animate-spin text-primary mb-4" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Chargement des documents…</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl glass-panel">
                <div className="w-12 h-12 rounded-2xl glass-surface flex items-center justify-center mb-3">
                  <Icon name="FileText" size={28} className="text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Aucun document</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                  Aucun fichier trouvé. Utilisez « Nouveau document » pour en ajouter.
                </p>
                <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm" className="rounded-xl">
                  Ajouter un document
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {documents.map((doc) => {
                  if (!doc || typeof doc !== 'object') return null;
                  const selectedArray = Array.isArray(selectedDocumentsForExport) ? selectedDocumentsForExport : [];
                  const isSelected = selectedArray.some((d) => d && d.id === doc.id);
                  return (
                    <div
                      key={doc.id}
                      className={`h-full relative ${isSelected ? 'ring-2 ring-primary rounded-xl ring-offset-2 dark:ring-offset-slate-900' : ''}`}
                    >
                      <div className="absolute top-2 right-2 z-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (isSelected) {
                              setSelectedDocumentsForExport((prev) => (Array.isArray(prev) ? prev : []).filter((d) => d && d.id !== doc.id));
                            } else {
                              setSelectedDocumentsForExport((prev) => [...(Array.isArray(prev) ? prev : []), doc]);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 text-primary rounded border-slate-300 focus:ring-primary/20 cursor-pointer bg-white dark:bg-slate-800"
                        />
                      </div>
                      <DocumentCard
                        document={doc}
                        onView={openViewer}
                        onDownload={handleDownload}
                        onDelete={initiateDelete}
                        onShare={handleShare}
                        canDelete={doc.uploadedBy === user?.id || user?.role === 'admin' || user?.role === 'gestionnaire'}
                        canShare={doc.uploadedBy === user?.id}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {documents.length > 0 && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-white/20 dark:border-white/10">
                <p className="text-xs text-slate-500 dark:text-slate-400 order-2 sm:order-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{((currentPage - 1) * limit) + 1}</span>
                  {' – '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.min(currentPage * limit, totalDocuments)}</span>
                  {' sur '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{totalDocuments}</span>
                </p>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <Icon name="ChevronLeft" size={16} className="mr-1" />
                    Précédent
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let page;
                      if (totalPages <= 7) page = i + 1;
                      else if (currentPage <= 4) page = i + 1;
                      else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                      else page = currentPage - 3 + i;
                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[2.25rem] px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-primary text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent'
                          }`}
                          disabled={isLoading}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    Suivant
                    <Icon name="ChevronRight" size={16} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- MODALES --- */}
      
      {/* 1. Confirmation Suppression */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => { setIsConfirmModalOpen(false); setDocToDelete(null); }}
        onConfirm={handleConfirmDelete}
        isLoading={deleteDocument.isPending}
        title={`Supprimer le document ?`}
        message={`Vous êtes sur le point de supprimer définitivement <strong>"${docToDelete?.title}"</strong>. Cette action est irréversible.`}
        confirmLabel="Oui, Supprimer"
        iconName="Trash2"
        iconColor="text-rose-500"
      />

      {/* 2. Upload */}
      <DocumentUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpload={handleUpload}
        isUploading={uploadDocument.isPending}
      />

      {/* 3. Visualiseur */}
      <DocumentViewer 
        document={selectedDoc}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        onDownload={handleDownload}
        onSign={() => openSigning(selectedDoc)}
        onViewVersions={handleViewVersions}
        onViewComments={handleViewComments}
        onViewApproval={handleViewApproval}
        onShare={handleShare}
      />

      {/* 4. Versions */}
      <DocumentVersionsModal
        document={selectedDoc}
        isOpen={isVersionsModalOpen}
        onClose={() => { setIsVersionsModalOpen(false); setSelectedDoc(null); }}
      />

      {/* 5. Commentaires */}
      <DocumentCommentsPanel
        documentId={selectedDoc?.id}
        isOpen={isCommentsPanelOpen}
        onClose={() => { setIsCommentsPanelOpen(false); setSelectedDoc(null); }}
      />

      {/* 6. Partage */}
      <DocumentShareModal
        document={selectedDoc}
        isOpen={isShareModalOpen}
        onClose={() => { setIsShareModalOpen(false); setSelectedDoc(null); }}
      />

      {/* 8. Workflow d'approbation */}
      <DocumentApprovalWorkflow
        document={selectedDoc}
        isOpen={isApprovalModalOpen}
        onClose={() => { setIsApprovalModalOpen(false); setSelectedDoc(null); }}
      />

      {/* 9. Signature */}
      <DocumentSigningModal
        isOpen={isSigningModalOpen}
        onClose={() => { setIsSigningModalOpen(false); setSelectedDoc(null); }}
        onConfirm={processSignature}
        documentTitle={selectedDoc?.title}
        isSigning={signDocument.isPending}
      />
    </div>
  );
};

export default DocumentManagement;