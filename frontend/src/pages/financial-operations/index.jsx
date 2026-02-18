import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../contexts/ToastContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useFinanceOverview, useFinanceChart, useFinanceHistory } from '../../hooks/useFinance';
import { useQueryClient } from '@tanstack/react-query';

// Composants internes
import RevenueOverviewCard from './components/RevenueOverviewCard';
import RecentTransactionsTable from './components/RecentTransactionsTable';
import PaymentMethodsChart from './components/PaymentMethodsChart';
import OutstandingInvoicesCard from './components/OutstandingInvoicesCard';
import RevenueChart from './components/RevenueChart';
import InvoicesList from './components/InvoicesList';
import CreateInvoiceModal from './components/CreateInvoiceModal';
import AllTransactionsModal from './components/AllTransactionsModal';

const FinancialOperations = () => {
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState('overview'); // 'overview' ou 'invoices'
  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);
  const [isAllTransactionsModalOpen, setIsAllTransactionsModalOpen] = useState(false);

  // --- HOOKS ---
  const { data: overview, isLoading: loadOverview, isError: errOverview } = useFinanceOverview();
  const { data: chartData, isLoading: loadChart } = useFinanceChart();
  const { data: transactions, isLoading: loadHistory } = useFinanceHistory({ limit: 1000 }); // Récupérer toutes les transactions
  
  // Fonction pour réessayer en invalidant les queries
  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['finance'] });
  };

  // État global de chargement
  const isLoading = loadOverview || loadChart || loadHistory;
  const hasError = errOverview;

  // --- 3. PRÉPARATION DES DONNÉES UI ---
  
  // Fonction helper pour calculer le pourcentage de changement
  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return { value: 0, type: 'neutral' };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      type: change >= 0 ? 'increase' : 'decrease'
    };
  };

  // Calculer les changements basés sur les données réelles
  const revenueChange = calculateChange(
    overview?.monthlyRevenue || 0,
    overview?.previousMonthRevenue || 0
  );
  const invoicesChange = calculateChange(
    overview?.invoicesCount || 0,
    overview?.previousMonthInvoicesCount || 0
  );
  const outstandingChange = calculateChange(
    overview?.outstandingAmount || 0,
    overview?.previousMonthOutstandingAmount || 0
  );
  const profitChange = calculateChange(
    overview?.netProfit || 0,
    overview?.previousMonthNetProfit || 0
  );
  
  const revenueOverviewData = overview ? [
    { 
      id: 'invoices',
      title: "Factures créées", 
      amount: overview.invoicesCount || 0, // Passer la valeur numérique
      change: invoicesChange.value > 0 ? `${invoicesChange.type === 'increase' ? '+' : '-'}${invoicesChange.value}%` : "0%", 
      changeType: invoicesChange.type, 
      icon: "FileText", 
      color: "success",
      isCount: true // Indicateur que c'est un nombre, pas une devise
    },
    { 
      id: 'outstanding',
      title: "Impayés", 
      amount: overview.outstandingAmount || 0, // Passer la valeur numérique
      change: outstandingChange.value > 0 ? `${outstandingChange.type === 'increase' ? '+' : '-'}${outstandingChange.value}%` : "0%", 
      changeType: outstandingChange.type, 
      icon: "AlertTriangle", 
      color: "warning" 
    },
    { 
      id: 'revenue',
      title: "Revenus du mois", 
      amount: overview.monthlyRevenue || 0, // Passer la valeur numérique, pas formatée
      change: revenueChange.value > 0 ? `${revenueChange.type === 'increase' ? '+' : '-'}${revenueChange.value}%` : "0%", 
      changeType: revenueChange.type, 
      icon: "TrendingUp", 
      color: "primary" 
    },
    { 
      id: 'profit',
      title: "Bénéfice Net", 
      amount: overview.netProfit || 0, // Passer la valeur numérique
      change: profitChange.value > 0 ? `${profitChange.type === 'increase' ? '+' : '-'}${profitChange.value}%` : "0%", 
      changeType: profitChange.type, 
      icon: "DollarSign", 
      color: "secondary" 
    }
  ] : [];

  // --- 5. RENDER ---
  
  // Cas de chargement initial
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 font-sans flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center pt-20">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-primary bg-white dark:bg-slate-900/50 px-8 py-8 flex flex-col items-center justify-center">
            <Icon name="Loader2" size={32} className="animate-spin text-primary mb-2" />
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Chargement…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 font-sans">
      <Helmet>
        <title>Opérations Financières - MediCore</title>
        <meta name="description" content="Gestion de la trésorerie, facturation et analyse financière." />
      </Helmet>

      <Header />
      
      <main className="pt-24 w-full max-w-[1600px] mx-auto px-6 lg:px-8 pb-12">
        
        {hasError ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-red-500">
            <Icon name="AlertCircle" size={32} className="text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Erreur de chargement</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Impossible de récupérer les données financières.</p>
            <Button onClick={handleRetry} variant="outline">Réessayer</Button>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* En-tête de page */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center text-primary dark:text-blue-400 border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <Icon name="DollarSign" size={24} />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                    Finance
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
                    Pilotage de la trésorerie et facturation
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                  <button 
                    onClick={() => setViewMode('overview')} 
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'overview' 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                    title="Vue d'ensemble"
                  >
                    <Icon name="LayoutDashboard" size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('invoices')} 
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'invoices' 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                    title="Toutes les factures"
                  >
                    <Icon name="FileText" size={18} />
                  </button>
                </div>
                <PermissionGuard requiredPermission="audit_view">
                  <Button variant="outline" size="sm" iconName="Download" disabled={!hasPermission('audit_view')}>
                    Rapport
                  </Button>
                </PermissionGuard>
                <PermissionGuard requiredPermission="billing_create">
                  <Button 
                    variant="default" 
                    size="sm" 
                    iconName="Plus"
                    onClick={() => setIsCreateInvoiceModalOpen(true)}
                    disabled={!hasPermission('billing_create')}
                  >
                    Nouvelle Facture
                  </Button>
                </PermissionGuard>
              </div>
            </motion.div>

            {/* Contenu selon le mode */}
            {viewMode === 'overview' ? (
              <>
                {/* KPIs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.isArray(revenueOverviewData) && revenueOverviewData.map((data) => {
                    if (!data || typeof data !== 'object') return null;
                    return (
                      <RevenueOverviewCard key={data.id || Math.random()} {...data} />
                    );
                  }).filter(Boolean)}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  
                  {/* Colonne Gauche (2/3) : Graphiques et Historique */}
                  <div className="xl:col-span-2 space-y-8">
                    {/* Graphique d'évolution */}
                    <div className="h-[500px]">
                      <RevenueChart data={chartData || []} /> 
                    </div>

                    {/* Tableau des transactions récentes */}
                    <div className="h-[500px]">
                      <RecentTransactionsTable 
                        transactions={transactions || []} 
                        onViewAll={() => setIsAllTransactionsModalOpen(true)}
                      /> 
                    </div>
                  </div>

                  {/* Colonne Droite (1/3) : Widgets secondaires */}
                  <div className="space-y-8">
                    
                    {/* Répartition des méthodes de paiement */}
                    <div className="h-[500px]">
                      <PaymentMethodsChart /> 
                    </div>

                    {/* Liste des impayés */}
                    <div className="h-[500px]">
                      <OutstandingInvoicesCard /> 
                    </div>
                    
                  </div>

                </div>
              </>
            ) : (
              <InvoicesList />
            )}
          </div>
        )}

        {/* Modal de création de facture */}
        <CreateInvoiceModal
          isOpen={isCreateInvoiceModalOpen}
          onClose={() => setIsCreateInvoiceModalOpen(false)}
        />

        {/* Modal de toutes les transactions */}
        <AllTransactionsModal
          isOpen={isAllTransactionsModalOpen}
          onClose={() => setIsAllTransactionsModalOpen(false)}
          transactions={transactions || []}
        />
      </main>
    </div>
  );
};

export default FinancialOperations;
