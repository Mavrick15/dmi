import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { useDocumentComments, useDocumentMutations } from '../../../hooks/useDocuments';
import { useAuth } from '../../../contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DocumentCommentsPanel = ({ documentId, isOpen, onClose }) => {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
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

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-[100] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Icon name="MessageSquare" size={20} className="text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-slate-900 dark:text-white">Commentaires</h3>
          {Array.isArray(comments) && comments.length > 0 && (
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700">
              {comments.length}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <Icon name="X" size={20} />
        </Button>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" size={24} className="animate-spin text-primary" />
          </div>
        ) : Array.isArray(comments) && comments.length > 0 ? (
          comments.map((comment) => {
            if (!comment || typeof comment !== 'object') return null;
            return (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon name="User" size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">
                      {comment.user?.nomComplet || comment.user?.name || 'Utilisateur'}
                    </p>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {comment.createdAt && format(new Date(comment.createdAt), 'PPp', { locale: fr })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            </motion.div>
            );
          }).filter(Boolean)
        ) : (
          <div className="text-center py-12">
            <Icon name="MessageSquare" size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Aucun commentaire</p>
          </div>
        )}
      </div>

      {/* Add Comment */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
            placeholder="Ajouter un commentaire..."
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white text-sm resize-none"
            rows={3}
          />
          <PermissionGuard requiredPermission="document_comment">
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || addComment.isPending || !hasPermission('document_comment')}
              size="sm"
              className="self-end"
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

