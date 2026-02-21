import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import { useQuickNotes, useQuickNotesMutations } from '../../../hooks/useClinicalTools';

const QuickNotes = ({ onInsertNote, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { useNote } = useQuickNotesMutations();

  // Récupérer les notes depuis l'API (avec pagination)
  const { data: notesResponse, isLoading } = useQuickNotes({
    includePrivate: 'true', // Inclure les notes personnelles
  });

  // Extraire les notes de la réponse paginée
  const notes = notesResponse?.data || [];
  const pagination = notesResponse?.pagination || null;

  const categories = useMemo(() => {
    return ['all', ...new Set(notes.map(n => n.category))];
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
      const matchesSearch = !searchQuery || note.text.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [notes, selectedCategory, searchQuery]);

  const handleInsert = async (note) => {
    // Incrémenter le compteur d'utilisation
    if (note.id) {
      try {
        await useNote.mutateAsync(note.id);
      } catch (error) {
        // Erreur non bloquante - l'insertion de la note peut continuer
        // Les erreurs sont loggées mais n'empêchent pas l'utilisation de la note
        if (process.env.NODE_ENV === 'development') {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Erreur lors de l\'incrémentation du compteur:', error);
          }
        }
      }
    }

    if (onInsertNote) {
      onInsertNote(note.text);
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
      {/* Search */}
      <div className="relative">
        <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher une note..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-white/20 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:text-white"
        />
      </div>

      {/* Categories */}
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
            {cat === 'all' ? 'Toutes' : cat}
          </button>
        ))}
      </div>

      {/* Notes List */}
      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Icon name="FileText" size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune note trouvée</p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <motion.button
              key={note.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleInsert(note)}
              className="w-full text-left p-3 bg-white dark:bg-slate-800 border border-white/20 dark:border-white/10 rounded-xl hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{note.text}</p>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 inline-block">
                    {note.category}
                  </span>
                </div>
                <Icon name="Plus" size={16} className="text-primary flex-shrink-0 mt-0.5" />
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
};

export default QuickNotes;

