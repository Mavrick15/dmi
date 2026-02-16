import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Header from '../../components/ui/Header';
import PermissionGuard from '../../components/PermissionGuard';
import { usePermissions } from '../../hooks/usePermissions';
import { useDashboardData } from '../../hooks/useDashboard';
import { useExportMutations } from '../../hooks/useExport';
import { useToast } from '../../contexts/ToastContext';
import { useCurrency } from '../../contexts/CurrencyContext';

// Composants
import MetricCard from './components/MetricCard';
import AppointmentWidget from './components/AppointmentWidget';
import RevenueChart from './components/RevenueChart';
import RecentPatientsWidget from './components/RecentPatientsWidget';
import SystemAlertsWidget from './components/SystemAlertsWidget';
import AnalysesWidget from './components/AnalysesWidget';

// --- CONFIGURATION DU LOADER ---
const LOADING_MIN_DURATION = 1500;

// --- COMPOSANT LOADER DÉDIÉ DASHBOARD ---
const DashboardLoader = ({ onFinished }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Connexion aux services...");

  useEffect(() => {
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const rawProgress = Math.min((elapsed / LOADING_MIN_DURATION) * 100, 100);

      if (rawProgress < 30) setStatusText("Agrégation des données patients...");
      else if (rawProgress < 60) setStatusText("Calcul des performances financières...");
      else if (rawProgress < 90) setStatusText("Synchronisation des rendez-vous...");
      else setStatusText("Affichage du tableau de bord...");

      setProgress(rawProgress);

      if (elapsed < LOADING_MIN_DURATION) {
        window.requestAnimationFrame(step);
      } else {
        setProgress(100);
        setTimeout(onFinished, 200);
      }
    };
    window.requestAnimationFrame(step);
  }, [onFinished]);

  return (
    <motion.div 
      className="flex flex-col items-center justify-center h-[calc(100vh-150px)]"
      exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)", transition: { duration: 0.5, ease: "easeInOut" } }}
    >
      <div className="relative mb-8">
        <div className="relative w-20 h-20 bg-white dark:bg-slate-900 rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 dark:border-slate-800 z-10">
          <Icon name="LayoutDashboard" size={32} className="text-primary animate-pulse" />
        </div>
        <span className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping duration-1000 delay-500"></span>
      </div>

      <div className="w-64 space-y-2">
        <div className="flex justify-between items-end px-1">
           <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{statusText}</span>
           <span className="text-[10px] font-mono font-bold text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
          <motion.div 
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { formatCurrency } = useCurrency();
  const { data: dashboardData, isLoading: isLoadingData } = useDashboardData();
  const { exportPatients } = useExportMutations();
  
  // --- ÉTATS ---
  // 1. Initialisation intelligente : On regarde si l'intro a déjà été vue dans cette session
  const hasSeenIntro = sessionStorage.getItem('dashboard_intro_seen') === 'true';
  
  const [isAnimationDone, setIsAnimationDone] = useState(hasSeenIntro);
  
  const isDataReady = !isLoadingData && dashboardData;

  // Fonction pour obtenir le titre selon le rôle
  const getRoleTitle = (role) => {
    const roleMap = {
      'docteur': 'Dr.',
      'medecin': 'Dr.',
      'infirmiere': 'Infirmier',
      'pharmacien': 'Pharmacien',
      'admin': 'Administrateur',
      'gestionnaire': 'Gestionnaire',
      'patient': 'Patient',
    };
    return roleMap[role?.toLowerCase()] || 'Utilisateur';
  };

  // Fonction pour obtenir le message de bienvenue selon le rôle
  const getWelcomeMessage = (role, nomComplet) => {
    const title = getRoleTitle(role);
    const name = nomComplet || 'Utilisateur';
    const roleLower = role?.toLowerCase();
    
    // Messages personnalisés selon le rôle
    const messageTemplates = {
      'docteur': `Bienvenue ${title} {name}, voici votre activité clinique.`,
      'medecin': `Bienvenue ${title} {name}, voici votre activité clinique.`,
      'infirmiere': `Bienvenue ${title} {name}, voici votre activité.`,
      'pharmacien': `Bienvenue ${title} {name}, voici votre activité pharmaceutique.`,
      'admin': `Bienvenue ${title} {name}, voici le tableau de bord administratif.`,
      'gestionnaire': `Bienvenue ${title} {name}, voici votre tableau de bord.`,
      'patient': `Bienvenue {name}, voici votre espace patient.`,
    };
    
    const template = messageTemplates[roleLower] || `Bienvenue ${title} {name}, voici votre activité.`;
    const message = template.replace('{name}', name);
    
    // Séparer le message pour mettre le nom en gras
    const parts = message.split(name);
    
    return (
      <>
        {parts[0]}
        <span className="font-semibold text-primary">{name}</span>
        {parts[1]}
      </>
    );
  };

  // Handler appelé quand l'animation se termine
  const handleAnimationComplete = () => {
    setIsAnimationDone(true);
    // On enregistre que l'intro a été vue pour cette session (disparaît si on ferme le navigateur)
    sessionStorage.setItem('dashboard_intro_seen', 'true');
  };

  const quickActions = [
    { title: 'Nouveau patient', subtitle: 'Dossier admission', icon: 'UserPlus', route: '/gestion-patients', color: 'text-primary bg-primary/10 dark:bg-primary/20' },
    { title: 'Consultation', subtitle: 'Démarrer séance', icon: 'Stethoscope', route: '/console-clinique', color: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30' },
    { title: 'Ordonnance', subtitle: 'Prescription', icon: 'FileText', route: '/console-clinique', color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30' },
    { title: 'Facturation', subtitle: 'Paiements', icon: 'CreditCard', route: '/operations-financieres', color: 'text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-900/30' }
  ];

  // Variants d'animation (Apparition du contenu)
  const contentVariants = {
    hidden: { opacity: 0, scale: 0.98, filter: "blur(5px)" },
    visible: { 
      opacity: 1, 
      scale: 1, 
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.05 } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  // Logique d'affichage :
  // 1. Si l'animation n'est pas finie (et qu'on ne l'a jamais vue) -> Afficher DashboardLoader
  // 2. Si l'animation est finie MAIS que les données chargent encore -> Afficher un Spinner discret (Skeleton)
  // 3. Si tout est prêt -> Afficher le contenu

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <Header />
      
      <main className="pt-24 w-full max-w-[1600px] mx-auto px-6 lg:px-8 pb-12">
        
        {/* En-tête (Toujours visible pour éviter le layout shift) */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center text-primary dark:text-blue-400 border border-primary/10 dark:border-primary/20 shadow-sm"
            >
              <Icon name="LayoutDashboard" size={24} />
            </motion.div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                Tableau de bord
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
                {getWelcomeMessage(user?.role, user?.nomComplet)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PermissionGuard requiredPermission="audit_view">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  iconName="Download" 
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-primary/30"
                  onClick={() => exportPatients.mutateAsync({})}
                  disabled={exportPatients.isPending || !hasPermission('audit_view')}
                >
                  {exportPatients.isPending ? 'Export...' : 'Rapport'}
                </Button>
              </motion.div>
            </PermissionGuard>
            <PermissionGuard requiredPermission="appointment_create">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="primary" 
                  iconName="Plus" 
                  onClick={() => navigate('/gestion-patients?action=rdv')} 
                  className="shadow-lg shadow-primary/20 font-semibold"
                  disabled={!hasPermission('appointment_create')}
                >
                  Rendez-vous
                </Button>
              </motion.div>
            </PermissionGuard>
          </div>
        </motion.div>

        {/* Zone de Contenu Dynamique */}
        <AnimatePresence mode="wait">
          
          {/* CAS 1 : Première visite, on joue l'animation cinématique */}
          {!isAnimationDone && (
            <DashboardLoader key="loader-cinematic" onFinished={handleAnimationComplete} />
          )}

          {/* CAS 2 : Animation finie (ou déjà vue), mais données en cours de chargement */}
          {isAnimationDone && !isDataReady && (
             <motion.div 
                key="loader-simple"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 space-y-4"
             >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon name="Loader2" size={24} className="text-primary" />
                  </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Mise à jour des données...</p>
             </motion.div>
          )}

          {/* CAS 3 : Tout est prêt */}
          {isAnimationDone && isDataReady && (
            <motion.div 
              key="dashboard-content"
              variants={contentVariants} 
              initial="hidden" 
              animate="visible" 
              className="space-y-8"
            >
              {/* KPI Cards - Réorganisées par catégorie */}
              <div className="space-y-6">
                {/* Section Patients & Consultations */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 ml-1">
                    Patients & Consultations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div variants={itemVariants}>
                      <MetricCard 
                        title="Total Patients" 
                        value={dashboardData?.metrics?.totalPatients || 0} 
                        icon="Users" 
                        color="primary" 
                        change="Total" 
                        changeType="neutral" 
                      />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <MetricCard 
                        title="Patients Actifs" 
                        value={dashboardData?.metrics?.activePatients || dashboardData?.metrics?.patients || 0} 
                        icon="UserCheck" 
                        color="emerald" 
                        change="Actifs" 
                        changeType="positive" 
                      />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <MetricCard 
                        title="RDV du Jour" 
                        value={dashboardData?.metrics?.appointments || 0} 
                        icon="Calendar" 
                        color="warning" 
                        change="En cours" 
                        changeType="neutral" 
                      />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <MetricCard 
                        title="Consultations" 
                        value={dashboardData?.metrics?.consultationsToday || dashboardData?.medicalStats?.consultationsToday || dashboardData?.statistics?.consultationsToday || 0} 
                        icon="Stethoscope" 
                        color="primary" 
                        change="Aujourd'hui" 
                        changeType="neutral" 
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Section Analyses Médicales */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 ml-1">
                    Analyses Médicales
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <motion.div variants={itemVariants}>
                      <MetricCard 
                        title="Analyses en attente" 
                        value={dashboardData?.metrics?.analysesPending || dashboardData?.statistics?.analysesPending || 0} 
                        icon="TestTube" 
                        color="warning" 
                        change="À traiter" 
                        changeType="neutral" 
                      />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <MetricCard 
                        title="Analyses terminées" 
                        value={dashboardData?.metrics?.analysesToday || dashboardData?.statistics?.analysesToday || 0} 
                        icon="CheckCircle" 
                        color="emerald" 
                        change="Aujourd'hui" 
                        changeType="positive" 
                      />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <MetricCard 
                        title="Résultats critiques" 
                        value={dashboardData?.metrics?.analysesCritical || dashboardData?.statistics?.analysesCritical || 0} 
                        icon="AlertTriangle" 
                        color="error" 
                        change="Urgent" 
                        changeType="negative" 
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Section Finance & Alertes */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 ml-1">
                    Finance & Alertes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    <motion.div variants={itemVariants}>
                      <MetricCard 
                        title="Revenus (Mois)" 
                        value={formatCurrency(dashboardData?.metrics?.revenue || 0)} 
                        icon="DollarSign" 
                        color="success" 
                        change="+12%" 
                        changeType="positive" 
                      />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <MetricCard 
                        title="Alertes système" 
                        value={dashboardData?.metrics?.alerts || 0} 
                        icon="AlertTriangle" 
                        color="error" 
                        change="À vérifier" 
                        changeType="neutral" 
                      />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Section Accès Rapide */}
              <motion.div variants={itemVariants}>
                <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 ml-1">Accès Rapide</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.isArray(quickActions) && quickActions.map((action, idx) => {
                    if (!action || typeof action !== 'object') return null;
                    return (
                    <motion.button 
                      key={idx}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(action.route)}
                      className="group flex flex-col items-start p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-200 text-left"
                    >
                      <div className={`p-3 rounded-xl mb-3 ${action.color}`}>
                        <Icon name={action.icon} size={24} />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{action.title}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{action.subtitle}</span>
                    </motion.button>
                    );
                  }).filter(Boolean)}
                </div>
              </motion.div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Colonne principale - Activités */}
                <div className="xl:col-span-2 space-y-8">
                  {/* Graphique de revenus */}
                  <motion.div variants={itemVariants}>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Activité Financière</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Revenus sur les 6 derniers mois</p>
                        </div>
                        <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-lg">
                          <button className="px-3 py-1 text-xs font-medium bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded shadow-sm border border-slate-100 dark:border-slate-600">Graphique</button>
                        </div>
                      </div>
                      <div className="h-80 w-full">
                        <RevenueChart data={dashboardData?.revenueChart || []} />
                      </div>
                    </div>
                  </motion.div>

                  {/* Widgets Patients et Analyses */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div variants={itemVariants}>
                      <RecentPatientsWidget patients={dashboardData?.widgets?.recentPatients || dashboardData?.recentPatients || []} />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <AnalysesWidget />
                    </motion.div>
                  </div>
                </div>

                {/* Droite */}
                <motion.div variants={itemVariants} className="space-y-6">
                  {/* Agenda - Réduit à la moitié */}
                  <div className="bg-white dark:bg-slate-900 p-6 flex flex-col rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors" style={{ height: '350px' }}>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Agenda</h3>
                      <Button variant="ghost" size="sm" iconName="ArrowRight" className="dark:text-slate-400 dark:hover:bg-slate-800">Voir tout</Button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <AppointmentWidget appointments={dashboardData.appointments} onAddAppointment={() => navigate('/gestion-patients?action=rdv')} />
                    </div>
                  </div>
                  
                  {/* Alerte système - Dans l'autre moitié */}
                  <div className="bg-white dark:bg-slate-900 p-6 flex flex-col rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors" style={{ height: '350px' }}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Icon name="AlertTriangle" size={20} className="text-amber-600 dark:text-amber-400" />
                          Alertes système
                        </h3>
                        {dashboardData?.alerts?.lowStock?.length > 0 && (
                          <Badge variant="error" className="text-xs">
                            {dashboardData.alerts.lowStock.length}
                          </Badge>
                        )}
                      </div>
                      {dashboardData?.alerts?.lowStock?.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="dark:text-slate-400 dark:hover:bg-slate-800"
                          onClick={() => navigate('/operations-pharmacie')}
                        >
                          Voir tout
                        </Button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-2 custom-scrollbar">
                      {Array.isArray(dashboardData?.alerts?.lowStock) && dashboardData.alerts.lowStock.length > 0 ? (
                        dashboardData.alerts.lowStock.map((alert, idx) => {
                          if (!alert || typeof alert !== 'object') return null;
                          return (
                          <motion.div
                            key={alert.id || idx}
                            className="w-full flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex-shrink-0">
                              <Icon name="Package" size={16} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {alert.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                                  Stock: {alert.stockActuel}
                                </span>
                                <span className="text-[10px] text-amber-300 dark:text-amber-700">•</span>
                                <span className="text-xs text-amber-600 dark:text-amber-400">
                                  Minimum: {alert.stockMinimum}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                          );
                        }).filter(Boolean)
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400 dark:text-slate-500">
                          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                            <Icon name="CheckCircle" size={24} className="opacity-50" />
                          </div>
                          <p className="text-sm">Aucune alerte</p>
                          <p className="text-xs mt-1">Tout fonctionne correctement</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Dashboard;