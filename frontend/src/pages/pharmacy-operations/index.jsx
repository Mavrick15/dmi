import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { motion, AnimatePresence } from 'framer-motion';
import { usePharmacyStats, usePharmacyMutations } from '../../hooks/usePharmacy';
import { useToast } from '../../contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { getTodayInBusinessTimezone } from '../../utils/dateTime';

// Sous-composants
import InventoryOverview from './components/InventoryOverview';
import InventoryTable from './components/InventoryTable';
import PrescriptionsList from './components/PrescriptionsList';
import ExpiryAlerts from './components/ExpiryAlerts';
import SupplierManagement from './components/SupplierManagement';
import PredictiveAnalytics from './components/PredictiveAnalytics';
import RecentOrdersTable from './components/RecentOrdersTable';

// Modales d'action
import CreateOrderModal from './components/CreateOrderModal';
import ReceiveStockModal from './components/ReceiveStockModal';
import PhysicalInventoryModal from './components/PhysicalInventoryModal';
import AddSupplierModal from './components/AddSupplierModal';
import AddMedicationModal from './components/AddMedicationModal';
import OrderDetailsModal from './components/OrderDetailsModal';
import MedicationDetailsModal from './components/MedicationDetailsModal';
import SupplierDetailsModal from './components/SupplierDetailsModal';
import ConfirmationModal from '../../components/ui/ConfirmationModal'; 

