import { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select'; // Utilisation du Select personnalisé

const FilterPanel = ({ onFiltersChange, isCollapsed, onToggle }) => {
  const [filters, setFilters] = useState({
    dateRange: 'last30days',
    department: 'all',
    provider: 'all',
    customStartDate: '',
    customEndDate: ''
  });

  const dateRangeOptions = [
    { value: 'today', label: "Auj." },
    { value: 'yesterday', label: 'Hier' },
    { value: 'last7days', label: '7 jours' },
    { value: 'last30days', label: '30 jours' },
    { value: 'last90days', label: '90 jours' },
    { value: 'thisMonth', label: 'Ce mois' },
    { value: 'lastMonth', label: 'Mois dernier' },
    { value: 'thisYear', label: 'Cette année' },
    { value: 'custom', label: 'Perso.' }
  ];

  const departmentOptions = [
    { value: 'all', label: 'Tous les départements' },
    { value: 'cardiology', label: 'Cardiologie' },
    { value: 'neurology', label: 'Neurologie' },
    { value: 'orthopedics', label: 'Orthopédie' },
    { value: 'pediatrics', label: 'Pédiatrie' },
    { value: 'emergency', label: 'Urgences' }
  ];

  const providerOptions = [
    { value: 'all', label: 'Tous les praticiens' },
    { value: 'dr-martin', label: 'Dr. Martin Dubois' },
    { value: 'dr-laurent', label: 'Dr. Sophie Laurent' },
    { value: 'dr-bernard', label: 'Dr. Pierre Bernard' },
    { value: 'dr-rousseau', label: 'Dr. Marie Rousseau' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      dateRange: 'last30days',
      department: 'all',
      provider: 'all',
      customStartDate: '',
      customEndDate: ''
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  // Mode Replié (Bouton simple)
  if (isCollapsed) {
    return (
      <div className="glass-panel p-4 h-fit">
        <Button
          variant="outline"
          onClick={onToggle}
          className="w-full justify-center dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          title="Ouvrir les filtres"
        >
          <Icon name="Filter" size={20} />
        </Button>
      </div>
    );
  }

  // Mode Déplié (Panneau complet)
  return (
    <div className="glass-panel flex flex-col h-full overflow-hidden transition-all duration-300 w-80">
      
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/20 dark:border-white/10">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Icon name="Filter" size={20} className="text-primary" />
          Filtres
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"
        >
          <Icon name="X" size={20} />
        </Button>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        
        {/* Période */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Période d'analyse
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Array.isArray(dateRangeOptions) && dateRangeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleFilterChange('dateRange', option.value)}
                className={`
                  px-2 py-2 text-xs font-medium rounded-lg transition-all duration-200 border
                  ${filters.dateRange === option.value 
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                    : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-white/20 dark:border-white/10 hover:border-primary/50 dark:hover:border-primary/50'}
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dates personnalisées */}
        {filters.dateRange === 'custom' && (
          <div className="grid grid-cols-1 gap-3 p-4 glass-surface rounded-xl animate-fade-in">
            <Input
              type="date"
              label="Du"
              value={filters.customStartDate}
              onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
              className="glass-surface"
            />
            <Input
              type="date"
              label="Au"
              value={filters.customEndDate}
              onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
              className="glass-surface"
            />
          </div>
        )}

        <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

        {/* Critères */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Critères spécifiques
          </label>
          
          <Select
            label="Département"
            options={departmentOptions}
            value={filters.department}
            // Le composant Select personnalisé retourne la valeur directement, pas l'événement
            onChange={(value) => handleFilterChange('department', value)}
            placeholder="Tous les départements"
            buttonClassName="glass-surface text-slate-900 dark:text-white"
          />

          <Select
            label="Praticien"
            options={providerOptions}
            value={filters.provider}
            onChange={(value) => handleFilterChange('provider', value)}
            placeholder="Tous les praticiens"
            searchable // Activation de la recherche
            buttonClassName="glass-surface text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-3 py-1.5 border-t border-white/20 dark:border-white/10 glass-surface flex flex-col gap-3">
        <Button
          variant="default"
          className="w-full shadow-lg shadow-primary/20"
          iconName="Check"
          iconPosition="left"
          onClick={() => onToggle()} // Simule l'application des filtres
        >
          Appliquer les filtres
        </Button>
        
        <div className="flex gap-3">
            <Button
                variant="outline"
                onClick={resetFilters}
                className="flex-1 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                iconName="RotateCcw"
                iconPosition="left"
                size="sm"
            >
                Réinitialiser
            </Button>
            <Button
                variant="outline"
                className="flex-1 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                iconName="Download"
                iconPosition="left"
                size="sm"
            >
                Exporter
            </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;