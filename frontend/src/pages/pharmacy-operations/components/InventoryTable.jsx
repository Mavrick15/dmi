import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import api from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { useToast } from '../../../contexts/ToastContext';
import { useCurrency } from '../../../contexts/CurrencyContext'; 

const InventoryTable = ({ onOpenAddMedication, onEditMedication, onDelete }) => { 
  const { hasPermission } = usePermissions();
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [page, setPage] = useState(1); 
  
  const [selectedMedicationDetailsId, setSelectedMedicationDetailsId] = useState(null);

  const itemsPerPage = 10; 
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Debounce de la recherche (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset à la page 1 lors d'une nouvelle recherche
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- 1. FONCTIONS DE FETCH (API) ---

  // Récupération de l'inventaire principal
  const fetchInventory = async () => {
    const params = {
      page: page, 
      limit: itemsPerPage, 
      search: debouncedSearch.trim() || undefined,
      sort: sortBy,
      category: filterCategory !== 'all' ? filterCategory : undefined 
    };
    
    const response = await api.get('/pharmacy/inventory', { params });
    
    // Normalisation de la réponse pour éviter les erreurs si l'API change légèrement
    return {
        data: Array.isArray(response.data.data) ? response.data.data : [],
        meta: response.data.meta || { total: 0, last_page: 1 }
    };
  };

  // Récupération des détails (Mouvements de stock) pour un médicament spécifique
  const fetchDetails = async (id) => {
      const res = await api.get(`/pharmacy/medications/${id}/details`);
      return res.data.data;
  };

  // --- 2. REACT QUERY : HOOK PRINCIPAL ---
  const { 
    data: inventoryData, 
    isLoading, 
    isError 
  } = useQuery({
    // La clé inclut toutes les dépendances pour re-fetch automatiquement si elles changent
    queryKey: ['inventory', page, debouncedSearch, filterCategory, sortBy],
    queryFn: fetchInventory,
    keepPreviousData: true, // Garde les données affichées pendant le chargement de la page suivante
    staleTime: 30000, // Cache valide 30 secondes
  });

  // Extraction sécurisée des données
  const items = inventoryData?.data || [];
  const meta = inventoryData?.meta || {};
  const totalPages = meta.lastPage || meta.last_page || 1;
  const totalItems = meta.total || 0;
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + items.length;

  // --- 3. HANDLERS ---

  const handleSearchChange = (e) => {
      setSearchTerm(e.target.value);
      setPage(1); // Reset à la page 1 lors d'une recherche
  };

  const handleCategoryChange = (val) => {
      setFilterCategory(val);
      setPage(1);
  };

  const handleSortChange = (val) => {
      setSortBy(val);
      setPage(1);
  };

  // Gestion de l'ouverture des détails avec pré-chargement (Prefetch)
  const toggleDetails = async (id) => {
    if (selectedMedicationDetailsId === id) {
        setSelectedMedicationDetailsId(null);
    } else {
        setSelectedMedicationDetailsId(id);
        // On pré-charge les données pour une UI plus réactive
        await queryClient.prefetchQuery({
            queryKey: ['medication', id, 'details'],
            queryFn: () => fetchDetails(id)
        });
    }
  };

  // Appel de la modale de suppression du parent
  const handleDeleteMedication = (id, name) => {
    if (onDelete) {
      onDelete(id, name, 'DELETE_MEDICAMENT');
    }
  };

  // --- 4. COMPOSANTS INTERNES & OPTIONS ---

  // Sous-composant pour la ligne de détails (Expandable Row)
  const MedicationDetailsRow = ({ id }) => {
     const { data: details, isLoading: detailsLoading } = useQuery({
         queryKey: ['medication', id, 'details'],
         queryFn: () => fetchDetails(id)
     });

     if (detailsLoading) {
        return (
             <tr className="col-span-full bg-slate-50 dark:bg-slate-800/50">
                <td colSpan={6} className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                    <Icon name="Loader2" size={20} className="animate-spin" />
                    Chargement de l'historique…
                  </div>
                </td>
             </tr>
        );
     }

     return (
        <tr className='col-span-full animate-fade-in'>
            <td colSpan={6} className="p-0">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-y border-slate-200 dark:border-slate-700 shadow-inner">
                    <div className="flex justify-between items-center mb-4">
                        <h5 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <Icon name="ListTree" size={18} className="text-primary"/> 
                            Historique des Mouvements ({details?.movements?.length || 0})
                        </h5>
                        <div className="text-xs text-slate-400">ID: {id}</div>
                    </div>
                    
                    {details?.movements?.length > 0 ? (
                        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                            <table className="w-full text-xs">
                                 <thead>
                                     <tr className="text-left text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-white dark:bg-slate-800">
                                         <th className="p-3 font-semibold border-b dark:border-slate-700">Date</th>
                                         <th className="p-3 font-semibold border-b dark:border-slate-700">Type</th>
                                         <th className="p-3 font-semibold border-b dark:border-slate-700 text-right">Quantité</th>
                                         <th className="p-3 font-semibold border-b dark:border-slate-700 text-right">Prix Achat</th>
                                         <th className="p-3 font-semibold border-b dark:border-slate-700">Utilisateur</th>
                                         <th className="p-3 font-semibold border-b dark:border-slate-700">Raison</th>
                                     </tr>
                                 </thead>
                                 <tbody className="bg-white dark:bg-slate-800/50 divide-y divide-slate-100 dark:divide-slate-700">
                                    {Array.isArray(details.movements) && details.movements.map((move, i) => {
                                      if (!move || typeof move !== 'object') return null;
                                      return (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{move.date}</td>
                                            <td className="p-3 font-medium capitalize text-slate-700 dark:text-slate-200">{move.type}</td>
                                            <td className={`p-3 text-right font-bold ${move.quantity < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {move.quantity > 0 ? '+' : ''}{move.quantity}
                                            </td>
                                            <td className="p-3 text-right text-slate-600 dark:text-slate-300">
                                                {move.unitPrice ? formatCurrency(move.unitPrice) : '-'}
                                            </td>
                                            <td className="p-3 text-slate-600 dark:text-slate-300">{move.user}</td>
                                            <td className="p-3 text-slate-500 dark:text-slate-400 italic max-w-xs truncate" title={move.reason}>{move.reason || '-'}</td>
                                        </tr>
                                      );
                                    }).filter(Boolean)}
                                 </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center p-6 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
                            Aucun mouvement de stock enregistré pour ce produit.
                        </div>
                    )}
                </div>
            </td>
        </tr>
     );
  };

  const categoryOptions = [
    { value: 'all', label: 'Toutes les catégories' },
    { value: 'Comprimé', label: 'Comprimés' },
    { value: 'Sirop', label: 'Sirops' },
    { value: 'Injection', label: 'Injections' },
    { value: 'Topique', label: 'Topiques' },
    { value: 'Divers', label: 'Divers' }
  ];
  
  const sortOptions = [
    { value: 'name', label: 'Nom (A-Z)' },
    { value: 'stockActuel', label: 'Stock (Croissant)' },
    { value: 'dateExpiration', label: 'Date d\'expiration' },
  ];

  const getStatusBadge = (status) => {
    const configs = {
      normal: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800', label: 'Normal' },
      low: { color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800', label: 'Faible' },
      critical: { color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800', label: 'Critique' },
      en_stock: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800', label: 'En Stock' },
      stock_faible: { color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800', label: 'Faible' },
      rupture_stock: { color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800', label: 'Rupture' }
    };
    // Fallback 'normal' si statut inconnu
    const config = configs[status] || configs.normal;
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${config.color}`}>
        {config.label}
      </span>
    );
  };
  
  const inputClassName = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white";

  // --- RENDER PRINCIPAL ---
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
      
      {/* 1. Header & Filtres */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
               <Icon name="List" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Inventaire ({totalItems})</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Gestion centralisée des stocks</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-48">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Icon name="Search" size={16} />
               </div>
               <Input 
                  type="search" 
                  placeholder="Rechercher (nom, code)..." 
                  value={searchTerm} 
                  onChange={handleSearchChange} 
                  maxLength={100}
                  className={`pl-9 h-9 text-sm ${inputClassName}`} 
               />
            </div>
            <div className="flex-1 sm:w-48">
              <Select options={categoryOptions} value={filterCategory} onChange={handleCategoryChange} placeholder="Catégorie" buttonClassName={inputClassName} />
            </div>
            <div className="flex-1 sm:w-40">
              <Select options={sortOptions} value={sortBy} onChange={handleSortChange} placeholder="Trier par" buttonClassName={inputClassName} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tableau */}
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="text-left p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Médicament</th>
              <th className="text-left p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stock</th>
              <th className="text-left p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Statut</th>
              <th className="text-left p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expiration</th>
              <th className="text-left p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Valeur</th>
              <th className="text-right p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {isLoading ? (
               <tr>
                  <td colSpan={6} className="p-12">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-center gap-3 py-10">
                      <Icon name="Loader2" size={28} className="animate-spin text-primary" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement de l'inventaire…</p>
                    </div>
                  </td>
               </tr>
            ) : isError ? (
                <tr>
                    <td colSpan={6} className="p-12">
                      <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/20 flex flex-col items-center justify-center gap-3 py-10">
                        <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                          <Icon name="AlertCircle" size={24} className="text-rose-600 dark:text-rose-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Erreur lors du chargement. Veuillez réessayer.</p>
                      </div>
                    </td>
                </tr>
            ) : items.length === 0 ? (
               <tr>
                   <td colSpan={6} className="p-12">
                     <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                       <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 border border-slate-200 dark:border-slate-700">
                         <Icon name="PackageX" size={28} className="text-slate-400 dark:text-slate-500" />
                       </div>
                       <p className="text-sm font-semibold text-slate-900 dark:text-white">Aucun médicament trouvé</p>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Modifiez les filtres ou ajoutez un médicament.</p>
                     </div>
                   </td>
               </tr>
            ) : (
                Array.isArray(items) && items.map((item) => {
                  if (!item || typeof item !== 'object') return null;
                   const maxStock = item.stockMinimum ? item.stockMinimum * 5 : 100;
                   const stockPercent = Math.min((item.currentStock / maxStock) * 100, 100);
                   const stockColor = item.currentStock <= item.stockMinimum ? 'bg-rose-500' : item.currentStock <= item.stockMinimum * 1.5 ? 'bg-amber-500' : 'bg-emerald-500';

                   return (
                    <React.Fragment key={item.id}>
                        <motion.tr 
                            className={`transition-all duration-200 group cursor-pointer ${selectedMedicationDetailsId === item.id ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-sm'}`}
                            onClick={() => toggleDetails(item.id)}
                            whileHover={{ x: 2 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            <td className="p-4">
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">{item.category}</span>
                                        {item.dosage && <span>{item.dosage}</span>}
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center space-x-3">
                                    <span className="font-bold text-slate-700 dark:text-slate-200 w-8 text-right">{item.currentStock}</span>
                                    <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${stockColor}`} style={{ width: `${stockPercent}%` }} />
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 pl-11">
                                    Min: {item.minStock || item.stockMinimum} | Lot: {item.batchNumber}
                                </div>
                            </td>
                            <td className="p-4">{getStatusBadge(item.statutStock)}</td>
                            <td className="p-4">
                                <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                                    <Icon name="Calendar" size={14} className="text-slate-400" />
                                    {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('fr-FR') : 'N/A'}
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(item.totalValue)}</div>
                                <div className="text-[10px] text-slate-400">PU: {formatCurrency(item.unitCost)}</div>
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-slate-500 hover:text-primary dark:hover:text-blue-400" 
                                        onClick={(e) => { e.stopPropagation(); toggleDetails(item.id); }}
                                        title={selectedMedicationDetailsId === item.id ? "Masquer détails" : "Voir détails"}
                                    >
                                        <Icon name={selectedMedicationDetailsId === item.id ? "ChevronUp" : "ChevronDown"} size={16} />
                                    </Button>
                                    
                                    <PermissionGuard requiredPermission="medication_edit">
                                      <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 text-slate-500 hover:text-primary dark:hover:text-blue-400" 
                                          onClick={(e) => { e.stopPropagation(); onEditMedication(item); }}
                                          disabled={!hasPermission('medication_edit')}
                                          title="Éditer"
                                      >
                                          <Icon name="Edit2" size={16} />
                                      </Button>
                                    </PermissionGuard>
                                    
                                    <PermissionGuard requiredPermission="medication_delete">
                                      <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20" 
                                          onClick={(e) => { e.stopPropagation(); handleDeleteMedication(item.id, item.name); }}
                                          disabled={!hasPermission('medication_delete')}
                                          title="Supprimer"
                                      >
                                          <Icon name="Trash2" size={16} />
                                      </Button>
                                    </PermissionGuard>
                                </div>
                            </td>
                        </motion.tr>
                        {/* Ligne de détails affichée conditionnellement */}
                        {selectedMedicationDetailsId === item.id && <MedicationDetailsRow id={item.id} />}
                    </React.Fragment>
                   );
                })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Footer & Pagination */}
      {!isLoading && !isError && totalItems > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
             <PermissionGuard requiredPermission="medication_create">
               <Button variant="default" size="sm" iconName="Pill" onClick={onOpenAddMedication} disabled={!hasPermission('medication_create')} className="rounded-xl">
                 Ajouter médicament
               </Button>
             </PermissionGuard>
             <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {startIndex + 1}-{Math.min(endIndex, totalItems)} sur {totalItems}
             </span>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="rounded-xl">
                  Précédent
                </Button>
                <span className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  Page {page} / {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="rounded-xl">
                  Suivant <Icon name="ChevronRight" size={14} className="ml-1" />
                </Button>
             </div>
          </div>
      )}
    </div>
  );
};

export default InventoryTable;