import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from '../ui/Modal';
import Icon from '../AppIcon';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import PermissionGuard from '../PermissionGuard';
import { useToast } from '../../contexts/ToastContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import api from '../../lib/axios';
import { Loader2 } from 'lucide-react';

const InvoiceDetailsModal = ({ isOpen, onClose, invoiceId }) => {
  const { showToast } = useToast();
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [insuranceName, setInsuranceName] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [createdClaim, setCreatedClaim] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setShowInsuranceForm(false);
      setCreatedClaim(null);
      setInsuranceName('');
      setClaimAmount('');
    }
  }, [isOpen]);

  const handleCreateInsuranceClaim = async (e) => {
    e?.preventDefault();
    const name = insuranceName?.trim();
    const amount = Number(claimAmount);
    if (!name) {
      showToast('Indiquez le nom de l\'assurance.', 'error');
      return;
    }
    if (!amount || amount <= 0) {
      showToast('Le montant demandé doit être supérieur à 0.', 'error');
      return;
    }
    setSubmittingClaim(true);
    try {
      const res = await api.post(`/finance/invoices/${invoiceId}/insurance-claim`, {
        insuranceName: name,
        claimAmount: amount,
      });
      const data = res.data?.data || res.data;
      setCreatedClaim(data);
      showToast(res.data?.message || 'Demande d\'assurance créée.', 'success');
      setShowInsuranceForm(false);
      setInsuranceName('');
      setClaimAmount('');
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    } catch (err) {
      showToast(err.userMessage || err.response?.data?.message || 'Erreur lors de la création de la demande.', 'error');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['finance', 'invoice', invoiceId],
    queryFn: async () => {
      try {
        const response = await api.get(`/finance/invoices/${invoiceId}`);
        return response.data.data || response.data;
      } catch (error) {
        if (error.response?.status === 404) {
          showToast('Facture introuvable', 'error');
        } else {
          showToast('Erreur lors du chargement de la facture', 'error');
        }
        throw error;
      }
    },
    enabled: !!invoiceId && isOpen,
    retry: 1
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      'en_attente': { variant: 'warning', label: 'En attente', icon: 'Clock' },
      'payee': { variant: 'success', label: 'Payée', icon: 'CheckCircle' },
      'en_retard': { variant: 'error', label: 'En retard', icon: 'AlertTriangle' },
      'annulee': { variant: 'default', label: 'Annulée', icon: 'XCircle' }
    };
    const statusInfo = statusMap[status] || { variant: 'default', label: status, icon: 'FileText' };
    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1.5">
        <Icon name={statusInfo.icon} size={14} />
        {statusInfo.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };


  if (isLoading) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Détails de la facture"
        icon="FileText"
        size="lg"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </Modal>
    );
  }

  if (error || !invoice) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Détails de la facture"
        icon="FileText"
        size="lg"
      >
        <div className="text-center py-12">
          <Icon name="AlertCircle" size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Impossible de charger les détails de la facture</p>
        </div>
      </Modal>
    );
  }

  const resteAPayer = (invoice.montantTotal || 0) - (invoice.montantPaye || 0);
  const pourcentagePaye = invoice.montantTotal > 0 
    ? ((invoice.montantPaye || 0) / invoice.montantTotal * 100).toFixed(1)
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Facture ${invoice.numeroFacture || invoice.id}`}
      icon="FileText"
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button
            variant="default"
            onClick={() => {
              // Navigation vers la page des opérations financières
              window.location.href = `/operations-financieres?invoice=${invoice.id}`;
            }}
          >
            <Icon name="ExternalLink" size={16} className="mr-2" />
            Voir dans Finance
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* En-tête avec statut */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {invoice.numeroFacture || `Facture #${invoice.id?.slice(0, 8)}`}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Émise le {formatDate(invoice.dateEmission)}
            </p>
          </div>
          {getStatusBadge(invoice.statut)}
        </div>

        {/* Informations patient */}
        {invoice.patient && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name="User" size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  {invoice.patient?.user?.nomComplet || invoice.patient?.numeroPatient || 'Patient inconnu'}
                </p>
                {invoice.patient?.user?.email && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {invoice.patient.user.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Montants */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-primary/10 to-blue-50 dark:from-primary/20 dark:to-blue-900/20 rounded-xl p-4 border border-primary/20">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Montant Total
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(invoice.montantTotal || 0)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Montant Payé
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(invoice.montantPaye || 0)}
            </p>
          </div>
        </div>

        {/* Barre de progression du paiement */}
        {invoice.montantTotal > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Progression du paiement
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {pourcentagePaye}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-green-500 h-full transition-all duration-500"
                style={{ width: `${pourcentagePaye}%` }}
              />
            </div>
            {resteAPayer > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                Reste à payer : {formatCurrency(resteAPayer)}
              </p>
            )}
          </div>
        )}

        {/* Informations supplémentaires */}
        <div className="grid grid-cols-2 gap-4">
          {invoice.dateEcheance && (
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Date d'échéance
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {formatDate(invoice.dateEcheance)}
              </p>
            </div>
          )}
          {invoice.datePaiementComplet && (
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Date de paiement complet
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {formatDate(invoice.datePaiementComplet)}
              </p>
            </div>
          )}
        </div>

        {/* Informations financières détaillées */}
        {(invoice.montantHt || invoice.montantTva || invoice.tauxTva) && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Détails financiers
            </p>
            {invoice.montantHt && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Montant HT</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatCurrency(invoice.montantHt)}
                </span>
              </div>
            )}
            {invoice.tauxTva && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  TVA ({invoice.tauxTva}%)
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatCurrency(invoice.montantTva || 0)}
                </span>
              </div>
            )}
            {invoice.remise > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Remise</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  -{formatCurrency(invoice.remise)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Notes
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {invoice.notes}
              </p>
            </div>
          </div>
        )}

        {/* Tiers payant / Demande d'assurance */}
        <PermissionGuard requiredPermission="finance_manage">
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/30">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Icon name="Shield" size={14} />
              Tiers payant / Demande d'assurance
            </p>
            {createdClaim ? (
              <div className="rounded-lg p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Demande enregistrée</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  N° {createdClaim.claimNumber} — {createdClaim.insuranceName} — {formatCurrency(createdClaim.amount || 0)} —{' '}
                  <Badge variant="warning" size="sm">{createdClaim.status === 'en_attente' ? 'En attente' : createdClaim.status}</Badge>
                </p>
              </div>
            ) : showInsuranceForm ? (
              <form onSubmit={handleCreateInsuranceClaim} className="space-y-3">
                <Input
                  label="Nom de l'assurance"
                  value={insuranceName}
                  onChange={(e) => setInsuranceName(e.target.value)}
                  placeholder="Ex. Mutuelle XYZ"
                />
                <Input
                  label="Montant demandé"
                  type="number"
                  min="0"
                  step="0.01"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  placeholder="0.00"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => { setShowInsuranceForm(false); setInsuranceName(''); setClaimAmount(''); }}>
                    Annuler
                  </Button>
                  <Button type="submit" size="sm" loading={submittingClaim} iconName="Send">
                    Créer la demande
                  </Button>
                </div>
              </form>
            ) : (
              <Button variant="outline" size="sm" iconName="Plus" onClick={() => setShowInsuranceForm(true)}>
                Créer une demande d'assurance
              </Button>
            )}
          </div>
        </PermissionGuard>
      </div>
    </Modal>
  );
};

export default InvoiceDetailsModal;

