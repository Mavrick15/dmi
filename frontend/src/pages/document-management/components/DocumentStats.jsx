import Icon from '../../../components/AppIcon';

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

  const statCards = [
    { id: 'total', title: 'Total des documents', value: safeStats.totalDocuments, icon: 'FileText', theme: 'primary', change: safeStats.totalDocumentsChange, changeType: safeStats.totalDocumentsChangeType ?? 'neutral' },
    { id: 'pending', title: 'En attente de signature', value: safeStats.pendingSignatures, icon: 'PenTool', theme: 'amber', change: safeStats.pendingSignaturesChange, changeType: safeStats.pendingSignaturesChangeType ?? 'neutral' },
    { id: 'totalSigned', title: 'Documents signés', value: safeStats.totalSigned, icon: 'CheckCircle', theme: 'emerald', change: safeStats.totalSignedChange, changeType: safeStats.totalSignedChangeType ?? 'positive' },
    { id: 'signed', title: "Signés aujourd'hui", value: safeStats.signedToday, icon: 'FileCheck', theme: 'green', change: safeStats.signedTodayChange, changeType: safeStats.signedTodayChangeType ?? 'positive' },
    { id: 'storage', title: 'Stockage utilisé', value: safeStats.storageUsed, icon: 'HardDrive', theme: 'violet', change: safeStats.storageChange, changeType: safeStats.storageChangeType ?? 'neutral' },
    { id: 'archived', title: 'Archivés', value: safeStats.archivedDocuments, icon: 'Archive', theme: 'slate', change: safeStats.archivedChange, changeType: safeStats.archivedChangeType ?? 'neutral' },
    { id: 'views', title: 'Vues totales', value: safeStats.totalViews, icon: 'Eye', theme: 'primary', change: safeStats.viewsChange, changeType: safeStats.viewsChangeType ?? 'positive' }
  ];

  const getIconBg = (theme) => {
    const map = {
      primary: 'bg-primary dark:bg-blue-600',
      amber: 'bg-amber-500 dark:bg-amber-600',
      emerald: 'bg-emerald-500 dark:bg-emerald-600',
      green: 'bg-green-500 dark:bg-green-600',
      violet: 'bg-violet-500 dark:bg-violet-600',
      slate: 'bg-slate-500 dark:bg-slate-600'
    };
    return map[theme] ?? map.primary;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 w-full">
      {statCards.map((stat) => {
        const isPositive = stat.changeType === 'positive';
        const isNegative = stat.changeType === 'negative';
        const hasChange = stat.change != null && stat.change !== '';

        return (
          <div
            key={stat.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 shadow-sm p-4 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  {stat.title}
                </p>
                <p className={`font-bold text-slate-900 dark:text-white ${stat.id === 'storage' ? 'text-base' : 'text-xl'} tabular-nums`}>
                  {stat.value}
                </p>
                {hasChange && (
                  <span
                    className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                      isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : isNegative ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon name={isPositive ? 'TrendingUp' : isNegative ? 'TrendingDown' : 'Minus'} size={10} />
                    {stat.change}
                  </span>
                )}
              </div>
              <div className={`w-10 h-10 rounded-xl ${getIconBg(stat.theme)} flex items-center justify-center shrink-0`}>
                <Icon name={stat.icon} size={18} className="text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DocumentStats;