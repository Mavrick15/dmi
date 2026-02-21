import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import Icon from '../../../components/AppIcon';
import { useCurrency } from '../../../contexts/CurrencyContext';

const RevenueChart = ({ data = [] }) => {
  const { formatCurrency, getSymbol } = useCurrency();
  
  const formatCurrencyShort = (value) => {
    const symbol = getSymbol();
    if (value >= 1000) return `${symbol}${(value / 1000).toFixed(1)}k`;
    return `${symbol}${value}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-dropdown p-4 rounded-xl shadow-xl z-50">
          <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">{label} 2024</p>
          <div className="space-y-1.5">
            {Array.isArray(payload) && payload.map((entry, index) => {
              if (!entry || typeof entry !== 'object') return null;
              return (
              <div key={index} className="flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                  {entry.name}
                </span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                  {formatCurrency(entry.value, { maximumFractionDigits: 0 })}
                </span>
              </div>
            );
          }).filter(Boolean)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-xl shadow-sm p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Performance Financière</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Revenus vs Dépenses (6 derniers mois)</p>
        </div>
        <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Revenu
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Bénéfice
            </span>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px]" style={{ minHeight: '300px' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
            
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94A3B8', fontSize: 12 }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94A3B8', fontSize: 12 }} 
              tickFormatter={formatCurrencyShort} 
            />
            
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            
            {/* Barres pour les revenus */}
            <Bar 
              dataKey="revenue" 
              name="Revenus" 
              fill="#3B82F6" 
              radius={[4, 4, 0, 0]} 
              barSize={20} 
            />
            
            {/* Ligne/Area pour le bénéfice */}
            <Area 
              type="monotone" 
              dataKey="profit" 
              name="Bénéfice Net" 
              stroke="#10B981" 
              strokeWidth={3}
              fill="url(#colorProfit)" 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;