import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
// import Textarea from '../../../components/ui/Textarea';
import Modal from '../../../components/ui/Modal';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { useResultatsMutations } from '../../../hooks/useResultats';

const ResultatsAnalyseModal = ({ isOpen, onClose, analyse, existingResultats = [] }) => {
  const { hasPermission } = usePermissions();
  const { createResultats, updateResultat } = useResultatsMutations();
  const [resultats, setResultats] = useState([
    { parametre: '', valeur: '', unite: '', valeurNormaleMin: '', valeurNormaleMax: '', commentaire: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recharger les résultats existants quand le modal s'ouvre ou que les résultats changent
  useEffect(() => {
    if (isOpen) {
      if (Array.isArray(existingResultats) && existingResultats.length > 0) {
        setResultats(
          existingResultats.map(r => ({
            id: r.id,
            parametre: r.parametre,
            valeur: r.valeur,
            unite: r.unite || '',
            valeurNormaleMin: r.valeurNormaleMin || '',
            valeurNormaleMax: r.valeurNormaleMax || '',
            commentaire: r.commentaire || ''
          }))
        );
      } else {
        // Réinitialiser avec un résultat vide si aucun résultat existant
        setResultats([{ parametre: '', valeur: '', unite: '', valeurNormaleMin: '', valeurNormaleMax: '', commentaire: '' }]);
      }
    }
  }, [isOpen, existingResultats]);

  const handleAddRow = () => {
    setResultats([...resultats, { parametre: '', valeur: '', unite: '', valeurNormaleMin: '', valeurNormaleMax: '', commentaire: '' }]);
  };

  const handleRemoveRow = (index) => {
    if (resultats.length > 1) {
      setResultats(resultats.filter((_, i) => i !== index));
    }
  };

  const handleReset = () => {
    setResultats([{ parametre: '', valeur: '', unite: '', valeurNormaleMin: '', valeurNormaleMax: '', commentaire: '' }]);
  };

  const handleChange = (index, field, value) => {
    const newResultats = [...resultats];
    newResultats[index][field] = value;
    setResultats(newResultats);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Filtrer les résultats vides
    const validResultats = Array.isArray(resultats) ? resultats.filter(r => r.parametre && r.valeur) : [];

    if (validResultats.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Si on a des résultats existants, on les met à jour
      if (existingResultats.length > 0) {
        // Mettre à jour chaque résultat existant
        for (const resultat of validResultats) {
          if (resultat.id) {
            await updateResultat.mutateAsync({
              id: resultat.id,
              analyse: analyse,
              data: {
                parametre: resultat.parametre,
                valeur: resultat.valeur,
                unite: resultat.unite || null,
                valeurNormaleMin: resultat.valeurNormaleMin ? parseFloat(resultat.valeurNormaleMin) : null,
                valeurNormaleMax: resultat.valeurNormaleMax ? parseFloat(resultat.valeurNormaleMax) : null,
                commentaire: resultat.commentaire || null
              }
            });
          }
        }
      } else {
        // Créer de nouveaux résultats
        await createResultats.mutateAsync({
          analyseId: analyse.id,
          analyse: analyse,
          resultats: validResultats.map(r => ({
            parametre: r.parametre,
            valeur: r.valeur,
            unite: r.unite || null,
            valeurNormaleMin: r.valeurNormaleMin ? parseFloat(r.valeurNormaleMin) : null,
            valeurNormaleMax: r.valeurNormaleMax ? parseFloat(r.valeurNormaleMax) : null,
            commentaire: r.commentaire || null
          }))
        });
      }
      onClose();
    } catch (error) {
      // L'erreur est gérée par le hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
          <Icon name="ClipboardCheck" size={20} className="text-white" />
        </div>
        <span className="text-base font-bold text-slate-900 dark:text-white">
          {existingResultats.length > 0 ? 'Modifier le résultat' : 'Ajouter un paramètre'}
        </span>
      </div>
    } size="lg" className="max-h-[85vh]">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700 max-h-[50vh] overflow-y-auto">
          <div className="space-y-3">
            {Array.isArray(resultats) && resultats.map((resultat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 md:col-span-4">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Paramètre <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={resultat.parametre}
                      onChange={(e) => handleChange(index, 'parametre', e.target.value)}
                      placeholder="Ex: Hémoglobine"
                      required
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Valeur <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={resultat.valeur}
                      onChange={(e) => handleChange(index, 'valeur', e.target.value)}
                      placeholder="12.5"
                      required
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Unité
                    </label>
                    <Input
                      type="text"
                      value={resultat.unite}
                      onChange={(e) => handleChange(index, 'unite', e.target.value)}
                      placeholder="g/dL"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Min
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={resultat.valeurNormaleMin}
                      onChange={(e) => handleChange(index, 'valeurNormaleMin', e.target.value)}
                      placeholder="Min"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Max
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={resultat.valeurNormaleMax}
                      onChange={(e) => handleChange(index, 'valeurNormaleMax', e.target.value)}
                      placeholder="Max"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-12 md:col-span-12">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Commentaire
                    </label>
                    <textarea
                      value={resultat.commentaire}
                      onChange={(e) => handleChange(index, 'commentaire', e.target.value)}
                      placeholder="Commentaire optionnel"
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm resize-none"
                    />
                  </div>
                  {resultats.length > 1 && existingResultats.length === 0 && (
                    <div className="col-span-12 md:col-span-12 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        iconName="Trash2"
                        onClick={() => handleRemoveRow(index)}
                        className="text-rose-600 hover:text-rose-700 dark:text-rose-400 text-xs"
                      >
                        Supprimer
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
          {existingResultats.length === 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconName="Plus"
              onClick={handleAddRow}
              className="text-xs"
            >
              Ajouter une ligne
            </Button>
          )}
          {existingResultats.length > 0 && <div />}

          <div className="flex items-center gap-2">
            {existingResultats.length === 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isSubmitting}
                iconName="RotateCcw"
                className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400"
              >
                Réinitialiser
              </Button>
            )}
            <PermissionGuard requiredPermission="resultats_create">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmitting || !hasPermission('resultats_create')}
                iconName={isSubmitting ? null : "Check"}
                className="text-xs"
              >
                {isSubmitting ? (
                  <>
                    <Icon name="Loader2" size={14} className="animate-spin mr-2" />
                    Enregistrement…
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </PermissionGuard>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ResultatsAnalyseModal;

