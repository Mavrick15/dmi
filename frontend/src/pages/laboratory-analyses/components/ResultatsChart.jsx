import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Icon from '../../../components/AppIcon';
import { formatDateInBusinessTimezone } from '../../../utils/dateTime';

const ResultatsChart = ({ resultats, historique = [] }) => {
  // Préparer les données pour le graphique de tendance
  const chartData = useMemo(() => {
    if (!historique || historique.length === 0) return [];

    // Grouper par paramètre et date
    const grouped = {};
    historique.forEach(item => {
      item.resultats?.forEach(r => {
        const key = `${r.parametre}_${item.date}`;
        if (!grouped[r.parametre]) {
          grouped[r.parametre] = [];
        }
        grouped[r.parametre].push({
          date: formatDateInBusinessTimezone(item.date),
          valeur: parseFloat(r.valeur) || 0,
          min: r.valeurNormaleMin,
          max: r.valeurNormaleMax
        });
      });
    });

    return grouped;
  }, [historique]);

  // Statistiques des résultats actuels
  const stats = useMemo(() => {
    if (!resultats || resultats.length === 0) return null;

    const total = resultats.length;
    const normaux = resultats.filter(r => r.interpretation === 'normal').length;
    const anormaux = resultats.filter(r => r.interpretation !== 'normal').length;
    const critiques = resultats.filter(r => r.interpretation === 'critique').length;

    return {
      total,
      normaux,
      anormaux,
      critiques,
      tauxNormal: total > 0 ? ((normaux / total) * 100).toFixed(1) : 0
    };
  }, [resultats]);

  // Données pour le graphique en barres (interprétation)
  const interpretationData = useMemo(() => {
    if (!resultats || resultats.length === 0) return [];

    const counts = {
      normal: 0,
      anormal_bas: 0,
      anormal_haut: 0,
      critique: 0
    };

    resultats.forEach(r => {
      if (counts[r.interpretation] !== undefined) {
        counts[r.interpretation]++;
      }
    });

    return [
      { name: 'Normal', value: counts.normal, color: '#10b981' },
      { name: 'Bas', value: counts.anormal_bas, color: '#f59e0b' },
      { name: 'Haut', value: counts.anormal_haut, color: '#f59e0b' },
      { name: 'Critique', value: counts.critique, color: '#ef4444' }
    ].filter(item => item.value > 0);
  }, [resultats]);

  if (!resultats || resultats.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-4 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-xl glass-surface flex items-center justify-center">
          <Icon name="BarChart3" size={28} className="text-slate-500 dark:text-slate-400" />
        </div>
        <p className="font-medium text-slate-700 dark:text-slate-300">Aucun résultat disponible</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Les graphiques s'afficheront une fois des résultats enregistrés.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/20 text-blue-600 dark:text-blue-400">
                <Icon name="TestTube" size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Normaux</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{stats.normaux}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Icon name="CheckCircle" size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Anormaux</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{stats.anormaux}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Icon name="AlertTriangle" size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4 border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Critiques</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{stats.critiques}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-rose-500/20 text-rose-600 dark:text-rose-400">
                <Icon name="AlertCircle" size={20} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Graphique en barres - Interprétation */}
      {interpretationData.length > 0 && (
        <div className="glass-panel rounded-xl p-4">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Icon name="BarChart3" size={18} className="text-primary" />
            Répartition des interprétations
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={interpretationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-30" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px'
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[8, 8, 0, 0]}
                shape={(props) => {
                  const { x, y, width, height, payload } = props;
                  const color = interpretationData.find(d => d.name === payload.name)?.color || '#3b82f6';
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={color}
                      rx={8}
                    />
                  );
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Graphiques de tendance par paramètre */}
      {Object.keys(chartData).length > 0 && (
        <div className="space-y-6">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Icon name="TrendingUp" size={18} className="text-primary" />
            Évolution dans le temps
          </h4>
          {Object.entries(chartData).map(([parametre, data]) => (
            <div
              key={parametre}
              className="glass-panel rounded-xl p-6"
            >
              <h5 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                {parametre}
              </h5>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-30" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #fff)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="valeur"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  {data[0]?.min !== undefined && data[0]?.max !== undefined && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="min"
                        stroke="#10b981"
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="max"
                        stroke="#10b981"
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultatsChart;

