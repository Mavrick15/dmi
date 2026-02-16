import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import PermissionGuard from '../../components/PermissionGuard';
import IntegrationCard from './components/IntegrationCard';
import ConnectionStatus from './components/ConnectionStatus';
import DataFlowMonitor from './components/DataFlowMonitor';
import APIEndpoints from './components/APIEndpoints';
import SecurityProtocols from './components/SecurityProtocols';
import IntegrationWizard from './components/IntegrationWizard';
import { useIntegrationsList, useDataFlows, useIntegrationMutations } from '../../hooks/useIntegration';
import { useToast } from '../../contexts/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';

const IntegrationCenter = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [wizardOpen, setWizardOpen] = useState(false);
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const { data: integrations = [], isLoading: loadingIntegrations } = useIntegrationsList();
  const { data: dataFlows = [], isLoading: loadingFlows } = useDataFlows();
  const { connectIntegration, disconnectIntegration } = useIntegrationMutations();
  
  // Protéger les données
  const integrationsArray = Array.isArray(integrations) ? integrations : [];
  const dataFlowsArray = Array.isArray(dataFlows) ? dataFlows : [];

  // Endpoints API disponibles (statiques car ce sont nos propres endpoints)
  const apiEndpoints = [
    { id: 1, method: "POST", path: "/api/v1/patients", description: "Créer ou mettre à jour un patient", status: "active", successRate: 99.8 },
    { id: 2, method: "GET", path: "/api/v1/patients/:id", description: "Récupérer les détails d'un patient", status: "active", successRate: 99.5 },
    { id: 3, method: "POST", path: "/api/v1/consultations", description: "Créer une consultation", status: "active", successRate: 98.2 },
    { id: 4, method: "GET", path: "/api/v1/pharmacy/inventory", description: "Récupérer l'inventaire de la pharmacie", status: "active", successRate: 99.0 },
    { id: 5, method: "POST", path: "/api/v1/documents", description: "Uploader un document", status: "active", successRate: 97.5 }
  ];

  // Protocoles de sécurité (statiques car ce sont nos configurations)
  const securityProtocols = [
    { id: 1, name: "TLS Encryption", icon: "Lock", level: "high", description: "End-to-end encryption using TLS 1.3", encryption: "AES-256", authentication: "Mutual TLS" },
    { id: 2, name: "OAuth 2.0 / Bearer Token", icon: "Key", level: "high", description: "Secure token-based authentication", encryption: "N/A", authentication: "Bearer Token" },
    { id: 3, name: "Rate Limiting", icon: "Shield", level: "medium", description: "Protection contre les abus et attaques DDoS", encryption: "N/A", authentication: "IP-based" }
  ];

  const handleConnect = async (integration) => {
    try {
      await connectIntegration.mutateAsync({ id: integration.id });
      // Le toast est géré par le hook connectIntegration
    } catch (error) {
      // L'erreur est gérée par le hook connectIntegration
    }
  };

  const handleDisconnect = async (integration) => {
    try {
      await disconnectIntegration.mutateAsync({ id: integration.id });
      // Le toast est géré par le hook disconnectIntegration
    } catch (error) {
      // L'erreur est gérée par le hook disconnectIntegration
    }
  };

  const handleConfigure = (integration) => {
    // Ouvrir le wizard en mode édition
    setWizardOpen(true);
  };

  const handleWizardComplete = (data) => {
    // Le toast est géré par le hook connectIntegration dans IntegrationWizard
    // Les hooks vont automatiquement rafraîchir les données
  };

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: 'LayoutDashboard' },
    { id: 'integrations', label: 'Connecteurs', icon: 'Zap' },
    { id: 'data-flow', label: 'Flux de Données', icon: 'ArrowRightLeft' },
    { id: 'api-endpoints', label: 'API', icon: 'Code' },
    { id: 'security', label: 'Sécurité', icon: 'Shield' }
  ];

  const renderContent = () => {
      switch(activeTab) {
          case 'overview': return (
              <div className="space-y-8 animate-fade-in">
                  {loadingIntegrations ? (
                    <div className="text-center py-12">
                      <Icon name="Loader2" size={32} className="animate-spin mx-auto text-primary mb-4" />
                      <p className="text-slate-500 dark:text-slate-400">Chargement des intégrations...</p>
                    </div>
                  ) : (
                    <>
                  <ConnectionStatus connections={integrationsArray} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {loadingFlows ? (
                            <div className="text-center py-8">
                              <Icon name="Loader2" size={24} className="animate-spin mx-auto text-primary mb-2" />
                              <p className="text-sm text-slate-500 dark:text-slate-400">Chargement des flux...</p>
                            </div>
                          ) : (
                      <DataFlowMonitor dataFlows={dataFlowsArray} />
                          )}
                      <div className="space-y-6">
                           <h3 className="font-bold text-slate-900 dark:text-white ml-1">Intégrations Critiques</h3>
                               {integrationsArray.length > 0 ? (
                                 integrationsArray.slice(0, 2).map(integration => {
                                   if (!integration || typeof integration !== 'object') return null;
                                   return (
                                     <IntegrationCard 
                                       key={integration.id} 
                                       integration={integration} 
                                       onConnect={() => handleConnect(integration)}
                                       onDisconnect={() => handleDisconnect(integration)}
                                       onConfigure={() => handleConfigure(integration)}
                                     />
                                   );
                                 }).filter(Boolean)
                               ) : (
                                 <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                   <Icon name="Zap" size={32} className="mx-auto mb-2 opacity-20" />
                                   <p>Aucune intégration configurée</p>
                                 </div>
                               )}
                          </div>
                      </div>
                    </>
                  )}
              </div>
          );
          case 'integrations': return (
              <div className="animate-fade-in">
                  {loadingIntegrations ? (
                    <div className="text-center py-12">
                      <Icon name="Loader2" size={32} className="animate-spin mx-auto text-primary mb-4" />
                      <p className="text-slate-500 dark:text-slate-400">Chargement...</p>
                    </div>
                  ) : integrationsArray.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {integrationsArray.map(integration => {
                    if (!integration || typeof integration !== 'object') return null;
                    return (
                            <IntegrationCard 
                              key={integration.id} 
                              integration={integration} 
                              onConnect={() => handleConnect(integration)}
                              onDisconnect={() => handleDisconnect(integration)}
                              onConfigure={() => handleConfigure(integration)}
                            />
                    );
                  }).filter(Boolean)}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <Icon name="Zap" size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Aucune intégration</h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-6">Créez votre première intégration pour commencer</p>
                      <PermissionGuard requiredPermission="settings_manage">
                        <Button onClick={() => setWizardOpen(true)} iconName="Plus" disabled={!hasPermission('settings_manage')}>Nouvelle Intégration</Button>
                      </PermissionGuard>
                    </div>
                  )}
              </div>
          );
          case 'data-flow': return (
            <div className="animate-fade-in">
              {loadingFlows ? (
                <div className="text-center py-12">
                  <Icon name="Loader2" size={32} className="animate-spin mx-auto text-primary mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">Chargement des flux de données...</p>
                </div>
              ) : (
                <DataFlowMonitor dataFlows={dataFlowsArray} />
              )}
            </div>
          );
          case 'api-endpoints': return <div className="animate-fade-in"><APIEndpoints endpoints={apiEndpoints} /></div>;
          case 'security': return <div className="animate-fade-in"><SecurityProtocols protocols={securityProtocols} /></div>;
          default: return null;
      }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <Header />
      
      <main className="pt-24 w-full max-w-[1600px] mx-auto px-6 lg:px-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center text-primary dark:text-blue-400 border border-primary/10 dark:border-primary/20 shadow-sm"
            >
              <Icon name="Zap" size={24} />
            </motion.div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                Centre d'Intégration
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
                Connecteurs et flux de données
              </p>
            </div>
          </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <PermissionGuard requiredPermission="settings_manage">
                <Button 
                  onClick={() => setWizardOpen(true)} 
                  className="shadow-lg shadow-cyan-500/20 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                  disabled={!hasPermission('settings_manage')}
                >
                  <Icon name="Plus" size={18} className="mr-2" />
                  Nouvelle Intégration
                </Button>
              </PermissionGuard>
            </motion.div>
          </div>
        </motion.div>

        <div className="flex overflow-x-auto pb-1 mb-8 border-b border-slate-200 dark:border-slate-800 gap-6">
            {Array.isArray(tabs) && tabs.map(tab => {
              if (!tab || typeof tab !== 'object') return null;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-primary dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                    <Icon name={tab.icon} size={18} /> {tab.label}
                </button>
              );
            }).filter(Boolean)}
        </div>

        {renderContent()}
      </main>

      <IntegrationWizard 
        isOpen={wizardOpen} 
        onClose={() => setWizardOpen(false)} 
        onComplete={handleWizardComplete} 
      />
    </div>
  );
};

export default IntegrationCenter;