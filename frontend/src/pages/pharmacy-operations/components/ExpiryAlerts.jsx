import React, { useState, useEffect } from 'react';
import api from '../../../lib/axios';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { AlertTriangle, Clock, Info, Zap, CheckCircle, Eye, RefreshCw, PackageCheck, AlertCircle, Trash2, Calendar, Loader2, X } from 'lucide-react'; // Import complet des icônes utilisées

const ExpiryAlerts = ({ refreshTrigger, onAlertsTreated, onMarkAllTreated, onMarkAllConfirmed, onViewMedication, onTreatAlert }) => { 
  const { hasPermission } = usePermissions();
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/pharmacy/alerts');
      if (response.data.success) {
        setExpiryAlerts(response.data.data);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur chargement alertes d'expiration:", error);
      }
      setExpiryAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [refreshTrigger]);

  // Effet pour vider la liste quand onMarkAllConfirmed est appelé
  useEffect(() => {
    if (onMarkAllConfirmed) {
      setExpiryAlerts([]);
    }
  }, [onMarkAllConfirmed]);

  // NOUVELLE LOGIQUE DE TRAITEMENT (ACTION)
  const handleTreatAlertClick = (alertId, medicationName, currentStock) => {
      if (onTreatAlert) {
          onTreatAlert(alertId, medicationName, currentStock);
      } else {
          // Fallback si onTreatAlert n'est pas fourni
          setExpiryAlerts(prev => Array.isArray(prev) ? prev.filter(alert => alert && alert.id !== alertId) : []);
          if (onAlertsTreated) onAlertsTreated();
      }
  }

  const handleViewClick = (alertId) => {
      if (onViewMedication) {
          onViewMedication(alertId);
      }
  }

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'high':
        return {
          bg: 'bg-rose-50 dark:bg-rose-900/20',
          text: 'text-rose-700 dark:text-rose-400',
          border: 'border-rose-100 dark:border-rose-900/50',
          iconBg: 'bg-rose-100 dark:bg-rose-900/40'
        };
      case 'medium':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          text: 'text-amber-700 dark:text-amber-400',
          border: 'border-amber-100 dark:border-amber-900/50',
          iconBg: 'bg-amber-100 dark:bg-amber-900/40'
        };
      case 'low':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-700 dark:text-blue-400',
          border: 'border-blue-100 dark:border-blue-900/50',
          iconBg: 'bg-blue-100 dark:bg-blue-900/40'
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800',
          text: 'text-slate-600 dark:text-slate-400',
          border: 'border-slate-200 dark:border-slate-700',
          iconBg: 'bg-slate-100 dark:bg-slate-700'
        };
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return 'AlertTriangle';
      case 'medium': return 'Clock';
      case 'low': return 'Info';
      default: return 'Bell';
    }
  };
  
  // FONCTION UTILITAIRE AJOUTÉE
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('fr-FR') : 'N/A';


  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
              <Icon name="Hourglass" size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Alertes d'expiration</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Médicaments expirant dans les 90 jours</p>
            </div>
          </div>
          <Button variant="outline" size="sm" iconName="Settings" className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Configurer
          </Button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="p-6 max-h-[500px] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
        {loading ? (
           <div className="flex justify-center items-center h-48 text-primary">
              <Icon name="Loader2" className="animate-spin" size={32} />
              <span className="ml-3 text-slate-500">Chargement des alertes...</span>
           </div>
        ) : expiryAlerts.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Icon name="CheckCircle" size={32} className="text-emerald-500 opacity-50" />
              <p className="mt-2 text-sm font-medium">Aucune alerte critique ou expirante.</p>
           </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(expiryAlerts) && expiryAlerts.map((alert) => {
              if (!alert || typeof alert !== 'object') return null;
              const style = getPriorityStyles(alert.priority);
              
              return (
                <div 
                  key={alert.id} 
                  className={`p-5 rounded-2xl border transition-all duration-200 hover:shadow-md ${style.bg} ${style.border} dark:border-opacity-50`}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    
                    {/* Main Content */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.iconBg} ${style.text}`}>
                        <Icon name={getPriorityIcon(alert.priority)} size={20} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate">{alert.medication}</h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${style.border} ${style.text} bg-white/50 dark:bg-black/20`}>
                            {alert.priority === 'high' ? 'Priorité haute' : alert.priority === 'medium' ? 'Moyenne' : 'Faible'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
                          <div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block">Lot</span>
                            <span className="font-mono text-slate-700 dark:text-slate-200">{alert.batchNumber}</span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block">Expire le</span>
                            <span className="font-medium text-slate-700 dark:text-slate-200">{formatDate(alert.expiryDate)}</span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block">Jours restants</span>
                            <span className={`font-bold ${alert.daysUntilExpiry <= 30 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {alert.daysUntilExpiry} jours
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block">Stock</span>
                            <span className="font-medium text-slate-700 dark:text-slate-200">{alert.currentStock} unités</span> 
                          </div>
                        </div>

                        {/* Action Recommendation */}
                        <div className="mt-3 flex items-center gap-2 text-xs bg-white/60 dark:bg-black/20 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50 w-fit">
                          <Icon name="Zap" size={12} className={style.text} />
                          <span className="text-slate-500 dark:text-slate-400">Action :</span>
                          <span className={`font-semibold ${style.text}`}>{alert.action}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 w-full sm:w-auto sm:flex-col">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 sm:flex-none justify-start bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300" 
                        title="Voir les détails"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewClick(alert.id);
                        }}
                      >
                        <Icon name="Eye" size={16} className="mr-1.5" /> Voir
                      </Button>
                      {/* BOUTON TRAITER */}
                      <PermissionGuard requiredPermission="inventory_manage">
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTreatAlertClick(alert.id, alert.medication, alert.currentStock);
                          }}
                          disabled={!hasPermission('inventory_manage')}
                          className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-md"
                          iconName="CheckCircle"
                        >
                          Traiter
                        </Button>
                      </PermissionGuard>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {expiryAlerts.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-rose-500"></span>
                <span className="font-bold text-slate-900 dark:text-white">{expiryAlerts.length} alerte(s) en attente</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" iconName="FileText" className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Rapport</Button>
                <PermissionGuard requiredPermission="inventory_manage">
                  <Button 
                    variant="default" 
                    size="sm" 
                    iconName="CheckCircle" 
                    className="shadow-sm" 
                    disabled={!hasPermission('inventory_manage')}
                    onClick={() => {
                      if (onMarkAllTreated) {
                        onMarkAllTreated(Array.isArray(expiryAlerts) ? expiryAlerts.length : 0);
                      } else {
                        // Fallback si onMarkAllTreated n'est pas fourni
                        setExpiryAlerts([]);
                        if(onAlertsTreated) onAlertsTreated();
                      }
                    }}
                  >
                    Tout marquer traité
                  </Button>
                </PermissionGuard>
              </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default ExpiryAlerts;