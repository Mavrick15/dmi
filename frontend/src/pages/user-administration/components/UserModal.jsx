import React, { useState, useEffect, useRef } from 'react';
import api from '../../../lib/axios';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import AnimatedModal from '../../../components/ui/AnimatedModal';
import ImageCropModal from '../../../components/ui/ImageCropModal';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { Checkbox } from '../../../components/ui/Checkbox';
import { AlertCircle, Upload, X } from 'lucide-react';
import Image from '../../../components/AppImage'; 

const UserModal = ({ isOpen, onClose, user = null, onSave }) => {
  const { hasPermission } = usePermissions();
  const [formData, setFormData] = useState({
    nomComplet: '', 
    email: '',
    role: 'docteur', // Valeur par défaut
    department: '',
    phone: '',
    address: '',
    status: 'Active',
    mfaEnabled: false,
    temporaryPassword: '', // Utilisé pour le mot de passe dans le formulaire
    numeroOrdre: '',
    etablissementId: ''
  });

  const [establishments, setEstablishments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const fileInputRef = useRef(null);
  
  // Générer les initiales
  const getInitials = () => {
    const name = formData.nomComplet || user?.name || user?.nomComplet || '';
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Chargement des établissements (Sécurisé)
  useEffect(() => {
    if (isOpen) {
      api.get('/establishments')
        .then(res => {
          if (res.data.success && Array.isArray(res.data.data)) {
            setEstablishments(res.data.data.map(e => {
              if (!e || typeof e !== 'object') return null;
              return { value: e.id, label: e.nom || '' };
            }).filter(Boolean));
          } else {
            setEstablishments([]);
          }
        })
        .catch(err => {
            // Erreur silencieuse - l'utilisateur peut continuer sans établissements
            setEstablishments([]);
        });
      
      // Chargement des départements
      api.get('/departments', { params: { actif: true } })
        .then(res => {
          if (res.data.success && Array.isArray(res.data.data)) {
            setDepartments(res.data.data.map(d => {
              if (!d || typeof d !== 'object') return null;
              return { value: d.id, label: d.nom || '' };
            }).filter(Boolean));
          } else {
            setDepartments([]);
          }
        })
        .catch(err => {
            setDepartments([]);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
        setErrors({});
        setGlobalError(null);
        setAvatarFile(null);
        setAvatarPreview(null);

        if (user) {
          let departmentId = '';
          if (user.departmentId) {
            departmentId = user.departmentId;
          } else if (user.department_id) {
            departmentId = user.department_id;
          } else if (user.department) {
            if (typeof user.department === 'object' && user.department !== null) {
              departmentId = user.department.id || user.department.departmentId || '';
            } else {
              departmentId = user.department;
            }
          }

          let etablissementId = '';
          if (user.etablissementId) {
            etablissementId = user.etablissementId;
          } else if (user.etablissement_id) {
            etablissementId = user.etablissement_id;
          } else if (user.etablissement) {
            if (typeof user.etablissement === 'object' && user.etablissement !== null) {
              etablissementId = user.etablissement.id || user.etablissement.etablissementId || '';
            } else {
              etablissementId = user.etablissement;
            }
          }

          // Gérer le numéro d'ordre avec toutes les variantes possibles
          let numeroOrdre = '';
          if (user.numeroOrdre) {
            numeroOrdre = user.numeroOrdre;
          } else if (user.numero_ordre) {
            numeroOrdre = user.numero_ordre;
          } else if (user.numeroOrdreMedecin) {
            numeroOrdre = user.numeroOrdreMedecin;
          } else if (user.numero_ordre_medecin) {
            numeroOrdre = user.numero_ordre_medecin;
          }

          setFormData({
            nomComplet: user.name || user.nomComplet || user.nom_complet || '', 
            email: user.email || '',
            role: user.role || 'docteur',
            phone: user.phone || user.telephone || '',
            address: user.address || user.adresse || '',
            status: user.status === 'Active' || user.actif === true ? 'Active' : 'Inactive',
            mfaEnabled: user.mfaEnabled || user.mfa_enabled || false,
            temporaryPassword: '',
            numeroOrdre: numeroOrdre,
            etablissementId: etablissementId,
            department: departmentId
          });
          // Charger l'avatar existant si disponible (gérer les deux variantes)
          const avatarUrl = user.avatar || user.photoProfil;
          if (avatarUrl) {
            setAvatarPreview(avatarUrl);
          }
        } else {
          setFormData({
            nomComplet: '', email: '', role: 'docteur', department: '', phone: '', address: '',
            status: 'Active', mfaEnabled: false, temporaryPassword: '',
            numeroOrdre: '', etablissementId: ''
          });
        }
    }
  }, [user, isOpen]);

  const roleOptions = [
    { value: 'docteur', label: 'Médecin / Docteur' },
    { value: 'infirmiere', label: 'Infirmier(e)' },
    { value: 'admin', label: 'Administrateur' },
    { value: 'pharmacien', label: 'Pharmacien' },
    { value: 'gestionnaire', label: 'Gestionnaire' },
    { value: 'it_specialist', label: 'Spécialiste IT' }
  ];

  const statusOptions = [
    { value: 'Active', label: 'Actif' },
    { value: 'Inactive', label: 'Inactif' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (globalError) setGlobalError(null);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        setGlobalError('Veuillez sélectionner une image valide');
        return;
      }
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setGlobalError('L\'image ne doit pas dépasser 5MB');
        return;
      }
      // Ouvrir le modal de recadrage
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedFile) => {
    setAvatarFile(croppedFile);
    // Créer une preview de l'image recadrée
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(croppedFile);
    setIsCropModalOpen(false);
    setImageToCrop(null);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nomComplet?.trim()) newErrors.nomComplet = 'Requis';
    if (!formData.email?.trim()) newErrors.email = 'Requis';
    if (!formData.role) newErrors.role = 'Requis';
    // Le mot de passe est requis seulement en mode création
    if (!user && !formData.temporaryPassword?.trim()) newErrors.temporaryPassword = 'Requis'; 
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGlobalError(null);

    if (validateForm()) {
        setLoading(true);
        
        try {
          // Si un nouveau fichier avatar est sélectionné, utiliser FormData
          // Sinon, utiliser JSON normal
          if (avatarFile) {
            const formDataPayload = new FormData();
            formDataPayload.append('nomComplet', formData.nomComplet);
            formDataPayload.append('email', formData.email);
            formDataPayload.append('role', formData.role);
            if (formData.phone) formDataPayload.append('telephone', formData.phone);
            if (formData.address) formDataPayload.append('adresse', formData.address);
            formDataPayload.append('actif', formData.status === 'Active' ? 'true' : 'false');
            if (formData.numeroOrdre) formDataPayload.append('numeroOrdre', formData.numeroOrdre);
            if (formData.etablissementId) formDataPayload.append('etablissementId', formData.etablissementId);
            if (formData.department) formDataPayload.append('departmentId', formData.department);
            if (formData.temporaryPassword) formDataPayload.append('password', formData.temporaryPassword);
            // Envoyer le fichier avec le nom 'file' (le backend cherche 'file' ou 'avatar')
            formDataPayload.append('file', avatarFile);
            
            await onSave(formDataPayload);
          } else {
            const payloadUpdate = {
                nomComplet: formData.nomComplet,
                email: formData.email,
                role: formData.role,
                telephone: formData.phone || null,
                adresse: formData.address || null,
                actif: formData.status === 'Active',
                numeroOrdre: formData.numeroOrdre || null,
                etablissementId: formData.etablissementId || null,
                departmentId: formData.department || null,
                ...(formData.temporaryPassword ? { password: formData.temporaryPassword } : {}),
                ...(user && !avatarPreview && !avatarFile ? { avatar: null } : {}),
            };

            Object.keys(payloadUpdate).forEach(key => {
                if (payloadUpdate[key] === undefined) {
                    delete payloadUpdate[key];
                }
            });

            await onSave(payloadUpdate);
          }
        } catch (error) {
            const responseData = error.response?.data?.error;
            const statusCode = error.response?.status;

            // Gère l'erreur de validation 422 (VineJS)
            if (statusCode === 422 && responseData?.details) {
                const fieldErrors = {};
                const details = responseData.details;
                if (Array.isArray(details)) {
                    details.forEach(err => { fieldErrors[err.field] = err.message; });
                } else {
                    Object.assign(fieldErrors, details);
                }
                setErrors(fieldErrors);
                setGlobalError("Veuillez corriger les erreurs indiquées ci-dessous.");
            } 
            // Gère les erreurs génériques (409, 400, 500) via l'intercepteur Axios
            else if (error.userMessage) {
                setGlobalError(error.userMessage);
                if (error.userMessage.toLowerCase().includes('email')) {
                    setErrors(prev => ({ ...prev, email: " " }));
                }
            } else {
                setGlobalError("Une erreur technique est survenue.");
            }
        } finally {
            setLoading(false);
        }
    }
  };

  if (!isOpen) return null;

  const inputStyle = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-start">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Icon name="User" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {user ? 'Modifier l\'Utilisateur' : 'Nouvel Utilisateur'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {user ? 'Modifiez les informations de l\'utilisateur.' : 'Créez un nouveau compte utilisateur.'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading} className="text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full">
            <Icon name="X" size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar space-y-8">
          
          {globalError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-medium animate-pulse">
              <AlertCircle size={20} />
              {globalError}
            </div>
          )}
          
          {/* Avatar Upload Section */}
          <section className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Icon name="Image" size={12} /> Photo de profil
            </h3>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <div 
                  className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center relative group cursor-pointer transition-all hover:border-primary/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarPreview ? (
                    <>
                      <Image 
                        src={avatarPreview} 
                        className="w-full h-full object-cover" 
                        alt="Avatar preview"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="p-1 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-colors"
                          title="Changer la photo"
                        >
                          <Upload size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAvatar();
                          }}
                          className="p-1 bg-rose-500 hover:bg-rose-600 rounded-full text-white transition-colors"
                          title="Supprimer la photo"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-slate-400 dark:text-slate-500 text-xl font-bold">
                        {getInitials()}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <Upload size={16} className="text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
              {avatarFile && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Photo sélectionnée ({(avatarFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
                {!avatarPreview && !avatarFile && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cliquez pour ajouter une photo
                </p>
              )}
              </div>
            </div>
          </section>

          {/* Image Crop Modal */}
          <ImageCropModal
            isOpen={isCropModalOpen}
            onClose={() => {
              setIsCropModalOpen(false);
              setImageToCrop(null);
            }}
            imageSrc={imageToCrop}
            onCrop={handleCropComplete}
            aspectRatio={1}
          />

          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Icon name="User" size={14} /> Informations personnelles
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input 
                  label="Nom Complet *" 
                  value={formData.nomComplet} 
                  onChange={(e) => handleInputChange('nomComplet', e.target.value)} 
                  error={errors.nomComplet} 
                  className={inputStyle} 
                  autoFocus
              />
              
              <Input 
                  label="Email *" 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => handleInputChange('email', e.target.value)} 
                  error={errors.email} 
                  className={inputStyle} 
              />
              
              <Input 
                  label="Téléphone" 
                  type="tel" 
                  value={formData.phone} 
                  onChange={(e) => handleInputChange('phone', e.target.value)} 
                  className={inputStyle} 
              />
              
              {!user && (
                <Input 
                  label="Mot de passe temporaire *" 
                  type="password" 
                  value={formData.temporaryPassword} 
                  onChange={(e) => handleInputChange('temporaryPassword', e.target.value)} 
                  error={errors.temporaryPassword} 
                  className={inputStyle} 
                  placeholder="Min. 8 caractères"
                />
              )}
              
              {user && (
                 <Input 
                   label="Nouveau mot de passe" 
                   type="password" 
                   value={formData.temporaryPassword} 
                   onChange={(e) => handleInputChange('temporaryPassword', e.target.value)} 
                   className={inputStyle} 
                   placeholder="Laisser vide pour ne pas changer" 
                 />
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Icon name="Shield" size={14} /> Rôle et statut
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select 
                  label="Rôle *" 
                  options={roleOptions} 
                  value={formData.role} 
                  onChange={(v) => handleInputChange('role', v)} 
                  error={errors.role} 
                  buttonClassName={inputStyle} 
              />
              
              <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Statut</label>
                  <Select 
                      options={statusOptions} 
                      value={formData.status} 
                      onChange={(v) => handleInputChange('status', v)} 
                      buttonClassName={inputStyle} 
                  />
              </div>
            </div>
          </section>

          {/* --- SECTION SPÉCIFIQUE MÉDECIN --- */}
          {formData.role === 'docteur' && (
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Icon name="Stethoscope" size={14} /> Informations médicales
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <Input 
                  label="Numéro d'Ordre" 
                  placeholder="RPPS / Ordre" 
                  value={formData.numeroOrdre} 
                  onChange={e => handleInputChange('numeroOrdre', e.target.value)} 
                  className={inputStyle} 
                />
              </div>
              <Select 
                label="Département"
                options={[{ value: '', label: 'Aucun' }, ...departments]}
                value={formData.department}
                onChange={v => handleInputChange('department', v)}
                placeholder="Choisir un département..."
                buttonClassName={inputStyle}
              />
              <Select 
                label="Établissement de rattachement" 
                options={establishments} 
                value={formData.etablissementId} 
                onChange={v => handleInputChange('etablissementId', v)} 
                placeholder={establishments.length === 0 ? "Aucun établissement disponible" : "Choisir..."}
                buttonClassName={inputStyle} 
              />
            </section>
          )}

        </form>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800">
            Annuler
          </Button>
          <PermissionGuard requiredPermission={user ? 'user_edit' : 'user_create'}>
            <Button 
              onClick={handleSubmit} 
              loading={loading} 
              iconName="Check" 
              className="shadow-lg shadow-primary/20"
              disabled={loading || !formData.email || !formData.nomComplet || !formData.role || !hasPermission(user ? 'user_edit' : 'user_create')}
            >
              {user ? 'Enregistrer les modifications' : 'Créer l\'utilisateur'}
            </Button>
          </PermissionGuard>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default UserModal;