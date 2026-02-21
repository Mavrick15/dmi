import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import AnimatedModal from '../../../components/ui/AnimatedModal';

const DocumentSigningModal = ({ isOpen, onClose, onConfirm, documentTitle, isSigning }) => {
  const sigCanvas = useRef({});
  const [isEmpty, setIsEmpty] = useState(true);

  const clear = () => {
    sigCanvas.current.clear();
    setIsEmpty(true);
  };

  const handleEnd = () => {
    setIsEmpty(sigCanvas.current.isEmpty());
  };

  const handleSave = () => {
    if (isEmpty) return;
    const signatureDataURL = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    onConfirm(signatureDataURL);
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div className="glass-panel w-full max-w-lg shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Icon name="PenTool" size={20} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Signer le document</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[240px]" title={documentTitle}>
                {documentTitle || 'Document'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Fermer"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Canvas Zone */}
        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center">
          <div className="rounded-xl border-2 border-dashed border-white/40 dark:border-white/20 glass-surface overflow-hidden">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{
                width: 400,
                height: 200,
                className: 'cursor-crosshair w-full'
              }}
              onEnd={handleEnd}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
            Dessinez votre signature dans le cadre ci-dessus
          </p>
        </div>

        {/* Footer */}
        <div className="px-3 py-1.5 border-t border-white/20 dark:border-white/10 flex justify-between items-center gap-4 shrink-0">
          <Button
            variant="ghost"
            onClick={clear}
            className="text-slate-500 hover:text-red-500 dark:hover:text-red-400"
            disabled={isSigning}
          >
            <Icon name="Eraser" size={16} className="mr-2" />
            Effacer
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSigning}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={isEmpty || isSigning}
              loading={isSigning}
            >
              <Icon name="Check" size={18} className="mr-2" />
              {isSigning ? 'Signature...' : 'Valider'}
            </Button>
          </div>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default DocumentSigningModal;
