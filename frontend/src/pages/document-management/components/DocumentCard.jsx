import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Badge from '../../../components/ui/Badge';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';

const DocumentCard = ({ document, onDownload, onDelete, onView, onShare, canDelete = true, canShare = true }) => {
  const { hasPermission } = usePermissions();

  const getIcon = () => {
    if (document.mimeType?.includes('image')) return 'FileImage';
    if (document.mimeType?.includes('pdf')) return 'FileText';
    return 'File';
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusBadge = () => {
    if (document.isArchived) return <Badge variant="default" size="xs">Archivé</Badge>;
    if (document.status === 'approved') return <Badge variant="success" size="xs">Approuvé</Badge>;
    if (document.status === 'pending_approval') return <Badge variant="warning" size="xs">En attente</Badge>;
    if (document.isSigned) return <Badge variant="info" size="xs">Signé</Badge>;
    return null;
  };

  const getIconBg = () => {
    if (document.mimeType?.includes('image')) return 'bg-purple-500 dark:bg-purple-600';
    if (document.mimeType?.includes('pdf')) return 'bg-red-500 dark:bg-red-600';
    return 'bg-primary dark:bg-blue-600';
  };

  const tags = Array.isArray(document.tags) ? document.tags : [];
  const created = document.createdAt ? new Date(document.createdAt).toLocaleDateString('fr-FR') : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all overflow-hidden flex flex-col"
    >
      <div className="p-4 flex flex-col flex-1 min-h-0">
        {/* En-tête */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-11 h-11 rounded-xl ${getIconBg()} flex items-center justify-center shrink-0`}>
            <Icon name={getIcon()} size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate" title={document.title || document.originalName}>
              {document.title || document.originalName}
            </h4>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {getStatusBadge()}
              {document.version > 1 && <Badge variant="default" size="xs">v{document.version}</Badge>}
              {document.isWatermarked && (
                <Badge variant="default" size="xs">
                  <Icon name="Shield" size={10} className="mr-0.5" /> Watermark
                </Badge>
              )}
            </div>
          </div>
          {document.isSigned && document.signer?.name && (
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Signé par</p>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[80px]" title={document.signer.name}>{document.signer.name}</p>
            </div>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag, idx) =>
              tag && typeof tag === 'string' ? (
                <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] rounded-md">
                  {tag}
                </span>
              ) : null
            )}
            {tags.length > 3 && (
              <span className="px-2 py-0.5 text-[11px] text-slate-400 dark:text-slate-500">+{tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Métadonnées */}
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 flex-wrap mb-3">
          <span>{formatSize(document.size)}</span>
          <span>·</span>
          <span>{created}</span>
          {(document.viewCount > 0 || document.downloadCount > 0) && (
            <>
              <span>·</span>
              {document.viewCount > 0 && <span>{document.viewCount} vue{document.viewCount > 1 ? 's' : ''}</span>}
              {document.downloadCount > 0 && (
                <span>{document.downloadCount} téléchargement{document.downloadCount > 1 ? 's' : ''}</span>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pt-3 border-t border-slate-200 dark:border-slate-700 mt-auto">
          {onView && (
            <button
              type="button"
              onClick={() => onView(document)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
            >
              <Icon name="Eye" size={14} />
              Voir
            </button>
          )}
          <PermissionGuard requiredPermission="document_view">
            <button
              type="button"
              onClick={() => onDownload?.(document)}
              disabled={!hasPermission('document_view')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <Icon name="Download" size={14} />
              Télécharger
            </button>
          </PermissionGuard>
          {onShare && canShare && (
            <button type="button" onClick={() => onShare?.(document)} className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors" title="Partager">
              <Icon name="Share2" size={14} />
            </button>
          )}
          {canDelete && (
            <PermissionGuard requiredPermission="document_delete">
              <button
                type="button"
                onClick={() => onDelete?.(document)}
                disabled={!hasPermission('document_delete')}
                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                title="Supprimer"
              >
                <Icon name="Trash2" size={14} />
              </button>
            </PermissionGuard>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DocumentCard;