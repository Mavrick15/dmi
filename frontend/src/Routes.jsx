import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes as RouterRoutes, useLocation } from "react-router-dom";
import { PatientModalProvider } from "./contexts/PatientModalContext";
import Icon from "./components/AppIcon";
import DefaultRouteRedirect from "./components/DefaultRouteRedirect";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import NotFound from "./pages/NotFound";

// --- CONFIGURATION ---
const LOADING_DURATION = 4000; 

// --- UTILITAIRE DE CHARGEMENT OPTIMISÉ ---
// Préchargement des routes critiques pour améliorer les performances
const lazyLoad = (importFunc, preload = false) => {
  const LazyComponent = lazy(importFunc);
  
  // Précharger les routes critiques en arrière-plan
  if (preload && typeof window !== 'undefined') {
    // Précharger après un délai pour ne pas bloquer le chargement initial
    setTimeout(() => {
      importFunc().catch(() => {
        // Ignorer les erreurs de préchargement
      });
    }, 2000);
  }
  
  return LazyComponent;
};

// --- IMPORTS DES PAGES ---
// Routes critiques préchargées pour améliorer les performances
const LoginPortal = lazyLoad(() => import('./pages/login-portal'));
const ForgotPassword = lazyLoad(() => import('./pages/login-portal/components/ForgotPassword'));
const ResetPassword = lazyLoad(() => import('./pages/login-portal/components/ResetPassword'));
const Dashboard = lazyLoad(() => import('./pages/dashboard'), true); // Précharger (route fréquente)
const UserAdministration = lazyLoad(() => import('./pages/user-administration'));
const PatientManagement = lazyLoad(() => import('./pages/patient-management'), true); // Précharger (route fréquente)
const IntegrationCenter = lazyLoad(() => import('./pages/integration-center'));
const ClinicalConsole = lazyLoad(() => import('./pages/clinical-console'), true); // Précharger (route fréquente)
const PharmacyOperations = lazyLoad(() => import('./pages/pharmacy-operations'));
const FinancialOperations = lazyLoad(() => import('./pages/financial-operations'));
const AnalyticsCenter = lazyLoad(() => import('./pages/analytics-center'));
const MobileCompanion = lazyLoad(() => import('./pages/mobile-companion'));
const DocumentManagement = lazyLoad(() => import('./pages/document-management'));
const ComplianceDashboard = lazyLoad(() => import('./pages/compliance-dashboard'));
const LaboratoryAnalyses = lazyLoad(() => import('./pages/laboratory-analyses'));
const Agenda = lazyLoad(() => import('./pages/agenda'));
const MyAccount = lazyLoad(() => import('./pages/my-account'));

