import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import api from '../../../lib/axios';
import { useToast } from '../../../contexts/ToastContext';

const ExportData = () => {
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(null);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const response = await api.get(`/export/${type}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: 'text/csv'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast(`Export ${type} réussi`, 'success');
    } catch (error) {
      showToast(error.userMessage || `Erreur lors de l'export ${type}`, 'error');
    } finally {
      setExporting(null);
    }
  };

  const exportOptions = [
    { id: 'users', label: 'Utilisateurs', icon: 'Users', description: 'Export de tous les utilisateurs (CSV)', permission: 'user_view' },
    { id: 'patients', label: 'Patients', icon: 'UserCheck', description: 'Export de tous les patients (CSV)', permission: 'patient_view' },
    { id: 'consultations', label: 'Consultations', icon: 'Stethoscope', description: 'Export des consultations (CSV)', permission: 'clinical_view' },
    { id: 'invoices', label: 'Factures', icon: 'FileText', description: 'Export des factures (CSV)', permission: 'billing_view' },
    { id: 'establishments', label: 'Établissements', icon: 'Building2', description: 'Export des établissements (CSV)', permission: 'settings_manage' },
    { id: 'audit', label: 'Logs d\'Audit', icon: 'Activity', description: 'Export des logs d\'audit (CSV)', permission: 'audit_view' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Export de Données</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Téléchargez les données au format CSV/Excel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.isArray(exportOptions) && exportOptions.map((option) => {
          if (!option || typeof option !== 'object') return null;
          return (
            <motion.div
            key={option.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <Icon name={option.icon} size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                  {option.label}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  {option.description}
                </p>
                <PermissionGuard requiredPermission={option.permission || 'audit_view'}>
                  <Button
                    onClick={() => handleExport(option.id)}
                    loading={exporting === option.id}
                    disabled={exporting !== null || !hasPermission(option.permission || 'audit_view')}
                    size="sm"
                    variant="outline"
                    iconName="Download"
                    className="w-full"
                  >
                    Exporter
                  </Button>
                </PermissionGuard>
              </div>
            </div>
          </motion.div>
          );
        }).filter(Boolean)}
      </div>
    </div>
  );
};

export default ExportData;

