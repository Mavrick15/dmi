import Icon from '../AppIcon';
import Button from './Button';

const Pagination = ({ currentPage, totalPages, onPageChange, className = "" }) => {
  // Sécurisation des données : conversion en nombre pour éviter les NaN
  const current = Number(currentPage) || 1;
  const total = Number(totalPages) || 1;

  // On masque la pagination s'il n'y a qu'une seule page ou aucune
  if (total <= 1) return null;

  return (
    <div className={`flex justify-center items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6 ${className}`}>
      {/* Bouton Précédent */}
      <Button 
        variant="outline" 
        size="sm" 
        disabled={current <= 1} 
        onClick={() => onPageChange(current - 1)} 
        className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Icon name="ChevronLeft" size={16} className="mr-1" /> Précédent
      </Button>

      {/* Indicateur de page */}
      <span className="flex items-center px-4 py-1 text-sm font-bold bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm">
        {current} / {total}
      </span>

      {/* Bouton Suivant */}
      <Button 
        variant="outline" 
        size="sm" 
        disabled={current >= total} 
        onClick={() => onPageChange(current + 1)} 
        className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Suivant <Icon name="ChevronRight" size={16} className="ml-1" />
      </Button>
    </div>
  );
};

export default Pagination;