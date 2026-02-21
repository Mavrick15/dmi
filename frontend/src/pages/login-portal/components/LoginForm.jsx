import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { getDefaultRoute } from '../../../utils/getDefaultRoute';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
// CORRECTION ICI : Ajout de AnimatePresence dans l'import
import { motion, AnimatePresence } from 'framer-motion';

const LoginForm = ({ onLoginSuccess, isLoading, setIsLoading }) => {
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isAccountDisabled, setIsAccountDisabled] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (error) {
      setError('');
      setIsAccountDisabled(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsAccountDisabled(false);
    
    if (setIsLoading) setIsLoading(true);

    const result = await signIn(formData.email, formData.password, formData.rememberMe);

    if (result.success) {
      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      } else {
        // Rediriger vers la route par défaut selon le rôle (les permissions seront chargées après)
        const defaultRoute = getDefaultRoute([], result.user?.role);
        navigate(defaultRoute);
      }
    } else {
      const errorMsg = result.error || "Identifiants incorrects.";
      const lowerMsg = errorMsg.toLowerCase();
      
      setIsAccountDisabled(
        lowerMsg.includes('désactivé') || lowerMsg.includes('desactive') || 
        lowerMsg.includes('inactif') || lowerMsg.includes('disabled') ||
        (lowerMsg.includes('compte') && (lowerMsg.includes('bloqué') || lowerMsg.includes('bloque')))
      );
      setError(errorMsg);
      if (setIsLoading) setIsLoading(false);
    }
  };

  const inputClasses = `
    block w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 outline-none
    backdrop-blur-xl bg-white/60 dark:bg-white/10 
    border border-white/50 dark:border-white/15
    text-slate-900 dark:text-white 
    placeholder:text-slate-400 dark:placeholder:text-slate-500
    focus:border-white/60 dark:focus:border-white/25 focus:ring-0
    shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Inputs */}
      <div className="space-y-5">
        
        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">
            Email professionnel
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Icon name="Mail" size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={inputClasses}
              placeholder="nom@clinique.com"
              required
              disabled={isLoading}
              autoComplete="username"
            />
          </div>
        </div>

        {/* Mot de passe */}
        <div>
          <div className="flex justify-between items-center mb-2 ml-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Mot de passe
            </label>
            <button 
              type="button" 
              onClick={() => navigate('/mot-de-passe-oublie')}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors hover:underline" 
              tabIndex="-1"
            >
              Oublié ?
            </button>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Icon name="LockKeyhole" size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={inputClasses}
              placeholder="••••••••••••"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition-colors"
              tabIndex="-1"
            >
              <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* "Se souvenir de moi" */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="rememberMe"
          name="rememberMe"
          checked={formData.rememberMe}
          onChange={handleInputChange}
          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary focus:ring-2"
          disabled={isLoading}
        />
        <label htmlFor="rememberMe" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
          Se souvenir de moi
        </label>
      </div>

      {/* Erreur */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm font-medium ${
              isAccountDisabled 
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300' 
                : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-300'
            }`}>
              <Icon name={isAccountDisabled ? "ShieldAlert" : "AlertCircle"} size={18} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="block">{error}</span>
                {isAccountDisabled && (
                  <span className="block text-xs mt-2 opacity-75">
                    Si vous pensez qu'il s'agit d'une erreur, contactez votre administrateur système.
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton */}
      <Button
        type="submit"
        variant="default"
        loading={isLoading}
        disabled={isLoading}
        fullWidth
        className="h-12 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none"
      >
        Se connecter
      </Button>
    </form>
  );
};

export default LoginForm;