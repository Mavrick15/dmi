import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';

const UserFilters = ({ filters, onFilterChange, hideRoleFilter = false }) => {

  const roleOptions = [
    { value: 'all', label: 'Tous les rôles' },
    { value: 'admin', label: 'Administrateur' },
    { value: 'docteur_clinique', label: 'Médecine générale' },
    { value: 'docteur_labo', label: 'Médecin biologiste' },
    { value: 'infirmiere', label: 'Infirmier(e)' },
    { value: 'pharmacien', label: 'Pharmacien' },
    { value: 'gestionnaire', label: 'Gestionnaire' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'Active', label: 'Actif' },
    { value: 'Inactive', label: 'Suspendu' }
  ];

  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const inputClass = "glass-surface text-sm";

  return (
    <div className="glass-surface p-4 rounded-xl mb-8 flex flex-col gap-4 transition-colors duration-300">

      <div className="flex flex-col md:flex-row gap-4 items-center">

        {/* Champ de recherche */}
        <div className="flex-1 w-full relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon name="Search" size={18} />
          </div>
          <input
            type="text"
            placeholder="Rechercher par nom, email ou ID... (min. 2 caractères)"
            value={filters.search}
            onChange={(e) => {
              const value = e.target.value;
              // Validation côté frontend : max 100 caractères
              if (value.length <= 100) {
                onFilterChange({ search: value });
              }
            }}
            maxLength={100}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl backdrop-blur-xl bg-white/50 dark:bg-white/10 border border-white/20 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
          {/* Bouton Effacer la recherche */}
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: '' })}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <Icon name="X" size={16} />
            </button>
          )}
        </div>

        {/* Filtres Select de base */}
        <div className="flex gap-2 w-full md:w-auto flex-wrap justify-center sm:justify-start">
          {!hideRoleFilter && (
            <div className="w-full sm:w-auto md:w-48">
              <Select
                options={roleOptions}
                value={filters.role || 'all'}
                onChange={(val) => handleFilterChange('role', val === 'all' ? null : val)}
                buttonClassName={inputClass}
                placeholder="Rôle"
                size="sm"
              />
            </div>
          )}
          <div className="w-full sm:w-auto md:w-40">
            <Select
              options={statusOptions}
              value={filters.status || 'all'}
              onChange={(val) => handleFilterChange('status', val === 'all' ? null : val)}
              buttonClassName={inputClass}
              placeholder="Statut"
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserFilters;