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
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
        isActive
          ? `${colorClass?.bg || 'bg-primary/15 dark:bg-primary/25'} ${colorClass?.text || 'text-primary'} border-current`
          : 'glass-surface text-slate-600 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-slate-200'
      }`}
    >
      <Icon name={icon} size={12} className={isActive ? 'text-current' : 'opacity-70'} />
      {label}
    </button>
  );

  const inputBaseClass = "w-full pl-10 pr-4 py-2.5 glass-panel rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="glass-panel rounded-xl shadow-sm mb-5 overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row gap-2 p-4">
        <div className="relative flex-1 min-w-0">
          <button
            type="button"
            onClick={triggerSearch}
            className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-primary transition-colors cursor-pointer z-10"
            title="Lancer la recherche"
          >
            <Icon name="Search" size={18} />
          </button>
          <input
            type="text"
            placeholder="Nom, ID patient, téléphone… (Entrée pour rechercher)"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={100}
            className={inputBaseClass}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`rounded-xl border transition-all shrink-0 ${
              showAdvanced || activeFiltersCount > 0
                ? 'bg-primary/10 dark:bg-primary/20 text-primary border-primary/40'
                : 'border-white/20 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Icon name="Filter" size={16} className="mr-2" />
            Filtres
            {activeFiltersCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">
                {activeFiltersCount}
              </span>
            )}
            <Icon name={showAdvanced ? 'ChevronUp' : 'ChevronDown'} size={14} className="ml-1 opacity-60" />
          </Button>
          {(activeFiltersCount > 0 || localSearch) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 shrink-0"
              title="Réinitialiser"
            >
              <Icon name="RotateCcw" size={18} />
            </Button>
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
            <div className="px-4 pb-4 pt-0 border-t border-white/20 dark:border-white/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
                {establishmentsList.length > 0 && (
                  <Select
                    label="Établissement"
                    options={establishmentsList}
                    value={filters.establishmentId || ''}
                    onChange={(v) => handleFilterChange('establishmentId', v)}
                    buttonClassName="rounded-xl border-white/20 dark:border-white/10 backdrop-blur-xl bg-white/50 dark:bg-white/10"
                  />
                )}
                <Select
                  label="Statut"
                  options={statusOptions}
                  value={filters.status}
                  onChange={(v) => handleFilterChange('status', v)}
                  buttonClassName="rounded-xl border-white/20 dark:border-white/10 backdrop-blur-xl bg-white/50 dark:bg-white/10"
                />
                <Select
                  label="Sexe"
                  options={genderOptions}
                  value={filters.gender}
                  onChange={(v) => handleFilterChange('gender', v)}
                  buttonClassName="rounded-xl border-white/20 dark:border-white/10 backdrop-blur-xl bg-white/50 dark:bg-white/10"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-t border-white/20 dark:border-white/10 glass-surface">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
          <Icon name="Zap" size={11} />
          Rapide
        </span>
        <QuickFilterChip
          label="Critiques"
          icon="AlertTriangle"
          isActive={filters.status === 'Critical'}
          onClick={() => handleFilterChange('status', filters.status === 'Critical' ? '' : 'Critical')}
          colorClass={{ bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' }}
        />
        <QuickFilterChip
          label="Actifs"
          icon="CheckCircle"
          isActive={filters.status === 'Active'}
          onClick={() => handleFilterChange('status', filters.status === 'Active' ? '' : 'Active')}
          colorClass={{ bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' }}
        />
      </div>
    </motion.div>
  );
};

export default PatientSearchFilters;