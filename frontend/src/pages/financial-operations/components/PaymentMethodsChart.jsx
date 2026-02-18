import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Icon from '../../../components/AppIcon';
import { usePaymentMethodsStats } from '../../../hooks/useFinance';
const PaymentMethodsChart = () => {
  const { data: paymentStats = [], isLoading } = usePaymentMethodsStats();

  // Calculer le total pour le pourcentage
  const total = Array.isArray(paymentStats) 
    ? paymentStats.reduce((sum, item) => sum + (item?.value || 0), 0)
    : 0;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl border-l-4 border-l-primary shadow-sm p-6 h-full flex flex-col items-center justify-center">
        <Icon name="Loader2" size={32} className="animate-spin text-primary mb-2" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Chargement…</p>
      </div>
    );
  }

  if (!paymentStats || paymentStats.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6 h-full flex flex-col items-center justify-center">
        <Icon name="PieChart" size={40} className="text-slate-400 mb-2" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6 h-full flex flex-col overflow-hidden">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 flex-shrink-0">
        <Icon name="PieChart" className="text-primary" /> Répartition
      </h3>
      
      <div className="flex-1 relative min-h-[300px] mb-3 -mt-[20px]" style={{ minHeight: '300px' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <PieChart>
            <Pie
              data={paymentStats}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {Array.isArray(paymentStats) && paymentStats.map((entry, index) => {
                if (!entry || typeof entry !== 'object') return null;
                return (
                  <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} />
                );
              }).filter(Boolean)}
            </Pie>
            <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: '#1e293b', fontSize: '12px', fontWeight: 'bold' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Centre du Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{total}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 flex-shrink-0 mt-auto">
        {Array.isArray(paymentStats) && paymentStats.map((item, index) => {
          if (!item || typeof item !== 'object') return null;
          return (
          <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">{item.name || ''}</span>
            </div>
            <span className="text-[11px] font-bold text-slate-900 dark:text-white ml-2 flex-shrink-0">{typeof item.value === 'number' ? item.value : 0}%</span>
          </div>
        );
      }).filter(Boolean)}
      </div>
    </div>
  );
};

export default PaymentMethodsChart;