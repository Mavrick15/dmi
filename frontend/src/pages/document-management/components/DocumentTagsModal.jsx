import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import AnimatedModal from '../../../components/ui/AnimatedModal';
import { useDocumentMutations } from '../../../hooks/useDocuments';

const SUGGESTED_TAGS = ['urgent', 'confidentiel', 'important', 'archivé', 'signé', 'brouillon'];

const DocumentTagsModal = ({ document, isOpen, onClose }) => {
  const { hasPermission } = usePermissions();
  const [newTag, setNewTag] = useState('');
  const { updateTags } = useDocumentMutations();
  const tags = Array.isArray(document?.tags) ? document.tags : [];

  if (!isOpen || !document) return null;

  const handleAddTag = async (tagToAdd) => {
    const value = (tagToAdd ?? newTag).trim();
    if (!value || tags.includes(value)) return;
    try {
      await updateTags.mutateAsync({
        id: document.id,
        action: 'add',
        tags: [value]
      });
      setNewTag('');
    } catch (error) {
      // Erreur gérée par le hook
    }
  };

  const handleRemoveTag = async (tag) => {
    try {
      await updateTags.mutateAsync({
        id: document.id,
        action: 'remove',
        tags: [tag]
      });
    } catch (error) {
      // Erreur gérée par le hook
    }
  };

  const suggestedFiltered = SUGGESTED_TAGS.filter(t => t && typeof t === 'string' && !tags.includes(t));

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
              <Icon name="Tag" size={20} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Gérer les tags</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={document.title || document.originalName}>
                {document.title || document.originalName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Fermer"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 flex-1 min-h-0">
          {/* Tags actuels */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-4">
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-3">Tags actuels</p>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => {
                  if (!tag || typeof tag !== 'string') return null;
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium"
                    >
                      {tag}
                      <PermissionGuard requiredPermission="document_edit">
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors disabled:opacity-50"
                          disabled={!hasPermission('document_edit')}
                          aria-label={`Retirer ${tag}`}
                        >
                          <Icon name="X" size={12} />
                        </button>
                      </PermissionGuard>
                    </span>
                  );
                }).filter(Boolean)}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Aucun tag sur ce document.</p>
            )}
          </div>

          {/* Ajouter un tag */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-4 shadow-sm">
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-3">Ajouter un tag</p>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Nouveau tag..."
                className="flex-1 rounded-xl"
              />
              <PermissionGuard requiredPermission="document_edit">
                <Button
                  onClick={() => handleAddTag()}
                  disabled={!newTag.trim() || updateTags.isPending || !hasPermission('document_edit')}
                  size="sm"
                  className="shrink-0"
                >
                  <Icon name="Plus" size={16} />
                </Button>
              </PermissionGuard>
            </div>
          </div>

          {/* Tags suggérés */}
          {suggestedFiltered.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-4">
              <p className="text-sm font-bold text-slate-900 dark:text-white mb-3">Tags suggérés</p>
              <div className="flex flex-wrap gap-2">
                {suggestedFiltered.map((tag, idx) => (
                  <PermissionGuard key={idx} requiredPermission="document_edit">
                    <button
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      disabled={!hasPermission('document_edit') || updateTags.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:border-primary hover:text-primary dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                    >
                      <Icon name="Plus" size={12} />
                      {tag}
                    </button>
                  </PermissionGuard>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default DocumentTagsModal;

