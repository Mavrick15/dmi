import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useKnowledgeBase } from '../../../hooks/useClinical';
import { formatDateInBusinessTimezone } from '../../../utils/dateTime';

// --- MODAL DE DÉTAILS ---
const KnowledgeDetailModal = ({ item, type, onClose }) => {
  if (!item) return null;

  const typeLabel = type === 'protocols' ? 'Protocole' : type === 'medications' ? 'Médicament' : type === 'diagnostics' ? 'Diagnostic' : type === 'procedures' ? 'Procédure' : 'Directive';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="backdrop-blur-xl bg-white/50 dark:bg-white/10 w-full max-w-2xl rounded-xl shadow-xl overflow-hidden border border-white/20 dark:border-white/10"
      >
        <div className="p-5 border-b border-white/20 dark:border-white/10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
              <Icon name="BookOpen" size={20} className="text-primary dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{typeLabel}</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate mt-0.5">{item.title || item.name}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          {/* Description */}
          {item.description && (
             <div className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
               {item.description}
             </div>
          )}

          {/* Spécifique Médicaments */}
          {type === 'medications' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <h4 className="text-base font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                    <Icon name="Pill" size={16} /> Dosage
                  </h4>
                  <p className="text-base dark:text-slate-300">{item.dosage}</p>
               </div>
               <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                  <h4 className="text-base font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                    <Icon name="AlertTriangle" size={16} /> Contre-indications
                  </h4>
                  <p className="text-base dark:text-slate-300">{item.contraindications}</p>
               </div>
            </div>
          )}

          {/* Spécifique Diagnostics */}
          {type === 'diagnostics' && (
             <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                   <h4 className="text-base font-semibold mb-2 dark:text-white">Critères</h4>
                   <p className="text-base text-slate-600 dark:text-slate-400">{item.criteria}</p>
                </div>
                <div>
                   <h4 className="text-base font-semibold mb-2 dark:text-white">Examens recommandés</h4>
                   <p className="text-base text-slate-600 dark:text-slate-400">{item.examinations}</p>
                </div>
             </div>
          )}

          {/* Spécifique Procédures */}
          {type === 'procedures' && (
             <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                      <h4 className="text-base font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                        <Icon name="CheckCircle" size={16} /> Indication
                      </h4>
                      <p className="text-base dark:text-slate-300">{item.indication}</p>
                   </div>
                   <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-800">
                      <h4 className="text-base font-semibold text-rose-800 dark:text-rose-300 mb-2 flex items-center gap-2">
                        <Icon name="XCircle" size={16} /> Contre-indications
                      </h4>
                      <p className="text-base dark:text-slate-300">{item.contraindications}</p>
                   </div>
                </div>
                {(item.steps || []).length > 0 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-white/20 dark:border-white/10">
                   <h4 className="text-base font-semibold mb-3 dark:text-white">Étapes</h4>
                   <ol className="list-decimal list-inside space-y-2 text-base text-slate-600 dark:text-slate-400">
                      {item.steps.map((step, idx) => (
                         <li key={idx}>{step}</li>
                      ))}
                   </ol>
                </div>
                )}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                   <h4 className="text-base font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                     <Icon name="AlertTriangle" size={16} /> Complications possibles
                   </h4>
                   <p className="text-base dark:text-slate-300">{item.complications}</p>
                </div>
             </div>
          )}

          {/* Spécifique Directives */}
          {type === 'guidelines' && (
             <div className="space-y-4">
                {item.content && Object.entries(item.content).map(([key, value]) => (
                   <div key={key} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <h4 className="text-base font-semibold mb-2 dark:text-white capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                      <p className="text-base text-slate-600 dark:text-slate-400">{value}</p>
                   </div>
                ))}
             </div>
          )}

          {/* Tags */}
          {(item.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              {item.tags.map((tag, i) => (
                <span key={i} className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/20 dark:border-white/10 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">Fermer</Button>
        </div>
      </motion.div>
    </div>
  );
};

const ClinicalKnowledgeBase = () => {
  const [activeCategory, setActiveCategory] = useState('protocols');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // Récupérer les données depuis le backend
  const { data: knowledgeData = [], isLoading: isLoadingKnowledge } = useKnowledgeBase(activeCategory, searchQuery);

  // Catégories avec compteurs dynamiques (sera mis à jour quand le backend fournira ces données)
  const knowledgeCategories = [
    { id: 'protocols', label: 'Protocoles', icon: 'FileText', count: knowledgeData.length || 0, color: 'text-blue-500' },
    { id: 'medications', label: 'Médicaments', icon: 'Pill', count: knowledgeData.length || 0, color: 'text-emerald-500' },
    { id: 'diagnostics', label: 'Diagnostics', icon: 'Search', count: knowledgeData.length || 0, color: 'text-violet-500' },
    { id: 'procedures', label: 'Procédures', icon: 'Stethoscope', count: knowledgeData.length || 0, color: 'text-amber-500' },
    { id: 'guidelines', label: 'Directives', icon: 'BookOpen', count: knowledgeData.length || 0, color: 'text-rose-500' }
  ];

  // Utiliser uniquement les données du backend
  // Le filtrage est géré par le backend via le paramètre search
  const filteredData = useMemo(() => {
    let data = knowledgeData;
    
    // Appliquer un filtrage local si recherche
    if (searchQuery.length >= 2) {
      const lowerSearch = searchQuery.toLowerCase();
      data = knowledgeData.filter((item) => {
        const titleMatch = (item.title || item.name || '').toLowerCase().includes(lowerSearch);
        const descMatch = (item.description || item.category || '').toLowerCase().includes(lowerSearch);
        const codeMatch = (item.code || '').toLowerCase().includes(lowerSearch);
        const tagsMatch = (item.tags || []).some(tag => tag.toLowerCase().includes(lowerSearch));
        return titleMatch || descMatch || codeMatch || tagsMatch;
      });
    }
    
    // Trier par priorité : Urgent > Priorité > Standard
    const urgencyOrder = { 'urgent': 1, 'priority': 2, 'standard': 3 };
    
    return [...data].sort((a, b) => {
      const urgencyA = urgencyOrder[a.urgency] || 3;
      const urgencyB = urgencyOrder[b.urgency] || 3;
      
      // D'abord par priorité
      if (urgencyA !== urgencyB) {
        return urgencyA - urgencyB;
      }
      
      // Ensuite par ordre d'affichage si disponible
      const orderA = a.ordreAffichage || a.ordre_affichage || 999;
      const orderB = b.ordreAffichage || b.ordre_affichage || 999;
      return orderA - orderB;
    });
  }, [activeCategory, searchQuery, knowledgeData]);

  const getUrgencyStyle = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/50';
      case 'priority': return 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50';
      default: return 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50';
    }
  };

  // --- RENDU DU CONTENU ---
  const renderContent = () => {
    if (isLoadingKnowledge) {
      return (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-white/20 dark:border-white/10 glass-surface mx-2 border-l-4 border-l-primary">
          <Icon name="Loader2" size={28} className="animate-spin text-primary mb-3" />
          <p className="text-base text-slate-500 dark:text-slate-400">Chargement…</p>
        </div>
      );
    }

    if (filteredData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Icon name="SearchX" size={40} className="text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-base font-medium text-slate-600 dark:text-slate-400">Aucun résultat</p>
          {searchQuery && <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">pour « {searchQuery} »</p>}
        </div>
      );
    }

    const groupedByUrgency = filteredData.reduce((acc, item) => {
      const urgency = item.urgency || 'standard';
      if (!acc[urgency]) acc[urgency] = [];
      acc[urgency].push(item);
      return acc;
    }, {});

    const urgencyLabels = { urgent: 'Urgent', priority: 'Priorité', standard: 'Standard' };
    const urgencyOrder = ['urgent', 'priority', 'standard'];

    return (
      <div className="space-y-6">
        {urgencyOrder.map((urgency) => {
          const items = groupedByUrgency[urgency] || [];
          if (items.length === 0) return null;

          return (
            <div key={urgency} className="space-y-2">
              <p className={`text-sm font-semibold uppercase tracking-wider ${
                urgency === 'urgent' ? 'text-rose-600 dark:text-rose-400' :
                urgency === 'priority' ? 'text-amber-600 dark:text-amber-400' :
                'text-slate-500 dark:text-slate-400'
              }`}>
                {urgencyLabels[urgency]} — {items.length}
              </p>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedItem(item)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedItem(item)}
                    className="p-4 glass-panel rounded-xl/50 hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
                  >
            {/* Cas Protocoles */}
            {activeCategory === 'protocols' && (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pr-4">
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-base text-slate-500 dark:text-slate-400 mb-2 leading-relaxed line-clamp-2">{item.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1"><Icon name="Folder" size={12} /> {item.category}</span>
                      <span className="flex items-center gap-1"><Icon name="Clock" size={12} /> Mis à jour: {item.lastUpdated ? formatDateInBusinessTimezone(item.lastUpdated) : '—'}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${getUrgencyStyle(item.urgency)}`}>
                    {item.urgency === 'urgent' ? 'Urgent' : item.urgency === 'priority' ? 'Priorité' : 'Standard'}
                  </span>
                </div>
                {(item.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {(item.tags || []).map((tag, index) => (
                      <span key={index} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm rounded-md">#{tag}</span>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Cas Médicaments */}
            {activeCategory === 'medications' && (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">{item.name}</h4>
                    <p className="text-base text-slate-500 dark:text-slate-400">{item.category}</p>
                  </div>
                  <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-base font-semibold rounded-lg border border-blue-100 dark:border-blue-900/50">
                    {item.dosage}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                   <div className="flex items-start gap-2">
                      <Icon name="AlertCircle" size={14} className="text-rose-500 mt-0.5" />
                      <p className="text-slate-600 dark:text-slate-300 line-clamp-1"><span className="font-medium">Contre-ind:</span> {item.contraindications}</p>
                   </div>
                   <div className="flex items-start gap-2">
                      <Icon name="ArrowRightLeft" size={14} className="text-amber-500 mt-0.5" />
                      <p className="text-slate-600 dark:text-slate-300 line-clamp-1"><span className="font-medium">Interactions:</span> {item.interactions}</p>
                   </div>
                </div>
              </>
            )}

            {/* Cas Diagnostics */}
            {activeCategory === 'diagnostics' && (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-white/20 dark:border-white/10">CIM-10</span>
                        <span className="text-base font-mono text-primary font-semibold">{item.code}</span>
                    </div>
                  </div>
                </div>
                <p className="text-base text-slate-500 dark:text-slate-400 line-clamp-2">{item.criteria}</p>
              </>
            )}

            {/* Cas Procédures */}
            {activeCategory === 'procedures' && (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pr-4">
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-base text-slate-500 dark:text-slate-400 mb-2">
                      <span className="font-medium">Indication:</span> {item.indication}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1"><Icon name="Folder" size={12} /> {item.category}</span>
                      <span className="flex items-center gap-1"><Icon name="AlertCircle" size={12} /> {(item.complications || '').split(',')[0] || '—'}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                    Procédure
                  </span>
                </div>
                {(item.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {(item.tags || []).map((tag, index) => (
                      <span key={index} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm rounded-md">#{tag}</span>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Cas Directives */}
            {activeCategory === 'guidelines' && (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pr-4">
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-base text-slate-500 dark:text-slate-400 mb-2 leading-relaxed line-clamp-2">{item.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1"><Icon name="Folder" size={12} /> {item.category}</span>
                      <span className="flex items-center gap-1"><Icon name="Clock" size={12} /> {item.lastUpdated ? formatDateInBusinessTimezone(item.lastUpdated) : '—'}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${getUrgencyStyle(item.urgency)}`}>
                    {item.urgency === 'urgent' ? 'Urgent' : item.urgency === 'priority' ? 'Priorité' : 'Standard'}
                  </span>
                </div>
                {(item.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {(item.tags || []).map((tag, index) => (
                      <span key={index} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm rounded-md">#{tag}</span>
                    ))}
                  </div>
                )}
              </>
            )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="glass-panel rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row h-[780px]">
      {/* Sidebar */}
      <div className="w-full md:w-64 border-r border-white/20 dark:border-white/10 backdrop-blur-xl bg-white/50 dark:bg-white/10 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-white/20 dark:border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Icon name="BookOpen" size={20} className="text-primary dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Base de Connaissances</h2>
            </div>
          </div>
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-white/20 dark:border-white/10 rounded-xl text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:text-white placeholder-slate-400"
            />
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto custom-scrollbar">
          {knowledgeCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => { setActiveCategory(category.id); setSearchQuery(''); }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-base font-medium transition-colors ${
                activeCategory === category.id
                  ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon name={category.icon} size={18} className={activeCategory === category.id ? category.color : 'text-slate-400'} />
                {category.label}
              </span>
              <span className={`text-xs font-semibold tabular-nums ${
                activeCategory === category.id ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'
              }`}>
                {category.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30 dark:bg-slate-950/30">
        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar min-h-0">
          <div className="max-w-3xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Modal de Détails */}
      <AnimatePresence>
        {selectedItem && (
          <KnowledgeDetailModal 
            item={selectedItem} 
            type={activeCategory} 
            onClose={() => setSelectedItem(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClinicalKnowledgeBase;