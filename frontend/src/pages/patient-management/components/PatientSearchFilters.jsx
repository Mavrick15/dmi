import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { useEstablishments } from '../../../hooks/useAdmin';

const PatientSearchFilters = ({ onSearch, onFilter, onReset }) => {
  const [localSearch, setLocalSearch] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    status: '', gender: '', ageRange: '', priority: '', insurance: '', establishmentId: ''
  });

  const { data: establishmentsData } = useEstablishments({ limit: 100 });
  const establishmentsList = useMemo(() => {
    const list = establishmentsData?.data || [];
    if (list.length <= 1) return [];
    return [{ value: '', label: 'Tous les établissements' }, ...list.map((e) => ({ value: e.id, label: e.nom || e.name || 'Établissement' }))];
  }, [establishmentsData]);

  const statusOptions = [{ value: '', label: 'Tous' }, { value: 'Active', label: 'Actif' }, { value: 'Inactive', label: 'Inactif' }];
  const genderOptions = [{ value: '', label: 'Tous' }, { value: 'masculin', label: 'Homme' }, { value: 'feminin', label: 'Femme' }];
  
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  // Déclenche la recherche vers le parent
  const triggerSearch = () => {
    onSearch(localSearch);
  };

  // Écoute la touche Entrée
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      triggerSearch();
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const handleReset = () => {
    setLocalSearch('');
    setFilters({ status: '', gender: '', ageRange: '', priority: '', insurance: '', establishmentId: '' });
    onReset();
  };

  const QuickFilterChip = ({ label, icon, isActive, onClick, colorClass }) => (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border
        ${isActive 
          ? `bg-white dark:bg-slate-800 border-transparent shadow-sm ring-1 ring-offset-1 dark:ring-offset-slate-900 ${colorClass.ring} ${colorClass.text}` 
          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-300 hover:text-slate-700 dark:hover:text-slate-200'}
      `}
    >
      <Icon name={icon} size={14} className={isActive ? 'text-current' : 'opacity-70'} />
      {label}
    </button>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-1 mb-6"
    >
      <div className="flex flex-col md:flex-row gap-2 p-2">
        <div className="relative flex-1">
          {/* Bouton de recherche (Loupe) cliquable */}
          <motion.button 
            onClick={triggerSearch}
            className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-primary transition-colors cursor-pointer z-10"
            title="Lancer la recherche"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Icon name="Search" size={18} />
          </motion.button>
          
          <input
            type="text"
            placeholder="Rechercher (Nom, ID, Tél) puis Entrée..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={100}
            className="block w-full pl-10 pr-4 py-2.5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-none rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/30 focus:bg-white dark:focus:bg-slate-950 transition-all outline-none shadow-sm"
          />
        </div>
        
        <div className="flex gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="ghost" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`rounded-xl border-2 transition-all ${showAdvanced || activeFiltersCount > 0 ? 'bg-primary/10 dark:bg-primary/20 text-primary border-primary/30 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent'}`}
            >
              <Icon name="Filter" size={18} className="mr-2" />
              Filtres
              {activeFiltersCount > 0 && (
                <motion.span 
                  className="ml-2 bg-gradient-to-r from-primary to-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  {activeFiltersCount}
                </motion.span>
              )}
              <Icon name={showAdvanced ? 'ChevronUp' : 'ChevronDown'} size={14} className="ml-2 opacity-50" />
            </Button>
          </motion.div>

          {(activeFiltersCount > 0 || localSearch) && (
            <motion.div whileHover={{ scale: 1.1, rotate: 180 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.3 }}>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleReset}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl border-2 border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                title="Réinitialiser"
              >
                <Icon name="RotateCcw" size={18} />
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-slate-50 dark:border-slate-800 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {establishmentsList.length > 0 && (
                  <Select label="Établissement" options={establishmentsList} value={filters.establishmentId || ''} onChange={(v) => handleFilterChange('establishmentId', v)} />
                )}
                <Select label="Statut" options={statusOptions} value={filters.status} onChange={(v) => handleFilterChange('status', v)} />
                <Select label="Sexe" options={genderOptions} value={filters.gender} onChange={(v) => handleFilterChange('gender', v)} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 pb-3 pt-2 flex flex-wrap gap-2 border-t border-slate-100 dark:border-slate-800 mt-1">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-600 self-center mr-1 flex items-center gap-1">
          <Icon name="Zap" size={12} />
          Rapide :
        </span>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <QuickFilterChip label="Critiques" icon="AlertTriangle" isActive={filters.status === 'Critical'} onClick={() => handleFilterChange('status', filters.status === 'Critical' ? '' : 'Critical')} colorClass={{ ring: 'ring-rose-500', text: 'text-rose-600 dark:text-rose-400' }} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <QuickFilterChip label="Actifs" icon="CheckCircle" isActive={filters.status === 'Active'} onClick={() => handleFilterChange('status', filters.status === 'Active' ? '' : 'Active')} colorClass={{ ring: 'ring-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' }} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PatientSearchFilters;