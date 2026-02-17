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
    if (window.confirm(`Restaurer la version ${versionNumber} ?`)) {
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

  const currentVersion = document.version ?? 1;
  const versionsList = Array.isArray(versions) ? versions : [];

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
              <Icon name="GitBranch" size={20} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Versions du document</h3>
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
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Icon name="Loader2" size={28} className="animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Version actuelle */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 shadow-sm p-4 border-l-4 border-l-primary">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                      v{currentVersion}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white">Version actuelle</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {document.updatedAt ? format(new Date(document.updatedAt), 'PPp', { locale: fr }) : '—'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold shrink-0">
                    Actuelle
                  </span>
                </div>
              </div>

              {/* Versions précédentes */}
              {versionsList.length > 0 ? (
                <>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-4 mb-2">
                    Versions précédentes
                  </p>
                  {versionsList.map((version) => {
                    if (!version || typeof version !== 'object') return null;
                    const creator = version.creator?.nomComplet || version.creator?.name;
                    const dateStr = version.createdAt ? format(new Date(version.createdAt), 'PPp', { locale: fr }) : '';
                    return (
                      <div
                        key={version.id}
                        className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-sm shrink-0">
                              v{version.versionNumber}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white">
                                Version {version.versionNumber}
                              </p>
                              {version.changeSummary && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                  {version.changeSummary}
                                </p>
                              )}
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                {dateStr}
                                {creator && ` · ${creator}`}
                              </p>
                            </div>
                          </div>
                          <PermissionGuard requiredPermission="document_edit">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestore(version.versionNumber)}
                              disabled={restoreVersion.isPending || !hasPermission('document_edit')}
                              className="shrink-0"
                            >
                              <Icon name="RotateCcw" size={14} className="mr-1.5" />
                              Restaurer
                            </Button>
                          </PermissionGuard>
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Icon name="GitBranch" size={28} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Aucune version précédente</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">L’historique des versions apparaîtra ici.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AnimatedModal>
  );
};

export default DocumentVersionsModal;

