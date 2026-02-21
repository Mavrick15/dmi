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
import { useFinanceMutations, usePaymentMethods } from '../../../hooks/useFinance';

const PaymentModal = ({ isOpen, onClose, invoice }) => {
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();
  const { formatCurrency } = useCurrency();
  const { recordPayment } = useFinanceMutations();
  const { data: paymentMethodsData = [] } = usePaymentMethods();
  const [formData, setFormData] = useState({
    montant: '',
    methodePaiement: 'especes',
    numeroTransaction: '',
    notes: '',
    typeTransaction: 'consultation'
  });

  // Réinitialiser le formulaire quand la modal s'ouvre
  React.useEffect(() => {
    if (isOpen && invoice) {
      const montantRestant = invoice.montantTotal - (invoice.montantPaye || 0);
      const isPaid = invoice.statut === 'payee' || montantRestant <= 0;
      
      if (isPaid) {
        showToast('Cette facture est déjà complètement payée', 'warning');
        onClose();
        return;
      }
      
      setFormData({
        montant: montantRestant > 0 ? montantRestant.toFixed(2) : '',
        methodePaiement: 'especes',
        numeroTransaction: '',
        notes: '',
        typeTransaction: 'consultation'
      });
    }
  }, [isOpen, invoice, onClose, showToast]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!invoice) {
      showToast('Facture introuvable', 'error');
      return;
    }

    // Validation
    if (!formData.montant || parseFloat(formData.montant) <= 0) {
      showToast('Le montant doit être supérieur à 0', 'error');
      return;
    }

    const montantRestant = invoice.montantTotal - (invoice.montantPaye || 0);
    if (parseFloat(formData.montant) > montantRestant) {
      showToast(`Le montant ne peut pas dépasser le reste à payer (${formatCurrency(montantRestant)})`, 'error');
      return;
    }

    const paymentData = {
      montant: parseFloat(formData.montant),
      methodePaiement: formData.methodePaiement,
      numeroTransaction: formData.numeroTransaction || null,
      notes: formData.notes || null,
      typeTransaction: formData.typeTransaction
    };

    recordPayment.mutate(
      { invoiceId: invoice.id, ...paymentData },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };

  if (!invoice) return null;

  const montantRestant = invoice.montantTotal - (invoice.montantPaye || 0);
  const isPaid = invoice.statut === 'payee' || montantRestant <= 0;
  const montantMax = montantRestant;

  // Si la facture est déjà payée, ne pas afficher le modal
  if (isPaid) {
    return null;
  }

  // Utiliser les méthodes de paiement depuis le backend
  const paymentMethods = Array.isArray(paymentMethodsData) ? paymentMethodsData.map(method => {
    if (!method || typeof method !== 'object') return null;
    return {
      value: method.code,
      label: method.name
    };
  }).filter(Boolean) : [];

  const transactionTypes = [
    { value: 'consultation', label: 'Consultation' },
    { value: 'traitement', label: 'Traitement' },
    { value: 'medicament', label: 'Médicament' },
    { value: 'analyse', label: 'Analyse' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enregistrer un paiement"
      icon="CreditCard"
      size="md"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={recordPayment.isPending}>
            Annuler
          </Button>
          <PermissionGuard requiredPermission="payment_process">
            <Button
              onClick={handleSubmit}
              loading={recordPayment.isPending}
              disabled={!formData.montant || parseFloat(formData.montant) <= 0 || !hasPermission('payment_process')}
            >
              <Icon name="Check" size={16} className="mr-2" />
              Enregistrer le paiement
            </Button>
          </PermissionGuard>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations facture */}
        <div className="bg-primary/10 dark:bg-primary/20 rounded-xl p-4 border border-white/20 dark:border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Facture</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{invoice.numeroFacture}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Montant total</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(invoice.montantTotal)}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Déjà payé</span>
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(invoice.montantPaye || 0)}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Reste à payer</span>
              <span className="text-xl font-bold text-amber-600">
                {formatCurrency(montantRestant)}
              </span>
            </div>
          </div>
        </div>

        {/* Montant du paiement */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Montant à payer <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            max={montantMax}
            value={formData.montant}
            onChange={(e) => handleChange('montant', e.target.value)}
            placeholder={`Maximum: ${formatCurrency(montantMax)}`}
            iconName="DollarSign"
            required
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Le montant ne peut pas dépasser {formatCurrency(montantMax)}
          </p>
        </div>

        {/* Méthode de paiement */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Méthode de paiement <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.methodePaiement}
            onChange={(value) => handleChange('methodePaiement', value)}
            options={paymentMethods}
            required
          />
        </div>

        {/* Type de transaction */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Type de transaction
          </label>
          <Select
            value={formData.typeTransaction}
            onChange={(value) => handleChange('typeTransaction', value)}
            options={transactionTypes}
          />
        </div>

        {/* Numéro de transaction (optionnel) */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Numéro de transaction (optionnel)
          </label>
          <Input
            type="text"
            value={formData.numeroTransaction}
            onChange={(e) => handleChange('numeroTransaction', e.target.value)}
            placeholder="Ex: REF-123456"
            iconName="Hash"
            maxLength={100}
          />
        </div>

        {/* Notes (optionnel) */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Notes (optionnel)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Notes supplémentaires sur le paiement..."
            rows={3}
            maxLength={500}
            className="w-full glass-panel rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
          />
        </div>

        {/* Aperçu */}
        {formData.montant && parseFloat(formData.montant) > 0 && (
          <div className="glass-surface rounded-xl p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Montant payé actuel</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(invoice.montantPaye || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Nouveau paiement</span>
                <span className="font-bold text-emerald-600">
                  +{formatCurrency(parseFloat(formData.montant || 0))}
                </span>
              </div>
              <div className="pt-2 border-t border-white/20 dark:border-white/10">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Total payé après</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatCurrency((invoice.montantPaye || 0) + parseFloat(formData.montant || 0))}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-white/20 dark:border-white/10">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Reste à payer</span>
                  <span className={`text-lg font-bold ${montantRestant - parseFloat(formData.montant || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {formatCurrency(montantRestant - parseFloat(formData.montant || 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default PaymentModal;
