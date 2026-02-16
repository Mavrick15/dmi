import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => setShowPrompt(false);

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-lg mb-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
      
      <div className="flex items-start gap-4 relative z-10">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
            <Icon name="Smartphone" size={24} className="text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-1 text-white">Installer l'App MediCore</h3>
          <p className="text-blue-100 text-sm mb-4 leading-relaxed">
            Accédez aux dossiers patients hors ligne et recevez les alertes en temps réel.
          </p>
          <div className="flex gap-3">
            <Button 
              size="sm" 
              onClick={handleInstallClick}
              className="bg-white text-blue-700 hover:bg-blue-50 border-transparent shadow-md font-semibold"
              iconName="Download"
              iconPosition="left"
            >
              Installer
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDismiss}
              className="text-white hover:bg-white/10 border-transparent"
            >
              Plus tard
            </Button>
          </div>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-white/60 hover:text-white transition-colors p-1"
        >
          <Icon name="X" size={18} />
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;