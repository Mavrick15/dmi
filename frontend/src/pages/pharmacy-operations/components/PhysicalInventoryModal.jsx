// openclinic/frontend/src/pages/pharmacy-operations/components/PhysicalInventoryModal.jsx

import React, { useState, useEffect } from 'react';
import api from '../../../lib/axios';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import AnimatedModal from '../../../components/ui/AnimatedModal';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { useToast } from '../../../contexts/ToastContext';
import { usePharmacyMutations } from '../../../hooks/usePharmacy';

const PhysicalInventoryModal = ({ isOpen, onClose, onSuccess }) => {
  const { hasPermission } = usePermissions();
  const [productsOptions, setProductsOptions] = useState([]);
  const [selectedMedId, setSelectedMedId] = useState('');
  const [realQuantity, setRealQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemStock, setSystemStock] = useState(0);

  const { showToast } = useToast();
  const { adjustStock } = usePharmacyMutations();

  // --- LOGIQUE D'ÉTAT ---
  const difference = realQuantity ? parseInt(realQuantity) - systemStock : 0;
  
  const reasons = [
    { value: 'correction', label: 'Erreur de comptage' },
    { value: 'loss', label: 'Perte / Vol' },
    { value: 'expired', label: 'Péremption (Destruction)' },
    { value: 'damage', label: 'Produit endommagé' }
  ];

  // --- EFFET DE CHARGEMENT DES PRODUITS (AUTOSUGGEST) ---
  useEffect(() => {
    if (isOpen) {
        setLoading(true);
        // Charger la liste des produits (le backend retourne une liste avec stock)
        api.get('/pharmacy/search?q=').then(res => {
            setProductsOptions(res.data.data);
            setLoading(false);
        }).catch(() => {
            setLoading(false);
            showToast("Échec du chargement de la liste des produits.", 'error'); // <--- FEEDBACK ERREUR
        });
        
        // Réinitialiser les champs à l'ouverture
        setSelectedMedId('');
        setRealQuantity('');
        setReason('');
        setSystemStock(0);
    }
  }, [isOpen]);

  // --- EFFET DE MISE À JOUR DU STOCK SYSTÈME ---
  useEffect(() => {
    const selectedProduct = Array.isArray(productsOptions) ? productsOptions.find(p => p && p.value === selectedMedId) : null;
    if (selectedProduct) {
        // Extraction du stock actuel à partir du label (ex: "Amox... - Stock: 45")
        const match = selectedProduct.label.match(/Stock: (\d+)/);
        setSystemStock(match ? parseInt(match[1]) : 0);
        setRealQuantity(''); // Réinitialiser la quantité comptée
        setReason('');
    } else {
        setSystemStock(0);
    }
  }, [selectedMedId, productsOptions]);

  // --- GESTIONNAIRE DE SOUMISSION ---
  const handleSubmit = async () => {
    if (!selectedMedId || realQuantity === '') {
      showToast("Veuillez sélectionner un produit et entrer une quantité réelle.", 'warning'); // <--- FEEDBACK AVERTISSEMENT
      return;
    }
    if (difference !== 0 && !reason) {
       showToast("Veuillez sélectionner le motif de l'ajustement.", 'warning'); // <--- FEEDBACK AVERTISSEMENT
       return;
    }

    setLoading(true);
    try {
        const payload = {
            medicamentId: selectedMedId,
            realQuantity: parseInt(realQuantity),
            reason: reason // Sera inclus seulement si difference != 0
        };

        await adjustStock.mutateAsync(payload);
        
        // Le toast et l'invalidation sont gérés par le hook
        onSuccess();
        onClose();
    } catch (error) {
        // L'erreur est gérée par le hook
        if (process.env.NODE_ENV === 'development') {
          console.error(error);
        }
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClassName = "glass-surface text-slate-900 dark:text-white";

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div className="backdrop-blur-xl bg-white/50 dark:bg-white/10 w-full max-w-4xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
           <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
             <Icon name="ClipboardList" className="text-amber-500" /> Inventaire Physique
           </h2>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
           <Select 
              label="Produit à vérifier"
              options={productsOptions}
              value={selectedMedId}
              onChange={setSelectedMedId}
              placeholder={loading ? "Chargement des produits..." : "Scanner ou chercher un produit..."}
              buttonClassName={inputClassName}
              searchable
              loading={loading}
              disabled={loading}
           />

           {selectedMedId && (
             <div className="p-4 glass-surface rounded-xl grid grid-cols-2 gap-6 animate-fade-in">
                <div>
                    <span className="text-xs text-slate-500 uppercase font-bold">Stock Système (Théorique)</span>
                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-200 mt-1">{systemStock}</p>
                </div>
                <div>
                    <span className="text-xs text-slate-500 uppercase font-bold">Écart</span>
                    <p className={`text-2xl font-bold mt-1 ${difference < 0 ? 'text-rose-500' : difference > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {difference > 0 ? '+' : ''}{difference}
                    </p>
                </div>
             </div>
           )}

           <Input 
              label="Quantité Réelle (Comptée)"
              type="number"
              value={realQuantity}
              onChange={(e) => setRealQuantity(e.target.value)}
              className={`text-lg font-bold ${inputClassName}`}
              autoFocus
              disabled={!selectedMedId}
           />

           {/* Le motif n'est requis que s'il y a un écart */}
           {difference !== 0 && (
              <Select 
                label="Motif de l'ajustement"
                options={reasons}
                value={reason}
                onChange={setReason}
                placeholder="Sélectionner la raison de l'écart..."
                buttonClassName={inputClassName}
              />
           )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={loading}>Annuler</Button>
            <Button 
                variant="default" 
                onClick={handleSubmit} 
                loading={loading} 
                disabled={!selectedMedId || realQuantity === '' || (difference !== 0 && !reason)}
                className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
            >
                Confirmer l'ajustement
            </Button>
        </div>

      </div>
    </AnimatedModal>
  );
};

export default PhysicalInventoryModal;