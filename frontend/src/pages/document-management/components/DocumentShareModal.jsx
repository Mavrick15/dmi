import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import AnimatedModal from '../../../components/ui/AnimatedModal';
import { useDocumentMutations } from '../../../hooks/useDocuments';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/axios';
import { useAuth } from '../../../contexts/AuthContext';

// Partage réservé aux docteurs uniquement
const ROLES_DOCTEURS = [{ value: 'docteur', label: 'Tous les docteurs' }];

const DocumentShareModal = ({ document, isOpen, onClose }) => {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [permission, setPermission] = useState('read');
  const [expiresAt, setExpiresAt] = useState('');
  const { shareDocument } = useDocumentMutations();

  const { data: usersData } = useQuery({
    queryKey: ['users', 'list'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.data || [];
    },
    enabled: isOpen
  });

  if (!isOpen || !document) return null;

  const noSelection = (Array.isArray(selectedUserIds) ? selectedUserIds.length : 0) === 0 &&
    (Array.isArray(selectedRoleIds) ? selectedRoleIds.length : 0) === 0;
  const canSubmit = !noSelection && hasPermission('document_share') && !shareDocument.isPending;

  const handleShare = async () => {
    if (noSelection) return;
    try {
      await shareDocument.mutateAsync({
        id: document.id,
        userIds: selectedUserIds,
        roleIds: selectedRoleIds,
        permission,
        expiresAt: expiresAt || null
      });
      onClose();
    } catch (error) {
      // Erreur gérée par le hook
    }
  };

  const toggleUser = (userId) => {
    setSelectedUserIds(prev => {
      const arr = Array.isArray(prev) ? prev : [];
      return arr.includes(userId) ? arr.filter(id => id !== userId) : [...arr, userId];
    });
  };

  const toggleRole = (roleId) => {
    setSelectedRoleIds(prev => {
      const arr = Array.isArray(prev) ? prev : [];
      return arr.includes(roleId) ? arr.filter(id => id !== roleId) : [...arr, roleId];
    });
  };

  const users = Array.isArray(usersData)
    ? usersData.filter(u => u && typeof u === 'object' && u.id !== user?.id && u.actif !== false && (u.role === 'docteur' || u.role === 'Docteur'))
    : [];

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Icon name="Share2" size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Partager le document</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px]" title={document.title}>
                {document.title || document.originalName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fermer"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0">
          {/* Rubrique Partage (docteurs uniquement) */}
          <div className="flex items-center gap-2 pb-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Partage du document</span>
            <span className="flex-1 h-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Les documents ne peuvent être partagés qu&apos;avec des médecins. Chaque médecin concerné sera notifié.</p>

          {/* Permission */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-4">
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Niveau d'accès</p>
            <Select
              options={[
                { value: 'read', label: 'Lecture seule' },
                { value: 'write', label: 'Lecture et écriture' },
                { value: 'delete', label: 'Lecture, écriture et suppression' }
              ]}
              value={permission}
              onChange={setPermission}
            />
          </div>

          {/* Médecins (sélection individuelle) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden">
            <p className="text-sm font-bold text-slate-900 dark:text-white px-4 pt-4 pb-2">Médecins</p>
            <div className="max-h-44 overflow-y-auto px-4 pb-4">
              {users.length > 0 ? (
                <ul className="space-y-1">
                  {users.map((u) => (
                    <li key={u.id}>
                      <label className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(u.id)}
                          onChange={() => toggleUser(u.id)}
                          className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary/20"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-slate-900 dark:text-white block truncate">
                            {u.nomComplet || u.email}
                          </span>
                          {u.role && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">{u.role}</span>
                          )}
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">Aucun médecin disponible pour le partage.</p>
              )}
            </div>
          </div>

          {/* Rôles (docteurs uniquement) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 shadow-sm p-4">
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-3">Partager avec un rôle</p>
            <div className="flex flex-wrap gap-2">
              {ROLES_DOCTEURS.map((role) => (
                <label
                  key={role.value}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 dark:has-[:checked]:bg-primary/10"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.value)}
                    onChange={() => toggleRole(role.value)}
                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary/20"
                  />
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Expiration */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-4">
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Expiration (optionnel)</p>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">L'accès expirera automatiquement à cette date.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-6 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <PermissionGuard requiredPermission="document_share">
            <Button
              onClick={handleShare}
              disabled={!canSubmit}
            >
              {shareDocument.isPending ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Partage en cours...
                </>
              ) : (
                <>
                  <Icon name="Share2" size={16} className="mr-2" />
                  Partager
                </>
              )}
            </Button>
          </PermissionGuard>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default DocumentShareModal;

