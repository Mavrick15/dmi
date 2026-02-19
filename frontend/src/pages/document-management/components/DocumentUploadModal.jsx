import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import AnimatedModal from '../../../components/ui/AnimatedModal';
import api from '../../../lib/axios';

const DocumentUploadModal = ({ isOpen, onClose, onUpload, isUploading }) => {
  const { hasPermission } = usePermissions();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [description, setDescription] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
      setTitle('');
      setDescription('');
      setSelectedPatientId('');
      setSelectedFile(null);
    }
  }, [isOpen]);

  const fetchPatients = async () => {
    try {
      setIsLoadingPatients(true);
      const response = await api.get('/patients', { params: { limit: 100 } });
      let dataToUse = [];
      if (response.data && Array.isArray(response.data.data)) dataToUse = response.data.data;
      else if (Array.isArray(response.data)) dataToUse = response.data;
      setPatients(dataToUse);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Erreur chargement patients:', error);
      setPatients([]);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const patientsArray = Array.isArray(patients) ? patients : [];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!title) setTitle(file.name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    if (!selectedPatientId) {
      alert('Veuillez sélectionner un patient.');
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', title);
    formData.append('category', category);
    formData.append('patientId', selectedPatientId);
    if (description) formData.append('description', description);
    onUpload(formData);
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Icon name="Upload" size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Nouveau document</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Patient, titre, fichier</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fermer"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
          {/* Patient */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-4">
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Patient concerné <span className="text-red-500">*</span>
            </p>
            <div className="relative">
              <Icon name="User" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
                disabled={isLoadingPatients}
                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white text-sm appearance-none cursor-pointer"
              >
                <option value="">Sélectionner un patient</option>
                {patientsArray.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || ''}</option>
                ))}
              </select>
              {isLoadingPatients && (
                <Icon name="Loader2" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary pointer-events-none" />
              )}
            </div>
            {!isLoadingPatients && patientsArray.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1.5">
                <Icon name="AlertCircle" size={12} /> Aucun patient dans la base.
              </p>
            )}
          </div>

          {/* Titre + Catégorie */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Titre du document</p>
              <div className="relative">
                <Icon name="FileText" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Radio Thorax..."
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Catégorie</p>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white text-sm cursor-pointer"
              >
                <option value="general">Général / Administratif</option>
                <option value="prescription">Ordonnance</option>
                <option value="lab">Laboratoire / Analyses</option>
                <option value="imaging">Imagerie (Radio, IRM)</option>
                <option value="report">Compte-rendu</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Description (optionnel)</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du document..."
              rows={3}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white text-sm resize-none"
            />
          </div>

          {/* Zone fichier */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Fichier</p>
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all group ${
                selectedFile
                  ? 'border-emerald-500 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              {selectedFile ? (
                <div className="flex flex-col items-center text-emerald-600 dark:text-emerald-400">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                    <Icon name="Check" size={24} />
                  </div>
                  <p className="font-semibold text-sm truncate max-w-[260px]">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB — Prêt à envoyer</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
                    <Icon name="Upload" size={24} />
                  </div>
                  <p className="font-medium text-sm">Cliquez pour choisir un fichier</p>
                  <p className="text-xs mt-1">PDF, JPG, PNG (max 100 Mo)</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isUploading} className="flex-1">
              Annuler
            </Button>
            <PermissionGuard requiredPermission="document_upload">
              <Button
                type="submit"
                disabled={isUploading || !selectedFile || !selectedPatientId || !hasPermission('document_upload')}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Icon name="Upload" size={18} className="mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </PermissionGuard>
          </div>
        </form>
      </div>
    </AnimatedModal>
  );
};

export default DocumentUploadModal;