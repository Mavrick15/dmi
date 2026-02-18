import Icon from '../../../components/AppIcon';

/**
 * Cartes de statistique inspirées du style des cartes du module Pharmacie (InventoryOverview).
 * Fond coloré léger, icône dans un carré thématique, valeur + libellé.
 */
const DocumentStats = ({ stats }) => {
  const safeStats = {
    totalDocuments: stats?.totalDocuments ?? 0,
    pendingSignatures: stats?.pendingSignatures ?? 0,
    signedToday: stats?.signedToday ?? 0,
    totalSigned: stats?.totalSigned ?? 0,
    storageUsed: stats?.storageUsed ?? '0 MB',
    archivedDocuments: stats?.archivedDocuments ?? 0,
    totalViews: stats?.totalViews ?? 0
  };

  const themeStyles = {
    primary: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800', icon: 'bg-violet-500/20 text-violet-600 dark:text-violet-400' },
    slate: { bg: 'bg-slate-50 dark:bg-slate-800/50', border: 'border-slate-200 dark:border-slate-700', icon: 'bg-slate-500/20 text-slate-600 dark:text-slate-400' }
  };

  const statCards = [
    { id: 'total', title: 'Total des documents', value: safeStats.totalDocuments, icon: 'FileText', theme: 'primary', change: safeStats.totalDocumentsChange, changeType: safeStats.totalDocumentsChangeType ?? 'neutral' },
    { id: 'pending', title: 'En attente de signature', value: safeStats.pendingSignatures, icon: 'PenTool', theme: 'amber', change: safeStats.pendingSignaturesChange, changeType: safeStats.pendingSignaturesChangeType ?? 'neutral' },
    { id: 'totalSigned', title: 'Documents signés', value: safeStats.totalSigned, icon: 'CheckCircle', theme: 'emerald', change: safeStats.totalSignedChange, changeType: safeStats.totalSignedChangeType ?? 'positive' },
    { id: 'signed', title: "Signés aujourd'hui", value: safeStats.signedToday, icon: 'FileCheck', theme: 'green', change: safeStats.signedTodayChange, changeType: safeStats.signedTodayChangeType ?? 'positive' },
    { id: 'storage', title: 'Stockage utilisé', value: safeStats.storageUsed, icon: 'HardDrive', theme: 'violet', change: safeStats.storageChange, changeType: safeStats.storageChangeType ?? 'neutral' },
    { id: 'archived', title: 'Archivés', value: safeStats.archivedDocuments, icon: 'Archive', theme: 'slate', change: safeStats.archivedChange, changeType: safeStats.archivedChangeType ?? 'neutral' },
    { id: 'views', title: 'Vues totales', value: safeStats.totalViews, icon: 'Eye', theme: 'primary', change: safeStats.viewsChange, changeType: safeStats.viewsChangeType ?? 'positive' }
  ];

  const getChangeBadgeClass = (changeType) => {
    if (changeType === 'positive') return 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30';
    if (changeType === 'negative') return 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/30';
    return 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800';
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 w-full">
      {statCards.map((stat) => {
        const style = themeStyles[stat.theme] || themeStyles.primary;
        const isPositive = stat.changeType === 'positive';
        const isNegative = stat.changeType === 'negative';
        const hasChange = stat.change != null && stat.change !== '';

        return (
          <div
            key={stat.id}
            className={`rounded-xl border p-4 ${style.bg} ${style.border} shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.icon}`}>
                <Icon name={stat.icon} size={20} />
              </div>
              {hasChange && (
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${getChangeBadgeClass(stat.changeType)}`}>
                  <Icon name={isPositive ? 'TrendingUp' : isNegative ? 'TrendingDown' : 'Minus'} size={12} />
                  {stat.change}
                </span>
              )}
            </div>
            <p className={`font-bold text-slate-900 dark:text-white tabular-nums tracking-tight mb-1 ${stat.id === 'storage' ? 'text-base' : 'text-2xl'}`}>
              {stat.value}
            </p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {stat.title}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default DocumentStats;
