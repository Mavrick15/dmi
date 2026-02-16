import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../lib/axios';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import RecentOrdersTable from './RecentOrdersTable';
import { useToast } from '../../../contexts/ToastContext';
import { useSuppliers } from '../../../hooks/usePharmacy';
import { Loader2 } from 'lucide-react'; // Ajout pour l'icône de chargement
import AddSupplierModal from './AddSupplierModal'; // <--- IMPORT MODALE AJOUT

const SupplierManagement = ({ onOpenAddSupplier, refreshTrigger, onDelete, onReceiveOrder, onViewOrderDetails, onViewHistory, onViewSupplier, onCreateOrder }) => { 
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState('suppliers');
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  
  // États pour pagination et recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // État de la modale d'ajout/édition
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); 
  const [supplierToEdit, setSupplierToEdit] = useState(null);
  
  const { showToast } = useToast(); 

  // Debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Réinitialiser à la page 1 lors d'une nouvelle recherche
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Récupérer les fournisseurs avec pagination et recherche
  const { data: suppliersResponse, isLoading: loadingSuppliers, refetch: refetchSuppliers } = useSuppliers({
    page: currentPage,
    limit: 20,
    search: debouncedSearch.trim() || undefined
  });

  // Extraire les données de la réponse paginée
  const suppliers = suppliersResponse?.data || [];
  const pagination = suppliersResponse?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  };

  // --- EFFET DE CHARGEMENT DES COMMANDES RÉCENTES ---
  const fetchRecentOrders = async () => {
    setLoadingOrders(true);
    try {
        const response = await api.get('/pharmacy/orders/recent');
        setRecentOrders(response.data.data);
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Erreur chargement commandes:", error);
        }
        showToast("Échec du chargement des commandes récentes.", 'error');
        setRecentOrders([]); 
    } finally {
        setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchRecentOrders();
  }, [refreshTrigger]);

  // Rafraîchir les fournisseurs quand refreshTrigger change
  useEffect(() => {
    if (refreshTrigger) {
      refetchSuppliers();
    }
  }, [refreshTrigger, refetchSuppliers]); 

  // NOUVELLE FONCTION DE SUPPRESSION (pour appeler la modale du parent)
  const handleDeleteSupplier = (supplier) => {
     // Utilise l'actionType 'DELETE_SUPPLIER' pour la logique du parent
     if (onDelete) {
         onDelete(supplier.id, supplier.nom, 'DELETE_SUPPLIER');
     }
  };
  
  // Fonction de succès après création/édition
  const handleSupplierSaveSuccess = () => {
      setIsAddModalOpen(false); // Ferme la modale
      setSupplierToEdit(null); // Réinitialise le fournisseur à éditer
      // On déclenche le re-fetch manuel pour rafraîchir la liste
      refetchSuppliers(); 
      fetchRecentOrders();
  };


  // --- RENDU UTILITAIRE ---
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50', label: 'Actif', icon: 'CheckCircle' },
      preferred: { color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50', label: 'Préféré', icon: 'Star' },
      inactive: { color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700', label: 'Inactif', icon: 'XCircle' },
      // ... (autres statuts)
    };
    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${config.color}`}>
        <Icon name={config.icon} size={12} />
        {config.label}
      </span>
    );
  };

  const renderStarRating = (rating) => {
    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="Star"
            size={14}
            className={star <= Math.round(rating) ? 'text-amber-400 fill-current' : 'text-slate-300 dark:text-slate-600'}
          />
        ))}
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1.5">{rating.toFixed(1)}</span>
      </div>
    );
  };
  
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
      
      {/* Header with Tabs */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                <Icon name="Truck" size={20} />
             </div>
             <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gestion des fournisseurs</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Suivi des partenaires et commandes</p>
             </div>
          </div>
          <PermissionGuard requiredPermission="inventory_manage">
            <Button variant="default" iconName="Plus" onClick={() => setIsAddModalOpen(true)} disabled={!hasPermission('inventory_manage')} className="shadow-lg shadow-primary/20">
              Nouveau fournisseur
            </Button>
          </PermissionGuard>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'suppliers' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            Fournisseurs ({loadingSuppliers ? '...' : pagination.total})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'orders' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            Commandes récentes ({loadingOrders ? '...' : recentOrders.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 bg-white dark:bg-slate-900">
        {/* TAB: FOURNISSEURS */}
        {activeTab === 'suppliers' && (
          <div className="space-y-6 animate-fade-in">

            {loadingSuppliers ? (
                 <div className="flex justify-center items-center h-48 text-primary">
                    <Loader2 className="animate-spin" size={32} />
                    <span className="ml-3 text-slate-500">Chargement des fournisseurs...</span>
                 </div>
            ) : suppliers.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                    <Icon name="SearchX" size={32} />
                    <p className="mt-2 text-sm">Aucun fournisseur enregistré</p>
                 </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                  {Array.isArray(suppliers) && suppliers.map((supplier) => {
                    if (!supplier || typeof supplier !== 'object') return null;
                    return (
                      <div key={supplier.id} className="group bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md hover:border-primary/30 transition-all duration-300">
                      
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-primary transition-colors">{supplier.nom}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{supplier.contactNom || 'N/A'}</p>
                        </div>
                        {getStatusBadge(supplier.actif ? 'active' : 'inactive')}
                      </div>

                      <div className="space-y-3 mb-5">
                        <div className="flex items-center space-x-3 text-sm text-slate-600 dark:text-slate-300">
                          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"><Icon name="Mail" size={14} /></div>
                          <span>{supplier.email}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-slate-600 dark:text-slate-300">
                          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"><Icon name="Phone" size={14} /></div>
                          <span>{supplier.telephone || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="pt-5 border-t border-slate-100 dark:border-slate-700/50">
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Délai moyen</span>
                            <div className="font-bold text-slate-900 dark:text-white mt-0.5">{supplier.delaiLivraisonMoyen} jours</div>
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Commandes</span>
                            <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                                {supplier.totalOrders} {/* VALEUR DYNAMIQUE */}
                            </div>
                          </div> 
                          <div>
                            <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Évaluation</span>
                            <div className="mt-1">{renderStarRating(supplier.rating)}</div> 
                          </div> 
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Icon name="Calendar" size={12} />
                            Livraison : <span className="font-semibold text-slate-700 dark:text-slate-200">{formatDate(supplier.nextDelivery)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              iconName="Eye" 
                              type="button"
                              className="text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (onViewSupplier && supplier?.id) {
                                  onViewSupplier(supplier.id);
                                }
                              }}
                              title="Voir les détails"
                            >
                              Voir
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              iconName="Edit2" 
                              className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSupplierToEdit(supplier);
                                setIsAddModalOpen(true);
                              }}
                              title="Modifier"
                            >
                              Modifier
                            </Button>
                            <PermissionGuard requiredPermission="order_create">
                              <Button 
                                  variant="outline" 
                                  size="sm" 
                                  iconName="ShoppingCart" 
                                  type="button"
                                  className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                                  disabled={!hasPermission('order_create')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    if (onCreateOrder && supplier?.id && supplier?.nom) {
                                      onCreateOrder(supplier.id, supplier.nom);
                                    }
                                  }}
                                  title="Créer une commande"
                              >
                                Commander
                              </Button>
                            </PermissionGuard>
                            
                            {/* BOUTON SUPPRIMER FOURNISSEUR */}
                            <PermissionGuard requiredPermission="inventory_manage">
                              <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteSupplier(supplier); }} 
                                  disabled={!hasPermission('inventory_manage')}
                                  className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                  title="Supprimer le fournisseur"
                              >
                                <Icon name="Trash2" size={16} />
                              </Button>
                            </PermissionGuard>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  }).filter(Boolean)}
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="ChevronLeft"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Précédent
                </Button>
                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                  Page {pagination.page} sur {pagination.totalPages} ({pagination.total} fournisseur{pagination.total > 1 ? 's' : ''})
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="ChevronRight"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Suivant
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB: COMMANDES RÉCENTES */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in">
             <RecentOrdersTable 
               orders={recentOrders} 
               loading={loadingOrders}
               onReceiveOrder={onReceiveOrder}
               onViewOrderDetails={onViewOrderDetails}
               onViewHistory={onViewHistory}
             />
          </div>
        )}
      </div>
      
      {/* Modale d'ajout/édition de fournisseur */}
      <AddSupplierModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setSupplierToEdit(null);
        }} 
        onSuccess={handleSupplierSaveSuccess}
        supplierToEdit={supplierToEdit}
      />
    </div>
  );
};

export default SupplierManagement;