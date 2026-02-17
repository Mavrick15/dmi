import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import EmptyState from '../../../components/ui/EmptyState';
import AnalyseQRCode from './AnalyseQRCode';
import { Loader2 } from 'lucide-react';

const AnalysesList = ({ analyses, meta, isLoading, onViewDetails, onCancel, onDelete, onPageChange }) => {
  const { hasPermission } = usePermissions();
  
  const getStatutBadge = (statut) => {
    const badges = {
      prescrite: { variant: 'info', label: 'Prescrite' },
      en_cours: { variant: 'warning', label: 'En cours' },
      terminee: { variant: 'success', label: 'Terminée' },
      annulee: { variant: 'error', label: 'Annulée' },
      en_attente_validation: { variant: 'warning', label: 'En attente' }
    };
    return badges[statut] || { variant: 'info', label: statut };
  };

  const getTypeIcon = (type) => {
    const icons = {
      hematologie: 'Droplet',
      biochimie: 'TestTube',
      serologie: 'Shield',
      microbiologie: 'Microscope',
      imagerie: 'Scan',
      autre: 'FileText'
    };
    return icons[type] || 'FileText';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      
      const now = new Date();
      const diffTime = now - date;
      const diffDays = Math.floor(Math.abs(diffTime) / (1000 * 60 * 60 * 24));
      const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      
      if (diffDays === 0) {
        return `Aujourd'hui à ${timeStr}`;
      } else if (diffTime > 0 && diffDays === 1) {
        return `Hier à ${timeStr}`;
      } else if (diffTime < 0 && diffDays === 1) {
        return `Demain à ${timeStr}`;
      } else if (diffTime > 0 && diffDays < 7) {
        return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      } else if (diffTime < 0 && diffDays < 7) {
        return `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      }
      
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!Array.isArray(analyses) || analyses.length === 0) {
    return (
      <EmptyState
        icon="TestTube"
        title="Aucune analyse"
        description="Aucune analyse trouvée avec les filtres sélectionnés."
      />
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl md:rounded-3xl shadow-xl overflow-hidden backdrop-blur-sm">
      <div className="overflow-x-auto -mx-2 md:mx-0">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-50 via-blue-50/50 to-indigo-50/50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                N°
              </th>
              <th className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Statut
              </th>
              <th className="hidden lg:table-cell px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Date
              </th>
              <th className="hidden xl:table-cell px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Service
              </th>
              <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {Array.isArray(analyses) && analyses.map((analyse, idx) => {
              const statutBadge = getStatutBadge(analyse.statut);
              return (
                <motion.tr
                  key={analyse.id}
                  initial={{ opacity: 0, x: -20, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ 
                    delay: idx * 0.03, 
                    type: "spring", 
                    stiffness: 150,
                    damping: 20
                  }}
                  whileHover={{ 
                    scale: 1.01, 
                    x: 6,
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                  }}
                  className="hover:bg-gradient-to-r hover:from-blue-50/60 hover:via-indigo-50/40 hover:to-purple-50/40 dark:hover:from-slate-800/90 dark:hover:via-slate-800/70 dark:hover:to-slate-800/90 transition-all duration-300 border-b border-slate-100 dark:border-slate-800/50 group cursor-pointer"
                >
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <Icon name={getTypeIcon(analyse.typeAnalyse)} size={18} className="text-white" />
                      </div>
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg" title={`Numéro d'analyse: ${analyse.numeroAnalyse}`}>
                        {analyse.numeroAnalyse}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-md">
                        {analyse.patient?.name && typeof analyse.patient.name === 'string' ? analyse.patient.name.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div>
                        <div className="text-sm text-slate-900 dark:text-white font-semibold">
                          {analyse.patient?.name || 'Patient inconnu'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                        {analyse.typeAnalyse?.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant={statutBadge.variant} size="sm" className="font-bold shadow-sm">
                      {statutBadge.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Icon name="Calendar" size={14} className="text-slate-400" />
                      <span>{formatDate(analyse.datePrescription)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      {analyse.laboratoire ? (
                        <>
                          <Icon name="Building" size={14} className="text-slate-400" />
                          <span>{analyse.laboratoire}</span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">N/A</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="ghost"
                          size="icon"
                          iconName="Eye"
                          onClick={() => onViewDetails(analyse)}
                          title="Voir les détails"
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 font-semibold shadow-sm"
                        />
                      </motion.div>
                      {analyse.statut !== 'annulee' && (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            iconName="Send"
                            onClick={() => {}}
                            title="Envoyer"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 font-semibold shadow-sm"
                          />
                        </motion.div>
                      )}
                      {analyse.statut !== 'annulee' && analyse.statut !== 'terminee' && (
                        <PermissionGuard requiredPermission="analyses_cancel">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              iconName="X"
                              onClick={() => onCancel(analyse)}
                              disabled={!hasPermission('analyses_cancel')}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 font-semibold shadow-sm"
                              title="Annuler l'analyse"
                            />
                          </motion.div>
                        </PermissionGuard>
                      )}
                      {analyse.statut === 'terminee' && Array.isArray(analyse.resultats) && analyse.resultats.length > 0 && (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            iconName="Download"
                            onClick={() => onViewDetails(analyse)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 font-semibold shadow-sm"
                            title="Télécharger les résultats"
                          />
                        </motion.div>
                      )}
                      <PermissionGuard requiredPermission="analyses_delete">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            iconName="Trash2"
                            onClick={() => onDelete(analyse)}
                            disabled={!hasPermission('analyses_delete')}
                            className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 font-semibold shadow-sm"
                            title="Supprimer l'analyse"
                          />
                        </motion.div>
                      </PermissionGuard>
                      <AnalyseQRCode analyse={analyse} />
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.total > 0 && (
        <div className="px-6 py-5 border-t-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              Affichage de <span className="font-bold text-blue-600 dark:text-blue-400">{meta.from || 0}</span> à <span className="font-bold text-blue-600 dark:text-blue-400">{meta.to || 0}</span> sur <span className="font-bold text-indigo-600 dark:text-indigo-400">{meta.total || 0}</span> analyses
            </div>
            {meta.lastPage > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="ChevronLeft"
                  onClick={() => onPageChange && onPageChange(meta.currentPage - 1)}
                  disabled={meta.currentPage === 1}
                >
                  Précédent
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, meta.lastPage) }, (_, i) => {
                    let pageNum;
                    if (meta.lastPage <= 5) {
                      pageNum = i + 1;
                    } else if (meta.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (meta.currentPage >= meta.lastPage - 2) {
                      pageNum = meta.lastPage - 4 + i;
                    } else {
                      pageNum = meta.currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={meta.currentPage === pageNum ? "primary" : "ghost"}
                        size="sm"
                        onClick={() => onPageChange && onPageChange(pageNum)}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="ChevronRight"
                  onClick={() => onPageChange && onPageChange(meta.currentPage + 1)}
                  disabled={meta.currentPage === meta.lastPage}
                >
                  Suivant
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(AnalysesList);

