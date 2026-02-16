import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import { useToast } from '../../../contexts/ToastContext';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      showToast("Les mots de passe ne correspondent pas.", 'error');
      return;
    }
    if (passwords.new.length < 8) {
      showToast("Le mot de passe doit contenir au moins 8 caractères.", 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        token,
        newPassword: passwords.new
      });
      
      if (response.data.success) {
        showToast("Mot de passe modifié avec succès. Vous allez être redirigé.", 'success');
        setTimeout(() => navigate('/portail-connexion'), 2000);
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Le lien de réinitialisation est invalide ou a expiré.";
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Si l'URL est incomplète (pas de token ou d'email), on affiche une erreur
  if (!email || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
        <div className="text-center p-8 max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                <Icon name="XCircle" size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Lien invalide</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Ce lien de réinitialisation est incomplet ou corrompu.</p>
            <Button variant="default" fullWidth onClick={() => navigate('/portail-connexion')}>Retour à la connexion</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
        
        <div className="text-center mb-8">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                <Icon name="LockKeyhole" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Nouveau mot de passe</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Sécurisez votre compte avec un mot de passe fort.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input 
            type="password" 
            label="Nouveau mot de passe" 
            value={passwords.new}
            onChange={(e) => setPasswords({...passwords, new: e.target.value})}
            required
            placeholder="••••••••"
            className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
          />
          <Input 
            type="password" 
            label="Confirmer le mot de passe" 
            value={passwords.confirm}
            onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
            required
            placeholder="••••••••"
            className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
          />
          
          <div className="pt-2">
              <Button type="submit" fullWidth loading={isLoading} className="shadow-lg shadow-indigo-500/20 h-11 text-base font-semibold">
                Valider le changement
              </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;