import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import PermissionGuard from '../../components/PermissionGuard';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useUsersList, useUserMutations } from '../../hooks/useAdmin';
import { useEstablishmentsList, useEstablishmentMutations } from '../../hooks/useAdmin';
import { useDepartmentsList, useDepartmentMutations } from '../../hooks/useAdmin';
import { usePermissions } from '../../hooks/usePermissions';
import api from '../../lib/axios';

// Sous-composants
import UserCard from './components/UserCard';
import UserListTable from './components/UserListTable';
import UserFilters from './components/UserFilters';
import UserModal from './components/UserModal';
import EstablishmentModal from './components/EstablishmentModal';
import DepartmentModal from './components/DepartmentModal';
import RolePermissionMatrix from './components/RolePermissionMatrix';
import AuditLogViewer from './components/AuditLogViewer';
import SecuritySettings from './components/SecuritySettings';
import ExportData from './components/ExportData';
import AppSettings from './components/AppSettings';

const UserAdministration = () => {
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();

  // --- ÉTATS GLOBAUX ---
  const [activeTab, setActiveTab] = useState('users');
  const [activeRoleTab, setActiveRoleTab] = useState('all'); // Nouvel état pour les sous-onglets de rôles
  const [viewMode, setViewMode] = useState('grid');

  // --- FILTRES & PAGINATION UTILISATEURS ---
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Pagination Users
  const [currentPage, setCurrentPage] = useState(1);
  const limit = viewMode === 'list' ? 15 : 9;

  // Debounce de la recherche (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Réinitialiser à la page 1 lors d'une nouvelle recherche
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Pagination Établissements
  const [etabCurrentPage, setEtabCurrentPage] = useState(1);
  const etabItemsPerPage = 9;

  // Pagination Départements
  const [deptCurrentPage, setDeptCurrentPage] = useState(1);
  const deptItemsPerPage = 9;

  // --- HOOKS ---
  // Récupérer les totaux pour chaque rôle via les métadonnées de pagination
  const { data: allUsersData } = useUsersList({
    page: 1,
    limit: 1, // On a juste besoin du meta.total
    search: '',
    role: '',
    status: ''
  });

  const { data: patientData } = useUsersList({
    page: 1,
    limit: 1,
    search: '',
    role: 'patient',
    status: ''
  });

  const { data: infirmiereData } = useUsersList({
    page: 1,
    limit: 1,
    search: '',
    role: 'infirmiere',
    status: ''
  });

  const { data: pharmacienData } = useUsersList({
    page: 1,
    limit: 1,
    search: '',
    role: 'pharmacien',
    status: ''
  });

  const { data: gestionnaireData } = useUsersList({
    page: 1,
    limit: 1,
    search: '',
    role: 'gestionnaire',
    status: ''
  });

  const { data: adminData } = useUsersList({
    page: 1,
    limit: 1,
    search: '',
    role: 'admin',
    status: ''
  });

  const { data: docteurCliniqueData } = useUsersList({
    page: 1,
    limit: 1,
    search: '',
    role: 'docteur_clinique',
    status: ''
  });

  const { data: docteurLaboData } = useUsersList({
    page: 1,
    limit: 1,
    search: '',
    role: 'docteur_labo',
    status: ''
  });

  // Utiliser les métadonnées de pagination pour obtenir les vrais totaux
  const roleCounts = {
    all: allUsersData?.meta?.total || 0,
    patient: patientData?.meta?.total || 0,
    docteur_clinique: docteurCliniqueData?.meta?.total || 0,
    docteur_labo: docteurLaboData?.meta?.total || 0,
    infirmiere: infirmiereData?.meta?.total || 0,
    pharmacien: pharmacienData?.meta?.total || 0,
    gestionnaire: gestionnaireData?.meta?.total || 0,
    admin: adminData?.meta?.total || 0
  };

  // Déterminer le rôle à filtrer selon l'onglet actif
  const getRoleFilter = () => {
    if (activeRoleTab === 'all') return '';
    if (activeRoleTab === 'docteur_clinique') return 'docteur_clinique';
    if (activeRoleTab === 'docteur_labo') return 'docteur_labo';
    if (activeRoleTab === 'infirmiere') return 'infirmiere';
    if (activeRoleTab === 'pharmacien') return 'pharmacien';
    if (activeRoleTab === 'gestionnaire') return 'gestionnaire';
    if (activeRoleTab === 'admin') return 'admin';
    return activeRoleTab;
  };

  const { data: usersData, isLoading: isLoadingUsers } = useUsersList({
    page: currentPage,
    limit,
    search: debouncedSearch.trim() || undefined, // Utiliser la recherche debounced
    role: getRoleFilter() || filterRole, // Utiliser le rôle de l'onglet actif
    status: filterStatus
  });

  const { data: establishmentsData, isLoading: isLoadingEstablishments } = useEstablishmentsList({
    page: etabCurrentPage,
    limit: etabItemsPerPage
  });

  const { data: departmentsData, isLoading: isLoadingDepartments } = useDepartmentsList({
    page: deptCurrentPage,
    limit: deptItemsPerPage
  });

  const { createUser, updateUser, deleteUser } = useUserMutations();
  const { createEstablishment, updateEstablishment, deleteEstablishment } = useEstablishmentMutations();
  const { createDepartment, updateDepartment, deleteDepartment } = useDepartmentMutations();

  // Extraction des données
  const users = usersData?.data || [];
  const lastPage = usersData?.meta?.last_page || usersData?.meta?.lastPage || 1;
  const totalUsers = usersData?.meta?.total || 0;

  const establishments = establishmentsData?.data || [];
  const etabLastPage = establishmentsData?.meta?.last_page || establishmentsData?.meta?.lastPage || 1;
  const etabTotal = establishmentsData?.meta?.total || 0;

  const departments = departmentsData?.data || [];
  const deptLastPage = departmentsData?.meta?.last_page || departmentsData?.meta?.lastPage || 1;
  const deptTotal = departmentsData?.meta?.total || 0;

  const loading = isLoadingUsers || isLoadingEstablishments || isLoadingDepartments;

  // --- MODALES & ACTIONS ---
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedEstablishment, setSelectedEstablishment] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEstablishmentModalOpen, setIsEstablishmentModalOpen] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // --- ÉTATS DE SUPPRESSION/ACTION ---
  const [userToDelete, setUserToDelete] = useState(null); // Contient { id, name, action, ... }
  const [etabToDelete, setEtabToDelete] = useState(null);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const tabs = [
    { id: 'users', label: 'Utilisateurs', icon: 'Users', permission: 'user_view' },
    { id: 'establishments', label: 'Établissements', icon: 'Building2', permission: 'settings_manage' },
    { id: 'departments', label: 'Départements', icon: 'Building', permission: 'settings_manage' },
    { id: 'permissions', label: 'Permissions', icon: 'Shield', permission: 'permission_manage' },
    { id: 'audit', label: 'Audit', icon: 'FileText', permission: 'audit_view' },
    { id: 'export', label: 'Export', icon: 'Download', permission: 'user_view' },
    { id: 'security', label: 'Sécurité', icon: 'Lock', permission: 'settings_manage' },
    { id: 'settings', label: 'Paramètres', icon: 'Settings', permission: 'settings_manage' }
  ].filter(tab => hasPermission(tab.permission));

  // --- GESTION DU CHANGEMENT DE MODE VUE ---
  const handleViewModeChange = (mode) => {
    if (mode !== viewMode) {
      setViewMode(mode);
      setCurrentPage(1);
    }
  };

  // Gestion du changement d'onglet de rôle
  const handleRoleTabChange = (role) => {
    setActiveRoleTab(role);
    setCurrentPage(1); // Réinitialiser à la première page
    setSearchQuery(''); // Réinitialiser la recherche
    setFilterStatus(''); // Réinitialiser le filtre de statut
  };

  // Mapping des utilisateurs pour compatibilité avec l'UI
  const mappedUsers = Array.isArray(users) ? users.map(u => ({
    ...u,
    name: u.nomComplet || u.name,
    status: u.status || (u.actif ? 'Active' : 'Inactive'),
    initials: (u.nomComplet || u.name || '?').charAt(0).toUpperCase()
  })) : [];


  // --- 3. ACTIONS UTILISATEURS ---

  const handleFilterChange = (newFilters) => {
    if (newFilters.search !== undefined) {
      setSearchQuery(newFilters.search);
    }
    if (newFilters.role !== undefined) {
      setFilterRole(newFilters.role || '');
    }
    if (newFilters.status !== undefined) {
      setFilterStatus(newFilters.status || '');
    }
    setCurrentPage(1);
    if (newFilters.search !== undefined) setSearchQuery(newFilters.search);
    if (newFilters.role !== undefined) setFilterRole(newFilters.role);
    if (newFilters.status !== undefined) setFilterStatus(newFilters.status);
    setCurrentPage(1);
  };

  const handleAddNewUser = () => { setSelectedUser(null); setIsUserModalOpen(true); };

  const handleEditUser = async (user) => {
    try {
      // Afficher un indicateur de chargement
      showToast('Chargement des informations de l\'utilisateur...', 'info');

      // Récupérer toutes les informations complètes de l'utilisateur depuis le backend
      const response = await api.get(`/users/${user.id}`);
      const fullUserData = response.data.data || response.data;

      // Ouvrir le modal avec les données complètes
      setSelectedUser(fullUserData);
      setIsUserModalOpen(true);
    } catch (error) {
      // En cas d'erreur, utiliser les données partielles disponibles
      console.error('Erreur lors de la récupération des détails utilisateur:', error);
      showToast(
        error.userMessage || 'Impossible de charger toutes les informations. Utilisation des données disponibles.',
        'warning'
      );
      // Ouvrir quand même le modal avec les données partielles
      setSelectedUser(user);
      setIsUserModalOpen(true);
    }
  };

  // Action pour basculer le statut (via la modale de confirmation)
  const handleToggleStatus = (user) => {
    const newStatus = !(user.status === 'Active' || user.actif);
    // On utilise userToDelete pour stocker l'action de toggle
    setUserToDelete({ id: user.id, name: user.name, action: 'TOGGLE_STATUS', newStatus: newStatus });
    setIsConfirmModalOpen(true);
  };

  const handleSaveUser = async (formData) => {
    try {
      if (selectedUser) {
        await updateUser.mutateAsync({ id: selectedUser.id, data: formData });
      } else {
        await createUser.mutateAsync(formData);
      }
      setIsUserModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      // L'erreur est déjà gérée par le hook
      throw error;
    }
  };

  // Initiation de la suppression d'utilisateur
  const initiateDeleteUser = (user) => {
    setUserToDelete({ id: user.id, name: user.name, action: 'DELETE_USER' });
    setEtabToDelete(null);
    setIsConfirmModalOpen(true);
  };

  // Confirmation de suppression d'utilisateur
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete || userToDelete.action !== 'DELETE_USER') return;
    try {
      await deleteUser.mutateAsync(userToDelete.id);

      if (users.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }

      setIsConfirmModalOpen(false);
      setUserToDelete(null);
    } catch (e) {
      // L'erreur est déjà gérée par le hook
    }
  };

  // --- 4. ACTIONS ÉTABLISSEMENTS ---

  const initiateDeleteEtab = (etab) => {
    setUserToDelete(null);
    setEtabToDelete({ id: etab.id, nom: etab.nom });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDeleteEtab = async () => {
    if (!etabToDelete) return;
    try {
      await deleteEstablishment.mutateAsync(etabToDelete.id);

      if (establishments.length === 1 && etabCurrentPage > 1) {
        setEtabCurrentPage(prev => prev - 1);
      }

      setIsConfirmModalOpen(false);
      setEtabToDelete(null);
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  };

  const handleEditEstablishment = (etab) => {
    setSelectedEstablishment(etab);
    setIsEstablishmentModalOpen(true);
  };

  const handleSaveEstablishment = async (data) => {
    try {
      if (selectedEstablishment) {
        await updateEstablishment.mutateAsync({ id: selectedEstablishment.id, data });
      } else {
        await createEstablishment.mutateAsync(data);
      }
      setIsEstablishmentModalOpen(false);
      setSelectedEstablishment(null);
    } catch (e) {
      throw e;
    }
  };

  // --- 5. ACTIONS DÉPARTEMENTS ---

  const initiateDeleteDept = (dept) => {
    setUserToDelete(null);
    setEtabToDelete(null);
    setDeptToDelete({ id: dept.id, nom: dept.nom });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDeleteDept = async () => {
    if (!deptToDelete) return;
    try {
      await deleteDepartment.mutateAsync(deptToDelete.id);

      if (departments.length === 1 && deptCurrentPage > 1) {
        setDeptCurrentPage(prev => prev - 1);
      }

      setIsConfirmModalOpen(false);
      setDeptToDelete(null);
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  };

  const handleEditDepartment = (dept) => {
    setSelectedDepartment(dept);
    setIsDepartmentModalOpen(true);
  };

  const handleSaveDepartment = async (data) => {
    try {
      if (selectedDepartment) {
        await updateDepartment.mutateAsync({ id: selectedDepartment.id, data });
      } else {
        await createDepartment.mutateAsync(data);
      }
      setIsDepartmentModalOpen(false);
      setSelectedDepartment(null);
    } catch (e) {
      throw e;
    }
  };

  const handleSavePermissions = () => {
    // La notification est déjà gérée par RolePermissionMatrix
    setActiveTab('users');
  };

  // --- CONFIRMATION GÉNÉRIQUE (Logique unifiée) ---
  const handleConfirmToggleStatus = async () => {
    if (!userToDelete || userToDelete.action !== 'TOGGLE_STATUS') return;

    try {
      // newStatus est déjà un booléen (true = actif, false = inactif)
      await updateUser.mutateAsync({
        id: userToDelete.id,
        data: { actif: userToDelete.newStatus }
      });

      setIsConfirmModalOpen(false);
      setUserToDelete(null);
    } catch (e) {
      // L'erreur est déjà gérée par le hook
    }
  };


  // --- RENDERERS ---

  // Définition des onglets de rôles
  const roleTabs = [
    { id: 'all', label: 'Tous', icon: 'Users', count: roleCounts.all },
    { id: 'patient', label: 'Patients', icon: 'User', count: roleCounts.patient },
    { id: 'docteur_clinique', label: 'Médecine générale', icon: 'Stethoscope', count: roleCounts.docteur_clinique },
    { id: 'docteur_labo', label: 'Médecin biologiste', icon: 'TestTube', count: roleCounts.docteur_labo },
    { id: 'infirmiere', label: 'Infirmières', icon: 'Activity', count: roleCounts.infirmiere },
    { id: 'pharmacien', label: 'Pharmaciens', icon: 'Pill', count: roleCounts.pharmacien },
    { id: 'gestionnaire', label: 'Gestionnaires', icon: 'Briefcase', count: roleCounts.gestionnaire },
    { id: 'admin', label: 'Administrateurs', icon: 'ShieldCheck', count: roleCounts.admin }
  ];

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion des Utilisateurs</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {activeRoleTab === 'all'
              ? <>Total : <span className="font-semibold text-primary">{roleCounts.all}</span> comptes</>
              : <>{roleTabs.find(t => t.id === activeRoleTab)?.label} : <span className="font-semibold text-primary">{roleCounts[activeRoleTab] || 0}</span> compte{(roleCounts[activeRoleTab] || 0) > 1 ? 's' : ''}</>
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button onClick={() => handleViewModeChange('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Icon name="Grid3X3" size={18} /></button>
            <button onClick={() => handleViewModeChange('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Icon name="List" size={18} /></button>
          </div>
          <PermissionGuard requiredPermission="user_create">
            <Button variant="default" onClick={handleAddNewUser} className="shadow-lg shadow-primary/20" disabled={!hasPermission('user_create')}>
              <Icon name="UserPlus" size={18} className="mr-2" /> Ajouter
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Onglets par rôle */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl w-fit min-w-full">
          {Array.isArray(roleTabs) && roleTabs.map((tab) => {
            if (!tab || typeof tab !== 'object') return null;
            const isActive = activeRoleTab === tab.id;
            return (
              <motion.button
                key={tab.id || Math.random()}
                onClick={() => handleRoleTabChange(tab.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors z-10 whitespace-nowrap ${isActive
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeRoleTabBackground"
                    className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20 rounded-lg shadow-sm border border-violet-200 dark:border-violet-800"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon name={tab.icon} size={16} className={isActive ? 'text-violet-600 dark:text-violet-400' : 'opacity-70'} />
                  {tab.label}
                  {typeof tab.count === 'number' && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive
                        ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                      {tab.count}
                    </span>
                  )}
                </span>
              </motion.button>
            );
          }).filter(Boolean)}
        </div>
      </div>

      <UserFilters
        filters={{ search: searchQuery, role: '', status: filterStatus }}
        onFilterChange={handleFilterChange}
        hideRoleFilter={true} // Masquer le filtre de rôle car on utilise les onglets
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 border-l-4 border-l-primary">
          <Icon name="Loader2" size={40} className="animate-spin text-primary mb-2" />
          <span className="text-sm text-slate-500 dark:text-slate-400">Chargement…</span>
        </div>
      ) : (!Array.isArray(users) || users.length === 0) && searchQuery ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3"><Icon name="UserX" size={28} className="text-slate-400" /></div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Aucun utilisateur trouvé pour cette recherche.</p>
        </div>
      ) : (
        <div className="animate-fade-in">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.isArray(mappedUsers) && mappedUsers.map(user => {
                if (!user || typeof user !== 'object') return null;
                return (
                  <UserCard key={user.id || Math.random()} user={user} onEdit={handleEditUser} onDelete={initiateDeleteUser} onToggleStatus={handleToggleStatus} />
                );
              }).filter(Boolean)}
            </div>
          ) : (
            <UserListTable users={mappedUsers} onEdit={handleEditUser} onDelete={initiateDeleteUser} onToggleStatus={handleToggleStatus} />
          )}
        </div>
      )}

      {/* PAGINATION UTILISATEURS */}
      {!loading && totalUsers > 0 && (
        <div className="flex justify-center items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Icon name="ChevronLeft" size={16} className="mr-1" /> Précédent
          </Button>

          <span className="flex items-center px-4 py-1 text-sm font-bold bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm">
            Page {currentPage || 1} / {lastPage || 1}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= lastPage}
            onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))}
            className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Suivant <Icon name="ChevronRight" size={16} className="ml-1" />
          </Button>
        </div>
      )}
    </div>
  );

  const renderEstablishments = () => {
    const getTypeStyle = (type) => {
      switch (type) {
        case 'hopital': return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-l-blue-500', icon: 'Building' };
        case 'clinique': return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-l-emerald-500', icon: 'Activity' };
        case 'laboratoire': return { color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-l-violet-500', icon: 'TestTube' };
        default: return { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-l-slate-500', icon: 'Home' };
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Établissements</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestion du réseau médical ({etabTotal} structures)</p>
          </div>
          <PermissionGuard requiredPermission="settings_manage">
            <Button onClick={() => { setSelectedEstablishment(null); setIsEstablishmentModalOpen(true); }} iconName="Plus" className="shadow-lg shadow-indigo-500/20" disabled={!hasPermission('settings_manage')}>
              Ajouter un lieu
            </Button>
          </PermissionGuard>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 border-l-4 border-l-primary">
            <Icon name="Loader2" size={40} className="animate-spin text-primary mb-2" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Chargement…</span>
          </div>
        ) : establishments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3"><Icon name="Building2" size={28} className="text-slate-400" /></div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Aucun établissement</h3>
            <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={() => setIsEstablishmentModalOpen(true)}>Créer maintenant</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {Array.isArray(establishments) && establishments.map(etab => {
                const style = getTypeStyle(etab.typeEtablissement);
                return (
                  <div key={etab.id} className={`group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 ${style.border} ${!etab.actif ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.bg} ${style.color}`}>
                        <Icon name={style.icon} size={24} />
                      </div>
                      <PermissionGuard requiredPermission="settings_manage">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); handleEditEstablishment(etab); }} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 rounded-lg transition-colors" title="Modifier" disabled={!hasPermission('settings_manage')}>
                            <Icon name="Edit2" size={16} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); initiateDeleteEtab(etab); }} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 rounded-lg transition-colors" title="Supprimer" disabled={!hasPermission('settings_manage')}>
                            <Icon name="Trash2" size={16} />
                          </button>
                        </div>
                      </PermissionGuard>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">{etab.nom}</h3>
                      {!etab.actif && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                          Inactif
                        </span>
                      )}
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mb-4">
                      {etab.typeEtablissement}
                    </span>

                    <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2"><Icon name="MapPin" size={14} className="text-slate-400 shrink-0" /> <span className="truncate">{etab.adresse}</span></div>
                      <div className="flex items-center gap-2"><Icon name="Phone" size={14} className="text-slate-400 shrink-0" /> <span>{etab.telephone || 'N/A'}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PAGINATION ÉTABLISSEMENTS */}
            {etabTotal > 0 && (
              <div className="flex justify-center items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={etabCurrentPage <= 1}
                  onClick={() => setEtabCurrentPage(p => Math.max(1, p - 1))}
                  className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Icon name="ChevronLeft" size={16} className="mr-1" /> Précédent
                </Button>

                <span className="flex items-center px-4 py-1 text-sm font-bold bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm">
                  Page {etabCurrentPage || 1} / {etabLastPage || 1}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={etabCurrentPage >= etabLastPage}
                  onClick={() => setEtabCurrentPage(p => Math.min(etabLastPage, p + 1))}
                  className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Suivant <Icon name="ChevronRight" size={16} className="ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // --- RENDU DÉPARTEMENTS ---
  const renderDepartments = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Départements</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestion des départements médicaux ({deptTotal} départements)</p>
          </div>
          <PermissionGuard requiredPermission="settings_manage">
            <Button onClick={() => { setSelectedDepartment(null); setIsDepartmentModalOpen(true); }} iconName="Plus" className="shadow-lg shadow-indigo-500/20" disabled={!hasPermission('settings_manage')}>
              Ajouter un département
            </Button>
          </PermissionGuard>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 border-l-4 border-l-primary">
            <Icon name="Loader2" size={40} className="animate-spin text-primary mb-2" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Chargement…</span>
          </div>
        ) : departments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3"><Icon name="Building" size={28} className="text-slate-400" /></div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Aucun département</h3>
            <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={() => setIsDepartmentModalOpen(true)}>Créer maintenant</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {Array.isArray(departments) && departments.map(dept => {
                return (
                  <div key={dept.id} className={`group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 ${!dept.actif ? 'opacity-60' : ''}`} style={{ borderLeftColor: dept.couleur || '#3B82F6' }}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${dept.couleur || '#3B82F6'}20`, color: dept.couleur || '#3B82F6' }}>
                        <Icon name="Building" size={24} />
                      </div>
                      <PermissionGuard requiredPermission="settings_manage">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); handleEditDepartment(dept); }} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 rounded-lg transition-colors" title="Modifier" disabled={!hasPermission('settings_manage')}>
                            <Icon name="Edit2" size={16} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); initiateDeleteDept(dept); }} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 rounded-lg transition-colors" title="Supprimer" disabled={!hasPermission('settings_manage')}>
                            <Icon name="Trash2" size={16} />
                          </button>
                        </div>
                      </PermissionGuard>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">{dept.nom}</h3>
                      {!dept.actif && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                          Inactif
                        </span>
                      )}
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mb-4">
                      {dept.code}
                    </span>

                    {dept.description && (
                      <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
                        <p className="line-clamp-2">{dept.description}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* PAGINATION DÉPARTEMENTS */}
            {deptTotal > 0 && (
              <div className="flex justify-center items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={deptCurrentPage <= 1}
                  onClick={() => setDeptCurrentPage(p => Math.max(1, p - 1))}
                  className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Icon name="ChevronLeft" size={16} className="mr-1" /> Précédent
                </Button>

                <span className="flex items-center px-4 py-1 text-sm font-bold bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm">
                  Page {deptCurrentPage || 1} / {deptLastPage || 1}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={deptCurrentPage >= deptLastPage}
                  onClick={() => setDeptCurrentPage(p => Math.min(deptLastPage, p + 1))}
                  className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Suivant <Icon name="ChevronRight" size={16} className="ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <Header />
      <main className="pt-24 w-full max-w-[1600px] mx-auto px-6 lg:px-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-11 h-11 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-slate-200 dark:border-slate-700">
              <Icon name="Shield" size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Administration</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Gestion des utilisateurs, permissions et sécurité</p>
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-fit shadow-sm">
              {Array.isArray(tabs) && tabs.map((tab) => {
                if (!tab || typeof tab !== 'object') return null;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id || Math.random()}
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors z-10 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabBackground"
                        className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-lg border border-slate-200 dark:border-slate-700"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon name={tab.icon} size={16} className={isActive ? 'text-violet-600 dark:text-violet-400' : 'opacity-70'} />
                      {tab.label}
                    </span>
                  </motion.button>
                );
              }).filter(Boolean)}
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {activeTab === 'users' && renderUserManagement()}
            {activeTab === 'establishments' && renderEstablishments()}
            {activeTab === 'departments' && renderDepartments()}
            {activeTab === 'permissions' && <RolePermissionMatrix onSave={handleSavePermissions} onCancel={() => setActiveTab('users')} />}
            {activeTab === 'audit' && <AuditLogViewer />}
            {activeTab === 'export' && <ExportData />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'settings' && <AppSettings />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* MODALE DE CONFIRMATION GÉNÉRIQUE */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => { setIsConfirmModalOpen(false); setUserToDelete(null); setEtabToDelete(null); setDeptToDelete(null); }}
        onConfirm={
          userToDelete?.action === 'DELETE_USER' ? handleConfirmDeleteUser :
            userToDelete?.action === 'TOGGLE_STATUS' ? handleConfirmToggleStatus :
              deptToDelete ? handleConfirmDeleteDept :
                handleConfirmDeleteEtab
        }
        isLoading={
          (userToDelete?.action === 'DELETE_USER' && deleteUser.isPending) ||
          (userToDelete?.action === 'TOGGLE_STATUS' && updateUser.isPending) ||
          (deptToDelete && deleteDepartment.isPending) ||
          (etabToDelete && deleteEstablishment.isPending)
        }
        // TITRE DYNAMIQUE
        title={userToDelete?.action === 'DELETE_USER'
          ? `Supprimer le compte ?`
          : deptToDelete
            ? `Supprimer le département ?`
            : etabToDelete
              ? `Supprimer l'établissement ?`
              : userToDelete?.action === 'TOGGLE_STATUS'
                ? `Changer le statut ?`
                : "Confirmer l'action"
        }
        // MESSAGE DYNAMIQUE
        message={userToDelete?.action === 'DELETE_USER'
          ? `Vous êtes sur le point de supprimer définitivement le compte de <strong><u>${userToDelete.name}</u></strong>. Cette action est irréversible.`
          : deptToDelete
            ? `Vous êtes sur le point de supprimer le département <strong><u>${deptToDelete?.nom}</u></strong>. Assurez-vous qu'aucun médecin n'y est rattaché.`
            : etabToDelete
              ? `Vous êtes sur le point de supprimer l'établissement <strong><u>${etabToDelete?.nom}</u></strong>. Assurez-vous qu'aucun utilisateur n'y est rattaché.`
              : userToDelete?.action === 'TOGGLE_STATUS'
                ? `Voulez-vous vraiment ${userToDelete.newStatus ? 'activer' : 'désactiver'} le compte de <strong><u>${userToDelete.name}</u></strong> ?`
                : "Confirmer cette action critique."
        }
        confirmLabel={userToDelete?.action === 'TOGGLE_STATUS' ? "Changer Statut" : "Oui, Supprimer"}
        iconName={userToDelete?.action === 'TOGGLE_STATUS' ? "RefreshCw" : "Trash2"}
        iconColor={userToDelete?.action === 'TOGGLE_STATUS' ? "text-primary" : "text-rose-500"}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        user={selectedUser}
        onSave={handleSaveUser}
      />
      <EstablishmentModal
        isOpen={isEstablishmentModalOpen}
        onClose={() => { setIsEstablishmentModalOpen(false); setSelectedEstablishment(null); }}
        onSave={handleSaveEstablishment}
        establishment={selectedEstablishment}
      />

      <DepartmentModal
        isOpen={isDepartmentModalOpen}
        onClose={() => { setIsDepartmentModalOpen(false); setSelectedDepartment(null); }}
        onSave={handleSaveDepartment}
        department={selectedDepartment}
      />
    </div>
  );
};

export default UserAdministration;