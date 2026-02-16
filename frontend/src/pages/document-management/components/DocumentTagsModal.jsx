import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import AnimatedModal from '../../../components/ui/AnimatedModal';
import { useDocumentMutations } from '../../../hooks/useDocuments';

const DocumentTagsModal = ({ document, isOpen, onClose }) => {
  const { hasPermission } = usePermissions();
  const [newTag, setNewTag] = useState('');
  const { updateTags } = useDocumentMutations();
  const tags = Array.isArray(document?.tags) ? document.tags : [];

  if (!isOpen || !document) return null;

  const handleAddTag = async () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    
    try {
      await updateTags.mutateAsync({
        id: document.id,
        action: 'add',
        tags: [newTag.trim()]
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

  const commonTags = ['urgent', 'confidentiel', 'important', 'archivé', 'signé', 'brouillon'];

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
              <Icon name="Tag" size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Gérer les tags</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{document.title}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Tags actuels */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Tags actuels
            </label>
            {Array.isArray(tags) && tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => {
                  if (!tag || typeof tag !== 'string') return null;
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium"
                    >
                      {tag}
                      <PermissionGuard requiredPermission="document_edit">
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-500 transition-colors"
                          disabled={!hasPermission('document_edit')}
                        >
                          <Icon name="X" size={12} />
                        </button>
                      </PermissionGuard>
                    </span>
                  );
                }).filter(Boolean)}
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">Aucun tag</p>
            )}
          </div>

          {/* Ajouter un tag */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Ajouter un tag
            </label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Nouveau tag..."
                className="flex-1"
              />
              <PermissionGuard requiredPermission="document_edit">
                <Button
                  onClick={handleAddTag}
                  disabled={!newTag.trim() || updateTags.isPending || !hasPermission('document_edit')}
                  size="sm"
                >
                  <Icon name="Plus" size={16} />
                </Button>
              </PermissionGuard>
            </div>
          </div>

          {/* Tags suggérés */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Tags suggérés
            </label>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(commonTags) && commonTags
                .filter(tag => {
                  if (!tag || typeof tag !== 'string') return false;
                  const tagsArray = Array.isArray(tags) ? tags : [];
                  return !tagsArray.includes(tag);
                })
                .map((tag, idx) => {
                  if (!tag || typeof tag !== 'string') return null;
                  return (
                    <PermissionGuard key={idx} requiredPermission="document_edit">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewTag(tag);
                          setTimeout(() => handleAddTag(), 100);
                        }}
                        className="text-xs"
                        disabled={!hasPermission('document_edit')}
                      >
                        <Icon name="Plus" size={12} className="mr-1" />
                        {tag}
                      </Button>
                    </PermissionGuard>
                  );
                }).filter(Boolean)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-6 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
    </div>
    </AnimatedModal>
  );
};

export default DocumentTagsModal;

