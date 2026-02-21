import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { useResultatsMutations } from '../../../hooks/useResultats';
import { useToast } from '../../../contexts/ToastContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ResultatComments = ({ resultat, analyse, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState(resultat?.commentaire || '');
  const [annotation, setAnnotation] = useState(resultat?.annotation || '');
  const { updateResultat } = useResultatsMutations();
  const { showToast } = useToast();

  const handleSave = async () => {
    if (!resultat || !resultat.id) {
      showToast('Résultat invalide', 'error');
      return;
    }

    try {
      await updateResultat.mutateAsync({
        id: resultat.id,
        analyse: analyse,
        isComment: true,
        data: {
          commentaire: comment || null,
          annotation: annotation || null
        }
      });

      showToast('Commentaires enregistrés avec succès', 'success');
      setIsOpen(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        iconName="MessageSquare"
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 p-2 rounded-xl"
        title="Ajouter/modifier commentaires"
      />

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-center">
              <Icon name="MessageSquare" size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                Commentaires et annotations
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {resultat?.parametre} - {analyse?.numeroAnalyse}
              </p>
            </div>
          </div>
        }
        size="lg"
      >
        <div className="space-y-6">
          {/* Informations du résultat */}
          <div className="glass-surface rounded-xl p-4 border-l-4 border-l-blue-500">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Paramètre</p>
                <p className="font-semibold text-slate-900 dark:text-white">{resultat?.parametre}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Valeur</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {resultat?.valeur} {resultat?.unite || ''}
                </p>
              </div>
              {resultat?.valeurNormaleMin !== null && resultat?.valeurNormaleMax !== null && (
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Valeurs normales</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {resultat.valeurNormaleMin} - {resultat.valeurNormaleMax} {resultat.unite || ''}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Commentaire médical */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Commentaire médical
              <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                (Observations cliniques, interprétation)
              </span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajoutez un commentaire médical sur ce résultat..."
              className="w-full min-h-[120px] px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-white/20 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ce commentaire sera visible dans les rapports et pourra être partagé avec le patient.
            </p>
          </div>

          {/* Annotation technique */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Annotation technique
              <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                (Notes internes, conditions de prélèvement, etc.)
              </span>
            </label>
            <textarea
              value={annotation}
              onChange={(e) => setAnnotation(e.target.value)}
              placeholder="Ajoutez une annotation technique (notes internes uniquement)..."
              className="w-full min-h-[100px] px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-white/20 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Cette annotation est réservée au personnel médical et ne sera pas visible par le patient.
            </p>
          </div>

          {/* Mentions légales */}
          <div className="glass-surface rounded-xl p-4 border-l-4 border-l-amber-500">
            <div className="flex items-start gap-2">
              <Icon name="Info" size={16} className="text-slate-600 dark:text-slate-400 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-300">
                <p className="font-semibold mb-1">Mentions légales :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Les commentaires médicaux doivent être factuels et basés sur les résultats d'analyse.</li>
                  <li>Toute interprétation doit être conforme aux normes médicales en vigueur.</li>
                  <li>Les annotations techniques sont confidentielles et réservées au personnel autorisé.</li>
                  <li>La date et l'heure de modification sont automatiquement enregistrées pour traçabilité.</li>
                  <li>En cas de doute, consulter un médecin spécialiste avant toute interprétation.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Informations de traçabilité */}
          {resultat?.updatedAt && (
            <div className="glass-surface rounded-xl p-3 border-l-4 border-l-slate-500">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold">Dernière modification :</span>{' '}
                {format(new Date(resultat.updatedAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/20 dark:border-white/10">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              iconName="Save"
              onClick={handleSave}
              loading={updateResultat.isPending}
              className="rounded-xl"
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ResultatComments;

