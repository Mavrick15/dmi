import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useKnowledgeBase } from '../../../hooks/useClinical';
import { Loader2 } from 'lucide-react';

// --- MODAL DE DÉTAILS (Interne au composant) ---
const KnowledgeDetailModal = ({ item, type, onClose }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                {type === 'protocols' ? 'Protocole' : type === 'medications' ? 'Médicament' : 'Diagnostic'}
              </span>
              {item.urgency && (
                <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                  item.urgency === 'urgent' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {item.urgency}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {item.title || item.name}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          {/* Description */}
          {item.description && (
             <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
               {item.description}
             </div>
          )}

          {/* Spécifique Médicaments */}
          {type === 'medications' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                    <Icon name="Pill" size={16} /> Dosage
                  </h4>
                  <p className="text-sm dark:text-slate-300">{item.dosage}</p>
               </div>
               <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                    <Icon name="AlertTriangle" size={16} /> Contre-indications
                  </h4>
                  <p className="text-sm dark:text-slate-300">{item.contraindications}</p>
               </div>
            </div>
          )}

          {/* Spécifique Diagnostics */}
          {type === 'diagnostics' && (
             <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                   <h4 className="font-semibold mb-2 dark:text-white">Critères</h4>
                   <p className="text-sm text-slate-600 dark:text-slate-400">{item.criteria}</p>
                </div>
                <div>
                   <h4 className="font-semibold mb-2 dark:text-white">Examens recommandés</h4>
                   <p className="text-sm text-slate-600 dark:text-slate-400">{item.examinations}</p>
                </div>
             </div>
          )}

          {/* Spécifique Procédures */}
          {type === 'procedures' && (
             <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                        <Icon name="CheckCircle" size={16} /> Indication
                      </h4>
                      <p className="text-sm dark:text-slate-300">{item.indication}</p>
                   </div>
                   <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-800">
                      <h4 className="font-semibold text-rose-800 dark:text-rose-300 mb-2 flex items-center gap-2">
                        <Icon name="XCircle" size={16} /> Contre-indications
                      </h4>
                      <p className="text-sm dark:text-slate-300">{item.contraindications}</p>
                   </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                   <h4 className="font-semibold mb-3 dark:text-white">Étapes</h4>
                   <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      {item.steps.map((step, idx) => (
                         <li key={idx}>{step}</li>
                      ))}
                   </ol>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                   <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                     <Icon name="AlertTriangle" size={16} /> Complications possibles
                   </h4>
                   <p className="text-sm dark:text-slate-300">{item.complications}</p>
                </div>
             </div>
          )}

          {/* Spécifique Directives */}
          {type === 'guidelines' && (
             <div className="space-y-4">
                {item.content && Object.entries(item.content).map(([key, value]) => (
                   <div key={key} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <h4 className="font-semibold mb-2 dark:text-white capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{value}</p>
                   </div>
                ))}
             </div>
          )}

          {/* Tags */}
          {(item.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              {item.tags.map((tag, i) => (
                <span key={i} className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Fermer</Button>
          <Button variant="default" iconName="Printer">Imprimer</Button>
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
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <Loader2 className="animate-spin text-primary mx-auto mb-3" size={32} />
          <p>Chargement des données...</p>
        </div>
      );
    }

    if (filteredData.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <Icon name="SearchX" size={48} className="mx-auto mb-3 opacity-20" />
                <p>Aucun résultat trouvé pour "{searchQuery}"</p>
            </div>
        );
    }

    // Grouper les données par priorité pour affichage avec en-têtes
    const groupedByUrgency = filteredData.reduce((acc, item) => {
      const urgency = item.urgency || 'standard';
      if (!acc[urgency]) {
        acc[urgency] = [];
      }
      acc[urgency].push(item);
      return acc;
    }, {});

    const urgencyLabels = {
      'urgent': 'Urgent',
      'priority': 'Priorité',
      'standard': 'Standard'
    };

    const urgencyOrder = ['urgent', 'priority', 'standard'];

    return (
      <div className="space-y-6 animate-fade-in">
        {urgencyOrder.map((urgency) => {
          const items = groupedByUrgency[urgency] || [];
          if (items.length === 0) return null;

          return (
            <div key={urgency} className="space-y-3">
              {/* En-tête de section par priorité */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-px flex-1 ${
                  urgency === 'urgent' ? 'bg-rose-200 dark:bg-rose-900/50' :
                  urgency === 'priority' ? 'bg-amber-200 dark:bg-amber-900/50' :
                  'bg-emerald-200 dark:bg-emerald-900/50'
                }`} />
                <span className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                  urgency === 'urgent' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                  urgency === 'priority' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}>
                  {urgencyLabels[urgency]} ({items.length})
                </span>
                <div className={`h-px flex-1 ${
                  urgency === 'urgent' ? 'bg-rose-200 dark:bg-rose-900/50' :
                  urgency === 'priority' ? 'bg-amber-200 dark:bg-amber-900/50' :
                  'bg-emerald-200 dark:bg-emerald-900/50'
                }`} />
              </div>

              {/* Items de cette priorité */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedItem(item)}
                    className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-md hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-200 cursor-pointer group"
                  >
            {/* Cas Protocoles */}
            {activeCategory === 'protocols' && (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pr-4">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 leading-relaxed line-clamp-2">{item.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1"><Icon name="Folder" size={12} /> {item.category}</span>
                      <span className="flex items-center gap-1"><Icon name="Clock" size={12} /> Mis à jour: {new Date(item.lastUpdated).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${getUrgencyStyle(item.urgency)}`}>
                    {item.urgency === 'urgent' ? 'Urgent' : item.urgency === 'priority' ? 'Priorité' : 'Standard'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex flex-wrap gap-2">
                    {(item.tags || []).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                    <Icon name="Eye" size={14} className="mr-1.5" /> Consulter
                  </Button>
                </div>
              </>
            )}

            {/* Cas Médicaments */}
            {activeCategory === 'medications' && (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg group-hover:text-primary transition-colors">{item.name}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.category}</p>
                  </div>
                  <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-semibold rounded-lg border border-blue-100 dark:border-blue-900/50">
                    {item.dosage}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">CIM-10</span>
                        <span className="text-sm font-mono text-primary font-semibold">{item.code}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{item.criteria}</p>
              </>
            )}

            {/* Cas Procédures */}
            {activeCategory === 'procedures' && (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pr-4">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                      <span className="font-medium">Indication:</span> {item.indication}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1"><Icon name="Folder" size={12} /> {item.category}</span>
                      <span className="flex items-center gap-1"><Icon name="AlertCircle" size={12} /> {item.complications.split(',')[0]}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                    Procédure
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex flex-wrap gap-2">
                    {(item.tags || []).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                    <Icon name="Eye" size={14} className="mr-1.5" /> Consulter
                  </Button>
                </div>
              </>
            )}

            {/* Cas Directives */}
            {activeCategory === 'guidelines' && (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pr-4">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 leading-relaxed line-clamp-2">{item.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1"><Icon name="Folder" size={12} /> {item.category}</span>
                      <span className="flex items-center gap-1"><Icon name="Clock" size={12} /> {new Date(item.lastUpdated).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${getUrgencyStyle(item.urgency)}`}>
                    {item.urgency === 'urgent' ? 'Urgent' : item.urgency === 'priority' ? 'Priorité' : 'Standard'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex flex-wrap gap-2">
                    {(item.tags || []).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                    <Icon name="Eye" size={14} className="mr-1.5" /> Consulter
                  </Button>
                </div>
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row h-[780px]">
      
      {/* Sidebar de Catégories */}
      <div className="w-full md:w-72 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Icon name="BookOpen" size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white leading-tight">Base Clinique</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ressources & Savoir</p>
            </div>
          </div>

          <div className="relative">
             <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
                type="text" 
                placeholder="Rechercher..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white placeholder:text-slate-400"
             />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {knowledgeCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => { setActiveCategory(category.id); setSearchQuery(''); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeCategory === category.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon name={category.icon} size={18} className={activeCategory === category.id ? category.color : 'text-slate-400'} />
                {category.label}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                  activeCategory === category.id 
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' 
                  : 'bg-transparent text-slate-400'
              }`}>
                {category.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Zone de Contenu */}
      <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-black/20 overflow-hidden min-h-0">
        <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar min-h-0">
           <div className="max-w-4xl mx-auto">
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