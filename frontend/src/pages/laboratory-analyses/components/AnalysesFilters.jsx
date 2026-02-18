import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

const AnalysesFilters = ({ filters, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState(filters || {});
  const [searchInput, setSearchInput] = useState(filters?.search || ''); // État local pour la recherche
  const [isExpanded, setIsExpanded] = useState(false);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    setLocalFilters(filters || {});
    setSearchInput(filters?.search || ''); // Synchroniser avec les filtres externes
  }, [filters]);

  const handleSearchSubmit = useCallback(() => {
    // Appliquer la recherche seulement quand on appuie sur Enter
    const newFilters = { ...localFilters, search: searchInput.trim() || undefined };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  }, [searchInput, localFilters, onFiltersChange]);

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  }, [handleSearchSubmit]);

  const handleFilterChange = useCallback((key, value) => {
    setLocalFilters(prevFilters => {
      const newFilters = { ...prevFilters, [key]: value || undefined };
      
      // Pour les autres filtres (pas la recherche), appliquer immédiatement
      if (key !== 'search') {
        // Debounce pour éviter les re-renders trop fréquents
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          onFiltersChange(newFilters);
        }, 100);
      }
      
      return newFilters;
    });
  }, [onFiltersChange]);

  // Nettoyer le timer au démontage
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleReset = () => {
    const resetFilters = {};
    setLocalFilters(resetFilters);
    setSearchInput(''); // Réinitialiser aussi la recherche
    onFiltersChange(resetFilters);
  };

  const activeFiltersCount = Object.keys(localFilters).filter(key => localFilters[key] && localFilters[key] !== '').length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary border border-primary/20 flex items-center justify-center">
              <Icon name="Filter" size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Filtres de recherche</h3>
              {activeFiltersCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold"
                >
                  <Icon name="CheckCircle" size={14} />
                  {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}
                </motion.span>
              )}
            </div>
          </div>
          <AnimatePresence>
            {activeFiltersCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button variant="ghost" size="sm" className="rounded-xl text-xs hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20" iconName="RotateCcw" onClick={handleReset}>
                  Réinitialiser
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              <Icon name="Search" size={14} />
              Recherche rapide
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Numéro, patient, type..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                iconName="Search"
                className="h-10 flex-1"
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  iconName="Search"
                  onClick={handleSearchSubmit}
                  className="h-10 px-3 md:px-4 rounded-xl"
                  title="Rechercher"
                />
              </motion.div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              <Icon name="Activity" size={14} />
              Statut
            </label>
            <Select
              value={localFilters.statut || ''}
              onChange={(value) => handleFilterChange('statut', value)}
              options={[
                { value: '', label: 'Tous les statuts' },
                { value: 'prescrite', label: 'Prescrite' },
                { value: 'en_cours', label: 'En cours' },
                { value: 'terminee', label: 'Terminée' },
                { value: 'annulee', label: 'Annulée' },
                { value: 'en_attente_validation', label: 'En attente validation' }
              ]}
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              <Icon name="TestTube" size={14} />
              Type d'analyse
            </label>
            <Select
              value={localFilters.typeAnalyse || ''}
              onChange={(value) => handleFilterChange('typeAnalyse', value)}
              options={[
                { value: '', label: 'Tous les types' },
                { value: 'hematologie', label: 'Hématologie' },
                { value: 'biochimie', label: 'Biochimie' },
                { value: 'serologie', label: 'Sérologie' },
                { value: 'microbiologie', label: 'Microbiologie' },
                { value: 'imagerie', label: 'Imagerie' },
                { value: 'autre', label: 'Autre' }
              ]}
            />
          </motion.div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  <Icon name="AlertTriangle" size={14} />
                  Priorité
                </label>
                <Select
                  value={localFilters.priorite || ''}
                  onChange={(value) => handleFilterChange('priorite', value)}
                  options={[
                    { value: '', label: 'Toutes les priorités' },
                    { value: 'normale', label: 'Normale' },
                    { value: 'urgente', label: 'Urgente' },
                    { value: 'critique', label: 'Critique' }
                  ]}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  <Icon name="Calendar" size={14} />
                  Date de début
                </label>
                <Input
                  type="date"
                  value={localFilters.dateDebut || ''}
                  onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
                  className="h-10"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  <Icon name="Calendar" size={14} />
                  Date de fin
                </label>
                <Input
                  type="date"
                  value={localFilters.dateFin || ''}
                  onChange={(e) => handleFilterChange('dateFin', e.target.value)}
                  className="h-10"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" className="rounded-xl text-xs font-semibold text-primary hover:bg-primary/10" iconName={isExpanded ? "ChevronUp" : "ChevronDown"} onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? 'Moins de filtres' : 'Plus de filtres'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AnalysesFilters);

