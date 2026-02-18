import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { Checkbox } from '../../../components/ui/Checkbox';
import { usePermissionMutations } from '../../../hooks/useAdmin';
import { useToast } from '../../../contexts/ToastContext';
import api from '../../../lib/axios';

const RolePermissionMatrix = ({ onSave, onCancel }) => {
  const { hasPermission } = usePermissions();
  const [selectedRole, setSelectedRole] = useState('docteur');
  const [permissions, setPermissions] = useState([]); // Permissions actuelles du rôle sélectionné
  const [initialPermissions, setInitialPermissions] = useState([]); // Pour détecter les changements
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const queryClient = useQueryClient();
  const { updateRolePermissions } = usePermissionMutations();
  const { showToast } = useToast();

  const roles = [
    { id: 'admin', label: 'Administrateur', icon: 'ShieldAlert', desc: 'Accès complet', color: 'text-purple-500' },
    { id: 'docteur', label: 'Médecin', icon: 'Stethoscope', desc: 'Accès clinique', color: 'text-blue-500' },
    { id: 'infirmiere', label: 'Infirmier(e)', icon: 'Activity', desc: 'Soins & Suivi', color: 'text-emerald-500' },
    { id: 'pharmacien', label: 'Pharmacien', icon: 'Pill', desc: 'Gestion stocks', color: 'text-teal-500' },
    { id: 'gestionnaire', label: 'Gestionnaire', icon: 'Briefcase', desc: 'Administratif', color: 'text-amber-500' }
  ];

  // Fonctions utilitaires pour les icônes et couleurs (définies avant leur utilisation)
  const getCategoryIcon = (category) => {
    const icons = {
      'Patients': 'Users',
      'Clinique': 'HeartPulse',
      'Analyses Labo': 'TestTube',
      'Rendez-vous': 'Calendar',
      'Documents': 'FileText',
      'Finance': 'DollarSign',
      'Admin': 'Shield',
      'Pharmacie': 'Pill'
    };
    return icons[category] || 'Settings';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Patients': 'text-blue-500',
      'Clinique': 'text-rose-500',
      'Analyses Labo': 'text-cyan-500',
      'Rendez-vous': 'text-indigo-500',
      'Documents': 'text-purple-500',
      'Finance': 'text-emerald-500',
      'Admin': 'text-amber-500',
      'Pharmacie': 'text-teal-500'
    };
    return colors[category] || 'text-slate-500';
  };

  // Fonction pour transformer les noms techniques en noms significatifs
  const getPermissionDisplayName = (permissionName) => {
    const nameMap = {
      // Patients
      'patient_view': 'Voir les dossiers patients',
      'patient_edit': 'Modifier les dossiers patients',
      'patient_create': 'Créer des patients',
      'patient_delete': 'Supprimer des patients',
      
      // Clinique
      'clinical_view': 'Voir la console clinique',
      'clinical_write': 'Écrire des notes cliniques',
      'prescription_create': 'Prescrire des médicaments',
      'prescription_view': 'Voir les prescriptions',
      'consultation_create': 'Créer des consultations',
      'consultation_edit': 'Modifier des consultations',
      
      // Analyses Labo
      'analyses_view': 'Voir les analyses',
      'analyses_create': 'Prescrire des analyses',
      'analyses_edit': 'Modifier les prescriptions d\'analyses',
      'analyses_cancel': 'Annuler des analyses',
      'analyses_delete': 'Supprimer des analyses',
      'resultats_view': 'Voir les résultats d\'analyses',
      'resultats_create': 'Enregistrer des résultats',
      'resultats_edit': 'Modifier des résultats',
      'resultats_validate': 'Valider des résultats',
      
      // Rendez-vous
      'appointment_view': 'Voir les rendez-vous (API / console)',
      'agenda_view': 'Voir l\'agenda (page planning global)',
      'appointment_create': 'Créer des rendez-vous',
      'appointment_edit': 'Modifier des rendez-vous',
      'appointment_delete': 'Supprimer des rendez-vous',
      
      // Documents
      'document_view': 'Voir les documents',
      'document_upload': 'Télécharger des documents',
      'document_delete': 'Supprimer des documents',
      
      // Finance & Admin
      'billing_view': 'Voir la facturation',
      'billing_create': 'Créer des factures',
      'payment_process': 'Encaisser des paiements',
      'finance_manage': 'Gérer les finances',
      'user_manage': 'Gérer les utilisateurs',
      'user_view': 'Voir les utilisateurs',
      'user_create': 'Créer des utilisateurs',
      'user_edit': 'Modifier des utilisateurs',
      'user_delete': 'Supprimer des utilisateurs',
      'dashboard_view': 'Voir le tableau de bord',
      'audit_view': 'Voir les logs d\'audit',
      'permission_manage': 'Gérer les permissions',
      'settings_manage': 'Gérer les paramètres',
      
      // Pharmacie
      'inventory_view': 'Voir l\'inventaire',
      'inventory_manage': 'Gérer l\'inventaire',
      'medication_create': 'Créer des médicaments',
      'medication_edit': 'Modifier des médicaments',
      'medication_delete': 'Supprimer des médicaments',
      'order_create': 'Créer des commandes',
      'order_receive': 'Réceptionner des commandes'
    };
    
    return nameMap[permissionName] || permissionName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Charger les permissions disponibles depuis l'API
  useEffect(() => {
    const fetchAvailablePermissions = async () => {
      try {
        const response = await api.get('/permissions/available');
        if (response.data.success) {
          setAvailablePermissions(response.data.data);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur lors du chargement des permissions:', error);
        }
        showToast('Erreur lors du chargement des permissions disponibles', 'error');
      }
    };
    fetchAvailablePermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Organiser les permissions par catégorie (utilise useMemo pour éviter les recalculs)
  const permissionCategories = React.useMemo(() => {
    if (!Array.isArray(availablePermissions) || availablePermissions.length === 0) {
      return [];
    }
    return availablePermissions.reduce((acc, perm) => {
      const category = acc.find(cat => cat.category === perm.category);
      if (category) {
        category.permissions.push(perm);
      } else {
        acc.push({
          category: perm.category,
          icon: getCategoryIcon(perm.category),
          color: getCategoryColor(perm.category),
          permissions: [perm]
        });
      }
      return acc;
    }, []);
  }, [availablePermissions, getCategoryIcon, getCategoryColor]);

  // Charger les permissions du rôle sélectionné depuis l'API
  useEffect(() => {
    const fetchRolePermissions = async () => {
      setLoadingPermissions(true);
      try {
        const response = await api.get(`/permissions/roles/${selectedRole}`);
        if (response.data.success) {
          const rolePerms = response.data.data || [];
          setPermissions(rolePerms);
          setInitialPermissions(rolePerms);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur lors du chargement des permissions du rôle:', error);
        }
        showToast('Erreur lors du chargement des permissions', 'error');
        setPermissions([]);
        setInitialPermissions([]);
      } finally {
        setLoadingPermissions(false);
      }
    };
    fetchRolePermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole]);

  const handlePermissionChange = (permissionId) => {
    setPermissions(prev => {
        const currentPerms = Array.isArray(prev) ? prev : [];
        if (currentPerms.includes(permissionId)) {
            return currentPerms.filter(id => id !== permissionId);
        } else {
            return [...currentPerms, permissionId];
        }
    });
  };

  const handleSave = async () => {
      setLoading(true);
      try {
        await updateRolePermissions.mutateAsync({ 
          role: selectedRole, 
          permissions 
        });
        
        // Met à jour l'état initial pour désactiver le bouton "Sauvegarder"
        setInitialPermissions(permissions);
        
        // Forcer le rafraîchissement immédiat pour TOUS les utilisateurs (pas seulement le rôle modifié)
        // Car un utilisateur peut avoir changé les permissions de son propre rôle
        await queryClient.refetchQueries({ 
          queryKey: ['permissions'],
          exact: false
        });
        
        // Invalider aussi le cache des permissions disponibles
        await queryClient.invalidateQueries({ 
          queryKey: ['permissions', 'available'],
          exact: false
        });
        
        // Afficher un message informatif
        showToast(
          `Permissions mises à jour. Les utilisateurs du rôle "${selectedRole}" doivent rafraîchir la page pour voir les changements.`,
          'success'
        );
        
        onSave({ role: selectedRole, permissions });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur lors de la sauvegarde des permissions:', error);
        }
        // L'erreur est déjà gérée par le hook
      } finally {
        setLoading(false);
      }
  };

  // Vérifie si des changements ont été faits
  const hasChanges = JSON.stringify((Array.isArray(permissions) ? permissions : []).sort()) !== JSON.stringify((Array.isArray(initialPermissions) ? initialPermissions : []).sort());

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row h-[880px] animate-fade-in">
      
      {/* Sidebar Roles */}
      <div className="w-full md:w-72 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
           <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
             <Icon name="Shield" size={20} className="text-primary" />
             Gestion des Permissions
           </h3>
           <p className="text-xs text-slate-500 mt-1">Accordez ou restreignez les permissions par rôle.</p>
           {hasChanges && (
             <div className="mt-3 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
               <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                 ⚠️ Modifications non enregistrées
               </p>
             </div>
           )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {Array.isArray(roles) && roles.map(role => {
              if (!role || typeof role !== 'object') return null;
              return (
                <button
                    key={role.id}
                    onClick={() => {
                        if (hasChanges) {
                            if (window.confirm("Vous avez des modifications non enregistrées. Voulez-vous vraiment changer de rôle ?")) {
                                setSelectedRole(role.id);
                            }
                        } else {
                            setSelectedRole(role.id);
                        }
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 border ${
                        selectedRole === role.id 
                        ? 'bg-white dark:bg-slate-800 border-primary/30 shadow-md ring-1 ring-primary/20' 
                        : 'bg-transparent border-transparent hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                    }`}
                >
                    <div className={`p-2 rounded-lg ${selectedRole === role.id ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                        <Icon name={role.icon} size={18} />
                    </div>
                    <div>
                        <div className={`text-sm font-bold ${selectedRole === role.id ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>{role.label}</div>
                        <div className="text-[10px] text-slate-500">{role.desc}</div>
                    </div>
                </button>
              );
            }).filter(Boolean)}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">Configuration pour :</span>
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 capitalize">
                      {Array.isArray(roles) ? roles.find(r => r && r.id === selectedRole)?.label : ''}
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Icon name="CheckCircle2" size={14} className="text-emerald-500" />
                  <span className="font-medium">{Array.isArray(permissions) ? permissions.length : 0} permission(s) accordée(s)</span>
                </div>
            </div>
            <div className="flex gap-3">
                <Button variant="ghost" onClick={onCancel} disabled={loading}>Fermer</Button>
                <PermissionGuard requiredPermission="permission_manage">
                  <Button 
                      variant="default" 
                      onClick={handleSave} 
                      loading={loading || updateRolePermissions.isPending}
                      disabled={!hasChanges || loading || updateRolePermissions.isPending || !hasPermission('permission_manage')}
                      iconName="Save" 
                      className="shadow-lg shadow-primary/20"
                  >
                      Sauvegarder
                  </Button>
                </PermissionGuard>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
          {loadingPermissions ? (
            <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 mx-2 border-l-4 border-l-primary">
              <Icon name="Loader2" size={32} className="animate-spin text-primary mb-4" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Chargement des permissions…</p>
            </div>
          ) : permissionCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Icon name="AlertCircle" size={48} className="text-slate-400 mb-4" />
              <p className="text-sm text-slate-500">Aucune permission disponible</p>
            </div>
          ) : (
            Array.isArray(permissionCategories) && permissionCategories.map(cat => {
              if (!cat || typeof cat !== 'object') return null;
              return (
                <div key={cat.category} className="animate-fade-in">
                    <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <Icon name={cat.icon} size={16} className={cat.color} /> {cat.category}
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {Array.isArray(cat.permissions) && cat.permissions.map(perm => {
                            if (!perm || typeof perm !== 'object') return null;
                            const currentPerms = Array.isArray(permissions) ? permissions : [];
                            const isChecked = currentPerms.includes(perm.id);
                            return (
                                <div 
                                    key={perm.id} 
                                    className={`
                                        flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none
                                        ${isChecked
                                            ? 'bg-primary/5 border-primary/30 dark:bg-primary/10 dark:border-primary/30 shadow-sm' 
                                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                                        }
                                    `}
                                    onClick={() => handlePermissionChange(perm.id)}
                                >
                                    <div className="mt-1">
                                        <Checkbox 
                                            checked={isChecked} 
                                            readOnly // Le clic est géré par le div parent
                                            className="pointer-events-none"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-sm font-bold ${isChecked ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {getPermissionDisplayName(perm.name)}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{perm.description}</div>
                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                                            {perm.name}
                                        </div>
                                    </div>
                                </div>
                            );
                        }).filter(Boolean)}
                    </div>
                </div>
              );
            }).filter(Boolean)
          )}
        </div>
      </div>
    </div>
  );
};

export default RolePermissionMatrix;