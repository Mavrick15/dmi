import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import { useCIM10Search, useCIM10Categories, useCIM10Mutations } from '../../../hooks/useClinicalTools';

const CIM10Search = ({ onSelect, selectedCode = null, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { useCode } = useCIM10Mutations();

  // Récupérer les codes CIM-10 depuis l'API (avec pagination)
  const { data: cim10Response, isLoading: loadingCodes } = useCIM10Search(
    searchQuery.length >= 2 ? searchQuery : '',
    selectedCategory
  );

  // Récupérer les catégories
  const { data: categoriesData = [], isLoading: loadingCategories } = useCIM10Categories();

  // Extraire les codes de la réponse paginée
  const codes = cim10Response?.data || [];
  const pagination = cim10Response?.pagination || null;
  const categories = categoriesData.map(c => c.category) || [];

  // Base de données CIM-10 de fallback (si l'API ne retourne rien)
  const FALLBACK_CIM10_DATABASE = [
  { code: 'A00-B99', name: 'Maladies infectieuses et parasitaires', category: 'Infectieux' },
  { code: 'C00-D48', name: 'Tumeurs', category: 'Oncologie' },
  { code: 'E00-E90', name: 'Maladies endocriniennes, nutritionnelles et métaboliques', category: 'Endocrinologie' },
  { code: 'F00-F99', name: 'Troubles mentaux et du comportement', category: 'Psychiatrie' },
  { code: 'G00-G99', name: 'Maladies du système nerveux', category: 'Neurologie' },
  { code: 'H00-H59', name: 'Maladies de l\'œil et de ses annexes', category: 'Ophtalmologie' },
  { code: 'H60-H95', name: 'Maladies de l\'oreille et de l\'apophyse mastoïde', category: 'ORL' },
  { code: 'I00-I99', name: 'Maladies du système circulatoire', category: 'Cardiologie' },
  { code: 'J00-J99', name: 'Maladies de l\'appareil respiratoire', category: 'Pneumologie' },
  { code: 'K00-K93', name: 'Maladies de l\'appareil digestif', category: 'Gastro-entérologie' },
  { code: 'L00-L99', name: 'Maladies de la peau et du tissu cellulaire sous-cutané', category: 'Dermatologie' },
  { code: 'M00-M99', name: 'Maladies du système ostéo-articulaire, des muscles et du tissu conjonctif', category: 'Rhumatologie' },
  { code: 'N00-N99', name: 'Maladies de l\'appareil génito-urinaire', category: 'Urologie' },
  { code: 'O00-O99', name: 'Grossesse, accouchement et puerpéralité', category: 'Gynécologie' },
  { code: 'P00-P96', name: 'Affections dont l\'origine se situe dans la période périnatale', category: 'Pédiatrie' },
  { code: 'Q00-Q99', name: 'Malformations congénitales et anomalies chromosomiques', category: 'Génétique' },
  { code: 'R00-R99', name: 'Symptômes, signes et résultats anormaux d\'examens', category: 'Symptômes' },
  { code: 'S00-T98', name: 'Lésions traumatiques, empoisonnements et certaines autres conséquences de causes externes', category: 'Traumatologie' },
  { code: 'U00-U99', name: 'Codes à usage spécial', category: 'Spécial' },
  { code: 'V01-Y98', name: 'Causes externes de morbidité et de mortalité', category: 'Externe' },
  { code: 'Z00-Z99', name: 'Facteurs influençant l\'état de santé et motifs de recours aux services de santé', category: 'Facteurs' },
  ];

  // Utiliser les données de l'API ou le fallback
  const CIM10_DATABASE = codes.length > 0 ? codes : FALLBACK_CIM10_DATABASE;
  
  // Codes spécifiques courants (fallback uniquement)
  const FALLBACK_SPECIFIC_CODES = [
  { code: 'I10', name: 'Hypertension essentielle (primitive)', category: 'Cardiologie' },
  { code: 'I20', name: 'Angine de poitrine', category: 'Cardiologie' },
  { code: 'I21', name: 'Infarctus aigu du myocarde', category: 'Cardiologie' },
  { code: 'E11', name: 'Diabète sucré de type 2', category: 'Endocrinologie' },
  { code: 'E10', name: 'Diabète sucré de type 1', category: 'Endocrinologie' },
  { code: 'J18', name: 'Pneumonie, organisme non précisé', category: 'Pneumologie' },
  { code: 'J44', name: 'Autre maladie pulmonaire obstructive chronique', category: 'Pneumologie' },
  { code: 'K59', name: 'Autres troubles fonctionnels de l\'intestin', category: 'Gastro-entérologie' },
  { code: 'K25', name: 'Ulcère gastrique', category: 'Gastro-entérologie' },
  { code: 'M79', name: 'Autres affections des tissus mous, non classées ailleurs', category: 'Rhumatologie' },
  { code: 'M54', name: 'Dorsalgie', category: 'Rhumatologie' },
  { code: 'N18', name: 'Insuffisance rénale chronique', category: 'Urologie' },
  { code: 'N39', name: 'Autres affections de l\'appareil urinaire', category: 'Urologie' },
  { code: 'R50', name: 'Fièvre d\'origine inconnue', category: 'Symptômes' },
  { code: 'R06', name: 'Anomalies de la respiration', category: 'Symptômes' },
  { code: 'R51', name: 'Céphalée', category: 'Symptômes' },
  { code: 'A09', name: 'Gastro-entérite et colite d\'origine infectieuse présumée', category: 'Infectieux' },
  { code: 'B34', name: 'Infection virale, site non précisé', category: 'Infectieux' },
  { code: 'F32', name: 'Épisode dépressif', category: 'Psychiatrie' },
  { code: 'F41', name: 'Autres troubles anxieux', category: 'Psychiatrie' },
  ];

  // Filtrer les résultats (la recherche est déjà faite côté API)
  const filteredResults = useMemo(() => {
    // Si on a des résultats de l'API, les utiliser directement
    if (codes.length > 0) {
      return codes;
    }
    
    // Sinon, utiliser le fallback avec filtrage local
    let results = FALLBACK_CIM10_DATABASE.concat(FALLBACK_SPECIFIC_CODES);

    // Filtrer par catégorie
    if (selectedCategory) {
      results = results.filter(item => item.category === selectedCategory);
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(item =>
        item.code.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    return results;
  }, [codes, searchQuery, selectedCategory]);

  // Catégories uniques (utiliser les catégories de l'API ou du fallback)
  const allCategories = useMemo(() => {
    if (categories.length > 0) {
      return categories;
    }
    const cats = [...new Set(FALLBACK_CIM10_DATABASE.concat(FALLBACK_SPECIFIC_CODES).map(item => item.category))];
    return cats.sort();
  }, [categories]);

  const handleSelect = async (item) => {
    // Incrémenter le compteur d'utilisation si l'item a un ID
    if (item.id) {
      try {
        await useCode.mutateAsync(item.id);
      } catch (error) {
        // Erreur non bloquante - la sélection du code peut continuer
        // Les erreurs sont loggées mais n'empêchent pas l'utilisation du code
        if (process.env.NODE_ENV === 'development') {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Erreur lors de l\'incrémentation du compteur CIM-10:', error);
          }
        }
      }
    }

    if (onSelect) {
      onSelect(item);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par code ou libellé CIM-10..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-white/20 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:text-white"
          autoFocus
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
          >
            <Icon name="X" size={16} className="text-slate-400" />
          </button>
        )}
      </div>

      {/* Category Filters — scroll horizontal si beaucoup */}
      {loadingCategories ? (
        <div className="flex justify-center py-4">
          <Icon name="Loader2" size={16} className="animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar max-w-full">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              !selectedCategory
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Toutes
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-2">
        {loadingCodes ? (
          <div className="flex justify-center py-8">
            <Icon name="Loader2" size={24} className="animate-spin text-primary" />
          </div>
        ) : !searchQuery.trim() && !selectedCategory && filteredResults.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Icon name="Search" size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Tapez 2 caractères ou plus pour rechercher</p>
            <p className="text-xs mt-1">ou choisissez une catégorie ci-dessus</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Icon name="SearchX" size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun résultat trouvé</p>
          </div>
        ) : (
          <>
            {filteredResults.map((item) => {
              const isSelected = selectedCode === item.code;
              return (
                <motion.button
                  key={item.code}
                  onClick={() => handleSelect(item)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary dark:bg-primary/20 dark:border-primary/50'
                      : 'bg-white dark:bg-slate-800 border-white/20 dark:border-white/10 hover:border-primary/30 dark:hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-slate-100 dark:bg-slate-700 text-primary dark:text-blue-400">
                      {item.code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm text-slate-700 dark:text-slate-300 font-medium line-clamp-2"
                        title={item.name}
                      >
                        {item.name}
                      </p>
                      {item.category && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                          {item.category}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Icon name="Check" size={16} className="shrink-0 text-primary dark:text-blue-400" />
                    )}
                  </div>
                </motion.button>
              );
            })}
            {pagination && (pagination.total > pagination.perPage) && (
              <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                {pagination.total} résultat{(pagination.total > 1) ? 's' : ''}
              </div>
            )}
          </>
        )}
      </div>

      {/* Info */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-white/20 dark:border-white/10">
        <div className="flex items-start gap-2">
          <Icon name="Info" size={16} className="text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-600 dark:text-slate-400">
            CIM-10 OMS — codification des diagnostics. {selectedCode && (
              <span className="font-semibold text-slate-700 dark:text-slate-300">Sélection: <span className="font-mono">{selectedCode}</span></span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CIM10Search;

