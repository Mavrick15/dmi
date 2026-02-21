import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import PermissionGuard from '../../components/PermissionGuard';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import MobileFeatureCard from './components/MobileFeatureCard';
import OfflineIndicator from './components/OfflineIndicator';
import QuickActionGrid from './components/QuickActionGrid';
import SyncStatusPanel from './components/SyncStatusPanel';
import EmergencyConsultationPanel from './components/EmergencyConsultationPanel';
import DeviceIntegrationPanel from './components/DeviceIntegrationPanel';
import { useSyncStatus, useMobileMutations } from '../../hooks/useMobile';
import { useDashboardData } from '../../hooks/useDashboard';
import { useAppointments } from '../../hooks/useAppointments';
import { useToast } from '../../contexts/ToastContext';
import { usePermissions } from '../../hooks/usePermissions';
import { getTodayInBusinessTimezone } from '../../utils/dateTime';
import { formatNotificationMessage } from '../../utils/notificationMessage';

const MobileCompanion = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const { data: syncStatus, isLoading: loadingSync } = useSyncStatus();
  const { data: dashboardData } = useDashboardData();
  const { data: appointments = [] } = useAppointments({ date: getTodayInBusinessTimezone() });
  const { triggerSync } = useMobileMutations();
  
  // Protéger les données
  const appointmentsArray = Array.isArray(appointments) ? appointments : [];

  // Générer les notifications depuis les données réelles
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const generatedNotifications = [];
    
    // Notifications depuis le dashboard
    if (dashboardData?.metrics?.alerts > 0) {
      generatedNotifications.push({
        id: 'alert-1',
        title: 'Alertes Urgentes',
        message: `${dashboardData.metrics.alerts} alerte(s) nécessite(nt) votre attention`,
        time: 'Maintenant',
        icon: 'AlertTriangle',
        priority: 'critical'
      });
    }

    // Notifications depuis les rendez-vous
    if (appointmentsArray && appointmentsArray.length > 0) {
      const nextAppointment = appointmentsArray.find(apt => apt && typeof apt === 'object' && apt.status === 'programme');
      if (nextAppointment) {
        generatedNotifications.push({
          id: 'apt-1',
          title: 'Rendez-vous à venir',
          message: `${nextAppointment.patientName || 'Patient'} - ${nextAppointment.time || 'N/A'}`,
          time: 'Bientôt',
          icon: 'Calendar',
          priority: 'high'
        });
      }
    }

    setNotifications(generatedNotifications);
  }, [dashboardData, appointmentsArray]);

  // Features data with updated styling props
  const mobileFeatures = [
    { icon: 'Stethoscope', title: 'Outils Cliniques', description: 'Aide au diagnostic & protocoles', status: 'active', lastSync: '5 min', onClick: () => navigate('/clinical-console') },
    { icon: 'Pill', title: 'Gestion Médicaments', description: 'Interactions & stocks', status: 'syncing', lastSync: 'En cours', badge: '3', onClick: () => navigate('/pharmacy-operations') },
    { icon: 'FileText', title: 'Scanner Documents', description: 'Numérisation & upload', status: 'active', lastSync: '1h', gradient: true },
    { icon: 'BarChart3', title: 'Tableau de Bord', description: 'Métriques temps réel', status: 'active', lastSync: '10 min', onClick: () => navigate('/analytics-center') },
    { icon: 'Shield', title: 'Conformité', description: 'Audit & sécurité', status: 'active', lastSync: '30 min', badge: '2', onClick: () => navigate('/compliance-dashboard') }
  ];

  const recentNotifications = [
    { id: 1, title: 'Alerte Urgence', message: 'Patient E. Thompson nécessite attention', time: '2 min', icon: 'AlertTriangle', priority: 'critical' },
    { id: 2, title: 'Rendez-vous', message: 'Consultation Dr. Rodriguez dans 15 min', time: '13 min', icon: 'Calendar', priority: 'high' },
    { id: 3, title: 'Résultats Labo', message: 'Analyses sanguines disponibles', time: '1h', icon: 'FileText', priority: 'medium' }
  ];

  const tabs = [
    { id: 'overview', label: 'Accueil', icon: 'LayoutDashboard' },
    { id: 'emergency', label: 'Urgence', icon: 'AlertTriangle' },
    { id: 'sync', label: 'Sync', icon: 'RefreshCw' },
    { id: 'devices', label: 'Appareils', icon: 'Smartphone' }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'border-l-rose-500 bg-rose-50 dark:bg-rose-900/10';
      case 'high': return 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10';
      case 'medium': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      default: return 'border-l-slate-300 bg-slate-50 dark:bg-slate-800/50';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
                <PWAInstallPrompt />
                <OfflineIndicator />
            </div>
            
            <section>
                <QuickActionGrid onActionClick={(id) => {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('Action clicked:', id);
                  }
                }} />
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white px-1">Fonctionnalités</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.isArray(mobileFeatures) && mobileFeatures.map((feature, index) => {
                  if (!feature || typeof feature !== 'object') return null;
                  return (
                    <MobileFeatureCard key={index} {...feature} />
                  );
                }).filter(Boolean)}
              </div>
            </section>

            <section className="backdrop-blur-xl bg-white/50 dark:bg-white/10 border border-white/20 dark:border-white/10 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notifications</h3>
                <Button variant="ghost" size="sm" className="text-xs">Voir tout</Button>
              </div>
              <div className="space-y-3">
                {Array.isArray(recentNotifications) && recentNotifications.map((n) => {
                  if (!n || typeof n !== 'object') return null;
                  return (
                  <div key={n.id} className={`p-4 rounded-xl border-l-4 border border-slate-100 dark:border-slate-800 ${getPriorityColor(n.priority)}`}>
                    <div className="flex items-start gap-3">
                      <Icon name={n.icon} size={18} className="mt-0.5 opacity-70" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                             <h4 className="font-bold text-sm text-slate-900 dark:text-white">{n.title}</h4>
                             <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{formatNotificationMessage(n.message) || 'Aucun message'}</p>
                      </div>
                    </div>
                  </div>
                  );
                }).filter(Boolean)}
              </div>
            </section>
          </div>
        );
      case 'emergency': return <div className="animate-fade-in"><EmergencyConsultationPanel /></div>;
      case 'sync': return <div className="animate-fade-in"><SyncStatusPanel /></div>;
      case 'devices': return <div className="animate-fade-in"><DeviceIntegrationPanel /></div>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <Header />
      
      <main className="pt-24 pb-24 w-full max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Mobile Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 px-1"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center text-primary dark:text-blue-400 border border-primary/10 dark:border-primary/20 shadow-sm"
          >
            <Icon name="Smartphone" size={22} />
          </motion.div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight mb-1">Compagnon Mobile</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Assistant connecté & sécurisé</p>
          </div>
        </motion.div>

        {/* Navigation Tabs (Sticky) */}
        <div className="sticky top-24 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-2 mb-4 -mx-4 px-4 border-b border-white/20 dark:border-white/10">
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {Array.isArray(tabs) && tabs.map((tab) => {
              if (!tab || typeof tab !== 'object') return null;
              return (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-white/20 dark:border-white/10'
                  }
                `}
              >
                <Icon name={tab.icon} size={16} />
                <span>{tab.label}</span>
              </button>
              );
            }).filter(Boolean)}
          </div>
        </div>

        {renderTabContent()}
      </main>
    </div>
  );
};

export default MobileCompanion;