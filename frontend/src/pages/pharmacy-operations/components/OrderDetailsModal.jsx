import React, { useState, useEffect, useRef } from 'react';
import api from '../../../lib/axios';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import AnimatedModal from '../../../components/ui/AnimatedModal';
import { useToast } from '../../../contexts/ToastContext';
import { useCurrency } from '../../../contexts/CurrencyContext';

const OrderDetailsModal = ({ isOpen, onClose, orderId }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { formatCurrency } = useCurrency();
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    } else {
      setOrder(null);
    }
  }, [isOpen, orderId]);

  // Focus automatique sur le bouton de fermeture quand la modale s'ouvre
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      // Petit délai pour s'assurer que la modale est rendue
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/pharmacy/orders/${orderId}`);
      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        showToast('Erreur lors du chargement des détails de la commande', 'error');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors du chargement des détails:', error);
      }
      showToast(
        error.response?.data?.message || 'Erreur lors du chargement des détails de la commande',
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
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
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
      },
      brouillon: {
        color: 'bg-slate-50 dark:bg-slate-900/20',
        text: 'text-slate-700 dark:text-slate-400',
        icon: 'FileText',
        label: 'Brouillon'
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
        ref={modalRef}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Icon name="FileText" size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Détails de la commande
              </h2>
              {order && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {order.orderNumber}
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
          ) : order ? (
            <div className="space-y-4">
              {/* Informations générales */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                    Statut
                  </div>
                  {getStatusBadge(order.status)}
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                    Montant total
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatCurrency(order.totalAmount)}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                    Date de commande
                  </div>
                  <div className="text-xs font-medium text-slate-900 dark:text-white">
                    {formatDate(order.date)}
                  </div>
                </div>
                {order.deliveryDate && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                      Date de livraison estimée
                    </div>
                    <div className="text-xs font-medium text-slate-900 dark:text-white">
                      {formatDate(order.deliveryDate)}
                    </div>
                  </div>
                )}
              </div>

              {/* Fournisseur */}
              {order.supplier && (
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 border border-blue-100 dark:border-blue-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Truck" size={14} className="text-blue-600 dark:text-blue-400" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                      Fournisseur
                    </h3>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {order.supplier.nom}
                    </div>
                    {order.supplier.email && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Icon name="Mail" size={12} />
                        {order.supplier.email}
                      </div>
                    )}
                    {order.supplier.telephone && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Icon name="Phone" size={12} />
                        {order.supplier.telephone}
                      </div>
                    )}
                    {order.supplier.adresse && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Icon name="MapPin" size={12} />
                        {order.supplier.adresse}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Créateur */}
              {order.createdBy && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                    Créée par
                  </div>
                  <div className="text-xs font-medium text-slate-900 dark:text-white">
                    {order.createdBy.nomComplet}
                    {order.createdBy.email && (
                      <span className="text-slate-500 dark:text-slate-400 ml-1.5">
                        ({order.createdBy.email})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Lignes de commande */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="Package" size={14} className="text-slate-600 dark:text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    Articles ({order.lines?.length || 0})
                  </h3>
                </div>
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="text-left py-2 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Médicament
                          </th>
                          <th className="text-center py-2 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Qté cmd
                          </th>
                          <th className="text-center py-2 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Qté reçue
                          </th>
                          <th className="text-right py-2 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Prix unit.
                          </th>
                          <th className="text-right py-2 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {order.lines && order.lines.length > 0 ? (
                          order.lines.map((line, index) => (
                            <tr key={line.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="py-2 px-3">
                                <div className="font-medium text-xs text-slate-900 dark:text-white">
                                  {line.medicament?.nom || 'Médicament inconnu'}
                                </div>
                                {line.medicament?.code && (
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {line.medicament.code}
                                  </div>
                                )}
                                {line.medicament?.forme && (
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {line.medicament.forme}
                                    {line.medicament.dosage && ` - ${line.medicament.dosage}`}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center text-xs font-medium text-slate-900 dark:text-white">
                                {line.quantiteCommandee}
                              </td>
                              <td className="py-2 px-3 text-center text-xs font-medium text-slate-900 dark:text-white">
                                <span className={line.quantiteRecue < line.quantiteCommandee ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                                  {line.quantiteRecue}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right text-xs text-slate-700 dark:text-slate-300">
                                {formatCurrency(line.prixUnitaireAchat)}
                              </td>
                              <td className="py-2 px-3 text-right text-xs font-semibold text-slate-900 dark:text-white">
                                {formatCurrency(line.total)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                              Aucune ligne de commande
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-xs text-slate-500 dark:text-slate-400">
              Aucune donnée disponible
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default OrderDetailsModal;

