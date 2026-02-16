import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import AnimatedModal from '../../../components/ui/AnimatedModal';
import { useDocumentVersions, useDocumentMutations } from '../../../hooks/useDocuments';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DocumentVersionsModal = ({ document, isOpen, onClose }) => {
  const { hasPermission } = usePermissions();
  const { data: versions, isLoading } = useDocumentVersions(document?.id);
  const { restoreVersion } = useDocumentMutations();

  if (!isOpen || !document) return null;

  const handleRestore = async (versionNumber) => {
    if (window.confirm(`Êtes-vous sûr de vouloir restaurer la version ${versionNumber} ?`)) {
      try {
        await restoreVersion.mutateAsync({
          id: document.id,
          versionNumber
        });
        onClose();
      } catch (error) {
        // Erreur gérée par le hook
      }
    }
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
              <Icon name="GitBranch" size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Versions du document</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{document.title}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="Loader2" size={24} className="animate-spin text-primary" />
            </div>
          ) : Array.isArray(versions) && versions.length > 0 ? (
            <div className="space-y-3">
              {/* Version actuelle */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                      v{document.version || 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Version actuelle</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {document.updatedAt && format(new Date(document.updatedAt), 'PPpp', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold">
                    Actuelle
                  </span>
                </div>
              </div>

              {/* Versions précédentes */}
              {versions.map((version) => {
                if (!version || typeof version !== 'object') return null;
                return (
                <div
                  key={version.id}
                  className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                        v{version.versionNumber}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          Version {version.versionNumber}
                        </p>
                        {version.changeSummary && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {version.changeSummary}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {version.createdAt && format(new Date(version.createdAt), 'PPpp', { locale: fr })}
                          {version.creator && ` par ${version.creator.nomComplet || version.creator.name}`}
                        </p>
                      </div>
                    </div>
                    <PermissionGuard requiredPermission="document_edit">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(version.versionNumber)}
                        disabled={restoreVersion.isPending || !hasPermission('document_edit')}
                      >
                        <Icon name="RotateCcw" size={14} className="mr-1.5" />
                        Restaurer
                      </Button>
                    </PermissionGuard>
                  </div>
                </div>
                );
              }).filter(Boolean)}
            </div>
          ) : (
            <div className="text-center py-12">
              <Icon name="GitBranch" size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Aucune version précédente</p>
            </div>
          )}
        </div>
    </div>
    </AnimatedModal>
  );
};

export default DocumentVersionsModal;

