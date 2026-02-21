import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/axios';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Appel à l'API backend pour déclencher l'envoi de l'email
      await api.post('/auth/forgot-password', { email });
      // On affiche toujours le succès par sécurité (pour ne pas révéler si un email existe)
      setIsSent(true);
    } catch (error) {
      console.error(error);
      setIsSent(true); // Même en cas d'erreur technique, on feint l'envoi pour l'UX
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
      <div className="backdrop-blur-xl bg-white/50 dark:bg-white/10 w-full max-w-md p-8 rounded-3xl shadow-xl border border-white/20 dark:border-white/10">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
            <Icon name={isSent ? "MailCheck" : "KeyRound"} size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isSent ? "Vérifiez vos emails" : "Mot de passe oublié ?"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
            {isSent 
              ? `Si un compte existe pour ${email}, vous recevrez un lien de réinitialisation dans quelques instants.` 
              : "Entrez votre email professionnel pour recevoir les instructions de réinitialisation."}
          </p>
        </div>

        {isSent ? (
          <div className="space-y-3">
            <Button variant="default" fullWidth onClick={() => navigate('/portail-connexion')}>
              Retour à la connexion
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input 
                type="email" 
                label="Email" 
                placeholder="nom@clinique.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="bg-slate-50 dark:bg-slate-950 border-white/20 dark:border-white/10"
              />
            </div>

            <div className="space-y-3">
              <Button 
                type="submit" 
                variant="default" 
                fullWidth 
                loading={isLoading} 
                disabled={!email || isLoading}
                className="h-11 shadow-lg shadow-primary/20"
              >
                Envoyer le lien
              </Button>
              
              <Button 
                variant="ghost" 
                fullWidth 
                onClick={() => navigate('/portail-connexion')}
                className="text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Annuler
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
