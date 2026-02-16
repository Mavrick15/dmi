import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import api from '../../../lib/axios'; 
import { useToast } from '../../../contexts/ToastContext'; 
import Pagination from '../../../components/ui/Pagination'; 
import { Loader2, Search } from 'lucide-react';

const AuditLogViewer = () => {
  // États
  const [filters, setFilters] = useState({ dateRange: '7days', action: 'all', search: '' });
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { showToast } = useToast();

  const filterOptions = [
    { value: 'all', label: 'Toutes les actions' },
    { value: 'created', label: 'Créations' },
    { value: 'updated', label: 'Modifications' },
    { value: 'deleted', label: 'Suppressions' },
    { value: 'login', label: 'Connexions' },
    { value: 'logout', label: 'Déconnexions' },
    { value: 'user', label: 'Utilisateurs' },
    { value: 'patient', label: 'Patients' },
    { value: 'document', label: 'Documents' },
    { value: 'facture', label: 'Factures' },
    { value: 'consultation', label: 'Consultations' },
    { value: 'rendezvous', label: 'Rendez-vous' },
    { value: 'prescription', label: 'Prescriptions' },
    { value: 'transaction', label: 'Transactions' }
  ];

  const dateRangeOptions = [
    { value: '7days', label: '7 derniers jours' },
    { value: '30days', label: '30 derniers jours' },
    { value: '90days', label: '90 derniers jours' },
  ];

  // Fonction de récupération des logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    
    // Calcul de la date de début
    let dateFrom = undefined;
    const now = new Date();
    
    if (filters.dateRange === '7days') {
        const d = new Date(now);
        d.setDate(now.getDate() - 7);
        dateFrom = d.toISOString();
    } else if (filters.dateRange === '30days') {
        const d = new Date(now);
        d.setDate(now.getDate() - 30);
        dateFrom = d.toISOString();
    } else if (filters.dateRange === '90days') {
        const d = new Date(now);
        d.setDate(now.getDate() - 90);
        dateFrom = d.toISOString();
    }
    
    try {
      const params = {
        page: currentPage,
        limit: 15, // Limite fixe pour l'audit
        search: filters.search,
        actionType: filters.action !== 'all' ? filters.action : undefined,
        dateFrom: dateFrom,
      };
      
      const response = await api.get('/audit', { params });

      if (response.data.success && Array.isArray(response.data.data)) {
        setAuditLogs(response.data.data);
        const meta = response.data.meta || {};
        setTotalPages(meta.last_page || meta.lastPage || 1);
      } else {
        setAuditLogs([]);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur chargement logs:", error);
      }
      // Utilisation du message standardisé
      showToast(error.userMessage || "Échec du chargement des journaux d'audit.", 'error');
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters.action, filters.dateRange, filters.search, showToast]);

  // Debounce pour la recherche et fetch automatique au changement de filtres
  useEffect(() => {
    const timeoutId = setTimeout(() => fetchLogs(), 300);
    return () => clearTimeout(timeoutId);
  }, [fetchLogs]);

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset page lors du changement de filtre
  };

  // Utilitaires de rendu
  const getStatusStyle = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'success' || s === 'completed') {
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50';
    }
    if (s === 'failed' || s === 'error') {
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/50';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  };

  const getActionIcon = (action) => {
    const act = action?.toLowerCase() || '';
    if (act.includes('connexion') || act.includes('login')) return 'LogIn';
    if (act.includes('créé') || act.includes('ajout')) return 'PlusCircle';
    if (act.includes('supprimé') || act.includes('delete')) return 'Trash2';
    if (act.includes('modifié') || act.includes('update')) return 'Edit';
    if (act.includes('erreur') || act.includes('échec')) return 'AlertTriangle';
    return 'Activity';
  };
  
  const formatDate = (dateStr) => {
      if(!dateStr) return '-';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleString('fr-FR', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });
      } catch (error) {
        return '-';
      }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full animate-fade-in">
      
      {/* Header & Filtres */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50">
            <Icon name="FileText" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Journaux d'Audit</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Traçabilité des opérations</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
            <div className="relative flex-1 sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search size={16} />
                </div>
                <input 
                    type="text" 
                    placeholder="Rechercher (User, Action)..." 
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                />
            </div>
            
            <div className="flex gap-2">
                <Select 
                    options={dateRangeOptions} 
                    value={filters.dateRange} 
                    onChange={(val) => handleFilterChange('dateRange', val)}
                    placeholder="Période"
                    buttonClassName="w-40 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
                <Select 
                    options={filterOptions} 
                    value={filters.action} 
                    onChange={(val) => handleFilterChange('action', val)}
                    placeholder="Type d'action"
                    buttonClassName="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
                <Button variant="outline" size="icon" iconName="Download" className="dark:border-slate-700 dark:text-slate-300" title="Exporter CSV" />
            </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-80 text-slate-400">
              <Loader2 className="animate-spin mb-2 text-primary" size={32} />
              <p>Chargement des logs...</p>
          </div>
        ) : auditLogs.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-80 text-slate-400">
               <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-3">
                   <Icon name="SearchX" size={32} />
               </div>
               <p className="text-sm font-medium">Aucun log trouvé pour ces critères.</p>
           </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-36">Date & Heure</th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-48">Utilisateur</th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40">Type</th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Opération</th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Ressource</th>
                <th className="text-center p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-28">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {Array.isArray(auditLogs) && auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {log.date || (log.timestamp ? formatDate(log.timestamp).split(' ')[0] : '-')}
                      </span>
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {log.time || (log.timestamp ? formatDate(log.timestamp).split(' ')[1] : '-')}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-bold uppercase">
                          {log.user && typeof log.user === 'string' ? log.user.charAt(0) : '?'}
                      </div>
                      <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[120px]" title={log.user}>
                              {log.user || 'Système'}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wide">{log.userRole || 'Automate'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        log.actionCategory === 'Création' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                        log.actionCategory === 'Modification' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                        log.actionCategory === 'Suppression' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' :
                        log.actionCategory === 'Connexion' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' :
                        'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        <Icon name={log.actionIcon || getActionIcon(log.action)} size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{log.actionCategory || 'Action'}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{log.resourceType || 'Ressource'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-700 dark:text-slate-300 max-w-[300px]">
                      <span className="truncate block" title={log.action}>{log.action}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {log.targetId ? (
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-slate-100 dark:border-slate-800 inline-block">
                        {log.targetIdShort || (typeof log.targetId === 'string' && log.targetId.length > 8 ? log.targetId.substring(0, 8) : log.targetId)}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusStyle(log.status)}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${log.status?.toLowerCase() === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                          {log.status}
                      </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Pagination */}
      {!loading && totalPages > 1 && (
         <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
         </div>
      )}
    </div>
  );
};

export default AuditLogViewer;