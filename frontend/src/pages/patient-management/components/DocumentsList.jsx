import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import api from '../../../lib/axios';
import { useToast } from '../../../contexts/ToastContext';
import { usePatientDocuments, useDocumentMutations } from '../../../hooks/useDocuments';
import { Loader2, Upload, FileText, Download, Eye, Trash2 } from 'lucide-react';

const DocumentsList = ({ patient }) => {
  const { hasPermission } = usePermissions();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    category: 'medical',
    description: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const documentsPerPage = 9;
  
  const { showToast } = useToast();
  const { uploadDocument, deleteDocument } = useDocumentMutations();

  // Fetch documents
  const { data: documentsData, isLoading: loadingDocuments, refetch } = usePatientDocuments(patient?.id);

  const allDocuments = documentsData || [];
  
  // Pagination
  const totalPages = Math.ceil(allDocuments.length / documentsPerPage);
  const startIndex = (currentPage - 1) * documentsPerPage;
  const endIndex = startIndex + documentsPerPage;
  const documents = allDocuments.slice(startIndex, endIndex);
  
  // Reset to page 1 when patient changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [patient?.id]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      if (!uploadData.title) {
        setUploadData({ ...uploadData, title: file.name });
      }
    }
  };

  const handleUpload = async () => {
    if (!patient?.id) {
      showToast('Veuillez sélectionner un patient', 'error');
      return;
    }

    if (!uploadFile) {
      showToast('Veuillez sélectionner un fichier', 'error');
      return;
    }

    if (!uploadData.title) {
      showToast('Veuillez saisir un titre', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('patientId', patient.id);
    formData.append('title', uploadData.title);
    formData.append('category', uploadData.category);
    formData.append('description', uploadData.description || '');

    try {
      await uploadDocument.mutateAsync(formData);
      // Le toast et l'invalidation sont gérés par le hook uploadDocument
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadData({
        title: '',
        category: 'medical',
        description: '',
      });
      // Pas besoin de refetch(), React Query invalide automatiquement les queries
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur upload document:', error);
      }
    }
  };

  const handleDelete = async (documentId, documentTitle) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${documentTitle}" ?`)) {
      try {
        await deleteDocument.mutateAsync(documentId);
        // Le toast et l'invalidation sont gérés par le hook deleteDocument
        // Pas besoin de refetch(), React Query invalide automatiquement les queries
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur suppression document:', error);
        }
      }
    }
  };

  const handlePreview = (documentId) => {
    const previewUrl = `/api/v1/documents/${documentId}/preview`;
    window.open(previewUrl, '_blank');
  };

  const handleDownload = (documentId, fileName) => {
    const downloadUrl = `/api/v1/documents/${documentId}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'medical':
        return 'primary';
      case 'prescription':
        return 'success';
      case 'lab':
        return 'info';
      case 'imaging':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'FileText';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'Image';
      case 'doc':
      case 'docx':
        return 'File';
      default:
        return 'File';
    }
  };

  if (loadingDocuments) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Icon name="Folder" size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Documents</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Gestion des documents médicaux</p>
          </div>
        </div>
        <PermissionGuard requiredPermission="document_upload">
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            iconName="Upload"
            disabled={!patient}
            size="sm"
            className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/20"
          >
            Uploader
          </Button>
        </PermissionGuard>
      </div>

      {/* Content */}
      <div className="w-full">
        {documents.length === 0 ? (
          <EmptyState
            icon="FolderX"
            title="Aucun document"
            description="Aucun document enregistré pour ce patient."
            action={null}
            actionLabel=""
          />
        ) : (
          <>
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {Array.isArray(documents) && documents.map((document, idx) => (
              <motion.div
                key={document.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/10 transition-all overflow-hidden"
              >
                {/* Gradient overlay au hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/3 group-hover:to-primary/0 transition-all duration-500 pointer-events-none rounded-2xl" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-14 h-14 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20"
                      >
                        <Icon name={getFileIcon(document.originalName || document.title)} size={28} className="text-white" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xl text-slate-900 dark:text-white mb-2 truncate group-hover:text-primary transition-colors">
                          {document.title || document.originalName}
                        </h4>
                        <div className="flex items-center gap-3 flex-wrap mb-3">
                          <Badge variant={getCategoryColor(document.category)} size="sm" className="shadow-sm">
                            <Icon name="Folder" size={12} className="mr-1" />
                            {document.category || 'medical'}
                          </Badge>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Icon name="Calendar" size={12} />
                            {formatDate(document.createdAt)}
                          </div>
                          {document.uploader?.nomComplet && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <Icon name="User" size={12} />
                              {document.uploader.nomComplet}
                            </div>
                          )}
                          {document.fileSize && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <Icon name="Database" size={12} />
                              {(document.fileSize / 1024).toFixed(2)} KB
                            </div>
                          )}
                        </div>
                        {document.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                            {document.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {document.previewUrl && (
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(document.id)}
                            title="Prévisualiser"
                            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            <Eye size={18} />
                          </Button>
                        </motion.div>
                      )}
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(document.id, document.originalName || document.title)}
                          title="Télécharger"
                          className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          <Download size={18} />
                        </Button>
                      </motion.div>
                      <PermissionGuard requiredPermission="document_delete">
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(document.id, document.title || document.originalName)}
                            disabled={!hasPermission('document_delete')}
                            className="hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 hover:text-rose-700"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </Button>
                        </motion.div>
                      </PermissionGuard>
                    </div>
                  </div>
                </div>
              </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {allDocuments.length > documentsPerPage && (
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Affichage de <span className="font-bold text-slate-900 dark:text-white">{startIndex + 1}</span> à{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {Math.min(endIndex, allDocuments.length)}
                  </span>{' '}
                  sur <span className="font-bold text-slate-900 dark:text-white">{allDocuments.length}</span> documents
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <Icon name="ChevronLeft" size={16} className="mr-1" />
                    Précédent
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          currentPage === page
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                    <Icon name="ChevronRight" size={16} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Uploader un Document"
        icon="Upload"
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleUpload}
              loading={uploadDocument.isPending}
              disabled={!uploadFile || !uploadData.title}
            >
              Uploader
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon name="Upload" size={18} className="text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Fichier à uploader</span>
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-2xl p-8 text-center hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all cursor-pointer group overflow-hidden bg-white dark:bg-slate-900"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:to-primary/5 transition-all duration-300 rounded-2xl" />
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <label htmlFor="file-upload" className="cursor-pointer relative z-10">
                <motion.div
                  animate={uploadFile ? { scale: [1, 1.1, 1] } : {}}
                  className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20"
                >
                  <Upload size={28} className="text-white" />
                </motion.div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {uploadFile ? (
                    <span className="text-primary flex items-center justify-center gap-2">
                      <Icon name="FileCheck" size={16} />
                      {uploadFile.name}
                    </span>
                  ) : (
                    'Cliquez pour sélectionner un fichier'
                  )}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                  PDF, Images, Documents (Max 10MB)
                </p>
              </label>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800"
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon name="FileText" size={18} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Informations du document</span>
            </div>
            <div className="space-y-4">
              <Input
                label="Titre *"
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                placeholder="Nom du document"
                className="bg-white dark:bg-slate-900"
              />
              <div className="w-full">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Catégorie
                </label>
                <select
                  value={uploadData.category}
                  onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                >
                  <option value="medical">Médical</option>
                  <option value="prescription">Prescription</option>
                  <option value="lab">Laboratoire</option>
                  <option value="imaging">Imagerie</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div className="w-full">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  placeholder="Description optionnelle..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-sm"
                  rows={3}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentsList;

