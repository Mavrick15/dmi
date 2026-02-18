import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
// import Textarea from '../../../components/ui/Textarea';
import Modal from '../../../components/ui/Modal';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAnalysesMutations } from '../../../hooks/useAnalyses';
import { usePatientsList } from '../../../hooks/usePatients';
import { useDepartments } from '../../../hooks/useAdmin';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/axios';
import { ANALYSE_TEMPLATES, getAllTemplates } from './AnalyseTemplates';

const PrescribeAnalyseModal = ({ isOpen, onClose, consultationId = null, defaultPatientId = null }) => {
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const { createAnalyse } = useAnalysesMutations();
  const { data: patientsData } = usePatientsList({ limit: 100 });
  const { data: departmentsData, isLoading: isLoadingDepts } = useDepartments({});
  const [searchParams] = useSearchParams();

  // Extraire les départements
  const departments = Array.isArray(departmentsData?.data) 
    ? departmentsData.data 
    : (Array.isArray(departmentsData) ? departmentsData : []);
  const [formData, setFormData] = useState({
    patientId: defaultPatientId || '',
    consultationId: consultationId || '',
    typeAnalyse: '',
    laboratoire: '', // Maintenant utilisé pour le service/département interne
    notesPrescription: '',
    priorite: 'normale'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const patients = Array.isArray(patientsData?.data) ? patientsData.data : (Array.isArray(patientsData) ? patientsData : []);
  const templates = getAllTemplates();

  const typeAnalyseLabel = (type) => {
    const labels = {
      hematologie: 'Hématologie',
      biochimie: 'Biochimie',
      serologie: 'Sérologie',
      microbiologie: 'Microbiologie',
      imagerie: 'Imagerie',
      autre: 'Autre'
    };
    return labels[type] || type;
  };

  // Pré-remplir le patient si fourni via query params
  useEffect(() => {
    const patientIdFromUrl = searchParams.get('patientId') || defaultPatientId;
    if (patientIdFromUrl && isOpen) {
      setFormData(prev => ({ ...prev, patientId: patientIdFromUrl }));
    }
  }, [isOpen, searchParams, defaultPatientId]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      typeAnalyse: template.typeAnalyse,
      notesPrescription: template.description
    }));
    setShowTemplates(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.patientId || !formData.typeAnalyse) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createAnalyse.mutateAsync({
        ...formData,
        consultationId: formData.consultationId || null
      });
      // Forcer le refetch immédiat des données
      await queryClient.refetchQueries({ queryKey: ['analyses'], exact: false });
      await queryClient.refetchQueries({ queryKey: ['analyses', 'stats'] });
      // Réinitialiser le formulaire
      setFormData({
        patientId: defaultPatientId || '',
        consultationId: consultationId || '',
        typeAnalyse: '',
        laboratoire: '',
        notesPrescription: '',
        priorite: 'normale'
      });
      onClose();
    } catch (error) {
      // L'erreur est gérée par le hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-center">
          <Icon name="TestTube" size={20} className="text-blue-600 dark:text-blue-400" />
        </div>
        <span className="text-base font-bold text-slate-900 dark:text-white">
          Prescrire une analyse
        </span>
      </div>
    }>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Templates rapides */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name="FileText" size={16} className="text-primary" />
              </span>
              Templates rapides
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconName={showTemplates ? "ChevronUp" : "ChevronDown"}
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-xs rounded-xl"
            >
              {showTemplates ? 'Masquer' : 'Afficher'}
            </Button>
          </div>
          {showTemplates && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl max-h-48 overflow-y-auto">
              {Array.isArray(templates) && templates.length === 0 ? (
                <div className="col-span-full py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  Aucun template disponible
                </div>
              ) : (
                templates.map((template) => (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-3 text-xs text-left rounded-xl border transition-all ${
                      selectedTemplate?.name === template.name
                        ? 'bg-primary text-white border-primary border-l-4 border-l-primary'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-primary/50'
                    }`}
                  >
                    <div className="font-semibold truncate">{template.name}</div>
                    <div className={`text-xs mt-1 truncate ${
                      selectedTemplate?.name === template.name ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {typeAnalyseLabel(template.typeAnalyse)}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {selectedTemplate && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 border-l-4 border-l-primary">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon name="FileText" size={18} className="text-primary" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Template sélectionné</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  iconName="X"
                  onClick={() => setSelectedTemplate(null)}
                  className="text-slate-500 hover:text-slate-700 rounded-xl"
                  title="Désélectionner"
                />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{selectedTemplate.description}</p>
              {selectedTemplate.parametres?.length > 0 && (
                <ul className="space-y-1.5 text-xs">
                  {selectedTemplate.parametres.map((p, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span className="font-medium">{p.parametre}</span>
                      {p.unite && <span className="text-slate-500 dark:text-slate-400">({p.unite})</span>}
                      {p.valeurNormaleMin != null && p.valeurNormaleMax != null && (
                        <span className="text-slate-500 dark:text-slate-400">
                          — Normale : {p.valeurNormaleMin}–{p.valeurNormaleMax}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Patient <span className="text-rose-500">*</span>
          </label>
          <Select
            value={formData.patientId}
            onChange={(value) => setFormData({ ...formData, patientId: value })}
            required
            options={[
              { value: '', label: 'Sélectionner un patient' },
              ...(Array.isArray(patients) ? patients.map(p => ({
                value: p.id,
                label: p.name || 'Patient'
              })) : [])
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Type d'analyse <span className="text-rose-500">*</span>
          </label>
          <Select
            value={formData.typeAnalyse}
            onChange={(value) => setFormData({ ...formData, typeAnalyse: value })}
            required
            options={[
              { value: '', label: 'Sélectionner un type' },
              { value: 'hematologie', label: 'Hématologie' },
              { value: 'biochimie', label: 'Biochimie' },
              { value: 'serologie', label: 'Sérologie' },
              { value: 'microbiologie', label: 'Microbiologie' },
              { value: 'imagerie', label: 'Imagerie' },
              { value: 'autre', label: 'Autre' }
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Priorité
          </label>
          <Select
            value={formData.priorite}
            onChange={(value) => setFormData({ ...formData, priorite: value })}
            options={[
              { value: 'normale', label: 'Normale' },
              { value: 'urgente', label: 'Urgente' },
              { value: 'critique', label: 'Critique' }
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Service / Département
          </label>
          <Select
            value={formData.laboratoire}
            onChange={(value) => setFormData({ ...formData, laboratoire: value })}
            disabled={isLoadingDepts}
            placeholder={isLoadingDepts ? 'Chargement des services...' : 'Sélectionner un service (optionnel)'}
            options={[
              { value: '', label: 'Sélectionner un service (optionnel)' },
              ...(departments.length > 0 
                ? departments.map((dept) => ({
                    value: dept.nom || dept.name,
                    label: dept.nom || dept.name
                  }))
                : []
              )
            ]}
          />
          {!isLoadingDepts && departments.length === 0 && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Aucun département disponible. Les analyses seront envoyées au laboratoire par défaut.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notesPrescription}
            onChange={(e) => setFormData({ ...formData, notesPrescription: e.target.value })}
            placeholder="Notes additionnelles (optionnel)"
            rows={3}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <PermissionGuard requiredPermission="analyses_create">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !formData.patientId || !formData.typeAnalyse || !hasPermission('analyses_create')}
              iconName={isSubmitting ? null : "Check"}
            >
              {isSubmitting ? (
                <>
                  <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                  Enregistrement…
                </>
              ) : (
                'Prescrire'
              )}
            </Button>
          </PermissionGuard>
        </div>
      </form>
    </Modal>
  );
};

export default PrescribeAnalyseModal;

