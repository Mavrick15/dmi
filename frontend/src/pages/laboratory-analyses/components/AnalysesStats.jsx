import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';

const AnalysesStats = ({ stats }) => {
  if (!stats) return null;

  const statCards = [
    {
      id: 'total',
      title: 'Total analyses',
      value: stats.total || 0,
      icon: 'TestTube',
      color: 'from-blue-500 to-blue-600',
      trend: null
    },
    {
      id: 'prescrite',
      title: 'Prescrites',
      value: stats.parStatut?.find(s => s.statut === 'prescrite')?.count || 0,
      icon: 'FileText',
      color: 'from-indigo-500 to-indigo-600',
      trend: null
    },
    {
      id: 'terminee',
      title: 'Terminées',
      value: stats.parStatut?.find(s => s.statut === 'terminee')?.count || 0,
      icon: 'CheckCircle',
      color: 'from-emerald-500 to-emerald-600',
      trend: null
    },
    {
      id: 'en_cours',
      title: 'En cours',
      value: stats.parStatut?.find(s => s.statut === 'en_cours')?.count || 0,
      icon: 'Clock',
      color: 'from-amber-500 to-amber-600',
      trend: null
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, idx) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200/50 dark:border-slate-800/50 group"
        >
          {/* Gradient background effect */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
          
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-full opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex-1 z-10">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                {card.title}
              </p>
              <p className="text-4xl font-black text-slate-900 dark:text-white mb-2 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                {card.value.toLocaleString('fr-FR')}
              </p>
              {card.trend !== null && (
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${card.trend >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                  <span>{card.trend >= 0 ? '↑' : '↓'}</span>
                  <span>{Math.abs(card.trend)}%</span>
                </div>
              )}
            </div>
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className={`relative w-16 h-16 bg-gradient-to-br ${card.color} rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 z-10`}
            >
              <div className="absolute inset-0 bg-white/20 rounded-2xl"></div>
              <Icon name={card.icon} size={32} className="text-white relative z-10" />
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default React.memo(AnalysesStats);

