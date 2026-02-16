import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuth } from '../../../contexts/AuthContext';
import { useResultatsMutations } from '../../../hooks/useResultats';
import { useToast } from '../../../contexts/ToastContext';
import { Loader2, PenTool, Eraser, Check, X } from 'lucide-react';

const ValidateResultatModal = ({ isOpen, onClose, resultat, analyse }) => {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const sigCanvas = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { validateResultat } = useResultatsMutations();
  const { showToast } = useToast();

  const clear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
    }
  };

  const handleEnd = () => {
    if (sigCanvas.current) {
      setIsEmpty(sigCanvas.current.isEmpty());
    }
  };

  const handleValidate = async () => {
    if (isEmpty) {
      showToast('Veuillez signer pour valider le résultat', 'warning');
      return;
    }

    if (!resultat || !resultat.id) {
      showToast('Résultat invalide', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Récupérer la signature en base64
      const signatureDataURL = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      
      // Appeler l'API de validation avec la signature
      // Note: Il faudra peut-être modifier le backend pour accepter la signature
      await validateResultat.mutateAsync({
        id: resultat.id,
        signature: signatureDataURL,
        analyse: analyse,
        resultat: resultat,
        validator: {
          id: user?.id,
          name: user?.name || user?.username
        }
      });

      showToast('Résultat validé avec succès', 'success');
      onClose();
      clear();
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!resultat) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
            <Icon name="CheckCircle" size={20} className="text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              Valider le résultat
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {resultat.parametre} - {analyse?.numeroAnalyse}
            </p>
          </div>
        </div>
      }
      size="md"
    >
      <div className="space-y-6">
        {/* Informations du résultat */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Paramètre</p>
              <p className="font-semibold text-slate-900 dark:text-white">{resultat.parametre}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Valeur</p>
              <p className="font-semibold text-slate-900 dark:text-white">
                {resultat.valeur} {resultat.unite || ''}
              </p>
            </div>
            {resultat.valeurNormaleMin !== null && resultat.valeurNormaleMax !== null && (
              <div className="col-span-2">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Valeurs normales</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {resultat.valeurNormaleMin} - {resultat.valeurNormaleMax} {resultat.unite || ''}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Zone de signature */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Signature électronique
            </label>
            <Button
              variant="ghost"
              size="sm"
              iconName="Eraser"
              onClick={clear}
              disabled={isEmpty || isSubmitting}
              className="text-xs text-slate-500 hover:text-rose-500"
            >
              Effacer
            </Button>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border-2 border-dashed border-slate-300 dark:border-slate-700">
            <div className="bg-white dark:bg-white rounded-lg overflow-hidden shadow-inner">
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{
                  width: 500,
                  height: 200,
                  className: 'cursor-crosshair w-full'
                }}
                onEnd={handleEnd}
              />
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">
              Dessinez votre signature dans le cadre ci-dessus
            </p>
          </div>
        </div>

        {/* Mentions légales */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Icon name="Info" size={16} className="text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-200">
              <p className="font-semibold mb-1">Mentions légales :</p>
              <p>
                En signant ce document, vous certifiez avoir vérifié et validé ce résultat d'analyse. 
                Cette signature électronique a valeur légale et sera enregistrée avec horodatage pour traçabilité.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <PermissionGuard requiredPermission="resultats_validate">
            <Button
              variant="primary"
              iconName="Check"
              onClick={handleValidate}
              disabled={isEmpty || isSubmitting || !hasPermission('resultats_validate')}
              loading={isSubmitting}
              className="shadow-lg shadow-primary/20"
            >
              {isSubmitting ? 'Validation...' : 'Valider avec signature'}
            </Button>
          </PermissionGuard>
        </div>
      </div>
    </Modal>
  );
};

export default ValidateResultatModal;

