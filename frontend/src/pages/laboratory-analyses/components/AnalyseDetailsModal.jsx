import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAnalyseDetails, useAnalysesMutations } from '../../../hooks/useAnalyses';
import { useResultatsByAnalyse, useResultatsMutations } from '../../../hooks/useResultats';
import ResultatsTable from './ResultatsTable';
import ResultatsAnalyseModal from './ResultatsAnalyseModal';
import ResultatsChart from './ResultatsChart';
import ValidateResultatModal from './ValidateResultatModal';
import AnalyseQRCode from './AnalyseQRCode';
import { generateAnalyseResultsPDF } from '../../../utils/analysePdfGenerator';
import { useNavigate } from 'react-router-dom';
import {
  formatDateTimeInBusinessTimezone,
  formatLongDateInBusinessTimezone,
  formatTimeInBusinessTimezone,
} from '../../../utils/dateTime';

const AnalyseDetailsModal = ({ isOpen, onClose, analyse: analyseProp }) => {
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const [isResultatsModalOpen, setIsResultatsModalOpen] = useState(false);
  const [isValidateModalOpen, setIsValidateModalOpen] = useState(false);
  const [selectedResultat, setSelectedResultat] = useState(null);
  const [editingResultat, setEditingResultat] = useState(null);
  const { data: analyseData, isLoading, error } = useAnalyseDetails(isOpen ? analyseProp?.id : null);
  const { data: resultats } = useResultatsByAnalyse(analyseProp?.id);
  const { validateResultat } = useResultatsMutations();
  const { updateAnalyse } = useAnalysesMutations();

  const handleValidate = (resultat, analyse) => {
    setSelectedResultat(resultat);
    setIsValidateModalOpen(true);
  };

  const handleCloturer = () => {
    if (!analyse?.id) return;
    updateAnalyse.mutate(
      { id: analyse.id, data: { statut: 'terminee' } },
      { onSuccess: () => {} }
    );
  };

  const handleEditResultat = (resultat) => {
    setEditingResultat(resultat);
    setIsResultatsModalOpen(true);
  };

  // Si l'analyse a été supprimée (erreur 404), fermer automatiquement la modal
  useEffect(() => {
    if (error?.response?.status === 404 && isOpen) {
      onClose();
    }
  }, [error, isOpen, onClose]);

  const analyse = analyseData || analyseProp;

  if (!analyse) return null;

  const getStatutBadge = (statut) => {
    const badges = {
      prescrite: { variant: 'info', label: 'Prescrite' },
      en_cours: { variant: 'warning', label: 'En cours' },
      terminee: { variant: 'success', label: 'Terminée' },
      annulee: { variant: 'error', label: 'Annulée' },
      en_attente_validation: { variant: 'warning', label: 'En attente' }
    };
    return badges[statut] || { variant: 'info', label: statut };
  };

  const moisAbrev = { janvier: 'Janv.', février: 'Fév.', mars: 'Mar.', avril: 'Avr.', mai: 'Mai', juin: 'Juin', juillet: 'Juil.', août: 'Août', septembre: 'Sept.', octobre: 'Oct.', novembre: 'Nov.', décembre: 'Déc.' };

  const formatDateShort = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      const day = d.getDate();
      const month = formatLongDateInBusinessTimezone(d).split(' ')[1]?.toLowerCase() || '';
      const year = d.getFullYear();
      const time = formatTimeInBusinessTimezone(d);
      const mois = moisAbrev[month] || month;
      return `${day} ${mois} ${year} à ${time}`;
    } catch {
      return dateString;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return formatDateTimeInBusinessTimezone(dateString);
    } catch {
      return dateString;
    }
  };

  const statutBadge = getStatutBadge(analyse.statut);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
            <Icon name="FileText" size={20} className="text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 dark:text-white">Analyse </span>
            <span className="text-base font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {analyse.numeroAnalyse}
            </span>
          </div>
        </div>
      } size="lg" className="max-h-[85vh]">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 border-l-4 border-l-primary flex flex-col items-center justify-center gap-3 py-12">
            <Icon name="Loader2" size={28} className="animate-spin text-primary" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement…</span>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-200px)] pr-2">
            {/* 1. Patient et Médecin - Acteurs principaux */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analyse.patient && (
                <div className="bg-emerald-50 dark:bg-slate-800/50 rounded-xl p-4 border border-emerald-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="User" size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Patient
                    </h4>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                      {analyse.patient.name}
                    </p>
                    {analyse.patient.numeroPatient && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md whitespace-nowrap">
                        {analyse.patient.numeroPatient}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {analyse.medecin && (
                <div className="bg-indigo-50 dark:bg-slate-800/50 rounded-xl p-4 border border-indigo-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="UserCheck" size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Médecin prescripteur
                    </h4>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                      {analyse.medecin.name || 'Médecin inconnu'}
                    </p>
                    {analyse.medecin.specialite && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-md whitespace-nowrap">
                        {analyse.medecin.specialite}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Informations de l'analyse */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-50 dark:bg-slate-800/50 rounded-xl p-4 border border-purple-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="Tag" size={16} className="text-purple-600 dark:text-purple-400" />
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Type d'analyse
                  </h4>
                </div>
                <p className="font-semibold text-slate-900 dark:text-white capitalize text-sm">
                  {analyse.typeAnalyse?.replace('_', ' ')}
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-slate-800/50 rounded-xl p-4 border border-blue-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="Info" size={16} className="text-blue-600 dark:text-blue-400" />
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Statut
                  </h4>
                </div>
                <Badge variant={statutBadge.variant} size="sm" className="font-bold">
                  {statutBadge.label}
                </Badge>
              </div>

              <div className="bg-amber-50 dark:bg-slate-800/50 rounded-xl p-4 border border-amber-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="AlertCircle" size={16} className="text-amber-600 dark:text-amber-400" />
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Priorité
                  </h4>
                </div>
                <p className="font-semibold text-slate-900 dark:text-white capitalize text-sm">
                  {analyse.priorite}
                </p>
              </div>
            </div>

            {/* 3. Dates et Service */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="Calendar" size={16} className="text-slate-600 dark:text-slate-400" />
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Dates importantes
                  </h4>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex flex-wrap gap-6 md:gap-8">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">Prescription</p>
                      <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">{formatDateShort(analyse.datePrescription)}</p>
                    </div>
                    {analyse.dateResultat && (
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs">Résultat</p>
                        <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">{formatDateShort(analyse.dateResultat)}</p>
                      </div>
                    )}
                  </div>
                  {analyse.datePrelevement && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">Prélèvement:</span>
                      <span className="font-medium text-slate-900 dark:text-white text-xs">
                        {formatDateShort(analyse.datePrelevement)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {analyse.laboratoire && (
                <div className="bg-cyan-50 dark:bg-slate-800/50 rounded-xl p-4 border border-cyan-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="Building2" size={16} className="text-cyan-600 dark:text-cyan-400" />
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Service
                    </h4>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    {analyse.laboratoire}
                  </p>
                </div>
              )}
            </div>

            {/* 4. Notes de prescription */}
            {analyse.notesPrescription && (
              <div className="bg-amber-50 dark:bg-slate-800/50 rounded-xl p-4 border border-amber-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="FileText" size={16} className="text-amber-600 dark:text-amber-400" />
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Notes de prescription
                  </h4>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {analyse.notesPrescription}
                </p>
              </div>
            )}

            {/* 5. Consultation liée */}
            {analyse.consultation && (
              <div className="bg-purple-50 dark:bg-slate-800/50 rounded-xl p-4 border border-purple-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Stethoscope" size={16} className="text-purple-600 dark:text-purple-400" />
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Consultation liée
                  </h4>
                </div>
                <div className="space-y-2 text-xs">
                  {analyse.consultation.dateConsultation && (
                    <div className="flex items-center gap-2">
                      <Icon name="Calendar" size={12} className="text-purple-500" />
                      <span className="text-slate-700 dark:text-slate-300">
                        {formatDate(analyse.consultation.dateConsultation)}
                      </span>
                    </div>
                  )}
                  {analyse.consultation.diagnosticPrincipal && (
                    <div className="flex items-center gap-2">
                      <Icon name="FileText" size={12} className="text-purple-500" />
                      <span className="text-slate-700 dark:text-slate-300">
                        {analyse.consultation.diagnosticPrincipal}
                      </span>
                    </div>
                  )}
                  {analyse.consultation.medecin && (
                    <div className="flex items-center gap-2">
                      <Icon name="UserCheck" size={12} className="text-purple-500" />
                      <span className="text-slate-700 dark:text-slate-300">
                        {analyse.consultation.medecin.name || analyse.consultation.medecin.nomComplet}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 6. Résultats d'analyse */}
            <div className="bg-blue-50 dark:bg-slate-800/50 rounded-xl p-5 border border-blue-200 dark:border-slate-700">
              {/* En-tête de section */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Icon name="ClipboardCheck" size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Résultats d'analyse
                    </h4>
                    {resultats && resultats.length > 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {resultats.length} résultat{resultats.length > 1 ? 's' : ''} enregistré{resultats.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Bouton d'action principal */}
                {analyse.statut !== 'annulee' && (
                  <PermissionGuard requiredPermission="resultats_create">
                    <Button
                      variant="primary"
                      size="sm"
                      iconName="Plus"
                      onClick={() => {
                        setEditingResultat(null);
                        setIsResultatsModalOpen(true);
                      }}
                      disabled={!hasPermission('resultats_create')}
                    >
                      Ajouter un paramètre
                    </Button>
                  </PermissionGuard>
                )}
              </div>

              {/* Contenu des résultats */}
              {resultats && resultats.length > 0 ? (
                <div className="space-y-4">
                  {/* Tableau des résultats */}
                  <div className="bg-white dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="max-h-[300px] overflow-y-auto">
                      <ResultatsTable
                        resultats={resultats}
                        analyse={analyse}
                        onValidate={handleValidate}
                        onEdit={handleEditResultat}
                      />
                    </div>
                  </div>

                  {/* Graphiques de visualisation */}
                  <div className="bg-white dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon name="BarChart3" size={16} className="text-blue-600 dark:text-blue-400" />
                      <h5 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Visualisation graphique
                      </h5>
                    </div>
                    <ResultatsChart resultats={resultats} />
                  </div>

                  {/* Actions d'export */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Exporter ou partager les résultats
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Download"
                        onClick={() => {
                          if (analyse && resultats) {
                            generateAnalyseResultsPDF(
                              analyse,
                              resultats,
                              analyse.patient,
                              analyse.medecin
                            );
                          }
                        }}
                        title="Télécharger en PDF"
                      >
                        PDF
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Printer"
                        onClick={() => {
                          window.print();
                        }}
                        title="Imprimer"
                      >
                        Imprimer
                      </Button>
                      <AnalyseQRCode analyse={analyse} />
                      {analyse.statut === 'en_cours' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconName="CheckCircle"
                          onClick={handleCloturer}
                          disabled={updateAnalyse.isPending}
                          title="Clôturer l'analyse"
                        >
                          Clôturer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900/50 rounded-lg p-8 text-center border border-dashed border-slate-300 dark:border-slate-700">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
                    <Icon name="FileText" size={28} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Aucun résultat enregistré
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cliquez sur "Ajouter des résultats" pour commencer
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ResultatsAnalyseModal
        isOpen={isResultatsModalOpen}
        onClose={() => {
          setIsResultatsModalOpen(false);
          setEditingResultat(null);
        }}
        analyse={analyse}
        existingResultats={editingResultat ? [editingResultat] : []}
      />

      <ValidateResultatModal
        isOpen={isValidateModalOpen}
        onClose={() => {
          setIsValidateModalOpen(false);
          setSelectedResultat(null);
        }}
        resultat={selectedResultat}
        analyse={analyse}
      />
    </>
  );
};

export default AnalyseDetailsModal;

