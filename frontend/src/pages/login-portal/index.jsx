import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getDefaultRoute } from '../../utils/getDefaultRoute';
import Icon from '../../components/AppIcon';
import { LOGOUT_REDIRECT_FLAG } from '../../contexts/AuthContext';

// Import des sous-composants
import WelcomeHeader from './components/WelcomeHeader';
import LoginForm from './components/LoginForm';
import BiometricLogin from './components/BiometricLogin';
import SecurityBadges from './components/SecurityBadges';
import QuickAccessCards from './components/QuickAccessCards';
import PrivacyInfo from './components/PrivacyInfo';
import TermsInfo from './components/TermsInfo';

const LoginPortal = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState('email');
  const [sessionRevokedMessage, setSessionRevokedMessage] = useState(false);
  const [tokenExpiredMessage, setTokenExpiredMessage] = useState(false);
  const [showLogoutScreen, setShowLogoutScreen] = useState(() =>
    typeof window !== 'undefined' && sessionStorage.getItem(LOGOUT_REDIRECT_FLAG) === '1'
  );
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!showLogoutScreen) return;
    sessionStorage.removeItem(LOGOUT_REDIRECT_FLAG);
    const t = setTimeout(() => setShowLogoutScreen(false), 800);
    return () => clearTimeout(t);
  }, [showLogoutScreen]);

  // Message selon la raison de la redirection (session révoquée ou token expiré)
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'session_revoked') {
      setSessionRevokedMessage(true);
      navigate('/portail-connexion', { replace: true });
    } else if (reason === 'token_expired') {
      setTokenExpiredMessage(true);
      navigate('/portail-connexion', { replace: true });
    }
  }, [searchParams, navigate]);

  const handleLoginSuccess = (userData) => {
    // Rediriger vers la route par défaut selon le rôle (les permissions seront chargées après la redirection)
    const defaultRoute = getDefaultRoute([], userData?.role);
    setTimeout(() => navigate(defaultRoute), 800);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showLogoutScreen ? (
          <motion.div
            key="logout-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="min-h-screen flex w-full bg-slate-950 font-sans items-center justify-center absolute inset-0 z-10"
            role="status"
            aria-live="polite"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 text-white"
            >
              <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <p className="text-lg font-medium">Déconnexion du système en cours...</p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="login-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen flex w-full bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden selection:bg-primary/30"
          >

      {/* --- COLONNE GAUCHE : Branding & Visuel (45% largeur) --- */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 text-white overflow-hidden">

        {/* Image de fond avec Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
            alt="Medical Background"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 opacity-90" />
        </div>

        {/* Cercles décoratifs animés */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/60 to-transparent z-0" />

        {/* Contenu Branding */}
        <div className="relative z-10 h-full flex flex-col justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl ring-1 ring-white/10">
              <Icon name="Activity" size={28} className="text-blue-300" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-white">MediCore</span>
              <span className="block text-xs text-blue-200/80 font-medium uppercase tracking-widest">Digital Medical Interface</span>
            </div>
          </div>

          {/* Message Central */}
          <div className="space-y-6 max-w-lg">
            <h1 className="text-5xl font-extrabold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-blue-200 drop-shadow-sm">
              L'avenir des soins,<br />
              <span className="font-light italic text-white/90">simplifié.</span>
            </h1>
            <p className="text-blue-100/90 text-lg leading-relaxed font-light border-l-4 border-blue-400/50 pl-6">
              "La plateforme la plus sécurisée pour gérer vos dossiers patients, prescriptions et analyses en temps réel."
            </p>
          </div>

          {/* Footer Gauche */}
          <div className="space-y-8">
            <SecurityBadges />
            <div className="flex justify-between items-end text-[10px] text-white/40 border-t border-white/10 pt-6">
              <p>© 2025 OpenClinic Inc.</p>
              <div className="flex gap-4">
                <PrivacyInfo />
                <TermsInfo />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- COLONNE DROITE : Formulaire (55% largeur) --- */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 relative">

        {/* Motif de fond subtil (Grid) */}
        <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
        </div>

        <div className="w-full max-w-[440px] relative z-10">

          {/* Header Mobile */}
          <div className="text-center mb-10">
            <div className="inline-flex lg:hidden items-center gap-2 mb-6 text-primary p-3 backdrop-blur-2xl bg-white/70 dark:bg-slate-900/80 rounded-2xl shadow-xl border border-white/40 dark:border-white/15">
              <Icon name="Activity" size={28} />
              <span className="font-bold text-xl text-slate-900 dark:text-white">MediCore</span>
            </div>
            <WelcomeHeader />
          </div>

          {/* Onglets Switcher (Style iOS/Segmented Control) */}
          <div className="backdrop-blur-xl bg-white/40 dark:bg-white/5 p-1.5 rounded-2xl flex mb-8 relative border border-white/40 dark:border-white/10 mx-auto w-fit">
            <motion.div
              className="absolute top-1.5 bottom-1.5 rounded-xl backdrop-blur-xl bg-white/80 dark:bg-white/10 border border-white/50 dark:border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
              initial={false}
              animate={{
                x: authMethod === 'email' ? 0 : '100%',
                width: 'calc(50% - 6px)' // Ajustement précis
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            <button
              onClick={() => setAuthMethod('email')}
              className={`relative z-10 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-200 w-36 ${authMethod === 'email' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              <Icon name="Mail" size={16} /> Email
            </button>
            <button
              onClick={() => setAuthMethod('biometric')}
              className={`relative z-10 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-200 w-36 ${authMethod === 'biometric' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              <Icon name="Fingerprint" size={16} /> Passkey
            </button>
          </div>

          {/* Zone de Contenu Dynamique avec Animation de hauteur */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={authMethod}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.3 }}
              >
                {authMethod === 'email' ? (
                  <div className="backdrop-blur-2xl bg-white/75 dark:bg-slate-900/85 p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] border border-white/50 dark:border-white/15">
                    {/* Message d'alerte si session révoquée ou token expiré */}
                    <AnimatePresence>
                      {sessionRevokedMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3"
                        >
                          <Icon name="AlertTriangle" size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                              Session déconnectée
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                              Votre session a été déconnectée car une nouvelle connexion a été établie avec ce compte depuis un autre appareil. Veuillez vous reconnecter.
                            </p>
                          </div>
                          <button
                            onClick={() => setSessionRevokedMessage(false)}
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                          >
                            <Icon name="X" size={16} />
                          </button>
                        </motion.div>
                      )}
                      {tokenExpiredMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mb-6 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-white/20 dark:border-white/10 flex items-start gap-3"
                        >
                          <Icon name="Clock" size={20} className="text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1">
                              Session expirée
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Votre session a expiré pour des raisons de sécurité. Veuillez vous reconnecter.
                            </p>
                          </div>
                          <button
                            onClick={() => setTokenExpiredMessage(false)}
                            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                          >
                            <Icon name="X" size={16} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <LoginForm
                      onLoginSuccess={handleLoginSuccess}
                      isLoading={isLoading}
                      setIsLoading={setIsLoading}
                    />
                  </div>
                ) : (
                  <div className="backdrop-blur-2xl bg-white/75 dark:bg-slate-900/85 p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] border border-white/50 dark:border-white/15">
                    <BiometricLogin
                      onBiometricLogin={handleLoginSuccess}
                      isLoading={isLoading}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Quick Access */}
          <QuickAccessCards />
        </div>
      </div>
    </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LoginPortal;