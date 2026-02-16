import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Select from '../../../components/ui/Select';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { useDocumentMutations } from '../../../hooks/useDocuments';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DocumentApprovalWorkflow = ({ document, isOpen, onClose }) => {
  const { hasPermission } = usePermissions();
  const [approvers, setApprovers] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const { createApprovalWorkflow, processApproval } = useDocumentMutations();

  // Récupérer les approbations existantes
  const { data: approvalsData, refetch } = useQuery({
    queryKey: ['documents', document?.id, 'approvals'],
    queryFn: async () => {
      // Cette route n'existe pas encore, on va la créer ou utiliser une route alternative
      // Pour l'instant, on retourne un tableau vide
      return [];
    },
    enabled: isOpen && !!document?.id
  });

  // Récupérer la liste des utilisateurs pour sélectionner les approbateurs
  const { data: usersData } = useQuery({
    queryKey: ['users', 'list'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.data || [];
    },
    enabled: isOpen
  });

  if (!isOpen || !document) return null;

  const handleAddApprover = () => {
    const approversArray = Array.isArray(approvers) ? approvers : [];
    setApprovers([...approversArray, { userId: '', stepNumber: approversArray.length + 1 }]);
  };

  const handleRemoveApprover = (index) => {
    const approversArray = Array.isArray(approvers) ? approvers : [];
    setApprovers(approversArray.filter((_, i) => i !== index));
  };

  const handleCreateWorkflow = async () => {
    const approversArray = Array.isArray(approvers) ? approvers : [];
    if (approversArray.length === 0) return;

    try {
      await createApprovalWorkflow.mutateAsync({
        id: document.id,
        approvers: approversArray.map((a, idx) => {
          if (!a || typeof a !== 'object') return null;
          return {
            userId: a.userId,
            stepNumber: idx + 1
          };
        }).filter(Boolean)
      });
      onClose();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur lors de la création du workflow:", error);
      }
    }
  };

  const handleProcessApproval = async (stepNumber, status, comment = '') => {
    try {
      await processApproval.mutateAsync({
        id: document.id,
        stepNumber,
        status,
        comment
      });
      refetch();
    } catch (error) {
      // Erreur gérée par le hook
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success" size="sm">Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="error" size="sm">Rejeté</Badge>;
      default:
        return <Badge variant="warning" size="sm">En attente</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
              <Icon name="CheckCircle" size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Workflow d'approbation</h3>
              <p className="text-sm text-slate-500 dark:text-400">{document.title}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Statut actuel */}
          {document.status && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Statut actuel
                  </p>
                  {getStatusBadge(document.status)}
                </div>
                {document.approvalStep > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Étape</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {document.approvalStep}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Créer un workflow */}
          {document.status === 'draft' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-900 dark:text-white">Créer un workflow</h4>
                <Button variant="outline" size="sm" onClick={handleAddApprover}>
                  <Icon name="Plus" size={16} className="mr-1.5" />
                  Ajouter un approbateur
                </Button>
              </div>

              {Array.isArray(approvers) && approvers.map((approver, index) => {
                if (!approver || typeof approver !== 'object') return null;
                return (
                  <div key={index} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {index + 1}
                      </span>
                    </div>
                    <Select
                      options={Array.isArray(usersData) ? usersData.map(u => {
                        if (!u || typeof u !== 'object') return null;
                        return { value: u.id, label: u.nomComplet || u.email || '' };
                      }).filter(Boolean) : []}
                      value={approver.userId}
                      onChange={(value) => {
                        const approversArray = Array.isArray(approvers) ? approvers : [];
                        const newApprovers = [...approversArray];
                        if (newApprovers[index]) {
                          newApprovers[index].userId = value;
                          setApprovers(newApprovers);
                        }
                      }}
                      placeholder="Sélectionner un approbateur"
                      className="flex-1"
                    />
                    <PermissionGuard requiredPermission="document_approve">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveApprover(index)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        disabled={!hasPermission('document_approve')}
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </PermissionGuard>
                  </div>
                );
              }).filter(Boolean)}

              {Array.isArray(approvers) && approvers.length > 0 && (
                <PermissionGuard requiredPermission="document_approve">
                  <Button
                    onClick={handleCreateWorkflow}
                    disabled={createApprovalWorkflow.isPending || approvers.some(a => !a || !a.userId) || !hasPermission('document_approve')}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                  >
                  {createApprovalWorkflow.isPending ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <Icon name="CheckCircle" size={16} className="mr-2" />
                      Créer le workflow
                    </>
                  )}
                  </Button>
                </PermissionGuard>
              )}
            </div>
          )}

          {/* Workflow existant */}
          {document.status === 'pending_approval' && Array.isArray(approvalsData) && approvalsData.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-white">Étapes d'approbation</h4>
              {approvalsData.map((approval, index) => {
                if (!approval || typeof approval !== 'object') return null;
                return (
                <div
                  key={approval.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          {approval.stepNumber}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {approval.approver?.nomComplet || 'Approbateur'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Étape {approval.stepNumber}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(approval.status)}
                  </div>
                  {approval.comment && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 italic">
                      "{approval.comment}"
                    </p>
                  )}
                  {approval.status === 'pending' && (
                    <PermissionGuard requiredPermission="document_approve">
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleProcessApproval(approval.stepNumber, 'approved')}
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          disabled={!hasPermission('document_approve')}
                        >
                          <Icon name="Check" size={14} className="mr-1.5" />
                          Approuver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleProcessApproval(approval.stepNumber, 'rejected')}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          disabled={!hasPermission('document_approve')}
                        >
                          <Icon name="X" size={14} className="mr-1.5" />
                          Rejeter
                        </Button>
                      </div>
                    </PermissionGuard>
                  )}
                </div>
                );
              }).filter(Boolean)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default DocumentApprovalWorkflow;

