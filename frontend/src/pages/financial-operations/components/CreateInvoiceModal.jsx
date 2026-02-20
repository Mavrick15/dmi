import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { useToast } from '../../../contexts/ToastContext';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { usePatientsList } from '../../../hooks/usePatients';
import { useAnalysesByPatient } from '../../../hooks/useAnalyses';
import { useQuery } from '@tanstack/react-query';
import { useFinanceMutations } from '../../../hooks/useFinance';
import api from '../../../lib/axios';
import {
  addDaysToBusinessDateKey,
  formatDateInBusinessTimezone,
  formatLongDateInBusinessTimezone,
  getTodayInBusinessTimezone,
} from '../../../utils/dateTime';

const CreateInvoiceModal = ({ isOpen, onClose }) => {
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();
  const { formatCurrency } = useCurrency();
  const { createInvoice } = useFinanceMutations();
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    typeFacture: '', // consultation | examen | traitement | autre
    consultationId: '',
    analyseIds: [],
    montantTotal: '',
    montantPaye: '0',
    statut: 'en_attente',
    dateEmission: getTodayInBusinessTimezone(),
    dateEcheance: '',
    notes: ''
  });

  // Récupérer la liste des patients
  const { data: patientsData, isLoading: loadingPatients } = usePatientsList({ limit: 100 });
  const patients = patientsData?.data || [];

  // Récupérer les consultations du patient sélectionné
  const { data: consultationsData, isLoading: loadingConsultations } = useQuery({
    queryKey: ['consultations', formData.patientId],
    queryFn: async () => {
      if (!formData.patientId) return [];
      try {
        const response = await api.get('/consultations', {
          params: { patientId: formData.patientId, limit: 100 }
        });
        // Le backend retourne { success: true, data: [...], meta: {...} }
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
        // Fallback si la structure est différente
        return Array.isArray(response.data.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur lors de la récupération des consultations:', error);
        }
        showToast('Erreur lors du chargement des consultations', 'error');
        return [];
      }
    },
    enabled: !!formData.patientId,
    retry: 1
  });

  const consultations = Array.isArray(consultationsData) ? consultationsData : [];

  // Récupérer les analyses du patient sélectionné
  const { data: analysesData } = useAnalysesByPatient(formData.patientId);
  const analyses = analysesData?.data || analysesData || [];
  const analysesAFacturer = Array.isArray(analyses) ? analyses.filter(a => a && a.statut === 'terminee' && !a.factureId) : [];

  // Réinitialiser consultationId quand le patient change
  const handlePatientChange = (patientId) => {
    setFormData(prev => ({ ...prev, patientId, consultationId: '', analyseIds: [], montantTotal: '' }));
  };

  const handleAnalyseToggle = (analyseId) => {
    setFormData(prev => {
      const currentIds = Array.isArray(prev.analyseIds) ? prev.analyseIds : [];
      const newAnalyseIds = currentIds.includes(analyseId)
        ? currentIds.filter(id => id !== analyseId)
        : [...currentIds, analyseId];
      
      // Calculer le montant total basé sur les analyses sélectionnées (si montant disponible)
      // Pour l'instant, on garde le montant manuel
      
      return {
        ...prev,
        analyseIds: newAnalyseIds
      };
    });
  };

  // Handler pour la sélection d'une consultation
  const handleConsultationChange = (consultationId) => {
    if (consultationId) {
      const consultation = Array.isArray(consultations) ? consultations.find(c => c && c.id === consultationId) : null;
      // Optionnel : pré-remplir le montant si disponible dans la consultation
      // Pour l'instant, on garde juste la sélection
    }
    handleChange('consultationId', consultationId);
  };

  const handlePreview = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.patientId) {
      showToast('Veuillez sélectionner un patient', 'error');
      return;
    }
    if (!formData.montantTotal || parseFloat(formData.montantTotal) <= 0) {
      showToast('Le montant total doit être supérieur à 0', 'error');
      return;
    }
    if (!formData.dateEmission) {
      showToast('La date d\'émission est requise', 'error');
      return;
    }

    setShowPreview(true);
  };

  const handleConfirmCreate = () => {
    // Calculer la date d'échéance si non fournie (30 jours par défaut)
    const dateEcheance = formData.dateEcheance || 
      addDaysToBusinessDateKey(formData.dateEmission, 30);

    // Libellé type pour les notes (affichage liste / PDF)
    const typeLabels = { consultation: 'Consultation', examen: 'Examen(s)', traitement: 'Traitement', autre: 'Autre' };
    const typePrefix = formData.typeFacture && typeLabels[formData.typeFacture]
      ? `[${typeLabels[formData.typeFacture]}] `
      : '';
    const notesFinal = formData.notes ? `${typePrefix}${formData.notes}` : (typePrefix || null);

    const invoiceData = {
      patientId: formData.patientId,
      consultationId: formData.consultationId || null,
      analyseIds: formData.analyseIds && formData.analyseIds.length > 0 ? formData.analyseIds : null,
      montantTotal: parseFloat(formData.montantTotal),
      montantPaye: parseFloat(formData.montantPaye) || 0,
      statut: formData.statut,
      dateEmission: formData.dateEmission,
      dateEcheance: dateEcheance,
      notes: notesFinal || null
    };

    createInvoice.mutate(invoiceData, {
      onSuccess: () => {
        setShowPreview(false);
        onClose();
        // Réinitialiser le formulaire
        setFormData({
          patientId: '',
          typeFacture: '',
          consultationId: '',
          analyseIds: [],
          montantTotal: '',
          montantPaye: '0',
          statut: 'en_attente',
          dateEmission: getTodayInBusinessTimezone(),
          dateEcheance: '',
          notes: ''
        });
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handlePreview(e);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Si le montant payé est égal au montant total, mettre le statut à "payee"
    if (field === 'montantPaye' || field === 'montantTotal') {
      const montantTotal = field === 'montantTotal' ? parseFloat(value) : parseFloat(formData.montantTotal);
      const montantPaye = field === 'montantPaye' ? parseFloat(value) : parseFloat(formData.montantPaye);
      
      if (montantTotal > 0 && montantPaye >= montantTotal) {
        setFormData(prev => ({ ...prev, statut: 'payee' }));
      } else if (montantTotal > 0 && montantPaye < montantTotal && formData.statut === 'payee') {
        setFormData(prev => ({ ...prev, statut: 'en_attente' }));
      }
    }
  };

  const patientOptions = Array.isArray(patients) ? patients.map(p => {
    if (!p || typeof p !== 'object') return null;
    return {
      value: p.id,
      label: p.name || p.user?.nomComplet || 'Patient sans nom'
    };
  }).filter(Boolean) : [];

  const statusOptions = [
    { value: 'en_attente', label: 'En attente' },
    { value: 'payee', label: 'Payée' },
    { value: 'en_retard', label: 'En retard' },
    { value: 'annulee', label: 'Annulée' }
  ];

  const resteAPayer = parseFloat(formData.montantTotal) - (parseFloat(formData.montantPaye) || 0);

  // Données pour l'aperçu
  const selectedPatient = Array.isArray(patients) ? patients.find(p => p && p.id === formData.patientId) : null;
  const selectedConsultation = Array.isArray(consultations) ? consultations.find(c => c && c.id === formData.consultationId) : null;
  const dateEcheance = formData.dateEcheance || 
    (formData.dateEmission ? addDaysToBusinessDateKey(formData.dateEmission, 30) : '');

  const getStatusLabel = (status) => {
    switch (status) {
      case 'en_attente': return 'En attente';
      case 'payee': return 'Payée';
      case 'en_retard': return 'En retard';
      case 'annulee': return 'Annulée';
      default: return status;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer une nouvelle facture"
      icon="FileText"
      size="lg"
      footer={
        <div className="flex gap-3">
          {showPreview ? (
            <>
              <Button variant="outline" onClick={() => setShowPreview(false)} disabled={createInvoice.isPending}>
                <Icon name="ArrowLeft" size={16} className="mr-2" />
                Retour
              </Button>
              <PermissionGuard requiredPermission="billing_create">
                <Button
                  onClick={handleConfirmCreate}
                  loading={createInvoice.isPending}
                  disabled={!hasPermission('billing_create')}
                >
                  <Icon name="Check" size={16} className="mr-2" />
                  Confirmer et créer
                </Button>
              </PermissionGuard>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={createInvoice.isPending}>
                Annuler
              </Button>
              <PermissionGuard requiredPermission="billing_create">
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.patientId || !formData.montantTotal || !hasPermission('billing_create')}
                >
                  <Icon name="Eye" size={16} className="mr-2" />
                  Aperçu
                </Button>
              </PermissionGuard>
            </>
          )}
        </div>
      }
    >
      {showPreview ? (
        <div className="space-y-6">
          <div className="bg-primary/10 dark:bg-primary/20 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
                <Icon name="FileText" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Aperçu de la facture</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Vérifiez les informations avant de créer</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-6">
            {/* Informations patient */}
            <div>
              <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Patient</h4>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedPatient?.name || selectedPatient?.user?.nomComplet || 'Patient non sélectionné'}
                </p>
                {selectedPatient?.numeroPatient && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    N° Patient: {selectedPatient.numeroPatient}
                  </p>
                )}
              </div>
            </div>

            {/* Consultation */}
            {selectedConsultation && (
              <div>
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Consultation liée</h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {selectedConsultation.dateConsultation
                      ? formatLongDateInBusinessTimezone(selectedConsultation.dateConsultation)
                      : 'Date inconnue'}
                  </p>
                  {selectedConsultation.diagnosticPrincipal && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Diagnostic: {selectedConsultation.diagnosticPrincipal}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Montants */}
            <div>
              <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Montants</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Montant total</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(parseFloat(formData.montantTotal || 0))}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Montant payé</span>
                  <span className="text-lg font-bold text-emerald-600">{formatCurrency(parseFloat(formData.montantPaye || 0))}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                  <span className="text-base font-bold text-slate-700 dark:text-slate-300">Reste à payer</span>
                  <span className={`text-xl font-bold ${resteAPayer > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {formatCurrency(resteAPayer)}
                  </span>
                </div>
              </div>
            </div>

            {/* Dates et statut */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Date d'émission</h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {formData.dateEmission
                      ? formatLongDateInBusinessTimezone(formData.dateEmission)
                      : 'Non définie'}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Date d'échéance</h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {dateEcheance ? formatLongDateInBusinessTimezone(dateEcheance) : 'Non définie'}
                  </p>
                </div>
              </div>
            </div>

            {/* Statut */}
            <div>
              <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Statut</h4>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold ${
                  formData.statut === 'payee' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  formData.statut === 'en_attente' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  formData.statut === 'en_retard' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {getStatusLabel(formData.statut)}
                </span>
              </div>
            </div>

            {/* Notes */}
            {formData.notes && (
              <div>
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Notes</h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{formData.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Patient <span className="text-red-500">*</span>
          </label>
          {loadingPatients ? (
            <div className="flex items-center justify-center py-4">
              <Icon name="Loader2" size={20} className="animate-spin text-primary" />
            </div>
          ) : (
            <Select
              value={formData.patientId}
              onChange={(value) => handlePatientChange(value)}
              options={[
                { value: '', label: 'Sélectionner un patient' },
                ...patientOptions
              ]}
              buttonClassName="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          )}
        </div>

        {/* Type de facture */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Type de facture
          </label>
          <Select
            value={formData.typeFacture}
            onChange={(value) => handleChange('typeFacture', value)}
            options={[
              { value: '', label: 'Choisir le type' },
              { value: 'consultation', label: 'Consultation' },
              { value: 'examen', label: 'Examen(s)' },
              { value: 'traitement', label: 'Traitement' },
              { value: 'autre', label: 'Autre' }
            ]}
            buttonClassName="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        {/* Consultation (optionnel) */}
        {formData.patientId && (
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Consultation liée (optionnel)
              {consultations.length > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                  ({consultations.length} consultation{consultations.length > 1 ? 's' : ''} disponible{consultations.length > 1 ? 's' : ''})
                </span>
              )}
            </label>
            {loadingConsultations ? (
              <div className="flex items-center justify-center py-4">
                <Icon name="Loader2" size={20} className="animate-spin text-primary" />
                <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Chargement des consultations...</span>
              </div>
            ) : consultations.length === 0 ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Icon name="Info" size={16} className="text-amber-600 dark:text-amber-400" />
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    Aucune consultation trouvée pour ce patient. Vous pouvez créer la facture sans lier de consultation.
                  </p>
                </div>
              </div>
            ) : (
              <Select
                value={formData.consultationId}
                onChange={handleConsultationChange}
                options={[
                  { value: '', label: 'Aucune consultation' },
                  ...(Array.isArray(consultations) ? consultations
                    .sort((a, b) => {
                      // Trier par date décroissante (plus récentes en premier)
                      const dateA = a && a.dateConsultation ? new Date(a.dateConsultation).getTime() : 0;
                      const dateB = b && b.dateConsultation ? new Date(b.dateConsultation).getTime() : 0;
                      return dateB - dateA;
                    })
                    .map(c => {
                      if (!c || typeof c !== 'object') return null;
                      const dateStr = c.dateConsultation 
                        ? formatDateInBusinessTimezone(c.dateConsultation)
                        : 'Date inconnue';
                      
                      const diagnostic = c.diagnosticPrincipal || c.consultationData?.diagnosticPrincipal || 'Consultation';
                      const medecin = c.medecin?.nomComplet || c.medecin?.name || '';
                      
                      // Créer un label plus informatif
                      let label = `${dateStr} - ${diagnostic}`;
                      if (medecin) {
                        label += ` (${medecin})`;
                      }
                      
                      return {
                        value: c.id,
                        label: label
                      };
                    }).filter(Boolean) : [])
                ]}
                buttonClassName="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            )}

            {/* Analyses à facturer */}
            {formData.patientId && analysesAFacturer && analysesAFacturer.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Analyses à facturer (optionnel)
                  <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                    ({analysesAFacturer.length} analyse{analysesAFacturer.length > 1 ? 's' : ''} disponible{analysesAFacturer.length > 1 ? 's' : ''})
                  </span>
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {Array.isArray(analysesAFacturer) && analysesAFacturer.map((analyse) => {
                    if (!analyse || typeof analyse !== 'object') return null;
                    const currentIds = Array.isArray(formData.analyseIds) ? formData.analyseIds : [];
                    const isSelected = currentIds.includes(analyse.id);
                    return (
                      <div
                        key={analyse.id || Math.random()}
                        onClick={() => handleAnalyseToggle(analyse.id)}
                        className={`p-3 border rounded-xl cursor-pointer text-sm transition-all ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-500 dark:text-indigo-300 ring-1 ring-indigo-500'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon name="TestTube" size={16} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
                            <div>
                              <p className="font-semibold">{analyse.numeroAnalyse}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {analyse.typeAnalyse?.replace('_', ' ').toUpperCase()}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <Icon name="Check" size={16} className="text-indigo-600" />
                          )}
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
                {formData.analyseIds && formData.analyseIds.length > 0 && (
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {formData.analyseIds.length} analyse{formData.analyseIds.length > 1 ? 's' : ''} sélectionnée{formData.analyseIds.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}
            
            {/* Afficher les détails de la consultation sélectionnée */}
            {formData.consultationId && selectedConsultation && (
              <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Icon name="Stethoscope" size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">
                      Consultation sélectionnée
                    </h5>
                    <div className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
                      {selectedConsultation.dateConsultation && (
                        <div className="flex items-center gap-2">
                          <Icon name="Calendar" size={14} />
                          <span>
                            {formatLongDateInBusinessTimezone(selectedConsultation.dateConsultation)}
                          </span>
                        </div>
                      )}
                      {selectedConsultation.diagnosticPrincipal && (
                        <div className="flex items-center gap-2">
                          <Icon name="FileText" size={14} />
                          <span><strong>Diagnostic:</strong> {selectedConsultation.diagnosticPrincipal}</span>
                        </div>
                      )}
                      {selectedConsultation.medecin?.nomComplet && (
                        <div className="flex items-center gap-2">
                          <Icon name="User" size={14} />
                          <span><strong>Médecin:</strong> {selectedConsultation.medecin.nomComplet}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Montants */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Montant Total (€) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.montantTotal}
              onChange={(e) => handleChange('montantTotal', e.target.value)}
              placeholder="0.00"
              iconName="DollarSign"
              buttonClassName="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Montant Payé (€)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.montantPaye}
              onChange={(e) => handleChange('montantPaye', e.target.value)}
              placeholder="0.00"
              iconName="Wallet"
              buttonClassName="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Reste à payer */}
        {formData.montantTotal && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Reste à payer :</span>
              <span className={`text-lg font-bold ${
                resteAPayer > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {formatCurrency(resteAPayer)}
              </span>
            </div>
          </div>
        )}

        {/* Statut */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Statut
          </label>
          <Select
            value={formData.statut}
            onChange={(value) => handleChange('statut', value)}
            options={statusOptions}
            className="w-full"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Date d'émission <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.dateEmission}
              onChange={(e) => handleChange('dateEmission', e.target.value)}
              buttonClassName="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Date d'échéance
            </label>
            <Input
              type="date"
              value={formData.dateEcheance}
              onChange={(e) => handleChange('dateEcheance', e.target.value)}
              min={formData.dateEmission}
              buttonClassName="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              placeholder="30 jours par défaut"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Notes (optionnel)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Notes supplémentaires sur la facture..."
            rows={3}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
          />
        </div>
      </form>
      )}
    </Modal>
  );
};

export default CreateInvoiceModal;

