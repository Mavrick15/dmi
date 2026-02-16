import React, { useState, useEffect } from 'react';
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

const DocumentShareModal = ({ document, isOpen, onClose }) => {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [permission, setPermission] = useState('read');
  const [expiresAt, setExpiresAt] = useState('');
  const { shareDocument } = useDocumentMutations();

  // Récupérer la liste des utilisateurs
  const { data: usersData } = useQuery({
    queryKey: ['users', 'list'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.data || [];
    },
    enabled: isOpen
  });

  // Récupérer la liste des rôles
  const roles = [
    { value: 'docteur', label: 'Docteurs' },
    { value: 'infirmiere', label: 'Infirmières' },
    { value: 'pharmacien', label: 'Pharmaciens' },
    { value: 'gestionnaire', label: 'Gestionnaires' },
    { value: 'admin', label: 'Administrateurs' }
  ];

  if (!isOpen || !document) return null;

  const handleShare = async () => {
    if (selectedUserIds.length === 0 && selectedRoleIds.length === 0) {
      return;
    }

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
      const prevArray = Array.isArray(prev) ? prev : [];
      return prevArray.includes(userId) 
        ? prevArray.filter(id => id !== userId)
        : [...prevArray, userId];
    });
  };

  const toggleRole = (roleId) => {
    setSelectedRoleIds(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      return prevArray.includes(roleId) 
        ? prevArray.filter(id => id !== roleId)
        : [...prevArray, roleId];
    });
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
              <Icon name="Share2" size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Partager le document</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{document.title}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Permission */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Permission
            </label>
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

          {/* Utilisateurs */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Utilisateurs
            </label>
            <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              {Array.isArray(usersData) && usersData.length > 0 ? (
                usersData
                  .filter(u => {
                    if (!u || typeof u !== 'object') return false;
                    return u.id !== user?.id && u.actif !== false;
                  })
                  .map((user) => {
                    if (!user || typeof user !== 'object') return null;
                    return (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => toggleUser(user.id)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {user.nomComplet || user.email}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.role}</p>
                      </div>
                    </label>
                    );
                  }).filter(Boolean)
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
                  Aucun utilisateur disponible
                </p>
              )}
            </div>
          </div>

          {/* Rôles */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Rôles
            </label>
            <div className="space-y-2">
              {Array.isArray(roles) && roles.map((role) => {
                if (!role || typeof role !== 'object') return null;
                return (
                  <label
                    key={role.value || Math.random()}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={Array.isArray(selectedRoleIds) && selectedRoleIds.includes(role.value)}
                      onChange={() => toggleRole(role.value)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {role.label || ''}
                    </span>
                  </label>
                );
              }).filter(Boolean)}
            </div>
          </div>

          {/* Expiration */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Expiration (optionnel)
            </label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              L'accès expirera automatiquement à cette date
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <PermissionGuard requiredPermission="document_share">
            <Button
              onClick={handleShare}
              disabled={shareDocument.isPending || (Array.isArray(selectedUserIds) ? selectedUserIds.length === 0 : true) && (Array.isArray(selectedRoleIds) ? selectedRoleIds.length === 0 : true) || !hasPermission('document_share')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
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

