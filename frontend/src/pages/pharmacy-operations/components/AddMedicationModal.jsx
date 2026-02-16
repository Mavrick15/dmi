import React, { useState, useEffect } from 'react';
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

const AddMedicationModal = ({ isOpen, onClose, onSuccess, medicationToEdit = null }) => {
  const { hasPermission } = usePermissions();
  const { getSymbol } = useCurrency();
  const initialData = {
    nom: '',
    principeActif: '',
    dosage: '',
    forme: 'Comprimé',
    fabricant: '',
    prixUnitaire: '',
    stockActuel: '',
    stockMinimum: 10,
    dateExpiration: '',
    prescriptionRequise: true,
  };

  const [formData, setFormData] = useState(initialData);
  const { showToast } = useToast();
  const { addMedication, updateMedication } = usePharmacyMutations();
  
  // État de chargement basé sur les mutations
  const loading = addMedication.isPending || updateMedication.isPending;

  useEffect(() => {
    if (isOpen) {
      if (medicationToEdit) {
        // MAPPING DES DONNÉES TABLE -> FORMULAIRE
        setFormData({
          nom: medicationToEdit.name || '',
          principeActif: medicationToEdit.principeActif || '',
          dosage: medicationToEdit.dosage || '',
          forme: medicationToEdit.category || 'Comprimé',
          fabricant: medicationToEdit.supplier || '',
          prixUnitaire: medicationToEdit.unitCost || '',
          stockActuel: medicationToEdit.currentStock || 0,
          stockMinimum: medicationToEdit.minStock || 10,
          dateExpiration: medicationToEdit.expiryDate || '',
          prescriptionRequise: medicationToEdit.prescriptionRequise ?? true 
        });
      } else {
        setFormData(initialData);
      }
    }
  }, [isOpen, medicationToEdit]);

  const formOptions = {
    forme: [
      { value: 'Comprimé', label: 'Comprimé / Gélule' },
      { value: 'Sirop', label: 'Sirop / Liquide' },
      { value: 'Injection', label: 'Injection / Solution' },
      { value: 'Topique', label: 'Topique / Crème' },
      { value: 'Divers', label: 'Autre / Divers' }
    ],
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.nom) {
        showToast("Le nom est obligatoire.", 'error'); // <--- TOAST ERREUR
        return;
    }

    try {
        const payload = {
            ...formData,
            // Conversion des types pour l'API
            prixUnitaire: parseFloat(formData.prixUnitaire) || 0,
            stockActuel: parseInt(formData.stockActuel) || 0,
            stockMinimum: parseInt(formData.stockMinimum) || 0,
            dateExpiration: formData.dateExpiration || null 
        };

        if (medicationToEdit) {
            // Utiliser le hook de mutation pour la mise à jour
            await updateMedication.mutateAsync({ id: medicationToEdit.id, ...payload });
        } else {
            // Utiliser le hook de mutation pour la création
            await addMedication.mutateAsync(payload);
        }
        
        // Le toast et l'invalidation sont gérés par les hooks
        onSuccess();
        onClose();
    } catch (error) {
        // L'erreur est gérée par le hook
        if (process.env.NODE_ENV === 'development') {
          console.error("Erreur:", error);
        }
    }
  };

  const inputClassName = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white";

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
           <div>
             <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
               <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Icon name="Pill" size={20} />
               </div>
               {medicationToEdit ? 'Modifier le Médicament' : 'Nouveau Médicament'}
             </h2>
           </div>
           <Button variant="ghost" size="icon" onClick={onClose}><Icon name="X" size={24} /></Button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nom Commercial *" placeholder="Ex: Doliprane" value={formData.nom} onChange={e => handleChange('nom', e.target.value)} className={inputClassName} />
            <Input label="Principe Actif" placeholder="Ex: Paracétamol" value={formData.principeActif} onChange={e => handleChange('principeActif', e.target.value)} className={inputClassName} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Input label="Dosage" placeholder="Ex: 1000mg" value={formData.dosage} onChange={e => handleChange('dosage', e.target.value)} className={inputClassName} />
             <Select label="Forme *" options={formOptions.forme} value={formData.forme} onChange={v => handleChange('forme', v)} buttonClassName={inputClassName} />
             <Input label="Fabricant" placeholder="Labo..." value={formData.fabricant} onChange={e => handleChange('fabricant', e.target.value)} className={inputClassName} />
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input label="Stock Actuel" type="number" placeholder="0" value={formData.stockActuel} onChange={e => handleChange('stockActuel', e.target.value)} className={inputClassName} min="0" />
            <Input label="Seuil Alerte *" type="number" placeholder="10" value={formData.stockMinimum} onChange={e => handleChange('stockMinimum', e.target.value)} className={inputClassName} min="1" />
            <Input label={`Prix Unit. (${getSymbol()})`} type="number" placeholder="0.00" value={formData.prixUnitaire} onChange={e => handleChange('prixUnitaire', e.target.value)} className={inputClassName} min="0" step="0.01" />
            <Input label="Date Exp." type="date" value={formData.dateExpiration} onChange={e => handleChange('dateExpiration', e.target.value)} className={inputClassName} />
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-3 cursor-pointer" onClick={() => handleChange('prescriptionRequise', !formData.prescriptionRequise)}>
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.prescriptionRequise ? 'bg-primary border-primary' : 'bg-white border-slate-300'}`}>
                {formData.prescriptionRequise && <Icon name="Check" size={14} className="text-white" />}
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 select-none">Ordonnance requise</span>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
           <Button variant="ghost" onClick={onClose} disabled={loading}>Annuler</Button>
           <Button 
               variant="default" 
               onClick={handleSubmit} 
               loading={loading}
               disabled={!formData.nom || !formData.dosage || loading || !hasPermission(medicationToEdit ? 'medication_edit' : 'medication_create')}
               iconName="Save"
               className="shadow-lg shadow-primary/20"
           >
               {medicationToEdit ? 'Mettre à jour' : 'Enregistrer'}
           </Button>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default AddMedicationModal;
