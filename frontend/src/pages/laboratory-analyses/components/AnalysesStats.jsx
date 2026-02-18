import React from 'react';
import Icon from '../../../components/AppIcon';

const AnalysesStats = ({ stats }) => {
  if (!stats) return null;

  const themeStyles = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', icon: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' }
  };

  const statCards = [
    { id: 'total', title: 'Total analyses', value: stats.total || 0, icon: 'TestTube', theme: 'blue' },
    { id: 'prescrite', title: 'Prescrites', value: stats.parStatut?.find(s => s.statut === 'prescrite')?.count || 0, icon: 'FileText', theme: 'indigo' },
    { id: 'terminee', title: 'Terminées', value: stats.parStatut?.find(s => s.statut === 'terminee')?.count || 0, icon: 'CheckCircle', theme: 'emerald' },
    { id: 'en_cours', title: 'En cours', value: stats.parStatut?.find(s => s.statut === 'en_cours')?.count || 0, icon: 'Clock', theme: 'amber' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {statCards.map((card) => {
        const style = themeStyles[card.theme] || themeStyles.blue;
        return (
          <div
            key={card.id}
            className={`rounded-xl border p-4 ${style.bg} ${style.border} shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.icon}`}>
                <Icon name={card.icon} size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight mb-1">
              {card.value.toLocaleString('fr-FR')}
            </p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {card.title}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(AnalysesStats);