// --- ECRAN DE CHARGEMENT PREMIUM ---
const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [statusText, setStatusText] = useState("Initialisation...");

  const tips = [
    "Astuce : Utilisez Ctrl+K pour ouvrir la recherche globale.",
    "Le module Pharmacie se met à jour automatiquement.",
    "Sécurité : Verrouillez votre session en quittant le poste.",
    "Vous pouvez signer les documents PDF directement ici.",
    "Le mode sombre réduit la fatigue visuelle."
  ];

  useEffect(() => {
    setCurrentTip(Math.floor(Math.random() * tips.length));
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const rawProgress = Math.min((elapsed / LOADING_DURATION) * 100, 100);
      
      if (rawProgress < 20) setStatusText("Connexion sécurisée TLS 1.3...");
      else if (rawProgress < 50) setStatusText("Chargement des modules cliniques...");
      else if (rawProgress < 80) setStatusText("Synchronisation des données...");
      else setStatusText("Lancement de l'interface...");

      setProgress(rawProgress);

      if (elapsed < LOADING_DURATION) {
        window.requestAnimationFrame(step);
      } else {
        setProgress(100);
        setTimeout(onComplete, 800); 
      }
    };
    window.requestAnimationFrame(step);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 1.05, 
        filter: "blur(20px)", 
        transition: { duration: 0.6, ease: "easeInOut" } 
      }}
    >
      {/* Arrière-plan animé avec particules */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient animé rotatif */}
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.3, 1] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-blue-500/10 to-transparent dark:from-primary/30 dark:via-blue-600/15"
        />
        
        {/* Particules flottantes */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 dark:bg-primary/40 rounded-full blur-sm"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0.3,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              x: [null, Math.random() * window.innerWidth],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
        
        {/* Lignes de grille subtiles */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }} />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-8">
        {/* Logo avec animation */}
        <motion.div 
          className="relative mb-10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="relative">
            {/* Cercle de fond animé */}
            <motion.div
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/30 via-blue-500/20 to-indigo-600/30 dark:from-primary/40 dark:via-blue-600/30 dark:to-indigo-700/40"
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.7, 0.5]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            
            {/* Logo principal */}
            <div className="relative w-28 h-28 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 rounded-3xl shadow-2xl shadow-primary/40 dark:shadow-primary/30 flex items-center justify-center border-2 border-white/20 dark:border-slate-700/50 z-10 overflow-hidden group backdrop-blur-sm">
              {/* Effet de brillance animé */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "linear",
                  repeatDelay: 1
                }}
              />
              
              {/* Logo avec serpent qui entoure le + */}
              <motion.svg 
                width="56" 
                height="56" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className="text-white relative z-10"
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                {/* Cercle de fond */}
                <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.15)" />
                {/* Croix médicale */}
                <path d="M12 6V18M6 12H18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white" />
                {/* Serpent qui entoure le + */}
                <path 
                  d="M8 8 Q10 6.5, 12 8.5 Q14 6.5, 16 8.5 Q16.5 10.5, 14.5 11.5 Q16.5 13, 16 15 Q14 17, 12 15.5 Q10 17, 8 15 Q7.5 13, 9.5 11.5 Q7.5 10, 8 8" 
                  stroke="currentColor" 
                  strokeWidth="1.6" 
                  fill="none" 
                  strokeLinecap="round" 
                  className="text-white"
                />
                {/* Tête du serpent */}
                <ellipse cx="8" cy="8" rx="1.4" ry="1.1" fill="currentColor" className="text-white" />
                {/* Œil du serpent */}
                <circle cx="7.7" cy="7.8" r="0.4" fill="rgba(255,255,255,0.95)" />
                {/* Queue du serpent */}
                <path 
                  d="M16 15 Q17 16, 16.5 17" 
                  stroke="currentColor" 
                  strokeWidth="1.6" 
                  fill="none" 
                  strokeLinecap="round" 
                  className="text-white"
                />
              </motion.svg>
            </div>
            
            {/* Anneau de pulsation */}
            <motion.div
              className="absolute inset-0 rounded-3xl border-2 border-primary/40"
              animate={{ 
                scale: [1, 1.2, 1.4],
                opacity: [0.6, 0.3, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeOut" 
              }}
            />
          </div>
        </motion.div>

        {/* Titre et sous-titre */}
        <motion.div 
          className="text-center mb-12"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary via-blue-600 to-indigo-700 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 tracking-tight mb-3">
            MediCore
          </h1>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] letter-spacing-wider">
            Système de Gestion Clinique
          </p>
        </motion.div>

        {/* Barre de progression améliorée */}
        <motion.div 
          className="w-full space-y-3 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex justify-between items-center px-1">
            <motion.span 
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate pr-4"
              key={statusText}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {statusText}
            </motion.span>
            <span className="text-sm font-mono font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="relative h-2 w-full bg-slate-200/80 dark:bg-slate-800/80 rounded-full overflow-hidden backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
            {/* Barre de progression */}
            <motion.div 
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-primary via-blue-500 to-indigo-600 rounded-full shadow-lg shadow-primary/50" 
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
            
            {/* Effet de brillance animé */}
            <motion.div 
              className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-white/70 to-transparent"
              animate={{ x: [-100, 500] }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "linear",
                repeatDelay: 0.5
              }}
            />
            
            {/* Points de progression */}
            {[0, 25, 50, 75, 100].map((point) => (
              <div
                key={point}
                className={`absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full ${
                  progress >= point 
                    ? 'bg-white shadow-sm' 
                    : 'bg-slate-400/50 dark:bg-slate-600/50'
                }`}
                style={{ left: `${point}%` }}
              />
            ))}
          </div>
        </motion.div>

        {/* Astuce */}
        <motion.div 
          className="mt-8 text-center max-w-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <Icon name="Lightbulb" size={14} className="text-amber-500 dark:text-amber-400" />
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {tips[currentTip]}
            </p>
          </div>
        </motion.div>

        {/* Indicateur de sécurité */}
        <motion.div 
          className="mt-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Icon name="ShieldCheck" size={12} className="text-emerald-500" />
          <span>Connexion sécurisée • TLS 1.3</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

// --- TRANSITION DE PAGE : GLISSEMENT FLUIDE (SLIDE) ---
const PageTransition = ({ children }) => (
  <div className="absolute top-0 left-0 w-full min-h-screen">
    {children}
  </div>
);

