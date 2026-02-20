import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { useEstablishments } from '../../../hooks/useAdmin';
import { useExportMutations } from '../../../hooks/useExport';
import InvoiceCard from './InvoiceCard';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import PaymentModal from './PaymentModal';
import api from '../../../lib/axios';
import { useToast } from '../../../contexts/ToastContext';
import { generateInvoicePDF } from '../../../utils/pdfGenerator';
import { getTodayInBusinessTimezone } from '../../../utils/dateTime';

const InvoicesList = () => {
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [establishmentId, setEstablishmentId] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceToPay, setInvoiceToPay] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const limit = 12;

  const { exportInvoices } = useExportMutations();
  const { data: establishmentsData } = useEstablishments({ limit: 100 });
  const establishmentsList = useMemo(() => {
    const list = establishmentsData?.data || [];
    if (list.length <= 1) return [];
    return [{ value: '', label: 'Tous les établissements' }, ...list.map((e) => ({ value: e.id, label: e.nom || e.name || 'Établissement' }))];
  }, [establishmentsData]);

  const { data: invoicesData, isLoading, refetch } = useQuery({
    queryKey: ['finance', 'invoices', currentPage, searchTerm, statusFilter, establishmentId],
    queryFn: async () => {
      try {
        const response = await api.get('/finance/invoices', {
          params: {
            page: currentPage,
            limit,
            search: searchTerm || undefined,
            statut: statusFilter !== 'all' ? statusFilter : undefined,
            establishmentId: establishmentId || undefined
          }
        });
        return response.data;
      } catch (error) {
        showToast('Erreur lors du chargement des factures', 'error');
        throw error;
      }
    },
    placeholderData: (previousData) => previousData,
    retry: 1
  });

  const invoices = invoicesData?.data || [];
  const totalPages = invoicesData?.meta?.last_page || invoicesData?.meta?.lastPage || 1;
  const totalInvoices = invoicesData?.meta?.total || 0;

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handlePay = (invoice) => {
    const montantRestant = invoice.montantTotal - (invoice.montantPaye || 0);
    const isPaid = invoice.statut === 'payee' || montantRestant <= 0;
    
    if (isPaid) {
      showToast('Cette facture est déjà complètement payée', 'warning');
      return;
    }
    
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

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleEstablishmentFilter = (value) => {
    setEstablishmentId(value || '');
    setCurrentPage(1);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Filtres et recherche */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <div className="flex flex-wrap items-end gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 flex-1">
            <div className={establishmentsList.length > 0 ? 'md:col-span-2' : 'md:col-span-2'}>
              <Input
                placeholder="Rechercher par numéro de facture, patient..."
                value={searchTerm}
                onChange={handleSearch}
                iconName="Search"
                className="w-full"
              />
            </div>
            {establishmentsList.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Établissement</label>
                <Select
                  value={establishmentId}
                  onChange={handleEstablishmentFilter}
                  options={establishmentsList}
                  className="w-full"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Statut</label>
              <Select
                value={statusFilter}
                onChange={handleStatusFilter}
                options={[
                  { value: 'all', label: 'Tous les statuts' },
                  { value: 'en_attente', label: 'En attente' },
                  { value: 'payee', label: 'Payée' },
                  { value: 'en_retard', label: 'En retard' },
                  { value: 'annulee', label: 'Annulée' }
                ]}
                className="w-full"
              />
            </div>
          </div>
            <PermissionGuard requiredPermission="billing_view">
              <Button variant="outline" size="sm" iconName="Download" onClick={() => exportInvoices.mutate({})} disabled={exportInvoices.isPending}>
                {exportInvoices.isPending ? 'Export...' : 'Exporter (CSV)'}
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Liste des factures */}
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-primary bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center py-20">
            <Icon name="Loader2" size={40} className="animate-spin text-primary mb-2" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Chargement…</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Icon name="FileX" className="text-slate-400" size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Aucune facture trouvée
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {searchTerm || statusFilter !== 'all' || establishmentId
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Aucune facture n\'a été créée pour le moment.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence mode="wait">
                {Array.isArray(invoices) && invoices.map((invoice, idx) => {
                  if (!invoice || typeof invoice !== 'object') return null;
                  return (
                  <motion.div
                    key={invoice.id}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Affichage de <span className="font-bold text-slate-900 dark:text-white">
                    {((currentPage - 1) * limit) + 1}
                  </span> à{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {Math.min(currentPage * limit, totalInvoices)}
                  </span>{' '}
                  sur <span className="font-bold text-slate-900 dark:text-white">{totalInvoices}</span> factures
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <Icon name="ChevronLeft" size={16} className="mr-1" />
                    Précédent
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let page;
                      if (totalPages <= 7) {
                        page = i + 1;
                      } else if (currentPage <= 4) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        page = totalPages - 6 + i;
                      } else {
                        page = currentPage - 3 + i;
                      }
                      return (
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
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || isLoading}
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

      {/* Modal de détails */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Facture ${selectedInvoice?.numeroFacture || ''}`}
        icon="FileText"
        size="lg"
      >
        {selectedInvoice && (
          <InvoiceCard
            invoice={selectedInvoice}
            onView={null}
            onPay={handlePay}
            onDownload={handleDownload}
            onPrint={handlePrint}
          />
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

export default InvoicesList;

