import React, { useState, useEffect, useRef } from 'react';
import api from '../../../lib/axios';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import AnimatedModal from '../../../components/ui/AnimatedModal';
import { useToast } from '../../../contexts/ToastContext';
import { usePharmacyMutations } from '../../../hooks/usePharmacy';
import { useCurrency } from '../../../contexts/CurrencyContext';

const CreateOrderModal = ({ isOpen, onClose, onSuccess, preselectedSupplier = null }) => {
  const { hasPermission } = usePermissions();
  const { formatCurrency, getSymbol } = useCurrency();
  const [suppliers, setSuppliers] = useState([]);
  const [medications, setMedications] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState([{ id: Date.now(), medicamentId: '', quantity: 1, price: 0 }]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const { showToast } = useToast();
  const { createOrder } = usePharmacyMutations();
  const closeButtonRef = useRef(null);

  // Focus automatique sur le bouton de fermeture quand la modale s'ouvre
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // --- CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    if (isOpen) {
        setLoadingData(true);
        // Réinitialisation ou utilisation du fournisseur présélectionné
        setSupplierId(preselectedSupplier?.id || '');
        setItems([{ id: Date.now(), medicamentId: '', quantity: 1, price: 0 }]);

        const fetchData = async () => {
            try {
                // On récupère tout en parallèle
                const [resSuppliers, resMeds] = await Promise.all([
                    api.get('/suppliers'), 
                    api.get('/pharmacy/search?q=') 
                ]);
                
                // Formatage pour le composant Select { value, label }
                const suppliersData = Array.isArray(resSuppliers.data.data) ? resSuppliers.data.data : [];
                const formattedSuppliers = suppliersData.map(s => {
                  if (!s || typeof s !== 'object') return null;
                  return {
                    value: s.id, 
                    label: s.name || s.nom || ''
                  };
                }).filter(Boolean);
                setSuppliers(formattedSuppliers);
                
                // Si un fournisseur est présélectionné, l'utiliser
                if (preselectedSupplier?.id) {
                    setSupplierId(preselectedSupplier.id);
                }
                
                setMedications(resMeds.data.data || []); 

            } catch (e) { 
                if (process.env.NODE_ENV === 'development') {
                  if (process.env.NODE_ENV === 'development') {
                  console.error("Erreur chargement données commande:", e);
                }
                }
                showToast("Erreur: Impossible de charger les données fournisseurs ou médicaments.", 'error'); // <--- TOAST ERREUR
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }
  }, [isOpen, preselectedSupplier, showToast]);

  // --- GESTION DES LIGNES ---
  const addItem = () => {
    setItems(prev => [...prev, { id: Date.now(), medicamentId: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (id) => {
    setItems(prev => Array.isArray(prev) ? prev.filter(item => item && item.id !== id) : []);
  };

  const updateItem = (id, field, value) => {
    setItems(prev => Array.isArray(prev) ? prev.map(item => {
      if (!item || typeof item !== 'object') return item;
      if (item.id === id) {
        let newValue = value;
        if (field === 'quantity' || field === 'price') {
          // S'assurer que la quantité/prix est au moins 0
          newValue = parseFloat(value) >= 0 ? parseFloat(value) : 0; 
        }
        return { ...item, [field]: newValue };
      }
      return item;
    }) : []);
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.price)), 0);
  };

  // --- SOUMISSION ---
  const handleSubmit = async () => {
    // Validation
    if (!supplierId) {
        showToast("Veuillez sélectionner un fournisseur.", 'error'); // <--- TOAST ERREUR
        return;
    }

    const validItems = Array.isArray(items) ? items.filter(i => i && i.medicamentId && i.quantity > 0 && i.price >= 0) : [];
    if (validItems.length === 0) {
        showToast("Veuillez ajouter au moins un médicament avec une quantité positive.", 'error'); // <--- TOAST ERREUR
        return;
    }

    setLoading(true);
    try {
        const payload = {
            fournisseurId: supplierId,
            items: Array.isArray(validItems) ? validItems.map(i => {
              if (!i || typeof i !== 'object') return null;
              return { 
                medicamentId: i.medicamentId, 
                quantity: Number(i.quantity), 
                price: Number(i.price) 
              };
            }).filter(Boolean) : []
        };
        
        // Utiliser le hook de mutation pour la création
        await createOrder.mutateAsync(payload);
        
        // Le toast et l'invalidation sont gérés par le hook
        onSuccess();
        onClose();
    } catch (error) {
        // L'erreur est déjà gérée par le hook avec toast
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur création commande:', error);
        }
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClassName = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-primary/20";

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <Icon name="ShoppingCart" size={20} />
                </div>
                Nouvelle Commande
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 ml-1">Créer un bon de commande fournisseur</p>
          </div>
          <Button 
            ref={closeButtonRef}
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            aria-label="Fermer"
          >
            <Icon name="X" size={24} />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          
          {/* Sélection Fournisseur & Total */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
             <div className="md:col-span-1">
               <Select 
                  label="Fournisseur *" 
                  options={suppliers} 
                  value={supplierId} 
                  onChange={setSupplierId} 
                  placeholder={loadingData ? "Chargement..." : "Sélectionner un fournisseur..."}
                  buttonClassName={inputClassName}
                  disabled={loadingData}
                  error={!supplierId && !loadingData ? "Obligatoire" : ""}
               />
             </div>
             
             <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center h-full">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Total Estimé</span>
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(calculateTotal())}</span>
             </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>

          {/* Liste des Articles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Articles à commander</h3>
                <Button variant="ghost" size="sm" onClick={addItem} iconName="Plus" className="text-primary hover:bg-primary/10">Ajouter ligne</Button>
            </div>

            <div className="space-y-3">
                {Array.isArray(items) && items.map((item, index) => {
                  if (!item || typeof item !== 'object') return null;
                  return (
                  <div key={item.id} className="flex flex-col md:flex-row gap-3 items-end p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 transition-all hover:border-primary/30">
                    <div className="w-8 flex justify-center items-center pb-3 text-slate-400 font-mono text-xs flex-shrink-0">
                        {index + 1}
                    </div>
                    <div className="flex-1 w-full min-w-[150px]">
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Médicament</label>
                        <Select 
                            placeholder="Rechercher..." 
                            options={medications} 
                            value={item.medicamentId} 
                            onChange={(v) => updateItem(item.id, 'medicamentId', v)}
                            buttonClassName={inputClassName}
                            searchable
                            required={true}
                        />
                    </div>
                    <div className="w-28">
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Quantité</label>
                        <Input 
                            type="number" 
                            value={item.quantity} 
                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                            className={inputClassName}
                            min="1"
                        />
                    </div>
                    <div className="w-32">
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Prix Unit. ({getSymbol()})</label>
                        <Input 
                            type="number" 
                            value={item.price} 
                            onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                            className={inputClassName}
                            min="0" step="0.01"
                        />
                    </div>
                    <div className="w-24 text-right font-mono font-bold text-slate-700 dark:text-slate-300 pb-3">
                        {formatCurrency(item.quantity * item.price)}
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 mb-0.5"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        title="Supprimer cette ligne"
                    >
                        <Icon name="Trash2" size={18} />
                    </Button>
                  </div>
                  );
                }).filter(Boolean)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Annuler</Button>
          <PermissionGuard requiredPermission="order_create">
            <Button 
              variant="default" 
              onClick={handleSubmit} 
              loading={loading} 
              iconName="Send" 
              disabled={!supplierId || (Array.isArray(items) ? items.filter(i => i && i.medicamentId && i.quantity > 0).length : 0) === 0 || loading || !hasPermission('order_create')}
              className="shadow-lg shadow-blue-500/20"
            >
              Envoyer la commande
            </Button>
          </PermissionGuard>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default CreateOrderModal;
