import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { usePatientDocuments, useDocumentMutations } from '../../../hooks/useDocuments';
import api from '../../../lib/axios';
import { Loader2 } from 'lucide-react';

const DocumentsList = ({ patient }) => {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const isInfirmier = user?.role === 'infirmiere';

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    category: 'medical',
    description: '',
  });
  const [doctors, setDoctors] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
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

  useEffect(() => {
    if (isUploadModalOpen && isInfirmier) {
      const fetchDoctors = async () => {
        try {
          setIsLoadingDoctors(true);
          const response = await api.get('/users/doctors');
          const raw = response.data?.data ?? response.data;
          const list = Array.isArray(raw) ? raw : [];
          setDoctors(list.map((d) => ({ value: d.id, label: d.nomComplet || d.name || 'Médecin' })));
        } catch (err) {
          if (process.env.NODE_ENV === 'development') console.error('Erreur chargement médecins:', err);
          setDoctors([]);
        } finally {
          setIsLoadingDoctors(false);
        }
      };
      fetchDoctors();
      setSelectedDoctorId('');
    }
  }, [isUploadModalOpen, isInfirmier]);

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

    if (isInfirmier && !selectedDoctorId) {
      showToast('En tant qu\'infirmier(ère), vous devez choisir le médecin auquel ce document sera attribué.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('patientId', patient.id);
    formData.append('title', uploadData.title);
    formData.append('category', uploadData.category);
    formData.append('description', uploadData.description || '');
    if (isInfirmier && selectedDoctorId) formData.append('attributedToUserId', selectedDoctorId);

    try {
      await uploadDocument.mutateAsync(formData);
      // Le toast et l'invalidation sont gérés par le hook uploadDocument
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setSelectedDoctorId('');
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
      case 'medical': return 'primary';
      case 'prescription': return 'success';
      case 'lab': return 'info';
      case 'imaging': return 'warning';
      default: return 'default';
    }
  };

  const getCategoryLabel = (category) => {
    const map = { medical: 'Médical', prescription: 'Prescription', lab: 'Laboratoire', imaging: 'Imagerie', other: 'Autre' };
    return map[category] || category || 'Médical';
  };

  const getCategoryAccent = (category) => {
    switch (category) {
      case 'medical': return 'bg-primary';
      case 'prescription': return 'bg-emerald-500';
      case 'lab': return 'bg-blue-500';
      case 'imaging': return 'bg-amber-500';
      default: return 'bg-slate-400 dark:bg-slate-500';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
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
      <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={36} />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement des documents...</p>
      </div>
    );
  }

  const totalCount = allDocuments.length;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Icon name="Folder" size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Documents</h3>
              {totalCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/15 dark:bg-primary/25 text-primary">
                  {totalCount} {totalCount === 1 ? 'fichier' : 'fichiers'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Documents médicaux du patient</p>
          </div>
        </div>
        <PermissionGuard requiredPermission="document_upload">
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            iconName="Upload"
            disabled={!patient}
            size="sm"
            className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
          >
            Uploader
          </Button>
        </PermissionGuard>
      </div>

      {/* Content */}
      <div className="w-full">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700 shadow-sm">
              <Icon name="FolderX" size={28} className="text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Aucun document</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5">
              Aucun document enregistré pour ce patient. Uploadez un fichier pour commencer.
            </p>
            <PermissionGuard requiredPermission="document_upload">
              {patient && (
                <Button
                  onClick={() => setIsUploadModalOpen(true)}
                  variant="outline"
                  size="sm"
                  disabled={!hasPermission('document_upload')}
                  iconName="Upload"
                  className="rounded-xl"
                >
                  Uploader un document
                </Button>
              )}
            </PermissionGuard>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <AnimatePresence mode="wait">
                {Array.isArray(documents) && documents.map((document, idx) => (
                  <motion.div
                    key={document.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.25 }}
                    className="group relative flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                  >
                    {/* Barre d'accent par catégorie */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 shrink-0 ${getCategoryAccent(document.category)}`} />

                    <div className="flex-1 min-w-0 pl-4 pr-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      {/* Icône + titre */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="shrink-0 w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
                          <Icon name={getFileIcon(document.originalName || document.title)} size={20} className="text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                            {document.title || document.originalName}
                          </h4>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <Badge variant={getCategoryColor(document.category)} size="sm" className="text-xs">
                              {getCategoryLabel(document.category)}
                            </Badge>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              <Icon name="Calendar" size={10} className="inline mr-0.5" />
                              {formatDate(document.createdAt)}
                            </span>
                            {(document.fileSize || document.size) && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {formatFileSize(document.fileSize || document.size)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {document.previewUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(document.id)}
                            title="Prévisualiser"
                            className="rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          >
                            <Icon name="Eye" size={18} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(document.id, document.originalName || document.title)}
                          title="Télécharger"
                          className="rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                        >
                          <Icon name="Download" size={18} />
                        </Button>
                        <PermissionGuard requiredPermission="document_delete">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(document.id, document.title || document.originalName)}
                            disabled={!hasPermission('document_delete')}
                            title="Supprimer"
                            className="rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                          >
                            <Icon name="Trash2" size={18} />
                          </Button>
                        </PermissionGuard>
                      </div>
                    </div>

                    {document.description && (
                      <div className="px-4 pb-4 pt-0">
                        <div className="pl-14 sm:pl-[4.5rem] py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{document.description}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {allDocuments.length > documentsPerPage && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400 order-2 sm:order-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{startIndex + 1}</span>
                  {' – '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.min(endIndex, allDocuments.length)}</span>
                  {' sur '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{allDocuments.length}</span>
                  {' documents'}
                </p>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-xl"
                  >
                    <Icon name="ChevronLeft" size={16} className="mr-1" />
                    Précédent
                  </Button>
                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[2.25rem] px-2 py-1.5 rounded-xl text-sm font-medium transition-all ${
                          currentPage === page
                            ? 'bg-primary text-white shadow-md'
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
                    className="rounded-xl"
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
              disabled={!uploadFile || !uploadData.title || (isInfirmier && !selectedDoctorId)}
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
                  <Icon name="Upload" size={28} className="text-white" />
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

          {isInfirmier && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Stethoscope" size={18} className="text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">Document attribué au médecin <span className="text-red-500">*</span></span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                En tant qu&apos;infirmier(ère), le document sera enregistré au nom du médecin choisi.
              </p>
              <div className="relative">
                <Icon name="User" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  required={isInfirmier}
                  disabled={isLoadingDoctors}
                  className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white text-sm appearance-none cursor-pointer"
                >
                  <option value="">Choisir un médecin</option>
                  {doctors.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                {isLoadingDoctors && (
                  <Icon name="Loader2" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary pointer-events-none" />
                )}
              </div>
            </motion.div>
          )}

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

