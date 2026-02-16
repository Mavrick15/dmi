import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import AnimatedModal from '../../../components/ui/AnimatedModal';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { Checkbox } from '../../../components/ui/Checkbox';
import { AlertCircle } from 'lucide-react'; 

const EstablishmentModal = ({ isOpen, onClose, onSave, establishment = null }) => {
  const { hasPermission } = usePermissions();
  const [formData, setFormData] = useState({
    nom: '', adresse: '', telephone: '', email: '', typeEtablissement: 'hopital', numeroAgrement: '', actif: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);

  // Charger les données de l'établissement si en mode édition
  useEffect(() => {
    if (isOpen) {
      if (establishment) {
        setFormData({
          nom: establishment.nom || '',
          adresse: establishment.adresse || '',
          telephone: establishment.telephone || '',
          email: establishment.email || '',
          typeEtablissement: establishment.typeEtablissement || 'hopital',
          numeroAgrement: establishment.numeroAgrement || '',
          actif: establishment.actif !== undefined ? establishment.actif : true
        });
      } else {
        setFormData({
          nom: '', adresse: '', telephone: '', email: '', typeEtablissement: 'hopital', numeroAgrement: '', actif: true
        });
      }
      setErrors({});
      setGlobalError(null);
    }
  }, [isOpen, establishment]);

  const types = [
    { value: 'hopital', label: 'Hôpital Public' },
    { value: 'clinique', label: 'Clinique Privée' },
    { value: 'cabinet', label: 'Cabinet Médical' },
    { value: 'laboratoire', label: 'Laboratoire d\'Analyses' },
    { value: 'pharmacie', label: 'Pharmacie' },
    { value: 'centre_sante', label: 'Centre de Santé' }
  ];

  const handleSubmit = async () => {
    setErrors({});
    setGlobalError(null);

    // Validation simple
    if (!formData.nom.trim()) {
        setErrors({ nom: 'Le nom de l\'établissement est requis.' });
        return;
    }

    setLoading(true);
    
    try {
        // Appelle la fonction onSave du parent (qui fait l'appel API)
        await onSave(formData);
        
        // Si on arrive ici, c'est un succès. On reset et on ferme.
        setFormData({ nom: '', adresse: '', telephone: '', email: '', typeEtablissement: 'hopital', numeroAgrement: '', actif: true });
        onClose();
        
    } catch (error) {
        // Notre intercepteur axios met le message dans 'userMessage'
        // Mais pour les codes d'erreur spécifiques (ex: 409 Conflit), on peut affiner ici.
        
        const responseData = error.response?.data?.error;
        const statusCode = error.response?.status;
        
        // Gestion du conflit (Doublon de nom)
        if (statusCode === 409 || responseData?.code === '23505' || responseData?.code === 'CONFLICT') {
            setErrors(prev => ({ ...prev, nom: "Un établissement avec ce nom existe déjà." }));
            setGlobalError("Conflit : Cet établissement existe déjà.");
        } 
        // Erreur de validation (422)
        else if (statusCode === 422 && responseData?.details) {
             setGlobalError("Veuillez vérifier les champs du formulaire.");
             // Si le backend renvoie des détails, on pourrait mapper les champs ici
        }
        // Erreur générique
        else {
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
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-start">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                <Icon name="Building2" size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {establishment ? 'Modifier l\'Établissement' : 'Nouvel Établissement'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {establishment ? 'Modifiez les détails du centre médical.' : 'Configurez les détails du centre médical.'}
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
                <AlertCircle size={20} />
                {globalError}
             </div>
          )}

          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Icon name="FileText" size={14} /> Identité de la structure
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div className="md:col-span-2">
                    <Input 
                        label="Nom de l'établissement *" 
                        placeholder="Ex: Clinique du Parc" 
                        value={formData.nom} 
                        onChange={e => handleInputChange('nom', e.target.value)} 
                        error={errors.nom} 
                        className={inputStyle} 
                        autoFocus
                    />
                 </div>
                 <Select 
                    label="Type de structure" 
                    options={types} 
                    value={formData.typeEtablissement} 
                    onChange={v => handleInputChange('typeEtablissement', v)} 
                    buttonClassName={inputStyle} 
                />
                 <Input 
                    label="N° Agrément / FINESS" 
                    placeholder="Optionnel"
                    value={formData.numeroAgrement} 
                    onChange={e => handleInputChange('numeroAgrement', e.target.value)} 
                    className={inputStyle} 
                />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Icon name="MapPin" size={14} /> Coordonnées & Contact
            </h3>
            
            <div className="space-y-4">
                <Input 
                    label="Adresse complète" 
                    placeholder="123 Avenue de la Santé, 75000 Paris"
                    value={formData.adresse} 
                    onChange={e => handleInputChange('adresse', e.target.value)} 
                    className={inputStyle} 
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input 
                        label="Téléphone standard" 
                        type="tel"
                        placeholder="+33 1 23 45 67 89"
                        value={formData.telephone} 
                        onChange={e => handleInputChange('telephone', e.target.value)} 
                        className={inputStyle} 
                    />
                    <Input 
                        label="Email professionnel" 
                        type="email"
                        placeholder="contact@clinique.com"
                        value={formData.email} 
                        onChange={e => handleInputChange('email', e.target.value)} 
                        className={inputStyle} 
                    />
                </div>
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
                Établissement actif
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
              {establishment ? 'Enregistrer les modifications' : 'Créer l\'établissement'}
            </Button>
          </PermissionGuard>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default EstablishmentModal;