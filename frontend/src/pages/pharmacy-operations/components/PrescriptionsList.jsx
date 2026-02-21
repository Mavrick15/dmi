import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import AnimatedModal from '../../../components/ui/AnimatedModal';
import Input from '../../../components/ui/Input';
import { usePendingPrescriptions, usePharmacyMutations } from '../../../hooks/usePharmacy';
import { useToast } from '../../../contexts/ToastContext';
import api from '../../../lib/axios';
import { formatDateTimeInBusinessTimezone } from '../../../utils/dateTime';
const PrescriptionsList = () => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ quantite: '', posologie: '', dureeTraitement: '' });
  const { showToast } = useToast();

  const { data: prescriptionsData, isLoading, isError, refetch } = usePendingPrescriptions({
    page,
    limit: itemsPerPage,
    search: '',
  });

  const { markPrescriptionDelivered } = usePharmacyMutations();

  const prescriptions = prescriptionsData?.data || [];
  const meta = prescriptionsData?.meta || {};
  const totalPages = meta.lastPage || meta.last_page || 1;
  const totalItems = meta.total || 0;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return formatDateTimeInBusinessTimezone(dateString);
    } catch {
      return dateString;
    }
  };

  const handleMarkDelivered = async (prescriptionId) => {
    try {
      await markPrescriptionDelivered.mutateAsync(prescriptionId);
      refetch();
    } catch (error) {
      // L'erreur est gérée par le hook
    }
  };

  const handleView = (prescription) => {
    setSelectedPrescription(prescription);
    setShowViewModal(true);
  };

  const handleEdit = (prescription) => {
    setSelectedPrescription(prescription);
    setEditFormData({
      quantite: prescription.quantite || '',
      posologie: prescription.posologie || '',
      dureeTraitement: prescription.dureeTraitement || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedPrescription) return;
    
    try {
      const response = await api.patch(`/pharmacy/prescriptions/${selectedPrescription.id}`, {
        quantite: parseInt(editFormData.quantite) || selectedPrescription.quantite,
        posologie: editFormData.posologie || selectedPrescription.posologie,
        dureeTraitement: editFormData.dureeTraitement || selectedPrescription.dureeTraitement
      });
      
      if (response.data.success) {
        showToast('Prescription modifiée avec succès', 'success');
        setShowEditModal(false);
        setSelectedPrescription(null);
        refetch();
      }
    } catch (error) {
      showToast(error.userMessage || 'Erreur lors de la modification de la prescription', 'error');
    }
  };

  const handleCancel = (prescription) => {
    setSelectedPrescription(prescription);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedPrescription) return;
    
    try {
      const response = await api.patch(`/pharmacy/prescriptions/${selectedPrescription.id}/cancel`);
      
      if (response.data.success) {
        showToast('Prescription annulée avec succès', 'success');
        setShowCancelModal(false);
        setSelectedPrescription(null);
        refetch();
      }
    } catch (error) {
      showToast(error.userMessage || 'Erreur lors de l\'annulation de la prescription', 'error');
    }
  };

  return (
    <div className="glass-panel rounded-xl shadow-sm overflow-hidden">
      
      {/* 1. Header */}
      <div className="p-4 border-b border-white/20 dark:border-white/10 glass-surface">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 glass-surface rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400">
            <Icon name="FileText" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Prescriptions ({totalItems})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Prescriptions en attente de délivrance
            </p>
          </div>
        </div>
      </div>

      {/* 2. Tableau */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="text-left p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Médicament
              </th>
              <th className="text-left p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Patient
              </th>
              <th className="text-left p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Médecin
              </th>
              <th className="text-center p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Quantité
              </th>
              <th className="text-left p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Posologie
              </th>
              <th className="text-left p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Date
              </th>
              <th className="text-right p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 dark:divide-white/5 backdrop-blur-xl bg-white/50 dark:bg-white/10">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-12">
                  <div className="rounded-xl border border-white/20 dark:border-white/10 glass-surface flex items-center justify-center gap-3 py-10">
                    <Icon name="Loader2" size={28} className="animate-spin text-primary" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement des prescriptions…</p>
                  </div>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={7} className="p-12">
                  <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/20 flex flex-col items-center justify-center gap-3 py-10">
                    <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                      <Icon name="AlertCircle" size={24} className="text-rose-600 dark:text-rose-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Erreur lors du chargement. Veuillez réessayer.</p>
                  </div>
                </td>
              </tr>
            ) : prescriptions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12">
                  <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-white/20 dark:border-white/10 glass-surface">
                    <div className="w-14 h-14 rounded-xl glass-surface flex items-center justify-center mb-3">
                      <Icon name="FileText" size={28} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Aucune prescription en attente</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Les nouvelles prescriptions apparaîtront ici.</p>
                  </div>
                </td>
              </tr>
            ) : (
              prescriptions.map((prescription) => (
                <motion.tr
                  key={prescription.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="transition-all duration-200 group hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-sm"
                >
                  {/* Médicament */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Icon name="Pill" size={16} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {prescription.medicament?.nom || 'Médicament inconnu'}
                      </div>
                    </div>
                  </td>

                  {/* Patient */}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Icon name="User" size={16} className="text-slate-400" />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {prescription.patient?.nomComplet || 'N/A'}
                      </span>
                    </div>
                  </td>

                  {/* Médecin */}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Icon name="Stethoscope" size={16} className="text-slate-400" />
                      <span className="text-slate-700 dark:text-slate-300">
                        {prescription.medecin?.nomComplet || 'N/A'}
                      </span>
                    </div>
                  </td>

                  {/* Quantité */}
                  <td className="p-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Icon name="Package" size={14} className="text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-blue-700 dark:text-blue-300">
                        {prescription.quantite}
                      </span>
                    </div>
                  </td>

                  {/* Posologie */}
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                      <Icon name="Clock" size={14} className="text-slate-400" />
                      <span>
                        {prescription.posologie || '—'}
                        {prescription.dureeTraitement && ` • ${prescription.dureeTraitement}`}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                      <Icon name="Calendar" size={14} className="text-slate-400" />
                      <span>{formatDate(prescription.datePrescription)}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        onClick={() => handleView(prescription)}
                        title="Voir les détails"
                      >
                        <Icon name="Eye" size={18} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        onClick={() => handleEdit(prescription)}
                        title="Modifier"
                      >
                        <Icon name="Edit2" size={18} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        onClick={() => handleMarkDelivered(prescription.id)}
                        loading={markPrescriptionDelivered.isPending}
                        disabled={markPrescriptionDelivered.isPending}
                        title="Marquer comme délivré"
                      >
                        <Icon name="CheckCircle" size={18} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        onClick={() => handleCancel(prescription)}
                        title="Annuler"
                      >
                        <Icon name="XCircle" size={18} />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-white/20 dark:border-white/10 glass-surface">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Page {page} sur {totalPages} ({totalItems} prescription{totalItems > 1 ? 's' : ''})
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                iconName="ChevronLeft"
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                iconName="ChevronRight"
              >
                Suivant
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de visualisation */}
      <AnimatedModal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setSelectedPrescription(null); }} usePortal={true}>
        {selectedPrescription && (
          <div className="backdrop-blur-xl bg-white/50 dark:bg-white/10 w-full max-w-2xl rounded-2xl shadow-2xl border-2 border-white/20 dark:border-white/10 overflow-hidden">
            <div className="p-6 border-b-2 border-white/20 dark:border-white/10 backdrop-blur-xl bg-white/50 dark:bg-white/10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="FileText" size={24} className="text-primary" />
                Détails de la prescription
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Médicament</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedPrescription.medicament?.nom || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Quantité</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedPrescription.quantite} unité{selectedPrescription.quantite > 1 ? 's' : ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Patient</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedPrescription.patient?.nomComplet || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Médecin</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedPrescription.medecin?.nomComplet || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Posologie</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {selectedPrescription.posologie || 'Non spécifiée'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Durée</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {selectedPrescription.dureeTraitement || 'Non spécifiée'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Date de prescription</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {formatDate(selectedPrescription.datePrescription)}
                  </p>
                </div>
              </div>
              {selectedPrescription.instructionsSpeciales && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Instructions spéciales</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {selectedPrescription.instructionsSpeciales}
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 border-t-2 border-white/20 dark:border-white/10 backdrop-blur-xl bg-white/50 dark:bg-white/10 flex justify-end">
              <Button variant="outline" onClick={() => { setShowViewModal(false); setSelectedPrescription(null); }}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* Modale de modification */}
      <AnimatedModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedPrescription(null); }} usePortal={true}>
        {selectedPrescription && (
          <div className="backdrop-blur-xl bg-white/50 dark:bg-white/10 w-full max-w-lg rounded-2xl shadow-2xl border-2 border-white/20 dark:border-white/10 overflow-hidden">
            <div className="p-6 border-b-2 border-white/20 dark:border-white/10 backdrop-blur-xl bg-white/50 dark:bg-white/10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="Edit2" size={24} className="text-primary" />
                Modifier la prescription
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Médicament: <span className="font-semibold text-slate-900 dark:text-white">{selectedPrescription.medicament?.nom}</span>
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Patient: <span className="font-semibold text-slate-900 dark:text-white">{selectedPrescription.patient?.nomComplet}</span>
                </p>
              </div>
              <Input
                label="Quantité"
                type="number"
                min="1"
                value={editFormData.quantite}
                onChange={(e) => setEditFormData({ ...editFormData, quantite: e.target.value })}
                className="backdrop-blur-xl bg-white/50 dark:bg-white/10"
              />
              <Input
                label="Posologie"
                value={editFormData.posologie}
                onChange={(e) => setEditFormData({ ...editFormData, posologie: e.target.value })}
                placeholder="Ex: 1 matin / 1 soir"
                className="backdrop-blur-xl bg-white/50 dark:bg-white/10"
              />
              <Input
                label="Durée de traitement"
                value={editFormData.dureeTraitement}
                onChange={(e) => setEditFormData({ ...editFormData, dureeTraitement: e.target.value })}
                placeholder="Ex: 5 jours"
                className="backdrop-blur-xl bg-white/50 dark:bg-white/10"
              />
            </div>
            <div className="p-6 border-t-2 border-white/20 dark:border-white/10 backdrop-blur-xl bg-white/50 dark:bg-white/10 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowEditModal(false); setSelectedPrescription(null); }}>
                Annuler
              </Button>
              <Button variant="default" onClick={handleSaveEdit} className="bg-primary hover:bg-primary/90">
                Enregistrer
              </Button>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* Modale de confirmation d'annulation */}
      <AnimatedModal isOpen={showCancelModal} onClose={() => { setShowCancelModal(false); setSelectedPrescription(null); }} usePortal={true}>
        {selectedPrescription && (
          <div className="backdrop-blur-xl bg-white/50 dark:bg-white/10 w-full max-w-md rounded-2xl shadow-2xl border-2 border-white/20 dark:border-white/10 overflow-hidden">
            <div className="p-6 border-b-2 border-white/20 dark:border-white/10 backdrop-blur-xl bg-white/50 dark:bg-white/10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="AlertTriangle" size={24} className="text-rose-600" />
                Annuler la prescription
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Êtes-vous sûr de vouloir annuler cette prescription ?
              </p>
              <div className="glass-surface rounded-xl p-4 space-y-2">
                <p className="text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Médicament:</span>{' '}
                  <span className="text-slate-900 dark:text-white">{selectedPrescription.medicament?.nom}</span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Patient:</span>{' '}
                  <span className="text-slate-900 dark:text-white">{selectedPrescription.patient?.nomComplet}</span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Quantité:</span>{' '}
                  <span className="text-slate-900 dark:text-white">{selectedPrescription.quantite} unité{selectedPrescription.quantite > 1 ? 's' : ''}</span>
                </p>
              </div>
            </div>
            <div className="p-6 border-t-2 border-white/20 dark:border-white/10 backdrop-blur-xl bg-white/50 dark:bg-white/10 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowCancelModal(false); setSelectedPrescription(null); }}>
                Non, garder
              </Button>
              <Button variant="default" onClick={handleConfirmCancel} className="bg-rose-600 hover:bg-rose-700">
                Oui, annuler
              </Button>
            </div>
          </div>
        )}
      </AnimatedModal>
    </div>
  );
};

export default PrescriptionsList;

