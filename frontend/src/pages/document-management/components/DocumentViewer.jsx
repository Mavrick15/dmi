// openclinic/frontend/src/pages/document-management/components/DocumentViewer.jsx

import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import Image from '../../../components/AppImage';
import { useAuth } from '../../../contexts/AuthContext';

const DocumentViewer = ({ document, isOpen, onClose, onSign, onDownload, onShare }) => { // <-- NOTEZ la prop onSign
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);

  if (!isOpen || !document) return null;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoomLevel(100);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // --- CONSTRUCTION DE L'URL DE PRÉVISUALISATION ---
  const getPreviewUrl = () => {
     // Utilisation de la variable d'environnement VITE_API_URL
     // Si elle n'est pas définie, on garde localhost comme fallback de sécurité
     const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1';
     
     const token = localStorage.getItem('auth_token');
     
     // On ajoute le token dans l'URL pour que le backend Adonis autorise l'accès à l'image
     return `${API_URL}/documents/${document.id}/preview?token=${token}`;
  };
  
  // Vérifie si le document est un PDF, n'est pas déjà signé, et si l'utilisateur est un docteur
  const isDoctor = user?.role === 'docteur' || user?.role === 'admin';
  const canSign = isDoctor && document.mimeType === 'application/pdf' && !document.title.includes('(Signé)');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
              <Icon name="FileText" size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{document.title || document.originalName}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="uppercase font-semibold">{document.mimeType ? document.mimeType.split('/')[1] : 'Fichier'}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                <span>{formatFileSize(document.size)}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* BOUTON SIGNER AJOUTÉ */}
            {canSign && (
                <PermissionGuard requiredPermission="document_sign">
                  <Button 
                      variant="success" 
                      size="sm" 
                      onClick={onSign} 
                      className="shadow-md shadow-emerald-500/20"
                      disabled={!hasPermission('document_sign')}
                  >
                      <Icon name="PenTool" size={16} className="mr-2" /> Signer
                  </Button>
                </PermissionGuard>
            )}
            
            <PermissionGuard requiredPermission="document_view">
              <Button variant="outline" size="icon" onClick={() => onDownload?.(document)} className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" title="Télécharger" disabled={!hasPermission('document_view')}>
                <Icon name="Download" size={18} />
              </Button>
            </PermissionGuard>
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500">
              <Icon name="X" size={24} />
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 shadow-sm">
            <button onClick={handleZoomOut} disabled={zoomLevel <= 50} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30">
              <Icon name="Minus" size={16} />
            </button>
            <span className="px-2 text-xs font-medium text-slate-700 dark:text-slate-200 min-w-[3.5rem] text-center">{zoomLevel}%</span>
            <button onClick={handleZoomIn} disabled={zoomLevel >= 200} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30">
              <Icon name="Plus" size={16} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 p-8 flex items-start justify-center relative">
          <div 
            className="relative bg-white shadow-2xl transition-transform duration-200 ease-out origin-top"
            style={{ transform: `scale(${zoomLevel / 100})`, width: 'fit-content', maxWidth: '100%' }}
          >
            {/* Si Image */}
            {document.mimeType && document.mimeType.startsWith('image') ? (
              <img
                src={getPreviewUrl()}
                alt={document.title}
                className="max-w-full h-auto block"
              />
            ) : document.mimeType === 'application/pdf' ? (
              /* Si PDF, on utilise une iframe ou un embed pointant vers l'URL preview */
              <iframe 
                src={getPreviewUrl()} 
                className="w-[800px] h-[1000px]" 
                title="PDF Preview"
              />
            ) : (
              /* Fallback pour fichiers non prévisualisables */
              <div className="w-[500px] h-[300px] flex flex-col items-center justify-center p-8 text-center">
                <Icon name="FileText" size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-500 mb-4">Aperçu non disponible pour ce type de fichier.</p>
                <Button onClick={() => onDownload?.(document)}>Télécharger le fichier</Button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DocumentViewer;