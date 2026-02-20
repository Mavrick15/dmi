import React, { useState, useEffect, useRef } from 'react';
import api from '../../../lib/axios';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import AnimatedModal from '../../../components/ui/AnimatedModal';
import { useToast } from '../../../contexts/ToastContext';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { formatDateInBusinessTimezone } from '../../../utils/dateTime';

const SupplierDetailsModal = ({ isOpen, onClose, supplierId, onCreateOrder, onEdit }) => {
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { formatCurrency } = useCurrency();
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen && supplierId) {
      fetchSupplierDetails();
    } else {
      setSupplier(null);
    }
  }, [isOpen, supplierId]);

  // Focus automatique sur le bouton de fermeture quand la modale s'ouvre
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const fetchSupplierDetails = async () => {
    if (!supplierId) return;

    setLoading(true);
    try {
      const response = await api.get(`/suppliers/${supplierId}`);
      if (response.data.success) {
        setSupplier(response.data.data);
      } else {
        showToast('Erreur lors du chargement des détails du fournisseur', 'error');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors du chargement des détails:', error);
      }
      showToast(
        error.response?.data?.message || 'Erreur lors du chargement des détails du fournisseur',
        'error'
      );
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return formatDateInBusinessTimezone(dateString);
    } catch (error) {
      return 'N/A';
    }
  };


  const getStatusBadge = (status) => {
    const statusConfig = {
      recue: {
        color: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        icon: 'PackageCheck',
        label: 'Reçue'
      },
      commandee: {
        color: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-700 dark:text-blue-400',
        icon: 'Clock',
        label: 'Commandée'
      },
      partiellement_recue: {
        color: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-400',
        icon: 'AlertTriangle',
        label: 'Partiellement reçue'
      },
      annulee: {
        color: 'bg-rose-50 dark:bg-rose-900/20',
        text: 'text-rose-700 dark:text-rose-400',
        icon: 'XCircle',
        label: 'Annulée'
      }
    };
    const config = statusConfig[status] || statusConfig.commandee;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${config.color} ${config.text}`}>
        <Icon name={config.icon} size={12} />
        {config.label}
      </span>
    );
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Icon name="Truck" size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Détails du fournisseur
              </h2>
              {supplier && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {supplier.name || supplier.nom}
                </p>
              )}
            </div>
          </div>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7"
            aria-label="Fermer"
          >
            <Icon name="X" size={16} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Icon name="Loader2" size={24} className="animate-spin text-primary" />
            </div>
          ) : supplier ? (
            <div className="space-y-4">
              {/* Informations générales */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                    Statut
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${supplier.actif
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-400'
                    }`}>
                    <Icon name={supplier.actif ? 'CheckCircle' : 'XCircle'} size={12} />
                    {supplier.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                    Total commandes
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {supplier.totalCommandes || 0}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                    Délai de livraison moyen
                  </div>
                  <div className="text-xs font-medium text-slate-900 dark:text-white">
                    {supplier.delaiLivraisonMoyen || supplier.delai_livraison_moyen || 0} jours
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                    Date de création
                  </div>
                  <div className="text-xs font-medium text-slate-900 dark:text-white">
                    {formatDate(supplier.createdAt)}
                  </div>
                </div>
              </div>

              {/* Informations de contact */}
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 border border-blue-100 dark:border-blue-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Mail" size={14} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    Contact
                  </h3>
                </div>
                <div className="space-y-1.5">
                  {supplier.contactNom && (
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {supplier.contactNom}
                    </div>
                  )}
                  {supplier.email && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Icon name="Mail" size={12} />
                      {supplier.email}
                    </div>
                  )}
                  {supplier.telephone && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Icon name="Phone" size={12} />
                      {supplier.telephone}
                    </div>
                  )}
                  {supplier.adresse && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Icon name="MapPin" size={12} />
                      {supplier.adresse}
                    </div>
                  )}
                </div>
              </div>

              {/* Commandes récentes */}
              {supplier.commandesRecentes && supplier.commandesRecentes.length > 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                      <Icon name="Package" size={14} className="text-primary dark:text-blue-400" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Commandes récentes ({supplier.commandesRecentes.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto max-h-[200px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                        <tr>
                          <th className="text-left py-2 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Commande</th>
                          <th className="text-left py-2 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="text-right py-2 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Montant</th>
                          <th className="text-center py-2 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                        {Array.isArray(supplier.commandesRecentes) && supplier.commandesRecentes.map((commande, index) => {
                          if (!commande || typeof commande !== 'object') return null;
                          return (
                            <tr key={commande.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">{commande.numeroCommande || '—'}</td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{formatDate(commande.dateCommande)}</td>
                              <td className="py-2 px-3 text-right font-semibold text-slate-900 dark:text-white tabular-nums">{formatCurrency(commande.montantTotal || 0)}</td>
                              <td className="py-2 px-3 text-center">{getStatusBadge(commande.statut)}</td>
                            </tr>
                          );
                        }).filter(Boolean)}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-xs text-slate-500 dark:text-slate-400">
              Aucune donnée disponible
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 p-3 border-t border-slate-200 dark:border-slate-700">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
          <div className="flex items-center gap-2">
            {supplier && onEdit && (
              <Button
                variant="outline"
                size="sm"
                iconName="Edit2"
                onClick={() => {
                  onClose();
                  onEdit(supplier);
                }}
              >
                Modifier
              </Button>
            )}
            {supplier && onCreateOrder && (
              <Button
                variant="default"
                size="sm"
                iconName="ShoppingCart"
                onClick={() => {
                  onClose();
                  onCreateOrder(supplier.id, supplier.name || supplier.nom);
                }}
              >
                Créer une commande
              </Button>
            )}
          </div>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default SupplierDetailsModal;

