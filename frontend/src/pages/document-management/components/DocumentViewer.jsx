// openclinic/frontend/src/pages/document-management/components/DocumentViewer.jsx

import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuth } from '../../../contexts/AuthContext';

const DocumentViewer = ({ document, isOpen, onClose, onSign, onDownload }) => {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !document) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoomLevel(100);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getPreviewUrl = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1';
    const token = localStorage.getItem('auth_token');
    return `${API_URL}/documents/${document.id}/preview?token=${token}`;
  };

  const isOwner = document?.uploadedBy && user?.id && document.uploadedBy === user.id;
  const canSign = isOwner && document.mimeType === 'application/pdf' && !document.title?.includes('(Signé)');
  const isPdf = document.mimeType === 'application/pdf';
  const isImage = document.mimeType?.startsWith('image');

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Aperçu du document"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-6xl max-h-[calc(100vh-3rem)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between gap-4 p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
              <Icon name="FileText" size={20} className="text-primary dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-white truncate text-sm">
                {document.title || document.originalName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="uppercase font-medium">{document.mimeType ? document.mimeType.split('/')[1] : 'Fichier'}</span>
                <span>·</span>
                <span>{formatFileSize(document.size)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canSign && (
              <PermissionGuard requiredPermission="document_sign">
                <Button variant="default" size="sm" onClick={onSign} disabled={!hasPermission('document_sign')} className="bg-emerald-600 hover:bg-emerald-700">
                  <Icon name="PenTool" size={14} className="mr-1.5" /> Signer
                </Button>
              </PermissionGuard>
            )}
            <PermissionGuard requiredPermission="document_view">
              <Button variant="outline" size="sm" onClick={() => onDownload?.(document)} disabled={!hasPermission('document_view')} title="Télécharger" className="dark:border-slate-600 dark:text-slate-300">
                <Icon name="Download" size={16} />
              </Button>
            </PermissionGuard>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
              title="Fermer"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
        </div>

        {/* Barre zoom (images uniquement, le PDF gère son propre zoom navigateur) */}
        {isImage && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1">
              <button type="button" onClick={handleZoomOut} disabled={zoomLevel <= 50} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-40 transition-colors">
                <Icon name="Minus" size={14} />
              </button>
              <button type="button" onClick={handleResetZoom} className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 min-w-[3rem] tabular-nums">
                {zoomLevel}%
              </button>
              <button type="button" onClick={handleZoomIn} disabled={zoomLevel >= 200} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-40 transition-colors">
                <Icon name="Plus" size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Contenu */}
        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 min-h-0 flex items-start justify-center p-4">
          {isImage && (
            <div
              className="bg-white dark:bg-slate-900 rounded-lg shadow-lg overflow-hidden transition-transform origin-top"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              <img src={getPreviewUrl()} alt={document.title || 'Aperçu'} className="max-w-full h-auto block" />
            </div>
          )}
          {isPdf && (
            <iframe
              src={getPreviewUrl()}
              title="Aperçu PDF"
              className="w-full min-h-[600px] flex-1 rounded-lg border-0 bg-white dark:bg-slate-900"
              style={{ minHeight: '70vh' }}
            />
          )}
          {!isImage && !isPdf && (
            <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-8 flex flex-col items-center justify-center text-center">
              <Icon name="FileText" size={40} className="text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Aperçu non disponible pour ce type de fichier.</p>
              <Button size="sm" onClick={() => onDownload?.(document)}>Télécharger</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;