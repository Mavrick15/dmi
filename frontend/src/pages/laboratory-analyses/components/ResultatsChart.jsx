import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Badge from '../../../components/ui/Badge';

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
          date: new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
        <Icon name="BarChart3" size={48} className="mx-auto text-slate-400 mb-4" />
        <p className="text-slate-600 dark:text-slate-400">
          Aucun résultat disponible pour afficher les graphiques
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon name="TestTube" size={18} className="text-blue-600 dark:text-blue-400" />
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Total</p>
            </div>
            <p className="text-2xl font-black text-blue-900 dark:text-blue-100">{stats.total}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon name="CheckCircle" size={18} className="text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Normaux</p>
            </div>
            <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100">{stats.normaux}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 rounded-xl p-4 border border-amber-200 dark:border-amber-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon name="AlertTriangle" size={18} className="text-amber-600 dark:text-amber-400" />
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">Anormaux</p>
            </div>
            <p className="text-2xl font-black text-amber-900 dark:text-amber-100">{stats.anormaux}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-900/10 rounded-xl p-4 border border-rose-200 dark:border-rose-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon name="AlertCircle" size={18} className="text-rose-600 dark:text-rose-400" />
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">Critiques</p>
            </div>
            <p className="text-2xl font-black text-rose-900 dark:text-rose-100">{stats.critiques}</p>
          </motion.div>
        </div>
      )}

      {/* Graphique en barres - Interprétation */}
      {interpretationData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
        >
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Icon name="BarChart3" size={18} className="text-primary" />
            Répartition des interprétations
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={interpretationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
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
        </motion.div>
      )}

      {/* Graphiques de tendance par paramètre */}
      {Object.keys(chartData).length > 0 && (
        <div className="space-y-6">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Icon name="TrendingUp" size={18} className="text-primary" />
            Évolution dans le temps
          </h4>
          {Object.entries(chartData).map(([parametre, data], idx) => (
            <motion.div
              key={parametre}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
            >
              <h5 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                {parametre}
              </h5>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
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
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultatsChart;

