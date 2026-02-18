import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { useAnalysesMutations } from '../../../hooks/useAnalyses';

const AnalysesKanban = ({ analyses, onViewDetails, onCancel, onDelete }) => {
  const { updateAnalyse } = useAnalysesMutations();
  const [draggedItem, setDraggedItem] = useState(null);

  // Ajouter des styles globaux pour améliorer la netteté du drag
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      .dragging-card {
        opacity: 0.4 !important;
        transform: scale(0.95) !important;
        border-color: rgba(59, 130, 246, 0.5) !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const columns = [
    { id: 'prescrite', title: 'Prescrites', color: 'blue', icon: 'FileText' },
    { id: 'en_cours', title: 'En cours', color: 'amber', icon: 'Clock' },
    { id: 'terminee', title: 'Terminées', color: 'emerald', icon: 'CheckCircle' },
    { id: 'en_attente_validation', title: 'En attente', color: 'purple', icon: 'AlertCircle' }
  ];

  const groupedAnalyses = useMemo(() => {
    const groups = {};
    columns.forEach(col => {
      groups[col.id] = Array.isArray(analyses) ? analyses.filter(a => a.statut === col.id) : [];
    });
    return groups;
  }, [analyses]);

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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      
      const now = new Date();
      const diffTime = now - date;
      const diffDays = Math.floor(Math.abs(diffTime) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Aujourd'hui";
      if (diffTime > 0 && diffDays === 1) return "Hier";
      if (diffTime > 0 && diffDays < 7) return `Il y a ${diffDays}j`;
      if (diffTime < 0 && diffDays === 1) return "Demain";
      if (diffTime < 0 && diffDays < 7) return `Dans ${diffDays}j`;
      
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    } catch {
      return 'Date invalide';
    }
  };

  const handleDragStart = useCallback((e, analyse) => {
    setDraggedItem(analyse);
    e.dataTransfer.effectAllowed = 'move';
    
    // Ajouter une classe pour l'élément en cours de drag
    e.currentTarget.classList.add('dragging-card');
    
    // Créer une image de drag personnalisée avec meilleure qualité
    const dragElement = e.currentTarget.cloneNode(true);
    dragElement.style.position = 'absolute';
    dragElement.style.top = '-10000px';
    dragElement.style.left = '-10000px';
    dragElement.style.width = e.currentTarget.offsetWidth + 'px';
    dragElement.style.height = 'auto';
    dragElement.style.borderRadius = '16px';
    dragElement.style.transform = 'rotate(3deg) scale(1.05)';
    dragElement.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 2px rgba(59, 130, 246, 0.4)';
    dragElement.style.opacity = '0.98';
    dragElement.style.border = '3px solid rgba(59, 130, 246, 0.6)';
    dragElement.style.backgroundColor = 'white';
    dragElement.style.pointerEvents = 'none';
    dragElement.style.willChange = 'transform';
    dragElement.style.backfaceVisibility = 'hidden';
    dragElement.style.webkitBackfaceVisibility = 'hidden';
    dragElement.style.webkitFontSmoothing = 'antialiased';
    dragElement.style.mozOsxFontSmoothing = 'grayscale';
    
    document.body.appendChild(dragElement);
    e.dataTransfer.setDragImage(dragElement, e.currentTarget.offsetWidth / 2, 40);
    
    // Nettoyer l'élément après un court délai
    setTimeout(() => {
      if (document.body.contains(dragElement)) {
        document.body.removeChild(dragElement);
      }
    }, 0);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(async (e, targetStatut) => {
    e.preventDefault();
    
    // Retirer la classe dragging de tous les éléments
    document.querySelectorAll('.dragging-card').forEach(el => {
      el.classList.remove('dragging-card');
    });
    
    if (!draggedItem || draggedItem.statut === targetStatut) {
      setDraggedItem(null);
      return;
    }

    // Interdire le drop vers "Terminée" : seule l’action Clôturer dans le modal peut terminer une analyse
    if (targetStatut === 'terminee' && (draggedItem.statut === 'en_cours' || draggedItem.statut === 'en_attente_validation')) {
      setDraggedItem(null);
      return;
    }

    try {
      await updateAnalyse.mutateAsync({
        id: draggedItem.id,
        data: { statut: targetStatut }
      });
    } catch (error) {
      // Erreur gérée par le hook
    } finally {
      setDraggedItem(null);
    }
  }, [draggedItem, updateAnalyse]);

  const handleDragEnd = useCallback(() => {
    // Retirer la classe dragging de tous les éléments
    document.querySelectorAll('.dragging-card').forEach(el => {
      el.classList.remove('dragging-card');
    });
    setDraggedItem(null);
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {columns.map((column) => {
        const columnAnalyses = groupedAnalyses[column.id] || [];
        const colorClasses = {
          blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
          amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
          emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
          purple: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800'
        };

        return (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: column.id === 'prescrite' ? 0 : column.id === 'en_cours' ? 0.1 : column.id === 'terminee' ? 0.2 : 0.3,
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
            whileHover={{ scale: 1.01 }}
            className={`${colorClasses[column.color]} rounded-xl border p-3 md:p-4 min-h-[400px] md:min-h-[500px] relative overflow-hidden transition-all ${
              draggedItem && draggedItem.statut !== column.id
                ? column.id === 'terminee' && (draggedItem.statut === 'en_cours' || draggedItem.statut === 'en_attente_validation')
                  ? 'ring-2 ring-rose-300 dark:ring-rose-600 ring-offset-2 opacity-90'
                  : 'ring-2 ring-primary/30 ring-offset-2 scale-[1.02]'
                : ''
            }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 md:mb-4 pb-2 md:pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Icon 
                  name={column.icon} 
                  size={18} 
                  className={
                    column.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                    column.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                    column.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                    'text-purple-600 dark:text-purple-400'
                  } 
                />
                <h3 className="font-bold text-slate-900 dark:text-white">{column.title}</h3>
              </div>
              <Badge variant="info" size="sm" className="bg-white/50 dark:bg-slate-800/50">
                {columnAnalyses.length}
              </Badge>
            </div>

            {/* Cards */}
            <div className="space-y-2 md:space-y-3 max-h-[500px] md:max-h-[600px] overflow-y-auto custom-scrollbar pr-1 md:pr-2">
              <AnimatePresence>
                {Array.isArray(columnAnalyses) && columnAnalyses.map((analyse, idx) => {
                  const statutBadge = getStatutBadge(analyse.statut);
                  return (
                    <motion.div
                      key={analyse.id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      transition={{ 
                        delay: idx * 0.05,
                        type: "spring",
                        stiffness: 300,
                        damping: 25
                      }}
                      whileHover={{ 
                        scale: 1.02, 
                        y: -4,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                      }}
                      whileTap={{ scale: 0.98 }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, analyse)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm hover:shadow-md cursor-move border relative overflow-hidden group transition-all ${
                        draggedItem?.id === analyse.id 
                          ? 'border-primary/50' 
                          : 'border-slate-200/60 dark:border-slate-700/60'
                      }`}
                      style={{
                        willChange: 'transform, opacity',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'translateZ(0)',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                        imageRendering: 'crisp-edges'
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        {/* Gradient decoratif au hover */}
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      
                      <div className="flex-1 min-w-0 relative z-10">
                          <p className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                            {analyse.numeroAnalyse}
                          </p>
                          <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                            {analyse.typeAnalyse?.replace('_', ' ') || 'Analyse'}
                          </p>
                        </div>
                        <Badge variant={statutBadge.variant} size="sm">
                          {statutBadge.label}
                        </Badge>
                      </div>

                      {analyse.patient && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                            {(analyse.patient.name || 'P').charAt(0).toUpperCase()}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate flex-1">
                            {analyse.patient.name || 'Patient inconnu'}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Icon name="Calendar" size={12} />
                          <span>{formatDate(analyse.datePrescription)}</span>
                        </div>
                        {analyse.priorite === 'urgente' && (
                          <Badge variant="error" size="xs">Urgent</Badge>
                        )}
                        {analyse.priorite === 'critique' && (
                          <Badge variant="error" size="xs">Critique</Badge>
                        )}
                      </div>

                      <div className="flex gap-2 relative z-10" draggable={false} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          iconName="Eye"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(analyse);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="flex-1 text-xs"
                        >
                          Détails
                        </Button>
                        {analyse.statut !== 'annulee' && analyse.statut !== 'terminee' && onCancel && (
                          <Button
                            variant="ghost"
                            size="sm"
                            iconName="XCircle"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onCancel(analyse);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            title="Annuler l'analyse"
                          />
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            iconName="Trash2"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onDelete(analyse);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                            title="Supprimer l'analyse"
                          />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {columnAnalyses.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/30">
                  <Icon name="Inbox" size={24} className="text-slate-400 dark:text-slate-500 mb-2" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Aucune analyse</p>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default AnalysesKanban;

