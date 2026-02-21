import Icon from '../../../components/AppIcon';

const DataFlowMonitor = ({ dataFlows }) => {
  const getFlowStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-emerald-500';
      case 'error': return 'text-rose-500';
      case 'paused': return 'text-amber-500';
      default: return 'text-slate-400';
    }
  };

  const getFlowIcon = (type) => {
    switch (type) {
      case 'import': return 'DownloadCloud';
      case 'export': return 'UploadCloud';
      case 'sync': return 'RefreshCw';
      default: return 'ArrowRightLeft';
    }
  };

  return (
    <div className="glass-panel rounded-3xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Icon name="Activity" className="text-primary" /> Flux de Données
        </h3>
        <div className="flex items-center gap-2 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-100 dark:border-emerald-900/50">
           <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Monitoring Live
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        {Array.isArray(dataFlows) && dataFlows.map((flow) => {
          if (!flow || typeof flow !== 'object') return null;
          return (
          <div key={flow.id} className="group relative flex items-center p-4 glass-panel rounded-2xl hover:border-primary/40 transition-all shadow-sm">
            
            {/* Type Icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center glass-surface ${getFlowStatusColor(flow.status)}`}>
              <Icon name={getFlowIcon(flow.type)} size={24} className={flow.status === 'active' && flow.type === 'sync' ? 'animate-spin-slow' : ''} />
            </div>

            {/* Flow Line Visual */}
            <div className="flex-1 mx-4 flex flex-col justify-center">
                <div className="flex justify-between items-end mb-1.5">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{flow.source}</span>
                    <Icon name="ArrowRight" size={16} className="text-slate-300 dark:text-slate-600" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{flow.destination}</span>
                </div>
                
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${flow.status === 'active' ? 'bg-primary animate-progress-indeterminate' : flow.status === 'error' ? 'bg-rose-500' : 'bg-slate-300'}`}></div>
                </div>
                
                <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-slate-400">{flow.description}</span>
                    <span className="text-[10px] font-mono text-slate-400">{flow.lastActivity}</span>
                </div>
            </div>

            {/* Status Badge */}
            <div className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold capitalize border bg-opacity-50 ${
                flow.status === 'active' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-900/50 dark:text-emerald-400' : 
                flow.status === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-900/20 dark:border-rose-900/50 dark:text-rose-400' : 
                'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:border-slate-700'
            }`}>
                {flow.status}
            </div>

          </div>
          );
        }).filter(Boolean)}
      </div>
    </div>
  );
};

export default DataFlowMonitor;