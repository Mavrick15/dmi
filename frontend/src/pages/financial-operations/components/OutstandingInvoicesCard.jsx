import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import InvoiceCard from './InvoiceCard';
import Modal from '../../../components/ui/Modal';
import PaymentModal from './PaymentModal';
import { useOutstandingInvoices } from '../../../hooks/useFinance';
import { useToast } from '../../../contexts/ToastContext';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { generateInvoicePDF } from '../../../utils/pdfGenerator';
import { getTodayInBusinessTimezone } from '../../../utils/dateTime';

const OutstandingInvoicesCard = () => {
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();
  const { formatCurrency } = useCurrency();
  const { data: invoicesData, isLoading } = useOutstandingInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceToPay, setInvoiceToPay] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const invoices = Array.isArray(invoicesData) ? invoicesData : [];
  const totalDue = invoices.reduce((sum, inv) => {
    if (!inv || typeof inv.montantTotal !== 'number') return sum;
    return sum + (inv.montantTotal - (inv.montantPaye || 0));
  }, 0);

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handlePay = (invoice) => {
    if (!invoice || typeof invoice.montantTotal !== 'number') {
      showToast('Facture invalide', 'error');
      return;
    }
    
    const montantRestant = invoice.montantTotal - (invoice.montantPaye || 0);
    const isPaid = invoice.statut === 'payee' || montantRestant <= 0;
    
    if (isPaid) {
      showToast('Cette facture est déjà complètement payée', 'warning');
      return;
    }
    
    // Fermer le modal "voir" avant d'ouvrir le modal de paiement
    setIsModalOpen(false);
    setSelectedInvoice(null);
    
    setInvoiceToPay(invoice);
    setIsPaymentModalOpen(true);
  };

  const handleDownload = (invoice) => {
    try {
      const doc = generateInvoicePDF(invoice);
      const fileName = `Facture_${invoice.numeroFacture}_${getTodayInBusinessTimezone()}.pdf`;
      doc.save(fileName);
      showToast(`Facture ${invoice.numeroFacture} téléchargée`, 'success');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors de la génération PDF:', error);
      }
      showToast('Erreur lors de la génération du PDF', 'error');
    }
  };

  const handlePrint = (invoice) => {
    try {
      const doc = generateInvoicePDF(invoice);
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            // Nettoyer l'URL après impression
            setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
          }, 250);
        };
      } else {
        // Fallback si popup bloquée : télécharger au lieu d'imprimer
        doc.save(`Facture_${invoice.numeroFacture}_${getTodayInBusinessTimezone()}.pdf`);
        showToast('Téléchargement lancé. Ouvrez le fichier pour imprimer.', 'info');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors de l\'impression:', error);
      }
      showToast('Erreur lors de l\'impression', 'error');
    }
  };

  const handleRelanceAll = () => {
    showToast('Relance de toutes les factures impayées', 'info');
    // TODO: Implémenter la relance groupée
  };

  return (
    <>
      <div className="relative bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl shadow-sm p-6 h-full flex flex-col overflow-hidden">
        <div className="absolute inset-0 bg-amber-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <div className="relative flex items-center justify-between mb-6 z-10">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 10 }}
              className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center"
            >
              <Icon name="AlertCircle" className="text-white" size={20} />
            </motion.div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Impayés
            </h3>
          </div>
          {invoices.length > 0 && (
            <Button variant="ghost" size="xs" onClick={handleRelanceAll}>
              Relancer tout
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-white/20 dark:border-white/10 border-l-4 border-l-primary bg-white/50 dark:bg-slate-800/30 py-8">
            <Icon name="Loader2" size={32} className="animate-spin text-primary mb-2" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Chargement…</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <Icon name="CheckCircle" className="text-emerald-500 mb-2" size={40} />
            <p className="text-sm text-slate-500 dark:text-slate-400">Aucune facture impayée</p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar max-h-[500px]">
              <AnimatePresence>
                {Array.isArray(invoices) && invoices.map((invoice, idx) => {
                  if (!invoice || typeof invoice !== 'object') return null;
                  return (
                    <motion.div
                      key={invoice.id || idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <InvoiceCard
                        invoice={invoice}
                        onView={handleView}
                        onPay={handlePay}
                        onDownload={handleDownload}
                        onPrint={handlePrint}
                      />
                    </motion.div>
                  );
                }).filter(Boolean)}
              </AnimatePresence>
            </div>

            <div className="mt-4 pt-4 border-t border-white/20 dark:border-white/10 text-center">
              <p className="text-xs text-slate-500">
                Total dû : <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(totalDue)}
                </span>
              </p>
            </div>
          </>
        )}
      </div>

      {/* Modal de détails de facture */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Facture ${selectedInvoice?.numeroFacture || ''}`}
        icon="FileText"
        size="lg"
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <InvoiceCard
              invoice={selectedInvoice}
              onView={null}
              onPay={handlePay}
              onDownload={handleDownload}
              onPrint={handlePrint}
            />
          </div>
        )}
      </Modal>

      {/* Modal de paiement */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setInvoiceToPay(null);
        }}
        invoice={invoiceToPay}
      />
    </>
  );
};

export default OutstandingInvoicesCard;