const PharmacyOperations = () => {
  const { hasPermission } = usePermissions();
  const { data: stats, isLoading: loading, refetch: refetchStats } = usePharmacyStats();
  const { deleteMedication, deleteSupplier, receiveOrder, adjustStock } = usePharmacyMutations();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  
  // --- ÉTATS GLOBAUX ---
  const [activeTab, setActiveTab] = useState('inventory');
  const [refreshTrigger, setRefreshTrigger] = useState(0); 
  
  // État de visibilité des modales
  const [modals, setModals] = useState({
    order: false, receive: false, inventory: false, supplier: false, medication: false,
    confirm: false, orderDetails: false, supplierEdit: false
  });

  // État pour l'édition et la sélection
  const [selectedMedication, setSelectedMedication] = useState(null);
  
  // État de la commande en cours de réception
  const [orderToReceiveId, setOrderToReceiveId] = useState(null); 
  
  // État pour la modale de détails de commande
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  
  // État pour la modale de détails de médicament (alertes d'expiration)
  const [selectedMedicationForDetails, setSelectedMedicationForDetails] = useState(null);
  
  // État pour la modale de détails de fournisseur
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [selectedSupplierForOrder, setSelectedSupplierForOrder] = useState(null);
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState(null);
  
  // ÉTAT GÉNÉRIQUE DE CONFIRMATION
  const [confirmAction, setConfirmAction] = useState({
    id: null,
    actionType: '', // 'DELETE_MEDICAMENT', 'DELETE_SUPPLIER', 'RECEIVE_ORDER', 'MARK_ALL_ALERTS_TREATED'
    name: '',
    count: 0, // Pour stocker le nombre d'alertes à traiter
  });

  // Rafraîchissement des stats quand refreshTrigger change
  useEffect(() => {
    if (refreshTrigger > 0) {
      refetchStats();
    }
  }, [refreshTrigger, refetchStats]);

  // Fonction pour actualiser toutes les données
  const handleRefresh = async () => {
    try {
      // Rafraîchir les stats
      await refetchStats();
      // Invalider et rafraîchir toutes les queries liées à la pharmacie
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      await queryClient.invalidateQueries({ queryKey: ['pharmacy'] });
      await queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      await queryClient.invalidateQueries({ queryKey: ['alerts'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      showToast('Données actualisées avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de l\'actualisation', 'error');
    }
  };

  // Fonction pour exporter l'inventaire en CSV
  const handleExport = async () => {
    try {
      showToast('Export en cours...', 'info');
      
      // Récupérer toutes les données de l'inventaire (sans pagination)
      const response = await api.get('/pharmacy/inventory', { 
        params: { 
          limit: 10000, // Limite élevée pour récupérer toutes les données
          page: 1 
        } 
      });
      
      const items = response.data.data || [];
      
      if (items.length === 0) {
        showToast('Aucune donnée à exporter', 'warning');
        return;
      }

      // Préparer les en-têtes CSV
      const headers = [
        'Nom',
        'Code',
        'Catégorie',
        'Stock Disponible',
        'Stock Minimum',
        'Unité',
        'Prix Unitaire',
        'Date d\'Expiration',
        'Fournisseur',
        'Emplacement'
      ];

      // Convertir les données en lignes CSV
      const csvRows = [
        headers.join(','),
        ...items.map(item => {
          const row = [
            `"${(item.name || item.nom || '').replace(/"/g, '""')}"`,
            `"${(item.code || '').replace(/"/g, '""')}"`,
            `"${(item.category || item.categorie || '').replace(/"/g, '""')}"`,
            item.stockAvailable || item.stock_disponible || 0,
            item.minStock || item.stock_minimum || 0,
            `"${(item.unit || item.unite || '').replace(/"/g, '""')}"`,
            item.unitPrice || item.prix_unitaire || 0,
            item.expiryDate || item.date_expiration || '',
            `"${(item.supplier || item.fournisseur || '').replace(/"/g, '""')}"`,
            `"${(item.location || item.emplacement || '').replace(/"/g, '""')}"`
          ];
          return row.join(',');
        })
      ];

      // Créer le blob et télécharger
      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM pour Excel
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventaire_pharmacie_${getTodayInBusinessTimezone()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(`Export réussi : ${items.length} éléments`, 'success');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      showToast(error.userMessage || 'Erreur lors de l\'export des données', 'error');
    }
  };

  // --- GESTIONNAIRES DE MODALES ---
  const toggleModal = (modalName, value) => {
    setModals(prev => ({ ...prev, [modalName]: value }));
  };

  const onSuccessAction = () => {
    setRefreshTrigger(prev => prev + 1); 
  }
  
  // --- FLUX DE CONFIRMATION GÉNÉRIQUE (CRITIQUE) ---
  const initiateConfirm = (id, name, type) => {
    setConfirmAction({ id, name, actionType: type });
    toggleModal('confirm', true);
  };
  
  const handleFinalConfirm = async () => {
    if (!confirmAction.actionType) return;
    
    try {
      if (confirmAction.actionType === 'DELETE_MEDICAMENT') {
          await deleteMedication.mutateAsync(confirmAction.id);
          onSuccessAction();
      } else if (confirmAction.actionType === 'DELETE_SUPPLIER') {
          await deleteSupplier.mutateAsync(confirmAction.id);
          onSuccessAction();
      } else if (confirmAction.actionType === 'RECEIVE_ORDER') {
           // Déclenche la réception après confirmation
           handleReceiveStock(confirmAction.id); 
      } else if (confirmAction.actionType === 'MARK_ALL_ALERTS_TREATED') {
          // Marquer toutes les alertes comme traitées
          setMarkAllConfirmed(true);
          setTimeout(() => setMarkAllConfirmed(false), 100); // Reset après un court délai
          onSuccessAction();
      }
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    } finally {
      setConfirmAction({ id: null, name: '', actionType: '', count: 0 });
      toggleModal('confirm', false);
    }
  };

  // --- LOGIQUE DE RÉCEPTION DE STOCK ---
  const openReceiveStock = (orderId) => {
    setOrderToReceiveId(orderId); // Définit l'ID de la commande à traiter
    toggleModal('receive', true); // Ouvre la modale
  };
  
  const handleReceiveStock = async (orderId) => {
      if (!orderId) return;
      
      try {
          // Le hook usePharmacyMutations gère déjà :
          // - L'invalidation des queries (via invalidateAll dans handleSuccess)
          // - L'affichage du toast de succès/erreur
          // Pas besoin d'appeler onSuccessAction() car invalidateAll() le fait déjà
          await receiveOrder.mutateAsync(orderId);
          setOrderToReceiveId(null);
          toggleModal('confirm', false);
          toggleModal('receive', false);
          setRefreshTrigger(prev => prev + 1);
      } catch(e) {
          // L'erreur est déjà gérée par le hook (toast d'erreur affiché)
      }
  }

  // --- LOGIQUE POUR LES ALERTES D'EXPIRATION ---
  
  // Fonction pour voir les détails d'un médicament depuis une alerte
  const handleViewMedication = async (alertId) => {
    try {
      // Récupérer les détails du médicament depuis l'API
      const response = await api.get(`/pharmacy/medications/${alertId}/details`);
      if (response.data.success) {
        // Le format de réponse contient medicament et movements
        const medicationData = response.data.data.medicament;
        setSelectedMedicationForDetails(medicationData);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors du chargement des détails:', error);
      }
      showToast('Erreur lors du chargement des détails du médicament', 'error');
    }
  };

  // Fonction pour traiter une alerte d'expiration (retirer le stock expiré)
  const handleTreatAlert = async (alertId, medicationName, currentStock) => {
    try {
      // Retirer tout le stock expiré (mettre à 0)
      await adjustStock.mutateAsync({
        medicamentId: alertId,
        realQuantity: 0,
        reason: `Alerte d'expiration traitée - Stock expiré retiré (${currentStock} unités)`
      });
      
      // Rafraîchir les alertes
      onSuccessAction();
    } catch (error) {
      // L'erreur est déjà gérée par le hook
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors du traitement de l\'alerte:', error);
      }
    }
  };

  // Fonction pour initialiser la confirmation de réception
  const initiateReceiveConfirm = (orderId, orderName) => {
    setConfirmAction({ id: orderId, name: orderName, actionType: 'RECEIVE_ORDER', count: 0 });
    toggleModal('confirm', true);
  }

  // Fonction pour initialiser la confirmation de marquer toutes les alertes comme traitées
  const initiateMarkAllAlertsTreated = (alertCount) => {
    setConfirmAction({ id: null, name: '', actionType: 'MARK_ALL_ALERTS_TREATED', count: alertCount });
    toggleModal('confirm', true);
  }

  // État pour déclencher la vidage de la liste dans ExpiryAlerts
  const [markAllConfirmed, setMarkAllConfirmed] = useState(false);

  const handleReceiveSuccess = () => {
      onSuccessAction(); 
  };
  
  // HANDLERS POUR L'AJOUT / ÉDITION / SUPPRESSION MÉDICAMENT
  const handleOpenAddMedication = () => {
    setSelectedMedication(null);
    toggleModal('medication', true);
  };

  const handleOpenEditMedication = (medication) => {
    setSelectedMedication(medication);
    toggleModal('medication', true);
  };
  
  // HANDLERS POUR FOURNISSEURS
  const handleOpenAddSupplier = () => {
    toggleModal('supplier', true);
  };

  // --- CONFIGURATION UI ---
  const tabs = [
    { id: 'inventory', label: 'Inventaire', icon: 'Package' },
    { id: 'prescriptions', label: 'Prescriptions', icon: 'FileText' },
    { id: 'expiry', label: 'Alertes d\'expiration', icon: 'Clock' },
    { id: 'suppliers', label: 'Fournisseurs', icon: 'Truck' },
    { id: 'analytics', label: 'Analyses prédictives', icon: 'TrendingUp' }
  ];

  const quickActions = [
    { id: 1, title: 'Nouvelle commande', description: 'Créer une commande fournisseur', icon: 'ShoppingCart', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800', action: () => toggleModal('order', true) },
    { id: 2, title: 'Réception stock', description: 'Enregistrer une livraison', icon: 'PackageCheck', color: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800', action: () => toggleModal('receive', true) },
    { id: 3, title: 'Inventaire physique', description: 'Démarrer un comptage', icon: 'ClipboardList', color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800', action: () => toggleModal('inventory', true) },
    { id: 4, title: 'Nouveau médicament', description: 'Ajouter un produit', icon: 'Pill', color: 'bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800', action: handleOpenAddMedication }
  ];

  // --- VARIANTES D'ANIMATION ---
  const contentVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.2 } }
  };
  
  const tabItemVariants = {
      active: {
          scale: 1,
          opacity: 1,
          transition: { type: "spring", bounce: 0.3, duration: 0.5 }
      },
      inactive: {
          scale: 0.95,
          opacity: 0.7,
          transition: { duration: 0.2 }
      }
  };
  // --- FIN VARIANTES D'ANIMATION ---


  // --- RENDU UTILITAIRE ET FLUIDITÉ DES ONGLET ---
  const renderTabContent = () => {
    switch (activeTab) {
      case 'inventory': 
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
            <InventoryTable 
                onOpenAddMedication={handleOpenAddMedication} 
                refreshTrigger={refreshTrigger} 
                onEditMedication={handleOpenEditMedication}
                onDelete={initiateConfirm}
            />
          </motion.div>
        );
      case 'prescriptions': 
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible" exit="exit">
            <PrescriptionsList />
          </motion.div>
        );
      case 'expiry': 
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible" exit="exit">
            <ExpiryAlerts 
              refreshTrigger={refreshTrigger} 
              onAlertsTreated={onSuccessAction} 
              onMarkAllTreated={initiateMarkAllAlertsTreated}
              onMarkAllConfirmed={markAllConfirmed}
              onViewMedication={handleViewMedication}
              onTreatAlert={handleTreatAlert}
            />
          </motion.div>
        );
      case 'suppliers': 
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible" exit="exit">
            <SupplierManagement 
                onOpenAddSupplier={() => toggleModal('supplier', true)} 
                refreshTrigger={refreshTrigger} 
                onDelete={initiateConfirm}
                onReceiveOrder={handleReceiveStock}
                onViewOrderDetails={(orderId) => {
                  setSelectedOrderId(orderId);
                  toggleModal('orderDetails', true);
                }}
                onViewHistory={() => {
                  // Pour l'instant, on peut afficher un toast ou naviguer vers une page d'historique
                  showToast('Historique des commandes - Fonctionnalité à venir', 'info');
                }}
                onViewSupplier={(supplierId) => {
                  if (supplierId) {
                    setSelectedSupplierId(supplierId);
                  }
                }}
                onCreateOrder={(supplierId, supplierName) => {
                  if (supplierId && supplierName) {
                    setSelectedSupplierForOrder({ id: supplierId, name: supplierName });
                    toggleModal('order', true);
                  }
                }}
            />
          </motion.div>
        );
      case 'analytics': 
        return (
          <motion.div variants={contentVariants} initial="hidden" animate="visible" exit="exit">
            <PredictiveAnalytics 
              onCreateOrder={(supplierId, supplierName) => {
                if (supplierId && supplierName) {
                  setSelectedSupplierForOrder({ id: supplierId, name: supplierName });
                  toggleModal('order', true);
                }
              }}
              onViewMedication={(medication) => {
                if (medication) {
                  setSelectedMedicationForDetails(medication);
                  toggleModal('medicationDetails', true);
                }
              }}
            />
          </motion.div>
        );
      default: 
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 dark:from-slate-950 dark:via-slate-900/80 dark:to-slate-950 font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <Header />
      
      <main className="pt-24 w-full max-w-[1600px] mx-auto px-6 lg:px-8 pb-12">
        <div className="space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                <Icon name="Pill" size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Opérations pharmaceutiques</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Stocks, commandes et fournisseurs</p>
              </div>
            </div>
          </div>

          {/* KPI Cards - Affichés en premier sur toutes les pages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <InventoryOverview data={stats} loading={loading} />
          </motion.div>

          {/* Actions Rapides */}
          <div>
            {/* QUICK ACTIONS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.isArray(quickActions) && quickActions.map((action) => {
                if (!action || typeof action !== 'object') return null;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={action.action}
                    className="group flex items-start gap-3 p-4 glass-panel hover:shadow-md hover:border-primary/30 transition-all text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${action.color}`}>
                      <Icon name={action.icon} size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{action.description}</p>
                    </div>
                  </button>
                );
              }).filter(Boolean)}
            </div>
          </div>

          {/* Onglets */}
          <div className="glass-panel shadow-sm">
            <div className="p-4 border-b border-white/20 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl overflow-x-auto custom-scrollbar">
                {Array.isArray(tabs) && tabs.map((tab) => {
                  if (!tab || typeof tab !== 'object') return null;
                    const isActive = activeTab === tab.id;
                    return (
                        <motion.button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
                                isActive 
                                ? 'text-slate-900 dark:text-white' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                            }`}
                            variants={tabItemVariants}
                            initial="inactive"
                            animate={isActive ? "active" : "inactive"}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabBackground"
                                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-md"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <Icon name={tab.icon} size={16} className={isActive ? 'text-primary dark:text-blue-400' : 'opacity-70'} />
                                {tab.label}
                            </span>
                        </motion.button>
                    );
                })}
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="rounded-xl" iconName="RefreshCw" onClick={handleRefresh} disabled={loading}>
                  Actualiser
                </Button>
                <PermissionGuard requiredPermission="audit_view">
                  <Button variant="default" size="sm" className="rounded-xl" iconName="Download" disabled={!hasPermission('audit_view')} onClick={handleExport}>
                    Exporter
                  </Button>
                </PermissionGuard>
              </div>
            </div>
          </div>

          {/* Contenu Principal */}
          <div className="min-h-[500px]">
            {renderTabContent()}
          </div>

          {/* Zone d'urgence */}
          <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/20 p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800">
                  <Icon name="AlertTriangle" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Zone d'urgence</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Rupture de stock, contact fournisseur, commande express.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="rounded-xl border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300" iconName="Phone">Contacter fournisseur</Button>
                <Button variant="outline" size="sm" className="rounded-xl border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300" iconName="AlertCircle">Signaler rupture</Button>
                <Button size="sm" className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white" iconName="Zap">Commande express</Button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* --- MODALE DE CONFIRMATION GÉNÉRIQUE (CRITIQUE - DOIT ÊTRE EN DERNIER) --- */}
      <ConfirmationModal
        isOpen={modals.confirm}
        onClose={() => { toggleModal('confirm', false); setConfirmAction({ id: null, name: '', actionType: '', count: 0 }); }}
        onConfirm={handleFinalConfirm}
        isLoading={
          (confirmAction.actionType === 'DELETE_MEDICAMENT' && deleteMedication.isPending) ||
          (confirmAction.actionType === 'DELETE_SUPPLIER' && deleteSupplier.isPending) ||
          (confirmAction.actionType === 'RECEIVE_ORDER' && receiveOrder.isPending)
        }
        // TITRE DYNAMIQUE
        title={confirmAction.actionType.includes('DELETE') 
            ? `Supprimer définitivement ?`
            : confirmAction.actionType === 'RECEIVE_ORDER' 
            ? `Valider la réception de la commande ?`
            : confirmAction.actionType === 'MARK_ALL_ALERTS_TREATED'
            ? `Marquer toutes les alertes comme traitées ?`
            : "Confirmer l'action"}
        // MESSAGE DYNAMIQUE
        message={confirmAction.actionType === 'DELETE_MEDICAMENT'
            ? `Le médicament <strong><u>${confirmAction.name}</u></strong> sera retiré de l'inventaire et de la base. Cette opération est irréversible.`
            : confirmAction.actionType === 'DELETE_SUPPLIER'
            ? `Le fournisseur <strong><u>${confirmAction.name}</u></strong> sera retiré. Assurez-vous qu'aucune commande en cours n'y est liée.`
            : confirmAction.actionType === 'RECEIVE_ORDER'
            ? (() => {
                const match = confirmAction.name?.match(/- (.+?) \(/);
                const supplierName = match ? match[1].trim().split(' ')[0] : (confirmAction.name || 'cette commande');
                return `Confirmez la réception complète de la commande <strong><u>${supplierName}</u></strong> pour mettre à jour les stocks.`;
              })()
            : confirmAction.actionType === 'MARK_ALL_ALERTS_TREATED'
            ? `Toutes les <strong><u>${confirmAction.count || 0} alerte(s)</u></strong> d'expiration seront marquées comme traitées.`
            : "Êtes-vous sûr de vouloir exécuter cette action ?"}
        confirmLabel={confirmAction.actionType.includes('DELETE') ? "Oui, Supprimer" : confirmAction.actionType === 'RECEIVE_ORDER' ? "Oui, Recevoir" : confirmAction.actionType === 'MARK_ALL_ALERTS_TREATED' ? "Oui, Marquer traité" : "Confirmer"}
        iconName={confirmAction.actionType.includes('DELETE') ? "Trash2" : confirmAction.actionType === 'RECEIVE_ORDER' ? "PackageCheck" : confirmAction.actionType === 'MARK_ALL_ALERTS_TREATED' ? "CheckCircle" : "AlertTriangle"}
        iconColor={confirmAction.actionType.includes('DELETE') ? "text-rose-500" : confirmAction.actionType === 'RECEIVE_ORDER' ? "text-emerald-500" : confirmAction.actionType === 'MARK_ALL_ALERTS_TREATED' ? "text-emerald-500" : "text-amber-500"}
      />

      {/* --- MODALES --- */}
      <CreateOrderModal 
        isOpen={modals.order} 
        onClose={() => {
          toggleModal('order', false);
          setSelectedSupplierForOrder(null);
        }} 
        onSuccess={onSuccessAction}
        preselectedSupplier={selectedSupplierForOrder}
      />
      <ReceiveStockModal 
        isOpen={modals.receive} 
        onClose={() => toggleModal('receive', false)} 
        onSuccess={onSuccessAction}
        orderId={orderToReceiveId} 
        onCloseAndReset={() => setOrderToReceiveId(null)}
        onConfirmReceive={initiateReceiveConfirm} // Initialise la confirmation avant d'ouvrir la modale
      />
      <PhysicalInventoryModal 
        isOpen={modals.inventory} 
        onClose={() => toggleModal('inventory', false)} 
        onSuccess={onSuccessAction}
      />
      <AddSupplierModal 
        isOpen={modals.supplier} 
        onClose={() => toggleModal('supplier', false)} 
        onSuccess={onSuccessAction}
      />
      <AddMedicationModal 
        isOpen={modals.medication} 
        onClose={() => toggleModal('medication', false)} 
        onSuccess={onSuccessAction}
        medicationToEdit={selectedMedication} 
      />
      <OrderDetailsModal
        isOpen={modals.orderDetails}
        onClose={() => {
          toggleModal('orderDetails', false);
          setSelectedOrderId(null);
        }}
        orderId={selectedOrderId}
      />
      <MedicationDetailsModal
        isOpen={!!selectedMedicationForDetails}
        onClose={() => setSelectedMedicationForDetails(null)}
        medication={selectedMedicationForDetails}
      />
      <SupplierDetailsModal
        isOpen={!!selectedSupplierId}
        onClose={() => setSelectedSupplierId(null)}
        supplierId={selectedSupplierId}
        onCreateOrder={(supplierId, supplierName) => {
          setSelectedSupplierId(null);
          setSelectedSupplierForOrder({ id: supplierId, name: supplierName });
          toggleModal('order', true);
        }}
        onEdit={(supplier) => {
          setSelectedSupplierId(null);
          setSelectedSupplierForEdit(supplier);
          toggleModal('supplierEdit', true);
        }}
      />
      <AddSupplierModal
        isOpen={modals.supplierEdit}
        onClose={() => {
          toggleModal('supplierEdit', false);
          setSelectedSupplierForEdit(null);
        }}
        onSuccess={onSuccessAction}
        supplierToEdit={selectedSupplierForEdit}
      />

    </div>
  );
};

export default PharmacyOperations;
