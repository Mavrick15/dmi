import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import Icon from '../../../components/AppIcon';
import Badge from '../../../components/ui/Badge';
import { formatDateInBusinessTimezone, toBusinessDateKey } from '../../../utils/dateTime';

const AnalysesAdvancedStats = ({ analyses, stats }) => {
  // Calculer les statistiques avancées
  const advancedStats = useMemo(() => {
    if (!analyses || analyses.length === 0) return null;

    const total = analyses.length;
    const terminees = analyses.filter(a => a.statut === 'terminee').length;
    const prescrites = analyses.filter(a => a.statut === 'prescrite').length;
    const enCours = analyses.filter(a => a.statut === 'en_cours').length;
    const annulees = analyses.filter(a => a.statut === 'annulee').length;

    // Calculer les délais moyens
    const analysesTerminees = analyses.filter(a => a.statut === 'terminee' && a.datePrescription && a.dateResultat);
    const delais = analysesTerminees.map(a => {
      const presc = new Date(a.datePrescription);
      const result = new Date(a.dateResultat);
      return Math.floor((result - presc) / (1000 * 60 * 60 * 24)); // Délai en jours
    });
    const delaiMoyen = delais.length > 0 
      ? (delais.reduce((a, b) => a + b, 0) / delais.length).toFixed(1)
      : 0;

    // Taux de complétion
    const tauxCompletion = total > 0 ? ((terminees / total) * 100).toFixed(1) : 0;

    // Répartition par type
    const parType = {};
    analyses.forEach(a => {
      const type = a.typeAnalyse || 'autre';
      parType[type] = (parType[type] || 0) + 1;
    });

    // Répartition par priorité
    const parPriorite = {};
    analyses.forEach(a => {
      const priorite = a.priorite || 'normale';
      parPriorite[priorite] = (parPriorite[priorite] || 0) + 1;
    });

    // Évolution temporelle (analyses par jour sur les 30 derniers jours)
    const evolution = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = toBusinessDateKey(date);
      evolution[dateStr] = 0;
    }

    analyses.forEach(a => {
      if (a.datePrescription) {
        const dateStr = toBusinessDateKey(a.datePrescription);
        if (evolution[dateStr] !== undefined) {
          evolution[dateStr]++;
        }
      }
    });

    const evolutionData = Object.entries(evolution).map(([date, count]) => ({
      date: formatDateInBusinessTimezone(date),
      analyses: count
    }));

    return {
      total,
      terminees,
      prescrites,
      enCours,
      annulees,
      delaiMoyen,
      tauxCompletion,
      parType,
      parPriorite,
      evolutionData
    };
  }, [analyses]);

  if (!advancedStats) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Icon name="BarChart3" size={64} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        </motion.div>
        <p className="text-slate-600 dark:text-slate-400 text-lg font-semibold">
          Aucune donnée disponible pour les statistiques
        </p>
      </motion.div>
    );
  }

  // Données pour le graphique en camembert (par type)
  const typeData = Object.entries(advancedStats.parType).map(([type, count]) => ({
    name: type.replace('_', ' ').toUpperCase(),
    value: count
  }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

  // Données pour le graphique en barres (par priorité)
  const prioriteData = [
    { name: 'Normale', value: advancedStats.parPriorite.normale || 0, color: '#3b82f6' },
    { name: 'Urgente', value: advancedStats.parPriorite.urgente || 0, color: '#f59e0b' },
    { name: 'Critique', value: advancedStats.parPriorite.critique || 0, color: '#ef4444' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Métriques clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 md:p-4 border border-indigo-200 dark:border-indigo-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1 md:mb-2">
            <Icon name="TrendingUp" size={16} className="text-indigo-600 dark:text-indigo-400" />
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">Taux</p>
          </div>
          <p className="text-2xl md:text-3xl font-black text-indigo-900 dark:text-indigo-100">{advancedStats.tauxCompletion}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 md:p-4 border border-blue-200 dark:border-blue-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1 md:mb-2">
            <Icon name="Clock" size={16} className="text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Délai</p>
          </div>
          <p className="text-2xl md:text-3xl font-black text-blue-900 dark:text-blue-100">{advancedStats.delaiMoyen}j</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 md:p-4 border border-emerald-200 dark:border-emerald-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1 md:mb-2">
            <Icon name="CheckCircle" size={16} className="text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">OK</p>
          </div>
          <p className="text-2xl md:text-3xl font-black text-emerald-900 dark:text-emerald-100">{advancedStats.terminees}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
          className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 md:p-4 border border-amber-200 dark:border-amber-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1 md:mb-2">
            <Icon name="FileText" size={16} className="text-amber-600 dark:text-amber-400" />
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">Presc</p>
          </div>
          <p className="text-2xl md:text-3xl font-black text-amber-900 dark:text-amber-100">{advancedStats.prescrites}</p>
        </motion.div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Évolution temporelle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-2xl transition-shadow"
        >
          <h4 className="text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 mb-3 md:mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
              <Icon name="TrendingUp" size={16} className="text-primary" />
            </div>
            Évolution (30j)
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={advancedStats.evolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" angle={-45} textAnchor="end" height={60} />
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
                dataKey="analyses"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Répartition par type */}
        {typeData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-2xl transition-shadow"
          >
            <h4 className="text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 mb-3 md:mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Icon name="PieChart" size={16} className="text-purple-600" />
              </div>
              Par type
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Répartition par priorité */}
        {prioriteData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-2xl transition-shadow"
          >
            <h4 className="text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 mb-3 md:mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <Icon name="AlertCircle" size={16} className="text-amber-600" />
              </div>
              Par priorité
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={prioriteData}>
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
                  const color = prioriteData.find(d => d.name === payload.name)?.color || '#3b82f6';
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

        {/* Détails par statut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-2xl transition-shadow"
        >
          <h4 className="text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 mb-3 md:mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <Icon name="Activity" size={16} className="text-emerald-600" />
            </div>
            Par statut
          </h4>
          <div className="space-y-2 md:space-y-3">
            <motion.div 
              whileHover={{ x: 5 }}
              className="flex items-center justify-between p-2 md:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg md:rounded-xl hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Icon name="FileText" size={14} className="text-blue-600" />
                <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Prescrites</span>
              </div>
              <Badge variant="info" size="sm">{advancedStats.prescrites}</Badge>
            </motion.div>
            <motion.div 
              whileHover={{ x: 5 }}
              className="flex items-center justify-between p-2 md:p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg md:rounded-xl hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Icon name="Clock" size={14} className="text-amber-600" />
                <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">En cours</span>
              </div>
              <Badge variant="warning" size="sm">{advancedStats.enCours}</Badge>
            </motion.div>
            <motion.div 
              whileHover={{ x: 5 }}
              className="flex items-center justify-between p-2 md:p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg md:rounded-xl hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Icon name="CheckCircle" size={14} className="text-emerald-600" />
                <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Terminées</span>
              </div>
              <Badge variant="success" size="sm">{advancedStats.terminees}</Badge>
            </motion.div>
            <motion.div 
              whileHover={{ x: 5 }}
              className="flex items-center justify-between p-2 md:p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg md:rounded-xl hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Icon name="X" size={14} className="text-rose-600" />
                <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">Annulées</span>
              </div>
              <Badge variant="error" size="sm">{advancedStats.annulees}</Badge>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalysesAdvancedStats;