// Variantes pour le glissement : nouvelle page entre par la droite, ancienne sort par la gauche
const pageSlideVariants = {
  initial: { opacity: 0, x: 48 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { type: "spring", stiffness: 400, damping: 38, mass: 0.8 }
  },
  exit: { 
    opacity: 0, 
    x: -48,
    transition: { type: "spring", stiffness: 400, damping: 38, mass: 0.8 }
  }
};

// --- ROUTAGE ---
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageSlideVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="absolute top-0 left-0 w-full min-h-screen overflow-x-hidden"
      >
        <RouterRoutes location={location}>
        <Route path="/portail-connexion" element={<PageTransition><LoginPortal /></PageTransition>} />
        <Route path="/mot-de-passe-oublie" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="/" element={<PageTransition><DefaultRouteRedirect /></PageTransition>} />
        
        {/* Routes Protégées - Basées UNIQUEMENT sur les permissions gérées par le backend */}
        <Route element={<ProtectedRoute requiredPermission="permission_manage" />}>
            <Route path="/administration-utilisateurs" element={<PageTransition><UserAdministration /></PageTransition>} />
        </Route>
        <Route element={<ProtectedRoute requiredPermission="audit_view" />}>
            <Route path="/tableau-conformite" element={<PageTransition><ComplianceDashboard /></PageTransition>} />
        </Route>
        {/* Tableau de bord - Nécessite une permission spécifique (peut être ajoutée au backend) */}
        <Route element={<ProtectedRoute requiredPermission="dashboard_view" />}>
            <Route path="/tableau-de-bord" element={<PageTransition><Dashboard /></PageTransition>} />
        </Route>
        <Route element={<ProtectedRoute requiredPermission="patient_view" />}>
            <Route path="/gestion-patients" element={<PageTransition><PatientManagement /></PageTransition>} />
        </Route>
        <Route element={<ProtectedRoute requiredPermission="agenda_view" />}>
            <Route path="/agenda" element={<PageTransition><Agenda /></PageTransition>} />
        </Route>
        <Route element={<ProtectedRoute authOnly />}>
            <Route path="/mon-compte" element={<PageTransition><MyAccount /></PageTransition>} />
        </Route>
        <Route element={<ProtectedRoute requiredPermission="clinical_view" />}>
            <Route path="/console-clinique" element={<PageTransition><ClinicalConsole /></PageTransition>} />
            <Route path="/compagnon-mobile" element={<PageTransition><MobileCompanion /></PageTransition>} />
        </Route>
        <Route element={<ProtectedRoute requiredPermission="analyses_view" />}>
            <Route path="/analyses-laboratoire" element={<PageTransition><LaboratoryAnalyses /></PageTransition>} />
        </Route>
        <Route element={<ProtectedRoute requiredPermission="document_view" />}>
            <Route path="/gestion-documents" element={<PageTransition><DocumentManagement /></PageTransition>} />
        </Route>
        <Route element={<ProtectedRoute requiredPermission="inventory_view" />}>
            <Route path="/operations-pharmacie" element={<PageTransition><PharmacyOperations /></PageTransition>} />
        </Route>
        <Route element={<ProtectedRoute requiredPermission="billing_view" />}>
             <Route path="/operations-financieres" element={<PageTransition><FinancialOperations /></PageTransition>} />
        </Route>
        <Route element={<ProtectedRoute requiredPermission="audit_view" />}>
             <Route path="/centre-analytique" element={<PageTransition><AnalyticsCenter /></PageTransition>} />
        </Route>
        <Route element={<ProtectedRoute requiredPermission="settings_manage" />}>
            <Route path="/centre-integration" element={<PageTransition><IntegrationCenter /></PageTransition>} />
            <Route path="/integration-center" element={<Navigate to="/centre-integration" replace />} />
        </Route>
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </RouterRoutes>
      </motion.div>
    </AnimatePresence>
  );
};

// --- GESTIONNAIRE D'ÉTAT DE CHARGEMENT ---
const AppLoader = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <LoadingScreen key="loader" onComplete={() => setIsLoading(false)} />
      ) : (
        <motion.div
            key="app"
            initial={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ 
                duration: 1.2, 
                ease: "easeOut",
                delay: 0.2
            }}
            // CORRECTION : relative ici pour servir de conteneur aux pages absolues
            className="relative w-full min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 dark:from-slate-950 dark:via-slate-900/95 dark:to-slate-950"
        >
             <Suspense fallback={<div className="h-screen w-full" />}>
                <AnimatedRoutes />
             </Suspense>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <PatientModalProvider>
        <ScrollToTop />
        <AppLoader />
      </PatientModalProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;