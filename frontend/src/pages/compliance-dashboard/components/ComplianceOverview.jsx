import Icon from '../../../components/AppIcon';

const ComplianceOverview = () => {
  const complianceMetrics = [
    {
      id: 1,
      title: "Score Conformité HIPAA",
      value: "98.5%",
      change: "+2.1%",
      trend: "up",
      theme: "emerald",
      description: "Niveau de conformité global basé sur les protocoles de sécurité."
    },
    {
      id: 2,
      title: "Pistes d'Audit Actives",
      value: "15,847",
      change: "+234",
      trend: "up",
      theme: "blue",
      description: "Total des événements système journalisés ce mois-ci."
    },
    {
      id: 3,
      title: "Violations Sécurité",
      value: "2",
      change: "-5",
      trend: "down", // Down is good for violations
      theme: "rose",
      description: "Incidents de sécurité nécessitant une attention immédiate."
    },
    {
      id: 4,
      title: "Formation Staff",
      value: "94.2%",
      change: "+1.8%",
      trend: "up",
      theme: "violet",
      description: "Taux de complétion des modules de formation obligatoires."
    }
  ];

  const getThemeStyles = (theme) => {
    const styles = {
      emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40' },
      blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/40' },
      rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', iconBg: 'bg-rose-100 dark:bg-rose-900/40' },
      violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400', iconBg: 'bg-violet-100 dark:bg-violet-900/40' }
    };
    return styles[theme];
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Vue d'ensemble</h3>
            <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Système surveillé en temps réel</span>
            </div>
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            Dernier scan: 2 min
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.isArray(complianceMetrics) && complianceMetrics.map((metric) => {
          if (!metric || typeof metric !== 'object') return null;
          const style = getThemeStyles(metric.theme);
          const isGoodTrend = (metric.trend === 'up' && metric.theme !== 'rose') || (metric.trend === 'down' && metric.theme === 'rose');
          
          return (
            <div key={metric.id} className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${style.iconBg} ${style.text}`}>
                   {/* Mapping simple d'icônes */}
                   <Icon name={metric.theme === 'emerald' ? 'ShieldCheck' : metric.theme === 'blue' ? 'Activity' : metric.theme === 'rose' ? 'AlertOctagon' : 'GraduationCap'} size={24} />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${isGoodTrend ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                  <Icon name={metric.trend === 'up' ? 'TrendingUp' : 'TrendingDown'} size={12} />
                  {metric.change}
                </div>
              </div>
              
              <div>
                <h4 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">{metric.value}</h4>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{metric.title}</p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                 <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed line-clamp-2">{metric.description}</p>
              </div>
            </div>
          );
        }).filter(Boolean)}
      </div>

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-lg flex items-start gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        
        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
          <Icon name="Shield" size={32} className="text-emerald-400" />
        </div>
        <div className="relative z-10">
          <h4 className="text-lg font-bold mb-1">Statut de Conformité : Excellent</h4>
          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
            Votre établissement maintient une conformité HIPAA exemplaire (98.5%). 
            Les audits de sécurité sont à jour. Deux alertes mineures de sécurité nécessitent une revue d'ici la fin de la semaine.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComplianceOverview;