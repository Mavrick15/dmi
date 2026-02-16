import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import PermissionGuard from '../../components/PermissionGuard';
import ComplianceOverview from './components/ComplianceOverview';
import AuditTrailMonitor from './components/AuditTrailMonitor';
import RegulatoryReports from './components/RegulatoryReports';
import SecurityAlerts from './components/SecurityAlerts';
import ComplianceTraining from './components/ComplianceTraining';
import { usePermissions } from '../../hooks/usePermissions';

const ComplianceDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const { hasPermission } = usePermissions();

  const navigationSections = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: 'LayoutDashboard' },
    { id: 'audit', label: 'Audit & Logs', icon: 'Activity' },
    { id: 'alerts', label: 'Alertes Sécurité', icon: 'AlertTriangle' },
    { id: 'reports', label: 'Rapports', icon: 'FileText' },
    { id: 'training', label: 'Formation', icon: 'GraduationCap' }
  ];

  // Animation pour le changement de section
  const variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview': return <ComplianceOverview />;
      case 'audit': return <AuditTrailMonitor />;
      case 'alerts': return <SecurityAlerts />;
      case 'reports': return <RegulatoryReports />;
      case 'training': return <ComplianceTraining />;
      default: return <ComplianceOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <Helmet>
        <title>Conformité & Sécurité - MediCore DMI</title>
        <meta name="description" content="Tableau de bord de conformité HIPAA, audit et sécurité." />
      </Helmet>

      <Header />

      <main className="pt-24 w-full max-w-[1600px] mx-auto px-6 lg:px-8 pb-12">
        
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center text-primary dark:text-blue-400 border border-primary/10 dark:border-primary/20 shadow-sm"
            >
              <Icon name="ShieldCheck" size={24} />
            </motion.div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                Conformité & Sécurité
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
                Surveillance réglementaire et protection des données
              </p>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <PermissionGuard requiredPermission="audit_view">
              <Button variant="outline" iconName="Download" className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 hover-lift" disabled={!hasPermission('audit_view')}>Rapport</Button>
            </PermissionGuard>
            <PermissionGuard requiredPermission="audit_view">
              <Button variant="default" iconName="Plus" className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all" disabled={!hasPermission('audit_view')}>Audit</Button>
            </PermissionGuard>
          </motion.div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex overflow-x-auto pb-1 mb-8 border-b border-slate-200 dark:border-slate-800 gap-6"
        >
          {Array.isArray(navigationSections) && navigationSections.map((section) => {
            if (!section || typeof section !== 'object') return null;
            return (
            <motion.button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              whileHover={{ y: -2 }}
              className={`
                relative flex items-center gap-2 pb-3 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap
                ${activeSection === section.id 
                  ? 'border-primary text-primary dark:text-blue-400' 
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300'
                }
              `}
            >
              <Icon name={section.icon} size={18} />
              {section.label}
            </motion.button>
            );
          }).filter(Boolean)}
        </motion.div>

        {/* Dynamic Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Main Content Area (2/3 width on large screens) */}
           <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  variants={variants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {renderActiveSection()}
                </motion.div>
              </AnimatePresence>
           </div>

           {/* Sidebar Area (1/3 width) - Always visible widgets */}
           <div className="space-y-8">
              <SecurityAlerts />
              <ComplianceTraining />
           </div>
        </div>

      </main>
    </div>
  );
};

export default ComplianceDashboard;