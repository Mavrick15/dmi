import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import AnalyseQRCode from './AnalyseQRCode';
import {
  formatDateTimeInBusinessTimezone,
  formatTimeInBusinessTimezone,
} from '../../../utils/dateTime';

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
      const timeStr = formatTimeInBusinessTimezone(date);
      
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
      
      return formatDateTimeInBusinessTimezone(date);
    } catch {
      return 'Date invalide';
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/20 dark:border-white/10 glass-surface border-l-4 border-l-primary flex flex-col items-center justify-center gap-3 py-16">
        <Icon name="Loader2" size={28} className="animate-spin text-primary" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement des analyses…</span>
      </div>
    );
  }

  if (!Array.isArray(analyses) || analyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 glass-panel rounded-xl">
        <div className="w-14 h-14 rounded-xl glass-surface flex items-center justify-center mb-3">
          <Icon name="TestTube" size={28} className="text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Aucune analyse</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Modifiez les filtres ou prescrivez une analyse.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-white/20 dark:border-white/10">
            <tr>
              <th className="px-3 md:px-4 py-2 md:py-2.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                N°
              </th>
              <th className="hidden sm:table-cell px-3 md:px-4 py-2 md:py-2.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-3 md:px-4 py-2 md:py-2.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-3 md:px-4 py-2 md:py-2.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Statut
              </th>
              <th className="hidden lg:table-cell px-3 md:px-4 py-2 md:py-2.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Date
              </th>
              <th className="hidden xl:table-cell px-3 md:px-4 py-2 md:py-2.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Service
              </th>
              <th className="px-3 md:px-4 py-2 md:py-2.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20 dark:divide-white/10">
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
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 group cursor-pointer"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 text-primary rounded-lg flex items-center justify-center border border-primary/20">
                        <Icon name={getTypeIcon(analyse.typeAnalyse)} size={16} />
                      </div>
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-white glass-surface px-3 py-1.5 rounded-lg" title={`Numéro d'analyse: ${analyse.numeroAnalyse}`}>
                        {analyse.numeroAnalyse}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-200 dark:border-emerald-800 text-xs">
                        {analyse.patient?.name && typeof analyse.patient.name === 'string' ? analyse.patient.name.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div>
                        <div className="text-sm text-slate-900 dark:text-white font-semibold">
                          {analyse.patient?.name || 'Patient inconnu'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize glass-surface px-3 py-1.5 rounded-lg">
                        {analyse.typeAnalyse?.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statutBadge.variant} size="sm" className="font-bold shadow-sm">
                      {statutBadge.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Icon name="Calendar" size={14} className="text-slate-400" />
                      <span>{formatDate(analyse.datePrescription)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
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
                  <td className="px-4 py-3 whitespace-nowrap">
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
        <div className="px-4 py-3 border-t border-white/20 dark:border-white/10 glass-surface">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              {meta.from || 0}-{meta.to || 0} sur {meta.total || 0}
            </div>
            {meta.lastPage > 1 && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="rounded-xl" iconName="ChevronLeft" onClick={() => onPageChange?.(meta.currentPage - 1)} disabled={meta.currentPage === 1}>
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
                        className="min-w-[40px] rounded-xl"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button variant="ghost" size="sm" className="rounded-xl" iconName="ChevronRight" onClick={() => onPageChange?.(meta.currentPage + 1)} disabled={meta.currentPage === meta.lastPage}>
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

