import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, Check, Loader2, User, AlertCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import AnimatedModal from '../../../components/ui/AnimatedModal';
import api from '../../../lib/axios'; 

const DocumentUploadModal = ({ isOpen, onClose, onUpload, isUploading }) => {
  const { hasPermission } = usePermissions();
  // --- ÉTATS DU FORMULAIRE ---
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [addWatermark, setAddWatermark] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // --- ÉTATS POUR LA LISTE DES PATIENTS ---
  const [patients, setPatients] = useState([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false); 

  const fileInputRef = useRef(null);

  // 1. Charger les patients quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      fetchPatients();
      // Reset des champs
      setTitle('');
      setDescription('');
      setTags([]);
      setNewTag('');
      setAddWatermark(false);
      setSelectedPatientId('');
      setSelectedFile(null);
    }
  }, [isOpen]);

  // 2. Fonction de récupération
  const fetchPatients = async () => {
    try {
      setIsLoadingPatients(true);
      
      // On demande une limite élevée pour avoir un bon choix dans la liste
      const response = await api.get('/patients', {
        params: { limit: 100 } 
      });

      // Gestion robuste de la structure de réponse
      let dataToUse = [];
      if (response.data && Array.isArray(response.data.data)) {
        dataToUse = response.data.data; // Cas standard pagination Adonis
      } else if (Array.isArray(response.data)) {
        dataToUse = response.data; // Cas tableau simple
      }

      setPatients(dataToUse);

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur lors du chargement des patients:", error);
      }
      setPatients([]);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  // 3. Liste des patients
  const patientsArray = Array.isArray(patients) ? patients : [];

  // 4. Gestion du fichier
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
      alert("Erreur : Veuillez sélectionner un patient dans la liste.");
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', title);
    formData.append('category', category);
    formData.append('patientId', selectedPatientId);
    if (description) formData.append('description', description);
    if (tags.length > 0) formData.append('tags', JSON.stringify(tags));
    if (addWatermark) formData.append('addWatermark', 'true');
    
    onUpload(formData);
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* --- EN-TÊTE --- */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Upload size={20} />
            </div>
            Nouveau Document
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* --- FORMULAIRE (Scrollable) --- */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          
          {/* SÉLECTION PATIENT */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Patient concerné <span className="text-rose-500">*</span>
            </label>
            
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              {/* Liste Déroulante */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  disabled={isLoadingPatients}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white appearance-none cursor-pointer text-sm font-medium"
                >
                  <option value="">-- Sélectionner un patient --</option>
                  
                  {Array.isArray(patientsArray) && patientsArray.map(patient => {
                    if (!patient || typeof patient !== 'object') return null;
                    return (
                      <option key={patient.id || Math.random()} value={patient.id}>
                        {patient.name || ''}
                      </option>
                    );
                  }).filter(Boolean)}
                  
                </select>
                
                {isLoadingPatients && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="animate-spin text-indigo-500" size={16} />
                  </div>
                )}
              </div>
              
              {/* Message si vide */}
              {!isLoadingPatients && patientsArray.length === 0 && (
                <p className="text-xs text-amber-500 pl-1 font-medium flex items-center gap-1 mt-2">
                  <AlertCircle size={12} />
                  Aucun patient dans la base.
                </p>
              )}
            </div>
          </div>

          {/* TITRE ET CATÉGORIE EN PARALLÈLE */}
          <div className="grid grid-cols-2 gap-4">
            {/* TITRE DOCUMENT */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Titre du document</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Radio Thorax..." 
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>

            {/* CATÉGORIE */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Catégorie</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white cursor-pointer text-sm"
              >
                <option value="general">Général / Administratif</option>
                <option value="prescription">Ordonnance</option>
                <option value="lab">Laboratoire / Analyses</option>
                <option value="imaging">Imagerie (Radio, IRM)</option>
                <option value="report">Compte-rendu</option>
              </select>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description (optionnel)</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description détaillée du document..."
              rows={3}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white text-sm resize-none"
            />
          </div>

          {/* TAGS */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tags (optionnel)</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newTag.trim() && !tags.includes(newTag.trim())) {
                      e.preventDefault();
                      setTags([...tags, newTag.trim()]);
                      setNewTag('');
                    }
                  }}
                  placeholder="Ajouter un tag (Entrée pour valider)"
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newTag.trim() && !tags.includes(newTag.trim())) {
                      setTags([...tags, newTag.trim()]);
                      setNewTag('');
                    }
                  }}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  Ajouter
                </button>
              </div>
              {Array.isArray(tags) && tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, idx) => {
                    if (!tag || typeof tag !== 'string') return null;
                    return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          const tagsArray = Array.isArray(tags) ? tags : [];
                          setTags(tagsArray.filter((_, i) => i !== idx));
                        }}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                    );
                  }).filter(Boolean)}
                </div>
              )}
            </div>
          </div>

          {/* WATERMARK (PDF uniquement) */}
          {selectedFile && selectedFile.type === 'application/pdf' && (
            <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                id="watermark"
                checked={addWatermark}
                onChange={(e) => setAddWatermark(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="watermark" className="flex-1 cursor-pointer">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Ajouter un watermark (nom patient + date)
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Le document sera marqué avec les informations du patient
                </p>
              </label>
            </div>
          )}

          {/* ZONE FICHIER - EN DESSOUS, SEULE */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Fichier</label>
            <div 
              onClick={() => fileInputRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all group ${
                selectedFile 
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' 
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
              />
              
              {selectedFile ? (
                <div className="flex flex-col items-center text-emerald-600 dark:text-emerald-400">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-2">
                     <Check size={24} />
                  </div>
                  <p className="font-bold text-sm truncate max-w-[250px]">{selectedFile.name}</p>
                  <p className="text-xs opacity-70 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB — Prêt à envoyer</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                     <Upload size={24} />
                  </div>
                  <p className="font-medium text-sm">Cliquez pour choisir un fichier</p>
                  <p className="text-xs opacity-60 mt-1">PDF, JPG, PNG (Max 100MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* BOUTONS ACTIONS */}
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Annuler
            </button>
            <PermissionGuard requiredPermission="document_upload">
              <button 
                type="submit" 
                disabled={isUploading || !selectedFile || !selectedPatientId || !hasPermission('document_upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 ${
                  isUploading || !selectedFile || !selectedPatientId || !hasPermission('document_upload')
                    ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-0.5'
                }`}
              >
                {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                {isUploading ? 'Envoi en cours...' : 'Enregistrer'}
              </button>
            </PermissionGuard>
          </div>

        </form>
      </div>
    </AnimatedModal>
  );
};

export default DocumentUploadModal;