import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, PenTool, Eraser, Check } from 'lucide-react';
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
    // Récupère l'image en base64 (PNG transparent)
    const signatureDataURL = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    onConfirm(signatureDataURL);
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PenTool className="text-primary" size={20} />
              Signer le document
            </h2>
            <p className="text-sm text-slate-500 mt-1 truncate max-w-xs">{documentTitle}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={24}/></button>
        </div>

        {/* Canvas Zone */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-white overflow-hidden shadow-inner">
            <SignatureCanvas 
              ref={sigCanvas}
              penColor="black"
              canvasProps={{
                width: 400, 
                height: 200, 
                className: 'cursor-crosshair'
              }}
              onEnd={handleEnd}
            />
          </div>
          <p className="text-xs text-slate-400 mt-3">Dessinez votre signature dans le cadre ci-dessus</p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 rounded-b-2xl">
          <Button 
            variant="ghost" 
            onClick={clear} 
            className="text-slate-500 hover:text-rose-500"
            disabled={isSigning}
          >
            <Eraser size={16} className="mr-2" /> Effacer
          </Button>

          <div className="flex gap-3">
             <Button variant="outline" onClick={onClose} disabled={isSigning}>Annuler</Button>
             <Button 
               variant="default" 
               onClick={handleSave} 
               disabled={isEmpty || isSigning}
               loading={isSigning}
               className="shadow-lg shadow-primary/20"
             >
               <Check size={18} className="mr-2" /> 
               {isSigning ? 'Signature...' : 'Valider'}
             </Button>
          </div>
        </div>

      </div>
    </AnimatedModal>
  );
};

export default DocumentSigningModal;
