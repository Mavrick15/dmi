import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Badge from '../../../components/ui/Badge';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';

const DocumentCard = ({ document, onDownload, onDelete, onView, onShare }) => {
  const { hasPermission } = usePermissions();
  // Helper pour choisir l'icône selon le type
  const getIcon = () => {
    if (document.mimeType && document.mimeType.includes('image')) return 'FileImage';
    if (document.mimeType && document.mimeType.includes('pdf')) return 'FileText';
    return 'File';
  };

  // Helper pour la taille
  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper pour le statut
  const getStatusBadge = () => {
    if (document.isArchived) {
      return <Badge variant="default" size="xs">Archivé</Badge>;
    }
    if (document.status === 'approved') {
      return <Badge variant="success" size="xs">Approuvé</Badge>;
    }
    if (document.status === 'pending_approval') {
      return <Badge variant="warning" size="xs">En attente</Badge>;
    }
    if (document.isSigned) {
      return <Badge variant="info" size="xs">Signé</Badge>;
    }
    return null;
  };

  const tags = Array.isArray(document.tags) ? document.tags : [];

  const getGradientBg = () => {
    if (document.mimeType?.includes('image')) return 'from-purple-50 via-white to-purple-50/50 dark:from-purple-950/30 dark:via-slate-900 dark:to-purple-950/20';
    if (document.mimeType?.includes('pdf')) return 'from-red-50 via-white to-red-50/50 dark:from-red-950/30 dark:via-slate-900 dark:to-red-950/20';
    return 'from-blue-50 via-white to-blue-50/50 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/20';
  };

  const getBorderColor = () => {
    if (document.mimeType?.includes('image')) return 'border-purple-100 dark:border-purple-900/50';
    if (document.mimeType?.includes('pdf')) return 'border-red-100 dark:border-red-900/50';
    return 'border-blue-100 dark:border-blue-900/50';
  };

  const getIconGradient = () => {
    if (document.mimeType?.includes('image')) return 'from-purple-500 to-purple-600';
    if (document.mimeType?.includes('pdf')) return 'from-red-500 to-red-600';
    return 'from-blue-500 to-blue-600';
  };

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className={`group relative bg-gradient-to-br ${getGradientBg()} border ${getBorderColor()} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all overflow-hidden`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {/* Header avec icône et statut */}
      <div className="relative flex items-start justify-between mb-3 z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className={`w-14 h-14 bg-gradient-to-br ${getIconGradient()} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}
          >
            <Icon 
              name={getIcon()} 
              size={24} 
              className="text-white"
            />
          </motion.div>
          <div className="flex-1 min-w-0">
            <h4 
              className="font-semibold text-slate-900 dark:text-white truncate mb-1" 
              title={document.title || document.originalName}
            >
              {document.title || document.originalName}
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge()}
              {document.version > 1 && (
                <Badge variant="default" size="xs">v{document.version}</Badge>
              )}
              {document.isWatermarked && (
                <Badge variant="default" size="xs">
                  <Icon name="Shield" size={10} className="mr-1" />
                  Watermark
                </Badge>
              )}
            </div>
          </div>
        </div>
        {/* Nom du signataire à droite */}
        {document.isSigned && document.signer?.name && (
          <div className="flex-shrink-0 ml-3 text-right">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Icon name="PenTool" size={12} />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {document.signer.name}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      {Array.isArray(tags) && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.slice(0, 3).map((tag, idx) => {
            if (!tag || typeof tag !== 'string') return null;
            return (
              <Badge key={idx} variant="default" size="xs" className="text-xs">
                {tag}
              </Badge>
            );
          }).filter(Boolean)}
          {tags.length > 3 && (
            <Badge variant="default" size="xs" className="text-xs">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Métadonnées */}
      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-3">
        <div className="flex items-center gap-2">
          <Icon name="Database" size={12} />
          <span>{formatSize(document.size)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="Calendar" size={12} />
          <span>{new Date(document.createdAt).toLocaleDateString('fr-FR')}</span>
        </div>
        {(document.viewCount > 0 || document.downloadCount > 0) && (
          <div className="flex items-center gap-3">
            {document.viewCount > 0 && (
              <div className="flex items-center gap-1">
                <Icon name="Eye" size={12} />
                <span>{document.viewCount} vue{document.viewCount > 1 ? 's' : ''}</span>
              </div>
            )}
            {document.downloadCount > 0 && (
              <div className="flex items-center gap-1">
                <Icon name="Download" size={12} />
                <span>{document.downloadCount} téléchargement{document.downloadCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="relative flex items-center gap-2 border-t border-slate-200 dark:border-slate-700 pt-3 z-10">
        {onView && (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onView(document)}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Icon name="Eye" size={16} />
            Voir
          </motion.button>
        )}
        <PermissionGuard requiredPermission="document_view">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDownload?.(document)}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
            disabled={!hasPermission('document_view')}
          >
            <Icon name="Download" size={16} />
            Télécharger
          </motion.button>
        </PermissionGuard>
        {onShare && (
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onShare?.(document)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Partager"
          >
            <Icon name="Share2" size={16} />
          </motion.button>
        )}
        <PermissionGuard requiredPermission="document_delete">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete?.(document)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Supprimer"
            disabled={!hasPermission('document_delete')}
          >
            <Icon name="Trash2" size={16} />
          </motion.button>
        </PermissionGuard>
      </div>
    </motion.div>
  );
};

export default DocumentCard;