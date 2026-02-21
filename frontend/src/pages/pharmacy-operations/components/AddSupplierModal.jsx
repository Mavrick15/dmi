import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import AnimatedModal from '../../../components/ui/AnimatedModal';
import { useToast } from '../../../contexts/ToastContext';
import { usePharmacyMutations } from '../../../hooks/usePharmacy';

const AddSupplierModal = ({ isOpen, onClose, onSuccess, supplierToEdit = null }) => {
  // Initialisation du formulaire
  const initialData = { 
    nom: '', 
    contactNom: '', 
    email: '', 
    telephone: '', 
    adresse: '', 
    delaiLivraisonMoyen: '2' // Valeur par défaut 
  };

  const [formData, setFormData] = useState(initialData);
  const { showToast } = useToast();
  const { addSupplier, updateSupplier } = usePharmacyMutations();
  const closeButtonRef = useRef(null);
  const firstInputRef = useRef(null);
  
  // État de chargement basé sur les mutations
  const isLoading = addSupplier.isPending || updateSupplier.isPending;

  // Charger les données du fournisseur à éditer
  useEffect(() => {
    if (isOpen) {
      if (supplierToEdit) {
        setFormData({
          nom: supplierToEdit.nom || supplierToEdit.name || '',
          contactNom: supplierToEdit.contactNom || supplierToEdit.contact_nom || '',
          email: supplierToEdit.email || '',
          telephone: supplierToEdit.telephone || '',
          adresse: supplierToEdit.adresse || '',
          delaiLivraisonMoyen: String(supplierToEdit.delaiLivraisonMoyen || supplierToEdit.delai_livraison_moyen || 2)
        });
      } else {
        setFormData(initialData);
      }
    }
  }, [isOpen, supplierToEdit]);

  // Focus automatique sur le bouton de fermeture ou le premier input
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        } else if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // 1. Validation basique
    if (!formData.nom || !formData.email) {
        showToast("Le nom de l'entreprise et l'email sont obligatoires.", 'error'); // <--- TOAST ERREUR
        return;
    }

    try {
        // 2. Préparation du payload
        const payload = {
            nom: formData.nom,
            contactNom: formData.contactNom,
            email: formData.email,
            telephone: formData.telephone,
            adresse: formData.adresse,
            // Convertir en nombre ou utiliser la valeur par défaut sécurisée
            delaiLivraisonMoyen: parseInt(formData.delaiLivraisonMoyen) || 2
        };

        // 3. Utiliser le hook de mutation pour la création ou la mise à jour
        if (supplierToEdit) {
          await updateSupplier.mutateAsync({ id: supplierToEdit.id, ...payload });
        } else {
        await addSupplier.mutateAsync(payload);
        }

        // 4. Le toast et l'invalidation sont gérés par le hook
        setFormData(initialData);
        onSuccess(); // Déclenche le rafraîchissement dans le parent
        onClose();
    } catch (error) {
        // L'erreur est gérée par le hook et affichée via toast
    }
  };

  const inputStyle = "glass-surface text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} usePortal={true}>
      <div className="backdrop-blur-xl bg-white/50 dark:bg-white/10 w-full max-w-4xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
           <div>
             <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
               <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                  <Icon name="Truck" size={20} />
               </div>
               {supplierToEdit ? 'Modifier le fournisseur' : 'Nouveau Fournisseur'}
             </h2>
             <p className="text-sm text-slate-500 dark:text-slate-400 ml-1">
               {supplierToEdit ? 'Modifier les informations' : 'Ajouter un partenaire'}
             </p>
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

        {/* Formulaire */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
           <Input 
              ref={firstInputRef}
              label="Nom de l'entreprise *" 
              placeholder="Ex: PharmaDistri Sud" 
              value={formData.nom} 
              onChange={e => handleChange('nom', e.target.value)} 
              className={inputStyle} 
           />
           
           <Input 
              label="Nom du contact" 
              placeholder="Ex: Jean Dupont" 
              value={formData.contactNom} 
              onChange={e => handleChange('contactNom', e.target.value)} 
              className={inputStyle} 
           />

           <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Email Contact *" 
                type="email" 
                placeholder="contact@pharma.com"
                value={formData.email} 
                onChange={e => handleChange('email', e.target.value)} 
                className={inputStyle} 
              />
              <Input 
                label="Téléphone" 
                type="tel" 
                placeholder="01 23 45 67 89"
                value={formData.telephone} 
                onChange={e => handleChange('telephone', e.target.value)} 
                className={inputStyle} 
              />
           </div>
           
           <Input 
              label="Adresse complète" 
              placeholder="123 Zone Industrielle, Paris"
              value={formData.adresse} 
              onChange={e => handleChange('adresse', e.target.value)} 
              className={inputStyle} 
           />
           
           <div className="p-4 glass-surface rounded-xl">
              <Input 
                label="Délai de livraison moyen (jours)" 
                type="number" 
                value={formData.delaiLivraisonMoyen} 
                onChange={e => handleChange('delaiLivraisonMoyen', e.target.value)} 
                placeholder="Ex: 2" 
                min="1" 
                className={inputStyle} 
              />
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                <Icon name="Info" size={12} /> Sert à calculer les dates d'estimation de réception.
              </p>
           </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
           <Button variant="ghost" onClick={onClose} disabled={isLoading}>Annuler</Button>
           <Button 
               variant="default" 
               onClick={handleSubmit} 
               loading={isLoading}
               disabled={!formData.nom || !formData.email || isLoading}
               iconName="Save"
               className="shadow-lg shadow-primary/20"
           >
               {supplierToEdit ? 'Mettre à jour' : 'Enregistrer'}
           </Button>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default AddSupplierModal;