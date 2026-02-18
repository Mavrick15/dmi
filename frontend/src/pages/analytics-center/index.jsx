import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Icon from '../../components/AppIcon';
import { useCurrency } from '../../contexts/CurrencyContext';
import Button from '../../components/ui/Button';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import Header from '../../components/ui/Header';
import MetricCard from './components/MetricCard';
import ChartContainer from './components/ChartContainer';
import FilterPanel from './components/FilterPanel';
import PerformanceIndicator from './components/PerformanceIndicator';
import { useDashboardData } from '../../hooks/useDashboard';
import { useStatsOverview, useStatsPeriod, useTopDoctors, useRevenueStats, useDepartmentStats } from '../../hooks/useAnalytics';
import { useExportMutations } from '../../hooks/useExport';
import { useToast } from '../../contexts/ToastContext';
import { getApiParamsFromFilters } from '../../utils/analyticsFilters';
import { aggregateDepartmentData } from '../../utils/departmentDataTransformer';

const AnalyticsCenter = () => {
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState('overview');
  const [filtersCollapsed, setFiltersCollapsed] = useState(false); 
  const [filters, setFilters] = useState({
    dateRange: 'last30days',
    department: 'all',
    provider: 'all',
    customStartDate: '',
    customEndDate: ''
  });
  
  const { showToast } = useToast();
  const { formatCurrency, getSymbol } = useCurrency();
  
  // Paramètres API basés sur les filtres (mémorisé pour éviter les recalculs)
  const apiParams = useMemo(() => getApiParamsFromFilters(filters), [filters]);
  
  // Hooks de données avec paramètres de filtres
  const { data: dashboardData, isLoading: isLoadingDashboard } = useDashboardData();
  const { data: statsOverview, isLoading: isLoadingStats } = useStatsOverview(apiParams);
  const { data: topDoctors, isLoading: isLoadingTopDoctors } = useTopDoctors(apiParams);
  const { data: revenueStats, isLoading: isLoadingRevenue } = useRevenueStats(apiParams);
  const { data: departmentStats, isLoading: isLoadingDepartments } = useDepartmentStats(apiParams);
  
  // Paramètres pour useStatsPeriod
  const periodParams = useMemo(() => {
    if (!apiParams || !apiParams.start || !apiParams.end) return null;
    return {
      start: apiParams.start,
      end: apiParams.end,
      type: 'daily'
    };
  }, [apiParams]);
  
  const { data: periodStats, isLoading: isLoadingPeriod } = useStatsPeriod(periodParams);
  const { exportPatients, exportConsultations, exportInvoices } = useExportMutations();
  
  const isLoading = isLoadingDashboard || isLoadingStats || isLoadingTopDoctors || isLoadingRevenue || isLoadingDepartments || isLoadingPeriod;

  // Handler pour les changements de filtres
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };


  // --- CONFIGURATION ANIMATION ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.06, when: "beforeChildren" } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 10, opacity: 0, scale: 0.98 },
    visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.19, 1, 0.22, 1] } }
  };
  
  // Animation pour le contenu des onglets - améliorée pour plus de fluidité
  const contentVariants = {
    hidden: { 
      opacity: 0, 
      y: 20, 
      scale: 0.98,
      filter: 'blur(4px)'
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      filter: 'blur(0px)',
      transition: { 
        duration: 0.5, 
        ease: [0.19, 1, 0.22, 1],
        staggerChildren: 0.08,
        when: "beforeChildren"
      } 
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.98,
      filter: 'blur(4px)',
      transition: { 
        duration: 0.3, 
        ease: [0.4, 0, 0.2, 1]
      } 
    }
  };

  const smoothTransition = { duration: 0.5, ease: [0.19, 1, 0.22, 1] };

  const handleExportData = async (type = 'patients') => {
    try {
      if (type === 'patients') {
        await exportPatients.mutateAsync({});
      } else if (type === 'consultations') {
        await exportConsultations.mutateAsync({});
      } else if (type === 'invoices') {
        await exportInvoices.mutateAsync({});
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors de l\'export:', error);
      }
      showToast('Erreur lors de l\'export', 'error');
    }
  };

  // Données dynamiques depuis les hooks (uniquement depuis le backend)
  const overviewMetrics = useMemo(() => {
    if (!statsOverview || typeof statsOverview !== 'object') return [];
    
    // Structure du backend: statsOverview.patients.total, statsOverview.consultations.thisMonth, etc.
    const patientsTotal = typeof statsOverview.patients?.total === 'number' ? statsOverview.patients.total : 0;
    const consultationsThisMonth = typeof statsOverview.consultations?.thisMonth === 'number' ? statsOverview.consultations.thisMonth : 0;
    const revenueThisMonth = typeof statsOverview.revenue?.thisMonth === 'number' ? statsOverview.revenue.thisMonth : 0;
    const totalMedications = typeof statsOverview.pharmacy?.totalMedications === 'number' ? statsOverview.pharmacy.totalMedications : 0;
    const lowStock = typeof statsOverview.pharmacy?.lowStock === 'number' ? statsOverview.pharmacy.lowStock : 0;
    
    return [
    { 
      title: "Patients totaux", 
      value: patientsTotal.toLocaleString(), 
      change: statsOverview.patientsGrowth ? `+${statsOverview.patientsGrowth}%` : "+0%", 
      changeType: "positive", 
      icon: "Users", 
      color: "primary" 
    },
    { 
      title: "Consultations", 
      value: consultationsThisMonth.toLocaleString(), 
      change: statsOverview.consultationsGrowth ? `+${statsOverview.consultationsGrowth}%` : "+0%", 
      changeType: "positive", 
      icon: "Calendar", 
      color: "warning" 
    },
    { 
      title: "Revenus", 
      value: formatCurrency && typeof revenueThisMonth === 'number' ? formatCurrency(revenueThisMonth, { maximumFractionDigits: 0 }) : revenueThisMonth.toLocaleString(), 
      change: statsOverview.revenueGrowth ? `+${statsOverview.revenueGrowth}%` : "+0%", 
      changeType: "positive", 
      icon: "DollarSign", 
      color: "success" 
    },
    { 
        title: "Médicaments", 
        value: totalMedications.toLocaleString(), 
        change: lowStock > 0 ? `${lowStock} en alerte` : "0", 
        changeType: lowStock > 0 ? "negative" : "positive", 
        icon: "Package", 
        color: lowStock > 0 ? "error" : "success" 
      }
    ];
  }, [statsOverview, formatCurrency]);

  // Données de volume de patients (uniquement depuis le backend)
  // Utiliser useStatsPeriod pour obtenir les données hebdomadaires
  // Le backend attend 'start' et 'end', pas 'startDate' et 'endDate'
  const patientVolumeData = useMemo(() => {
    if (!Array.isArray(periodStats) || periodStats.length === 0) return [];
    
    // Transformer les données du backend en format pour le graphique
    // Le backend retourne: { period: 'YYYY-MM-DD', consultations: number, unique_patients: number }
    return periodStats.slice(-7).map((stat, idx) => {
      try {
        const date = stat.period ? new Date(stat.period) : new Date();
        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const dayIndex = !isNaN(date.getTime()) ? date.getDay() : idx % 7;
        return {
          name: dayNames[dayIndex] || `J${idx + 1}`,
          consultations: parseInt(stat.consultations) || 0
        };
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erreur parsing date dans patientVolumeData:', stat, e);
        }
        return {
          name: `J${idx + 1}`,
          consultations: parseInt(stat.consultations) || 0
        };
      }
    });
  }, [periodStats]);

  // Données par département (uniquement depuis le backend)
  const departmentData = useMemo(() => {
    // Si on a des statistiques dédiées par département, les utiliser
    if (Array.isArray(departmentStats) && departmentStats.length > 0) {
      return departmentStats.map((dept, idx) => ({
        name: dept.name || dept.department || `Dépt ${idx + 1}`,
        value: dept.consultations || dept.value || 0,
        fill: dept.fill || dept.color || '#3B82F6',
        percentage: dept.percentage || 0,
        revenue: dept.revenue || 0,
        patients: dept.patients || 0,
        doctorsCount: dept.doctorsCount || 0,
        tooltipData: dept.tooltipData || {}
      }));
    }
    
    // Sinon, agréger depuis topDoctors (données du backend)
    if (Array.isArray(topDoctors) && topDoctors.length > 0) {
      const aggregated = aggregateDepartmentData(topDoctors);
      // Limiter aux 10 premiers départements les plus actifs
      return Array.isArray(aggregated) ? aggregated.slice(0, 10) : [];
    }
    
    // Retourner un tableau vide si aucune donnée disponible (pas de données par défaut)
    return [];
  }, [topDoctors, departmentStats]);

  // Indicateurs de performance (uniquement depuis le backend)
  const performanceIndicators = useMemo(() => {
    if (!statsOverview || typeof statsOverview !== 'object') return [];
    
    // Calculer les indicateurs depuis les données réelles du backend
    const consultationsThisMonth = typeof statsOverview.consultations?.thisMonth === 'number' ? statsOverview.consultations.thisMonth : 0;
    const daysInMonth = new Date().getDate();
    const dailyConsultations = daysInMonth > 0 ? Math.round(consultationsThisMonth / daysInMonth) : 0;
    const upcomingAppointments = typeof statsOverview.appointments?.upcoming === 'number' ? statsOverview.appointments.upcoming : 0;
    
    return [
      { 
        title:"Consultations ce mois", 
        current: consultationsThisMonth, 
        target: 100, // Objectif par défaut, peut être configuré
        unit:"", 
        trend: consultationsThisMonth > 100 ? "up" : "down", 
        benchmark: 80
    },
    { 
      title:"Consultations/Jr", 
        current: dailyConsultations, 
        target: 25, 
        unit:"", 
        trend: dailyConsultations > 25 ? "up" : "down", 
        benchmark: 22
      },
      { 
        title:"Rendez-vous à venir", 
        current: upcomingAppointments, 
        target: 50, 
      unit:"", 
        trend: upcomingAppointments > 50 ? "up" : "down", 
        benchmark: 40
    }
  ];
  }, [statsOverview]);

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: 'LayoutDashboard' },
    { id: 'financial', label: 'Finance', icon: 'DollarSign' },
    { id: 'clinical', label: 'Clinique', icon: 'Activity' },
    { id: 'operational', label: 'Opérations', icon: 'Settings' },
    { id: 'reports', label: 'Rapports', icon: 'FileText' }
  ];

  const renderTabContent = () => {
    if (isLoading) {
        return (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-primary shadow-sm"
          >
                <Icon name="Loader2" size={48} className="animate-spin text-primary mb-4" />
                <p className="text-sm font-medium">Chargement des données analytiques…</p>
          </motion.div>
        );
    }
      
    switch(activeTab){
      case 'overview':
        return (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.isArray(overviewMetrics) && overviewMetrics.map((m,i)=>(
                <motion.div key={i} variants={itemVariants}>
                  <MetricCard {...m} />
                </motion.div>
              ))}
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <motion.div variants={itemVariants} className="lg:col-span-2">
                 <ChartContainer 
                   title="Volume de consultations (7 derniers jours)" 
                   type="bar" 
                   data={patientVolumeData} 
                   dataKey="consultations" 
                   height={320}
                   loading={isLoading}
                 />
              </motion.div>
              <motion.div variants={itemVariants}>
                 <ChartContainer 
                   title="Par Département" 
                   type="pie" 
                   data={departmentData} 
                   dataKey="value" 
                   height={320}
                   loading={isLoadingTopDoctors || isLoadingDepartments}
                 />
              </motion.div>
            </div>

            {/* Performance Indicators */}
            {Array.isArray(performanceIndicators) && performanceIndicators.length > 0 ? (
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {performanceIndicators.map((p,i)=>(<PerformanceIndicator key={i} {...p} />))}
            </motion.div>
            ) : (
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                    <div className="animate-pulse">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-4"></div>
                      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                    </div>
                  </div>
                ))}
          </motion.div>
            )}
          </div>
        );
      case 'financial':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Évolution des revenus</h3>
                {isLoadingRevenue ? (
                  <div className="flex flex-col items-center justify-center h-[400px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 border-l-4 border-l-primary">
                    <Icon name="Loader2" size={32} className="animate-spin text-primary mb-2" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Chargement…</p>
                  </div>
                ) : !Array.isArray(revenueStats) || revenueStats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Aucune donnée disponible</p>
                  </div>
                ) : (
                  <div className="w-full" style={{ minHeight: '400px' }}>
                  <ResponsiveContainer width="100%" height={400} minHeight={400}>
                    <LineChart 
                      data={Array.isArray(revenueStats) ? revenueStats.map(r => {
                        if (!r || typeof r !== 'object') {
                          return { period: '', revenus: 0, paye: 0, enAttente: 0 };
                        }
                        // Gérer différents formats de données du backend
                        const period = r.period || r.name || r.date || r.month || '';
                        const revenus = parseFloat(r.totalRevenue || r.revenus || r.revenue || r.total || 0);
                        const paye = parseFloat(r.paidAmount || r.paye || r.paid || 0);
                        const enAttente = parseFloat(r.pendingAmount || r.enAttente || r.pending || 0);
                        
                        return {
                          period: period,
                          revenus: isNaN(revenus) ? 0 : revenus,
                          paye: isNaN(paye) ? 0 : paye,
                          enAttente: isNaN(enAttente) ? 0 : enAttente
                        };
                      }) : []} 
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                      <XAxis 
                        dataKey="period" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 500 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 500 }}
                        tickFormatter={(value) => `${getSymbol()}${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && Array.isArray(payload) && payload.length > 0) {
                            return (
                              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl shadow-xl">
                                <p className="text-sm font-bold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                                  {label || ''}
                                </p>
                                {payload.map((entry, index) => {
                                  if (!entry || typeof entry !== 'object') return null;
                                  return (
                                    <div key={index} className="flex items-center gap-2 mb-2">
                                      <span 
                                        className="w-3 h-3 rounded-full flex-shrink-0" 
                                        style={{ backgroundColor: entry.color || '#3B82F6' }}
                                      />
                                      <span className="text-sm text-slate-600 dark:text-slate-300">
                                        {entry.name === 'revenus' ? 'Revenus totaux' : 
                                         entry.name === 'paye' ? 'Payé' : 
                                         entry.name === 'enAttente' ? 'En attente' : entry.name || 'Valeur'}:
                                      </span>
                                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                                        {formatCurrency && typeof entry.value === 'number' ? formatCurrency(entry.value) : (typeof entry.value === 'number' ? entry.value.toLocaleString() : String(entry.value || 0))}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }
                          return null;
                        }}
                        cursor={{ stroke: 'rgba(148, 163, 184, 0.4)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={36}
                        iconType="line"
                        formatter={(value) => {
                          const labels = {
                            'revenus': 'Revenus totaux',
                            'paye': 'Payé',
                            'enAttente': 'En attente'
                          };
                          return <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">{labels[value] || value}</span>;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenus"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        name="revenus"
                        animationDuration={1500}
                      />
                      <Line
                        type="monotone"
                        dataKey="paye"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 4, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        name="paye"
                        animationDuration={1500}
                      />
                      <Line
                        type="monotone"
                        dataKey="enAttente"
                        stroke="#F59E0B"
                        strokeWidth={3}
                        dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        name="enAttente"
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'clinical':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartContainer 
                title="Top Médecins (Consultations)" 
                type="bar" 
                data={Array.isArray(topDoctors) ? topDoctors.slice(0, 5).map(doc => {
                  if (!doc || typeof doc !== 'object') {
                    return { name: 'Médecin', consultations: 0 };
                  }
                  return {
                    name: doc.name || doc.nomComplet || 'Médecin',
                    consultations: parseInt(doc.consultations_count || doc.consultationsCount || 0)
                  };
                }) : []} 
                dataKey="consultations" 
                height={300}
                loading={isLoadingTopDoctors}
              />
              <ChartContainer 
                title="Répartition par Spécialité" 
                type="pie" 
                data={departmentData} 
                dataKey="value" 
                height={300}
              />
            </div>
          </div>
        );
      case 'operational':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.isArray(performanceIndicators) && performanceIndicators.map((p,i)=>(<PerformanceIndicator key={i} {...p} />))}
            </div>
            <ChartContainer 
              title="Volume Hebdomadaire" 
              type="bar" 
              data={patientVolumeData} 
              dataKey="consultations" 
              height={320}
            />
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PermissionGuard requiredPermission="audit_view">
                <button 
                  onClick={() => handleExportData('patients')}
                  disabled={!hasPermission('audit_view')}
                  className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name="Users" size={32} className="text-primary mb-3" />
                  <h3 className="font-bold text-slate-900 dark:text-white mb-1">Export Patients</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Télécharger la liste complète des patients</p>
                </button>
              </PermissionGuard>
              <PermissionGuard requiredPermission="audit_view">
                <button 
                  onClick={() => handleExportData('consultations')}
                  disabled={!hasPermission('audit_view')}
                  className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name="FileText" size={32} className="text-primary mb-3" />
                  <h3 className="font-bold text-slate-900 dark:text-white mb-1">Export Consultations</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Télécharger l'historique des consultations</p>
                </button>
              </PermissionGuard>
              <PermissionGuard requiredPermission="audit_view">
                <button 
                  onClick={() => handleExportData('invoices')}
                  disabled={!hasPermission('audit_view')}
                  className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name="DollarSign" size={32} className="text-primary mb-3" />
                  <h3 className="font-bold text-slate-900 dark:text-white mb-1">Export Factures</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Télécharger les données financières</p>
                </button>
              </PermissionGuard>
            </div>
          </div>
        );
      default:
        return (
          <motion.div 
            variants={contentVariants} initial="hidden" animate="visible" exit="exit"
            className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
               <Icon name="BarChart3" size={32} className="text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Contenu de l'onglet '{Array.isArray(tabs) ? tabs.find(t => t.id === activeTab)?.label : ''}'</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              Le contenu détaillé pour cet onglet est en cours de développement.
            </p>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <Header />
      
      <main className="pt-24 w-full max-w-[1600px] mx-auto px-6 lg:px-8 pb-12">
        {/* En-tête Page */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center text-primary dark:text-blue-400 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <Icon name="BarChart3" size={24} />
            </motion.div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                Centre Analytique
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
                Analyses approfondies et insights métier
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <Button variant="outline" onClick={()=>setFiltersCollapsed(!filtersCollapsed)} iconName="Filter" className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Filtres</Button>
             <PermissionGuard requiredPermission="audit_view">
               <div className="relative">
                 <Button variant="default" onClick={() => handleExportData('patients')} iconName="Download" className="shadow-lg shadow-primary/20" disabled={exportPatients.isPending || !hasPermission('audit_view')}>
                   {exportPatients.isPending ? 'Export...' : 'Exporter'}
                 </Button>
               </div>
             </PermissionGuard>
          </div>
        </motion.div>

        {/* Layout Principal */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Panneau Latéral (Filtres) */}
            <AnimatePresence>
                {!filtersCollapsed && (
                    <motion.div 
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="hidden lg:block shrink-0 overflow-hidden"
                    >
                        <FilterPanel 
                          onFiltersChange={handleFiltersChange} 
                          isCollapsed={false} 
                          onToggle={()=>setFiltersCollapsed(true)} 
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Contenu Principal */}
            <div className="flex-1 w-full min-w-0">
                {/* Navigation Onglets */}
                <div className="relative flex overflow-x-auto pb-1 mb-6 border-b border-slate-200 dark:border-slate-700 gap-6">
                    <div className="flex space-x-6">
                        {Array.isArray(tabs) && tabs.map(tab => (
                            <motion.button 
                                key={tab.id} 
                                onClick={()=>setActiveTab(tab.id)}
                                whileHover={{ y: -2 }}
                                whileTap={{ y: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className={`
                                    relative flex items-center gap-2 pb-3 text-sm font-medium transition-all duration-300 border-b-2 whitespace-nowrap
                                    ${activeTab === tab.id 
                                        ? 'border-primary text-primary dark:text-blue-400' 
                                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300'}
                                `}
                            >
                                {activeTab === tab.id && (
                                  <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                  />
                                )}
                                <Icon name={tab.icon} size={16} />
                                {tab.label}
                            </motion.button>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={activeTab}
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="w-full"
                    >
                    {renderTabContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-4">
                <span>Dernière synchro: {new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span>
                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                   <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    En ligne
                </span>
            </div>
            <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" className="dark:text-slate-400 dark:hover:bg-slate-800" title="Paramètres">
                  <Icon name="Settings" size={16} />
                </Button>
            </div>
        </div>

      </main>
    </div>
  );
};

export default AnalyticsCenter;