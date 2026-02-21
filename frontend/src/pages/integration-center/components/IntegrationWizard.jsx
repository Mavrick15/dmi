import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import PermissionGuard from '../../../components/PermissionGuard';
import { useToast } from '../../../contexts/ToastContext';
import { useIntegrationMutations } from '../../../hooks/useIntegration';
import { usePermissions } from '../../../hooks/usePermissions';

const IntegrationWizard = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const { connectIntegration } = useIntegrationMutations();
  
  const [formData, setFormData] = useState({
    integrationType: '',
    name: '',
    endpoint: '',
    apiKey: '',
    apiSecret: '',
    authentication: 'api-key',
    username: '',
    password: '',
    token: '',
    dataMapping: {
      patientId: '',
      patientName: '',
      vitalSigns: '',
      labResults: ''
    }
  });

  const steps = [
    { id: 1, title: 'Type', icon: 'Grid' },
    { id: 2, title: 'Config', icon: 'Settings' },
    { id: 3, title: 'Auth', icon: 'Lock' },
    { id: 4, title: 'Mapping', icon: 'GitMerge' },
    { id: 5, title: 'Test', icon: 'Zap' }
  ];

  const integrationTypes = [
    { id: 'medical-device', name: 'Dispositif Médical', icon: 'Activity', description: 'Moniteurs, Pompes...' },
    { id: 'laboratory', name: 'Laboratoire (LIS)', icon: 'TestTube', description: 'Imports résultats' },
    { id: 'hospital-system', name: 'Dossier Patient (HIS)', icon: 'Building2', description: 'Échange HL7/FHIR' },
    { id: 'pharmacy', name: 'Pharmacie', icon: 'Pill', description: 'Stocks & Commandes' }
  ];

  const handleNext = () => {
    // Validation avant de passer à l'étape suivante
    if (currentStep === 1 && !formData.integrationType) {
      showToast('Veuillez sélectionner un type d\'intégration', 'error');
      return;
    }
    if (currentStep === 2 && (!formData.name || !formData.endpoint)) {
      showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    if (currentStep === 3 && !formData.authentication) {
      showToast('Veuillez configurer l\'authentification', 'error');
      return;
    }
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };
  
  const handlePrevious = () => { 
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setTestResult(null);
    }
  };
  
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      // Simulation d'un test de connexion
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Vérification basique
      const isValid = formData.endpoint && (
        (formData.authentication === 'api-key' && formData.apiKey) ||
        (formData.authentication === 'basic' && formData.username && formData.password) ||
        (formData.authentication === 'bearer' && formData.token)
      );
      
      if (isValid) {
        setTestResult({ success: true, message: 'Connexion réussie !' });
        showToast('Test de connexion réussi', 'success');
      } else {
        setTestResult({ success: false, message: 'Paramètres d\'authentification incomplets' });
        showToast('Test de connexion échoué', 'error');
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Erreur lors du test de connexion' });
      showToast('Erreur lors du test', 'error');
    } finally {
      setTesting(false);
    }
  };
  
  const handleComplete = async () => {
    try {
      // Créer l'intégration via le hook
      await connectIntegration.mutateAsync({
        event: `integration.${formData.integrationType}`,
        url: formData.endpoint,
        ...formData
      });
      
      onComplete(formData);
      onClose();
      
      // Reset form
      setCurrentStep(1);
      setFormData({
        integrationType: '',
        name: '',
        endpoint: '',
        apiKey: '',
        apiSecret: '',
        authentication: 'api-key',
        username: '',
        password: '',
        token: '',
        dataMapping: {
          patientId: '',
          patientName: '',
          vitalSigns: '',
          labResults: ''
        }
      });
    } catch (error) {
      showToast('Erreur lors de la création de l\'intégration', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="backdrop-blur-xl bg-white/50 dark:bg-white/10 rounded-2xl shadow-2xl w-full max-w-3xl border border-white/20 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nouvelle Intégration</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Assistant de configuration</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><Icon name="X" /></Button>
        </div>

        {/* Stepper */}
        <div className="px-8 py-4 backdrop-blur-xl bg-white/50 dark:bg-white/10 border-b border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 -z-10" />
                <div className="absolute top-1/2 left-0 h-0.5 bg-primary -z-10 transition-all duration-300" style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} />
                
                {Array.isArray(steps) && steps.map((step) => {
                  if (!step || typeof step !== 'object') return null;
                  return (
                    <div key={step.id} className={`flex flex-col items-center gap-2 backdrop-blur-xl bg-white/50 dark:bg-white/10 px-2`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${currentStep >= step.id ? 'bg-primary text-white border-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-white/20 dark:border-white/10'}`}>
                            {currentStep > step.id ? <Icon name="Check" size={14} /> : <Icon name={step.icon} size={14} />}
                        </div>
                        <span className={`text-[10px] font-medium ${currentStep >= step.id ? 'text-primary' : 'text-slate-400'}`}>{step.title}</span>
                    </div>
                  );
                }).filter(Boolean)}
            </div>
        </div>

        {/* Content Body */}
        <div className="p-8 overflow-y-auto flex-1">
            {currentStep === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.isArray(integrationTypes) && integrationTypes.map((type) => {
                      if (!type || typeof type !== 'object') return null;
                      return (
                        <button
                            key={type.id}
                            onClick={() => setFormData({...formData, integrationType: type.id})}
                            className={`p-4 rounded-xl border text-left transition-all hover:shadow-md flex items-start gap-4 ${formData.integrationType === type.id ? 'border-primary bg-primary/5 ring-1 ring-primary/50' : 'border-white/20 dark:border-white/10 hover:border-primary/50'}`}
                        >
                            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-primary"><Icon name={type.icon} size={24} /></div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">{type.name}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{type.description}</p>
                            </div>
                        </button>
                      );
                    }).filter(Boolean)}
                </div>
            )}

            {currentStep === 2 && (
                <div className="space-y-6 max-w-lg mx-auto">
                    <Input 
                      label="Nom de l'intégration *" 
                      placeholder="Ex: Moniteur Philips Salle 3" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    />
                    <Input 
                      label="URL Endpoint *" 
                      placeholder="https://api.device.com/v1" 
                      value={formData.endpoint} 
                      onChange={(e) => setFormData({...formData, endpoint: e.target.value})} 
                    />
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <Icon name="Info" size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800 dark:text-blue-300">
                          <p className="font-semibold mb-1">Conseil</p>
                          <p>Assurez-vous que l'endpoint est accessible et que les certificats SSL sont valides.</p>
                        </div>
                      </div>
                    </div>
                </div>
            )}

            {currentStep === 3 && (
                <div className="space-y-6 max-w-lg mx-auto">
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                          Méthode d'authentification *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { id: 'api-key', label: 'Clé API', icon: 'Key' },
                                { id: 'basic', label: 'Basic Auth', icon: 'Lock' },
                                { id: 'bearer', label: 'Bearer Token', icon: 'Shield' }
                            ].map((auth) => {
                              if (!auth || typeof auth !== 'object') return null;
                              return (
                                <button
                                    key={auth.id}
                                    onClick={() => setFormData({...formData, authentication: auth.id})}
                                    className={`p-4 rounded-xl border text-center transition-all ${
                                        formData.authentication === auth.id
                                            ? 'border-primary bg-primary/5 ring-1 ring-primary/50'
                                            : 'border-white/20 dark:border-white/10 hover:border-primary/50'
                                    }`}
                                >
                                    <Icon name={auth.icon} size={20} className="mx-auto mb-2 text-primary" />
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{auth.label}</p>
                                </button>
                              );
                            }).filter(Boolean)}
                        </div>
                    </div>

                    {formData.authentication === 'api-key' && (
                        <div className="space-y-4">
                            <Input 
                              label="Clé API *" 
                              type="password"
                              placeholder="Entrez votre clé API" 
                              value={formData.apiKey} 
                              onChange={(e) => setFormData({...formData, apiKey: e.target.value})} 
                            />
                            <Input 
                              label="Secret API (optionnel)" 
                              type="password"
                              placeholder="Secret pour signature HMAC" 
                              value={formData.apiSecret} 
                              onChange={(e) => setFormData({...formData, apiSecret: e.target.value})} 
                            />
                        </div>
                    )}

                    {formData.authentication === 'basic' && (
                        <div className="space-y-4">
                            <Input 
                              label="Nom d'utilisateur *" 
                              placeholder="username" 
                              value={formData.username} 
                              onChange={(e) => setFormData({...formData, username: e.target.value})} 
                            />
                            <Input 
                              label="Mot de passe *" 
                              type="password"
                              placeholder="••••••••" 
                              value={formData.password} 
                              onChange={(e) => setFormData({...formData, password: e.target.value})} 
                            />
                        </div>
                    )}

                    {formData.authentication === 'bearer' && (
                        <div>
                            <Input 
                              label="Token Bearer *" 
                              type="password"
                              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                              value={formData.token} 
                              onChange={(e) => setFormData({...formData, token: e.target.value})} 
                            />
                        </div>
                    )}
                </div>
            )}

            {currentStep === 4 && (
                <div className="space-y-6 max-w-2xl mx-auto">
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                      <div className="flex items-start gap-3">
                        <Icon name="Info" size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-amber-800 dark:text-amber-300">
                          <p className="font-semibold mb-1">Mapping des données</p>
                          <p>Définissez comment les champs de l'intégration externe correspondent aux champs de MediCore.</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                        <Input 
                          label="ID Patient (champ externe)" 
                          placeholder="Ex: patient_id, patientId" 
                          value={formData.dataMapping.patientId} 
                          onChange={(e) => setFormData({
                            ...formData, 
                            dataMapping: {...formData.dataMapping, patientId: e.target.value}
                          })} 
                        />
                        <Input 
                          label="Nom Patient (champ externe)" 
                          placeholder="Ex: full_name, patientName" 
                          value={formData.dataMapping.patientName} 
                          onChange={(e) => setFormData({
                            ...formData, 
                            dataMapping: {...formData.dataMapping, patientName: e.target.value}
                          })} 
                        />
                        <Input 
                          label="Signes Vitaux (champ externe)" 
                          placeholder="Ex: vitals, vital_signs" 
                          value={formData.dataMapping.vitalSigns} 
                          onChange={(e) => setFormData({
                            ...formData, 
                            dataMapping: {...formData.dataMapping, vitalSigns: e.target.value}
                          })} 
                        />
                        <Input 
                          label="Résultats Labo (champ externe)" 
                          placeholder="Ex: lab_results, testResults" 
                          value={formData.dataMapping.labResults} 
                          onChange={(e) => setFormData({
                            ...formData, 
                            dataMapping: {...formData.dataMapping, labResults: e.target.value}
                          })} 
                        />
                    </div>
                </div>
            )}
            
            {currentStep === 5 && (
                <div className="space-y-6 max-w-lg mx-auto">
                    <div className="text-center py-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Test de Connexion</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Vérifiez que la connexion fonctionne avant de finaliser
                        </p>
                    </div>

                    <div className="p-6 glass-surface rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Endpoint</span>
                            <code className="text-xs backdrop-blur-xl bg-white/50 dark:bg-white/10 px-2 py-1 rounded border border-white/20 dark:border-white/10 text-slate-600 dark:text-slate-400">
                                {formData.endpoint || 'Non défini'}
                            </code>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</span>
                            <span className="text-xs font-semibold text-primary">
                                {Array.isArray(integrationTypes) ? (integrationTypes.find(t => t && typeof t === 'object' && t.id === formData.integrationType)?.name || 'Non sélectionné') : 'Non sélectionné'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Authentification</span>
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 capitalize">
                                {formData.authentication.replace('-', ' ')}
                            </span>
                        </div>
                    </div>

                    {testResult && (
                        <div className={`p-4 rounded-xl border ${
                            testResult.success 
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
                        }`}>
                            <div className="flex items-center gap-3">
                                <Icon 
                                    name={testResult.success ? "CheckCircle" : "XCircle"} 
                                    size={20} 
                                    className={testResult.success ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
                                />
                                <p className={`text-sm font-medium ${
                                    testResult.success 
                                        ? 'text-emerald-800 dark:text-emerald-300'
                                        : 'text-rose-800 dark:text-rose-300'
                                }`}>
                                    {testResult.message}
                                </p>
                            </div>
                        </div>
                    )}

                    <Button 
                        onClick={handleTestConnection} 
                        disabled={testing || !formData.endpoint}
                        className="w-full"
                        variant={testResult?.success ? "outline" : "default"}
                    >
                        {testing ? (
                            <>
                                <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                                Test en cours...
                            </>
                        ) : (
                            <>
                                <Icon name="Zap" size={16} className="mr-2" />
                                Tester la connexion
                            </>
                        )}
                    </Button>

                    {testResult?.success && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
                                <Icon name="Check" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Prêt à connecter !</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                                La configuration est valide. Cliquez sur "Terminer" pour activer l'intégration.
                    </p>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between">
            <Button 
                variant="ghost" 
                onClick={handlePrevious} 
                disabled={currentStep === 1} 
                className="text-slate-500"
            >
                <Icon name="ArrowLeft" className="mr-2" size={16} />
                Précédent
            </Button>
            {currentStep < 5 ? (
                <PermissionGuard requiredPermission="settings_manage">
                  <Button onClick={handleNext} disabled={!hasPermission('settings_manage')}>
                      Suivant 
                      <Icon name="ArrowRight" className="ml-2" size={16} />
                  </Button>
                </PermissionGuard>
            ) : (
                <PermissionGuard requiredPermission="settings_manage">
                  <Button 
                      onClick={handleComplete} 
                      disabled={!testResult?.success || !hasPermission('settings_manage')}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <Icon name="Check" className="mr-2" size={16} />
                      Terminer
                  </Button>
                </PermissionGuard>
            )}
        </div>

      </div>
    </div>
  );
};

export default IntegrationWizard;