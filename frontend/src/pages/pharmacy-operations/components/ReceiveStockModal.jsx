import React, { useState, useEffect } from 'react';
import api from '../../../lib/axios';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import AnimatedModal from '../../../components/ui/AnimatedModal';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { useToast } from '../../../contexts/ToastContext';
import { usePharmacyMutations } from '../../../hooks/usePharmacy';

const ReceiveStockModal = ({ isOpen, onClose, onSuccess, orderId, onCloseAndReset, onConfirmReceive }) => {
  const { hasPermission } = usePermissions();
  const [selectedOrderId, setSelectedOrderId] = useState(orderId || '');
  const [pendingOrders, setPendingOrders] = useState([]);
  const [orderLines, setOrderLines] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const { showToast } = useToast();
  const { receiveOrder } = usePharmacyMutations();

  // Mettre à jour selectedOrderId si orderId change
  useEffect(() => {
    if (orderId) {
      setSelectedOrderId(orderId);
    }
  }, [orderId]);

  useEffect(() => {
    if (isOpen) {
      setLoadingOrders(true);
      // Ne pas réinitialiser selectedOrderId si orderId est fourni
      if (!orderId) {
        setSelectedOrderId('');
      }
      setOrderLines([]);
      
      api.get('/pharmacy/orders/pending')
        .then(res => {
          if(res.data.success) {
              setPendingOrders(res.data.data);
          } else {
              setPendingOrders([]);
          }
        })
        .catch(e => {
          if (process.env.NODE_ENV === 'development') {
            console.error("Erreur chargement commandes en attente:", e);
          }
          showToast("Échec du chargement des commandes en attente.", 'error');
          setPendingOrders([]);
        })
        .finally(() => setLoadingOrders(false));
    }
  }, [isOpen, showToast, orderId]);

  useEffect(() => {
    const order = Array.isArray(pendingOrders) ? pendingOrders.find(o => o && o.value === selectedOrderId) : null;
    if (order && order.lines && Array.isArray(order.lines)) {
        // Assure-toi que les lignes sont bien des objets avec 'name' pour l'affichage
        setOrderLines(order.lines.map(line => {
          if (!line || typeof line !== 'object') return null;
          return {
             ...line,
             name: line.name || 'Médicament Inconnu', // Sécurité
             // On met la quantité à recevoir par défaut = quantité commandée - quantité reçue
             quantityToReceive: Math.max(0, (typeof line.ordered === 'number' ? line.ordered : 0) - (typeof line.received === 'number' ? line.received : 0)) // S'assurer que c'est >= 0
          };
        }).filter(Boolean));
    } else {
        setOrderLines([]);
    }
  }, [selectedOrderId, pendingOrders]);


  const handleSubmit = async () => {
    // Validation
    if (!selectedOrderId || orderLines.length === 0 || orderLines.every(line => line.quantityToReceive <= 0)) {
      showToast("Veuillez sélectionner une commande avec des articles à recevoir et une quantité positive.", 'warning'); // <--- FEEDBACK AVERTISSEMENT
      return;
    }
    
    // Si onConfirmReceive est fourni, l'utiliser (pour la confirmation via modale)
    // Mais on doit d'abord initialiser confirmAction dans le parent
    if (onConfirmReceive) {
      // On passe l'ID de la commande et son nom pour la confirmation
      const order = pendingOrders.find(o => o.value === selectedOrderId);
      const orderName = order?.label || selectedOrderId.substring(0, 8);
      onConfirmReceive(selectedOrderId, orderName);
      return;
    }
    
    // Sinon, procéder directement à la réception
    setLoadingSubmit(true);
    try {
        // Utiliser le hook de mutation pour la réception
        await receiveOrder.mutateAsync(selectedOrderId);

        // Le toast et l'invalidation sont gérés par le hook
        onSuccess(); // Déclenche le rafraîchissement global (Stats, Inventaire, etc.)
        if (onCloseAndReset) {
          onCloseAndReset();
        }
        onClose();
    } catch (error) {
        // L'erreur est gérée par le hook
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur réception commande:', error);
        }
    } finally {
        setLoadingSubmit(false);
    }
  };

  if (!isOpen) return null;

  const inputClassName = "glass-surface text-slate-900 dark:text-white";

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} usePortal={true}>
      <div className="backdrop-blur-xl bg-white/50 dark:bg-white/10 w-full max-w-4xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
           <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
             <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                 <Icon name="PackageCheck" size={20} />
             </div>
             Validation de Réception
           </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-1">Valider l'entrée des marchandises en stock</p>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
            <Select 
                label="Sélectionner la commande à valider"
                options={pendingOrders}
                value={selectedOrderId}
                onChange={setSelectedOrderId}
                placeholder={loadingOrders ? "Chargement..." : "Choisir une commande..."}
                buttonClassName={inputClassName}
                disabled={loadingOrders || loadingSubmit}
                loading={loadingOrders}
            />

            {selectedOrderId && Array.isArray(orderLines) && orderLines.length > 0 && (
                <div className="space-y-3 animate-fade-in">
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
                        <span>Article</span>
                        <div className="flex gap-16">
                            <span className="w-20 text-center">Commandé</span>
                            <span className="w-20 text-center">Recevoir</span>
                        </div>
                    </div>
                    
                    <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                      {orderLines.map((line) => {
                        if (!line || typeof line !== 'object') return null;
                        return (
                          <div key={line.id || Math.random()} className="flex items-center justify-between p-3 rounded-xl glass-surface transition-all hover:border-emerald-300">
                            <div className="font-medium text-slate-900 dark:text-white flex-1 min-w-0 pr-2">{line.name}</div>
                            <div className="flex items-center gap-16 flex-shrink-0">
                                {/* Quantité Commandée */}
                                <span className="text-slate-500 w-20 text-center">{line.ordered}</span>
                                
                                {/* Quantité à Recevoir */}
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold w-20 text-center">{line.quantityToReceive}</span> 
                            </div>
                          </div>
                        );
                      }).filter(Boolean)}
                    </div>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2 mt-4">
                      <Icon name="CheckCircle" size={16} /> {orderLines.reduce((sum, line) => sum + (line && typeof line.quantityToReceive === 'number' ? line.quantityToReceive : 0), 0)} article(s) en attente de validation de stock.
                    </div>
                </div>
            )}
            {selectedOrderId && orderLines.length === 0 && (
                 <div className="text-center py-8 text-slate-400">Cette commande est déjà marquée comme reçue ou n'a pas de lignes valides à traiter.</div>
            )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loadingSubmit}>Annuler</Button>
          <Button 
            variant="default" 
            onClick={handleSubmit} 
            loading={loadingSubmit}
            iconName="Check" 
            disabled={!selectedOrderId || orderLines.length === 0 || orderLines.every(line => line.quantityToReceive <= 0) || loadingSubmit}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
          >
            Valider la réception
          </Button>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default ReceiveStockModal;
