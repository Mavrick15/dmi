import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useConsultationTemplates } from '../../../hooks/useClinicalTools';

const ConsultationTemplates = ({ onSelectTemplate, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Récupérer les templates depuis l'API (avec pagination)
  const { data: templatesResponse, isLoading } = useConsultationTemplates({
    includePrivate: 'true', // Inclure les templates personnels
  });

  // Extraire les templates de la réponse paginée
  const templates = templatesResponse?.data || [];
  const pagination = templatesResponse?.pagination || null;

  const categories = useMemo(() => {
    return ['all', ...new Set(templates.map(t => t.category))];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  const handleSelect = (template) => {
    if (onSelectTemplate) {
      // Adapter le format pour correspondre à l'ancien format
      onSelectTemplate({
        ...template,
        data: template.templateData || {}
      });
    }
    if (onClose) {
      onClose();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-white/20 dark:border-white/10 glass-surface border-l-4 border-l-primary">
        <Icon name="Loader2" size={32} className="animate-spin text-primary mb-2" />
        <span className="text-sm text-slate-500 dark:text-slate-400">Chargement…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-white/20 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:text-white"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'all' ? 'Tous' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates List */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Icon name="FileText" size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun template trouvé</p>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="bg-white dark:bg-slate-800 border border-white/20 dark:border-white/10 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleSelect(template)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {template.name}
                    </h4>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary dark:text-blue-400 text-[10px] font-bold rounded">
                      {template.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    {template.description}
                  </p>
                  {template.templateData?.symptoms && template.templateData.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {template.templateData.symptoms.slice(0, 3).map((symptom, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] rounded"
                        >
                          {symptom}
                        </span>
                      ))}
                      {template.templateData.symptoms.length > 3 && (
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] rounded">
                          +{template.templateData.symptoms.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Check"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(template);
                  }}
                  className="flex-shrink-0"
                >
                  Utiliser
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Icon name="Info" size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Les templates pré-remplissent certains champs de la consultation pour gagner du temps.
            Vous pouvez toujours modifier les informations après avoir chargé un template.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsultationTemplates;

