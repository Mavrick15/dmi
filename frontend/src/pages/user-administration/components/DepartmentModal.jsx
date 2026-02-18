import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import AnimatedModal from '../../../components/ui/AnimatedModal';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { Checkbox } from '../../../components/ui/Checkbox';

const DepartmentModal = ({ isOpen, onClose, onSave, department = null }) => {
  const { hasPermission } = usePermissions();
  const [formData, setFormData] = useState({
    nom: '', 
    code: '', 
    description: '', 
    couleur: '#3B82F6', 
    actif: true,
    ordreAffichage: 0
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);

  // Charger les données du département si en mode édition
  useEffect(() => {
    if (isOpen) {
      if (department) {
        setFormData({
          nom: department.nom || '',
          code: department.code || '',
          description: department.description || '',
          couleur: department.couleur || '#3B82F6',
          actif: department.actif !== undefined ? department.actif : true,
          ordreAffichage: department.ordreAffichage || department.ordre_affichage || 0
        });
      } else {
        setFormData({
          nom: '', 
          code: '', 
          description: '', 
          couleur: '#3B82F6', 
          actif: true,
          ordreAffichage: 0
        });
      }
      setErrors({});
      setGlobalError(null);
    }
  }, [isOpen, department]);

  const handleSubmit = async () => {
    setErrors({});
    setGlobalError(null);

    // Validation
    if (!formData.nom.trim()) {
      setErrors({ nom: 'Le nom du département est requis.' });
      return;
    }
    if (!formData.code.trim()) {
      setErrors({ code: 'Le code du département est requis.' });
      return;
    }
    if (formData.code.length > 20) {
      setErrors({ code: 'Le code ne doit pas dépasser 20 caractères.' });
      return;
    }

    setLoading(true);
    
    try {
      await onSave(formData);
      setFormData({ nom: '', code: '', description: '', couleur: '#3B82F6', actif: true, ordreAffichage: 0 });
      onClose();
    } catch (error) {
      // Erreur gérée par l'intercepteur axios et affichée via globalError
      
      const responseData = error.response?.data?.error;
      const statusCode = error.response?.status;
      
      if (statusCode === 409 || responseData?.code === '23505' || responseData?.code === 'CONFLICT') {
        if (responseData?.message?.includes('nom')) {
          setErrors(prev => ({ ...prev, nom: "Un département avec ce nom existe déjà." }));
        } else if (responseData?.message?.includes('code')) {
          setErrors(prev => ({ ...prev, code: "Un département avec ce code existe déjà." }));
        }
        setGlobalError("Conflit : Ce département existe déjà.");
      } else if (statusCode === 422 && responseData?.details) {
        setGlobalError("Veuillez vérifier les champs du formulaire.");
      } else {
        setGlobalError(error.userMessage || "Une erreur technique est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    if (globalError) setGlobalError(null);
  };

  if (!isOpen) return null;

  const inputStyle = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-start">
          <div className="flex gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary border border-slate-200 dark:border-slate-700">
              <Icon name="Building2" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {department ? 'Modifier le Département' : 'Nouveau Département'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {department ? 'Modifiez les détails du département.' : 'Configurez un nouveau département médical.'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading} className="text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full">
            <Icon name="X" size={20} />
          </Button>
        </div>
        
        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
          
          {globalError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-medium animate-pulse">
              <Icon name="AlertCircle" size={20} />
              {globalError}
            </div>
          )}

          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Icon name="FileText" size={14} /> Informations du département
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Input 
                  label="Nom du département *" 
                  placeholder="Ex: Cardiologie" 
                  value={formData.nom} 
                  onChange={e => handleInputChange('nom', e.target.value)} 
                  error={errors.nom} 
                  className={inputStyle} 
                  autoFocus
                />
              </div>
              <Input 
                label="Code *" 
                placeholder="Ex: CARDIO" 
                value={formData.code} 
                onChange={e => handleInputChange('code', e.target.value.toUpperCase())} 
                error={errors.code} 
                className={inputStyle}
                maxLength={20}
              />
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Couleur
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.couleur}
                    onChange={e => handleInputChange('couleur', e.target.value)}
                    className="w-16 h-10 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
                  />
                  <Input 
                    value={formData.couleur} 
                    onChange={e => handleInputChange('couleur', e.target.value)} 
                    className={inputStyle}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  placeholder="Description du département..."
                  rows={3}
                  className={`w-full px-4 py-2 rounded-xl ${inputStyle}`}
                />
              </div>
              <Input 
                label="Ordre d'affichage" 
                type="number"
                placeholder="0" 
                value={formData.ordreAffichage} 
                onChange={e => handleInputChange('ordreAffichage', parseInt(e.target.value) || 0)} 
                className={inputStyle}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Icon name="Settings" size={14} /> Statut
            </h3>
            
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <Checkbox
                checked={formData.actif}
                onCheckedChange={(checked) => handleInputChange('actif', checked)}
                id="actif"
              />
              <label htmlFor="actif" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                Département actif
              </label>
            </div>
          </section>

        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800">
            Annuler
          </Button>
          <PermissionGuard requiredPermission="settings_manage">
            <Button onClick={handleSubmit} loading={loading} iconName="Check" className="shadow-lg shadow-primary/20" disabled={!hasPermission('settings_manage')}>
              {department ? 'Enregistrer les modifications' : 'Créer le département'}
            </Button>
          </PermissionGuard>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default DepartmentModal;

