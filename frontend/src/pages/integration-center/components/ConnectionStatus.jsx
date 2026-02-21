import Icon from '../../../components/AppIcon';

const ConnectionStatus = ({ connections }) => {
  const connectionsArray = Array.isArray(connections) ? connections : [];
  const totalConnections = connectionsArray.length;
  const activeConnections = connectionsArray.filter(conn => conn && typeof conn === 'object' && conn.status === 'connected').length;
  const errorConnections = connectionsArray.filter(conn => conn && typeof conn === 'object' && conn.status === 'error').length;
  const pendingConnections = connectionsArray.filter(conn => conn && typeof conn === 'object' && conn.status === 'pending').length;

  const statusItems = [
    {
      label: 'Total Intégrations',
      value: totalConnections,
      icon: 'Zap',
      theme: 'blue'
    },
    {
      label: 'Actives',
      value: activeConnections,
      icon: 'CheckCircle',
      theme: 'emerald'
    },
    {
      label: 'Erreurs',
      value: errorConnections,
      icon: 'AlertOctagon',
      theme: 'rose'
    },
    {
      label: 'En attente',
      value: pendingConnections,
      icon: 'Loader',
      theme: 'amber'
    }
  ];

  const getThemeStyles = (theme) => {
    const themes = {
      blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900/50', iconBg: 'bg-blue-100 dark:bg-blue-900/40' },
      emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/50', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40' },
      rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-100 dark:border-rose-900/50', iconBg: 'bg-rose-100 dark:bg-rose-900/40' },
      amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900/50', iconBg: 'bg-amber-100 dark:bg-amber-900/40' }
    };
    return themes[theme];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.isArray(statusItems) && statusItems.map((item, index) => {
        if (!item || typeof item !== 'object') return null;
        const style = getThemeStyles(item.theme);
        return (
          <div key={index} className="backdrop-blur-xl bg-white/50 dark:bg-white/10 rounded-2xl border border-white/20 dark:border-white/10 p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{item.label}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{item.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.iconBg} ${style.text}`}>
                <Icon name={item.icon} size={24} />
              </div>
            </div>
            <div className={`mt-4 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden`}>
               <div className={`h-full rounded-full ${style.text.replace('text-', 'bg-')}`} style={{ width: `${(item.value / (totalConnections || 1)) * 100}%` }} />
            </div>
          </div>
        );
      }).filter(Boolean)}
    </div>
  );
};

export default ConnectionStatus;