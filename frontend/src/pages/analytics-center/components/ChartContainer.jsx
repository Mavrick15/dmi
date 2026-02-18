import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import Icon from '../../../components/AppIcon';
import { useCurrency } from '../../../contexts/CurrencyContext';

const ChartContainer = ({
  title,
  type = "bar",
  data = [],
  dataKey,
  xAxisKey = "name",
  height = 300,
  colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
  className = "",
  loading = false, // <-- PROP AJOUTÉE
}) => {
  const { formatCurrency } = useCurrency();
  
  // Tooltip personnalisé enrichi pour les départements (Mode Clair/Sombre)
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && Array.isArray(payload) && payload.length > 0 && payload[0]) {
      const data = payload[0]?.payload;
      const hasExtendedData = data && (data.tooltipData || data.percentage !== undefined);
      
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-xl transition-colors duration-300 min-w-[200px]">
          <p className="text-sm font-bold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
            {label || payload[0].name}
          </p>
          
          {payload.map((entry, index) => {
            if (!entry || typeof entry !== 'object') return null;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: entry.color || entry.payload?.fill || colors[0] }}
                  />
                  <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                    {typeof entry.value === 'number' ? entry.value.toLocaleString() : String(entry.value || 0)} consultations
                  </p>
                </div>
                
                {/* Métriques supplémentaires pour les départements */}
                {hasExtendedData && data && (
                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700 space-y-1.5">
                    {data.percentage !== undefined && typeof data.percentage === 'number' && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Part de marché:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{data.percentage}%</span>
                      </div>
                    )}
                    {data.doctorsCount !== undefined && typeof data.doctorsCount === 'number' && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Médecins:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{data.doctorsCount}</span>
                      </div>
                    )}
                    {data.revenue !== undefined && typeof data.revenue === 'number' && data.revenue > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Revenus:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency ? formatCurrency(data.revenue, { maximumFractionDigits: 0 }) : data.revenue.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {data.patients !== undefined && typeof data.patients === 'number' && data.patients > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Patients:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{data.patients}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Props communes pour le style des axes
  const commonAxisProps = {
    axisLine: false,
    tickLine: false,
    tick: { fill: '#94A3B8', fontSize: 12, fontWeight: 500 },
    dy: 10
  };

  const commonGridProps = {
    strokeDasharray: "3 3",
    vertical: false,
    stroke: "rgba(148, 163, 184, 0.2)"
  };

  const renderChart = () => {
    if (type === "line") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis dataKey={xAxisKey} {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(148, 163, 184, 0.4)', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              strokeWidth={3}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (type === "pie") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60} // Style Donut plus moderne
              outerRadius={80}
              paddingAngle={5}
              dataKey={dataKey}
              stroke="none"
            >
              {Array.isArray(data) && data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill || colors[index % colors.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              formatter={(value) => {
                if (!value || !Array.isArray(data)) {
                  return <span className="text-slate-600 dark:text-slate-400 text-xs font-medium ml-1">{value || ''}</span>;
                }
                const entry = data.find(d => d && d.name === value);
                const percentage = entry?.percentage;
                return (
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-medium ml-1">
                    {value || ''}
                    {percentage !== undefined && typeof percentage === 'number' && percentage > 0 && (
                      <span className="text-slate-400 dark:text-slate-500 ml-1">({percentage}%)</span>
                    )}
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    // Bar Chart par défaut
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis dataKey={xAxisKey} {...commonAxisProps} />
          <YAxis {...commonAxisProps} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
          <Bar 
            dataKey={dataKey} 
            fill={colors[0]} 
            radius={[6, 6, 0, 0]} 
            barSize={32}
            animationDuration={1000}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // État vide si pas de données OU si en chargement
  if (!Array.isArray(data) || data.length === 0 || loading) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm ${className}`}>
         <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{title}</h3>
         <div className={`flex flex-col items-center justify-center h-[200px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 ${loading ? 'border-l-4 border-l-primary' : ''}`}>
             {loading ? (
                  <div className='flex flex-col items-center'>
                     <Icon name="Loader2" size={32} className="animate-spin text-primary mb-2" />
                     <p className="text-slate-500 dark:text-slate-400 text-sm">Chargement…</p>
                  </div>
             ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Aucune donnée disponible</p>
             )}
         </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm transition-colors duration-300 ${className}`}>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{title}</h3>
      <div className="w-full" style={{ height: `${height}px` }} aria-label={`${title} Chart`}>
        {renderChart()}
      </div>
    </div>
  );
};

export default ChartContainer;
