import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { useDocumentComments, useDocumentMutations } from '../../../hooks/useDocuments';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DocumentCommentsPanel = ({ documentId, isOpen, onClose }) => {
  const { hasPermission } = usePermissions();
  const [newComment, setNewComment] = useState('');
  const { data: comments, isLoading } = useDocumentComments(documentId);
  const { addComment } = useDocumentMutations();

  if (!isOpen) return null;

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addComment.mutateAsync({
        id: documentId,
        content: newComment.trim()
      });
      setNewComment('');
    } catch (error) {
      // Erreur gérée par le hook
    }
  };

  const count = Array.isArray(comments) ? comments.length : 0;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md glass-strong border-l border-white/20 dark:border-white/10 shadow-xl z-[100] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <Icon name="MessageSquare" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Commentaires</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {count === 0 ? 'Aucun commentaire' : `${count} commentaire${count > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          aria-label="Fermer"
        >
          <Icon name="X" size={20} />
        </button>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl glass-panel border-l-4 border-l-primary">
            <Icon name="Loader2" size={28} className="animate-spin text-primary mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Chargement…</p>
          </div>
        ) : count > 0 ? (
          comments.map((comment) => {
            if (!comment || typeof comment !== 'object') return null;
            const author = comment.user?.nomComplet || comment.user?.name || 'Utilisateur';
            const dateStr = comment.createdAt ? format(new Date(comment.createdAt), 'PPp', { locale: fr }) : '';
            return (
              <div
                key={comment.id}
                className="rounded-xl glass-panel shadow-sm p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                    <Icon name="User" size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">{author}</span>
                      {dateStr && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">{dateStr}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          }).filter(Boolean)
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-xl glass-surface flex items-center justify-center mb-4">
              <Icon name="MessageSquare" size={28} className="text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Aucun commentaire</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Soyez le premier à commenter</p>
          </div>
        )}
      </div>

      {/* Add Comment */}
      <div className="p-4 border-t border-white/20 dark:border-white/10 shrink-0 glass-surface">
        <div className="flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
            placeholder="Ajouter un commentaire..."
            className="flex-1 px-4 py-3 glass-panel rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-white text-sm resize-none placeholder:text-slate-400"
            rows={3}
          />
          <PermissionGuard requiredPermission="document_comment">
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || addComment.isPending || !hasPermission('document_comment')}
              size="sm"
              className="self-end shrink-0"
            >
              <Icon name="Send" size={16} />
            </Button>
          </PermissionGuard>
        </div>
      </div>
    </div>
  );
};

export default DocumentCommentsPanel;

