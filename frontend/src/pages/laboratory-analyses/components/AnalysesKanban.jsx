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
        blue: 'from-blue-50 via-indigo-50/50 to-blue-50 dark:from-slate-900/50 dark:via-blue-950/30 dark:to-slate-900/50 border-blue-200/70 dark:border-blue-900/50 shadow-lg shadow-blue-100/50 dark:shadow-blue-900/20',
        amber: 'from-amber-50 via-orange-50/50 to-amber-50 dark:from-slate-900/50 dark:via-amber-950/30 dark:to-slate-900/50 border-amber-200/70 dark:border-amber-900/50 shadow-lg shadow-amber-100/50 dark:shadow-amber-900/20',
        emerald: 'from-emerald-50 via-teal-50/50 to-emerald-50 dark:from-slate-900/50 dark:via-emerald-950/30 dark:to-slate-900/50 border-emerald-200/70 dark:border-emerald-900/50 shadow-lg shadow-emerald-100/50 dark:shadow-emerald-900/20',
        purple: 'from-purple-50 via-pink-50/50 to-purple-50 dark:from-slate-900/50 dark:via-purple-950/30 dark:to-slate-900/50 border-purple-200/70 dark:border-purple-900/50 shadow-lg shadow-purple-100/50 dark:shadow-purple-900/20'
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
            className={`bg-gradient-to-br ${colorClasses[column.color]} rounded-2xl md:rounded-3xl border-2 p-3 md:p-5 min-h-[400px] md:min-h-[500px] backdrop-blur-sm relative overflow-hidden transition-all duration-300 ${
              draggedItem && draggedItem.statut !== column.id
                ? 'ring-2 ring-primary/30 ring-offset-2 scale-[1.02]'
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
                      className={`bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-lg hover:shadow-2xl cursor-move border-2 backdrop-blur-sm relative overflow-hidden group transition-all duration-200 ${
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
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
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
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
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
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                  <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Aucune analyse</p>
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

