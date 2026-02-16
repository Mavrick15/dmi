import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext'; 
import { useDocuments, useDocumentMutations, useDocumentStats } from '../../hooks/useDocuments';

// Composants
import DocumentCard from './components/DocumentCard';
import DocumentStats from './components/DocumentStats';
import DocumentUploadModal from './components/DocumentUploadModal';
import DocumentSigningModal from './components/DocumentSigningModal';
import DocumentViewer from './components/DocumentViewer';
import DocumentVersionsModal from './components/DocumentVersionsModal';
import DocumentTagsModal from './components/DocumentTagsModal';
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
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
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
    updateTags,
    shareDocument,
    addComment,
    toggleArchive,
    addWatermark,
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

  // Téléchargement
  const handleDownload = async (doc) => {
    if (!doc) return;
    try {
      const downloadUrl = downloadDocument(doc.id);
      window.open(downloadUrl, '_blank');
      showToast(`Téléchargement de "${doc.title}" lancé.`, 'info');
    } catch (err) {
      showToast("Impossible de télécharger le fichier.", 'error');
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
    
    // Vérifier que seul un docteur peut signer
    const isDoctor = user?.role === 'docteur' || user?.role === 'admin';
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
            setSelectedDoc(prev => ({
                ...prev, 
                title: prev.title.includes('(Signé)') ? prev.title : `${prev.title} (Signé)`, 
                isSigned: true
            }));
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

  const handleManageTags = (doc) => {
    setSelectedDoc(doc);
    setIsTagsModalOpen(true);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <Header />
      
      <main className="pt-24 max-w-[1600px] mx-auto px-6 lg:px-8 pb-12">
        
        {/* En-tête de page */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center text-primary dark:text-blue-400 border border-primary/10 dark:border-primary/20 shadow-sm"
              >
                <Icon name="FileText" size={24} />
              </motion.div>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                  Gestion Documentaire
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
                  Archivage, consultation et signature des dossiers médicaux
                </p>
              </div>
            </div>
          </div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <Button 
              variant="outline" 
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['documents'], exact: false });
                showToast('Documents actualisés', 'success');
              }}
              className="flex items-center gap-2 border-slate-200 dark:border-slate-700 hover-lift"
            >
              <Icon name="RefreshCw" size={16} className={isLoading ? "animate-spin" : ""} />
              Actualiser
            </Button>
            {selectedDocumentsForExport.length > 0 && (
              <PermissionGuard requiredPermission="audit_view">
                <Button 
                  variant="outline"
                  onClick={handleExportBulk}
                  disabled={exportBulkMutation.isPending || !hasPermission('audit_view')}
                  className="flex items-center gap-2 border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                >
                  <Icon name="Download" size={16} className={exportBulkMutation.isPending ? "animate-spin" : ""} />
                  Exporter ({selectedDocumentsForExport.length})
                </Button>
              </PermissionGuard>
            )}
            <PermissionGuard requiredPermission="document_upload">
              <Button 
                onClick={() => setIsModalOpen(true)} 
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 border-transparent hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
                disabled={!hasPermission('document_upload')}
              >
                <Icon name="Plus" size={20} />
                Nouveau Document
              </Button>
            </PermissionGuard>
          </motion.div>
        </motion.div>

        {/* Statistiques */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 w-full"
        >
          <DocumentStats stats={computedStats} />
        </motion.div>

        {/* Zone d'erreur globale */}
        <AnimatePresence>
          {documentsError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3 border border-red-100 dark:border-red-900/30"
            >
              <Icon name="AlertCircle" size={20} />
              <p>{documentsError.message || "Impossible de charger les documents."}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conteneur principal (Liste) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm min-h-[400px] border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow"
        >
          
          {/* Barre de recherche interne */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Fichiers récents ({totalDocuments})
            </h2>
            
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="Search" size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher (titre, patient)..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                maxLength={100}
                className="w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white placeholder:text-slate-400"
              />
              {searchTerm && (
                <button onClick={() => handleSearchChange('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <Icon name="X" size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Grille de documents */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 text-slate-400"
              >
                <div className="relative mb-4">
                  <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon name="RefreshCw" className="text-indigo-600 dark:text-indigo-400" size={24} />
                  </div>
                </div>
                <p className="text-sm font-medium">Chargement des documents...</p>
              </motion.div>
            ) : documents.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", bounce: 0.4 }}
                  className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-4"
                >
                  <Icon name="FileText" className="text-indigo-600 dark:text-indigo-400" size={40} />
                </motion.div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Aucun document</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                  Aucun fichier trouvé. Utilisez le bouton "Nouveau" pour en ajouter.
                </p>
                <Button 
                  onClick={() => setIsModalOpen(true)} 
                  variant="outline"
                  className="hover-lift"
                >
                  Uploader un document
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="documents-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {Array.isArray(documents) && documents.map((doc, index) => {
                  if (!doc || typeof doc !== 'object') return null;
                  const selectedArray = Array.isArray(selectedDocumentsForExport) ? selectedDocumentsForExport : [];
                  const isSelected = selectedArray.some(d => d && d.id === doc.id);
                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`h-full relative ${isSelected ? 'ring-2 ring-indigo-500 rounded-2xl' : ''}`}
                    >
                      {/* Checkbox pour sélection multiple */}
                      <div className="absolute top-2 right-2 z-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (isSelected) {
                              setSelectedDocumentsForExport(prev => {
                                const prevArray = Array.isArray(prev) ? prev : [];
                                return prevArray.filter(d => d && d.id !== doc.id);
                              });
                            } else {
                              setSelectedDocumentsForExport(prev => {
                                const prevArray = Array.isArray(prev) ? prev : [];
                                return [...prevArray, doc];
                              });
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer bg-white dark:bg-slate-800"
                        />
                      </div>
                        <DocumentCard
                          document={doc}
                        onView={(document) => openViewer(document)}
                        onDownload={(document) => handleDownload(document)}
                        onDelete={(document) => initiateDelete(document)}
                        onShare={(document) => handleShare(document)}
                        />
                    </motion.div>
                  );
                }).filter(Boolean)}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {documents.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Affichage de <span className="font-bold text-slate-900 dark:text-white">
                  {((currentPage - 1) * limit) + 1}
                </span> à{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {Math.min(currentPage * limit, totalDocuments)}
                </span>{' '}
                sur <span className="font-bold text-slate-900 dark:text-white">{totalDocuments}</span> documents
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  <Icon name="ChevronLeft" size={16} className="mr-1" />
                  Précédent
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let page;
                    if (totalPages <= 7) {
                      page = i + 1;
                    } else if (currentPage <= 4) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      page = totalPages - 6 + i;
                    } else {
                      page = currentPage - 3 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
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
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Suivant
                  <Icon name="ChevronRight" size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
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
        onManageTags={handleManageTags}
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

      {/* 5. Tags */}
      <DocumentTagsModal
        document={selectedDoc}
        isOpen={isTagsModalOpen}
        onClose={() => { setIsTagsModalOpen(false); setSelectedDoc(null); }}
      />

      {/* 6. Commentaires */}
      <DocumentCommentsPanel
        documentId={selectedDoc?.id}
        isOpen={isCommentsPanelOpen}
        onClose={() => { setIsCommentsPanelOpen(false); setSelectedDoc(null); }}
      />

      {/* 7. Partage */}
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