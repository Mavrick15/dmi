import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import Icon from '../../../components/AppIcon';
import { useCurrency } from '../../../contexts/CurrencyContext';

const RevenueChart = ({ data = [], title = "Revenus mensuels" }) => {
  const { formatCurrency, getSymbol } = useCurrency();

  // Calcul des statistiques
  const stats = useMemo(() => {
    const dataArray = Array.isArray(data) ? data : [];
    if (!dataArray || dataArray.length === 0) return null;
    
    const revenues = dataArray.map(d => {
      if (!d || typeof d !== 'object') return 0;
      return d.revenue || 0;
    });
    const total = revenues.reduce((sum, val) => sum + val, 0);
    const average = total / revenues.length;
    const max = Math.max(...revenues);
    const min = Math.min(...revenues);
    const lastMonth = revenues[revenues.length - 1];
    const previousMonth = revenues[revenues.length - 2] || 0;
    const growth = previousMonth > 0 ? ((lastMonth - previousMonth) / previousMonth) * 100 : 0;
    
    return { total, average, max, min, growth, lastMonth };
  }, [data]);

  const dataArray = Array.isArray(data) ? data : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const dataArray = Array.isArray(data) ? data : [];
      const index = dataArray.findIndex(d => d && d.month === label);
      const previousValue = index > 0 && dataArray[index - 1] ? dataArray[index - 1].revenue : null;
      const change = previousValue ? ((value - previousValue) / previousValue) * 100 : null;
      
      return (
        <div className="glass-dropdown p-4 rounded-xl shadow-xl">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
            {label}
          </p>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              {formatCurrency(value)}
            </p>
            {change !== null && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                change >= 0 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
              }`}>
                {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
              </span>
            )}
          </div>
          {previousValue && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Précédent: {formatCurrency(previousValue)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Couleurs dynamiques selon la valeur
  const getBarColor = (value, max) => {
    const ratio = value / max;
    if (ratio >= 0.8) return '#3B82F6'; // Bleu vif pour les valeurs élevées
    if (ratio >= 0.5) return '#60A5FA'; // Bleu moyen
    return '#93C5FD'; // Bleu clair
  };

  if (!dataArray || dataArray.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center rounded-xl border border-white/20 dark:border-white/10 glass-surface p-8">
        <div className="w-14 h-14 rounded-xl glass-surface flex items-center justify-center mb-3">
          <Icon name="BarChart3" size={28} className="text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Aucune donnée financière</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Les revenus apparaîtront ici une fois disponibles.</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...dataArray.map(d => {
    if (!d || typeof d !== 'object') return 0;
    return d.revenue || 0;
  }));

  return (
    <div className="h-full flex flex-col">
      {/* Statistiques en haut */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-white/20 dark:border-white/10">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {formatCurrency(stats.total)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Moyenne</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {formatCurrency(stats.average)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Évolution</p>
            <div className="flex items-center gap-1">
              <span className={`text-lg font-bold ${
                stats.growth >= 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {stats.growth >= 0 ? '↑' : '↓'} {Math.abs(stats.growth).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Graphique */}
      <div className="flex-1 w-full min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={dataArray} 
            margin={{ top: 20, right: 20, left: -10, bottom: 10 }}
          >
            <defs>
              {/* Gradient principal */}
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={1}/>
                <stop offset="50%" stopColor="#60A5FA" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#93C5FD" stopOpacity={0.4}/>
              </linearGradient>
              
              {/* Gradient pour les valeurs élevées */}
              <linearGradient id="colorRevenueHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={1}/>
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.6}/>
              </linearGradient>
              
              {/* Ombre pour effet de profondeur */}
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
              </filter>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="rgba(148, 163, 184, 0.2)" 
              strokeOpacity={0.5}
            />
            
            {/* Ligne de moyenne */}
            {stats && (
              <ReferenceLine 
                y={stats.average} 
                stroke="#94A3B8" 
                strokeDasharray="5 5" 
                strokeOpacity={0.5}
                label={{ 
                  value: `Moyenne: ${formatCurrency(stats.average)}`, 
                  position: "right",
                  fill: '#94A3B8',
                  fontSize: 11
                }}
              />
            )}
            
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fill: '#64748B', 
                fontSize: 12,
                fontWeight: 500
              }} 
              dy={10}
              className="text-slate-600 dark:text-slate-400"
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fill: '#64748B', 
                fontSize: 11,
                fontWeight: 500
              }}
              tickFormatter={(value) => {
                const symbol = getSymbol();
                if (value >= 1000000) return `${symbol}${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${symbol}${(value / 1000).toFixed(0)}k`;
                return `${symbol}${value}`;
              }}
              className="text-slate-600 dark:text-slate-400"
            />
            
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ 
                fill: 'rgba(59, 130, 246, 0.1)',
                stroke: '#3B82F6',
                strokeWidth: 1,
                strokeDasharray: '5 5'
              }} 
            />
            
            <Bar 
              dataKey="revenue" 
              radius={[8, 8, 0, 0]} 
              barSize={40}
              animationDuration={1000}
            >
              {dataArray.map((entry, index) => {
                if (!entry || typeof entry !== 'object') return null;
                const isHigh = entry.revenue >= maxRevenue * 0.8;
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={isHigh ? "url(#colorRevenueHigh)" : "url(#colorRevenue)"}
                    style={{ filter: 'url(#shadow)' }}
                  />
                );
              }).filter(Boolean)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;