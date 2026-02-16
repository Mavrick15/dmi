import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';

const UserFilters = ({ filters, onFilterChange, hideRoleFilter = false }) => {
  
  const roleOptions = [
    { value: 'all', label: 'Tous les rôles' },
    { value: 'admin', label: 'Administrateur' },
    { value: 'docteur', label: 'Médecin' },
    { value: 'infirmiere', label: 'Infirmier(e)' },
    { value: 'pharmacien', label: 'Pharmacien' },
    { value: 'gestionnaire', label: 'Gestionnaire' },
    { value: 'it_specialist', label: 'IT Specialist' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'Active', label: 'Actif' },
    { value: 'Inactive', label: 'Suspendu' }
  ];

  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const inputClass = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm";

  return (
    <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-8 flex flex-col gap-4 transition-colors duration-300">
      
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
             className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
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