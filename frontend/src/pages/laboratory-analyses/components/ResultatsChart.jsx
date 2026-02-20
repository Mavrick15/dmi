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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-start gap-3 border-l-4 border-l-blue-500">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Icon name="TestTube" size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
          </div>

          <div className="rounded-xl p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-start gap-3 border-l-4 border-l-emerald-500">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <Icon name="CheckCircle" size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Normaux</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.normaux}</p>
            </div>
          </div>

          <div className="rounded-xl p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-start gap-3 border-l-4 border-l-amber-500">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <Icon name="AlertTriangle" size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Anormaux</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.anormaux}</p>
            </div>
          </div>

          <div className="rounded-xl p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-start gap-3 border-l-4 border-l-rose-500">
            <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
              <Icon name="AlertCircle" size={18} className="text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Critiques</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.critiques}</p>
            </div>
          </div>
        </div>
      )}

      {/* Graphique en barres - Interprétation */}
      {interpretationData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
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
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6"
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

