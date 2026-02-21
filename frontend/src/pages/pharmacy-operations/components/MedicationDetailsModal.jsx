import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import AnimatedModal from '../../../components/ui/AnimatedModal';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { formatDateInBusinessTimezone } from '../../../utils/dateTime';

const MedicationDetailsModal = ({ isOpen, onClose, medication }) => {
  const { formatCurrency } = useCurrency();
  if (!medication) return null;

  const data = {
    nom: medication.nom || medication.name || 'Médicament inconnu',
    id: medication.id || 'N/A',
    dosage: medication.dosage || 'N/A',
    forme: medication.forme || medication.category || 'N/A',
    principeActif: medication.principeActif || medication.principe_actif || 'N/A',
    stockActuel: Number(medication.stockActuel || medication.stock_actuel || medication.currentStock || 0),
    stockMinimum: Number(medication.stockMinimum || medication.stock_minimum || medication.minStock || 0),
    stockMaximum: Number(medication.stockMaximum || medication.stock_maximum || medication.maxStock || (medication.minStock ? Number(medication.minStock) * 10 : 0)),
    prixUnitaire: Number(medication.prixUnitaire || medication.prix_unitaire || medication.unitCost || 0),
    codeBarre: medication.codeBarre || medication.code_barre || 'N/A',
    fabricant: medication.fabricant || medication.supplier || 'N/A',
    dateExpiration: medication.dateExpiration || medication.date_expiration || medication.expiryDate || null,
    categorie: medication.categorie || medication.category || medication.forme || 'N/A',
    description: medication.description || 'Aucune description disponible',
    prescription: medication.prescription || medication.prescriptionRequise || false,
    actif: medication.actif !== undefined ? medication.actif : true
  };

  const getStockStatus = () => {
    if (data.stockActuel <= 0) {
      return { variant: 'error', label: 'Rupture de stock', color: 'bg-rose-500' };
    } else if (data.stockActuel <= data.stockMinimum) {
      return { variant: 'warning', label: 'Stock faible', color: 'bg-amber-500' };
    } else {
      return { variant: 'success', label: 'En stock', color: 'bg-emerald-500' };
    }
  };

  const stockStatus = getStockStatus();
  const stockPercentage = data.stockMaximum > 0
    ? Math.min((data.stockActuel / data.stockMaximum) * 100, 100)
    : 0;

  const modalContent = (
    <AnimatedModal isOpen={isOpen} onClose={onClose} usePortal={true}>
      <div className="backdrop-blur-xl bg-white/50 dark:bg-white/10 w-full max-w-4xl max-h-[85vh] my-auto rounded-xl shadow-xl overflow-hidden flex flex-col border border-white/20 dark:border-white/10">

        {/* En-tête */}
        <div className="p-6 border-b border-white/20 dark:border-white/10 glass-surface flex flex-col sm:flex-row gap-6 items-center sm:items-start relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 transition-colors"
            aria-label="Fermer"
          >
            <Icon name="X" size={20} />
          </button>

          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-primary/10 dark:bg-primary/20 border border-white/20 dark:border-white/10 flex items-center justify-center">
              <Icon name="Pill" size={40} className="text-primary dark:text-blue-400" />
            </div>
            <span className={`absolute -bottom-1 -right-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white rounded-lg ${stockStatus.color}`}>
              {stockStatus.label}
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2 pr-10">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{data.nom}</h2>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-mono text-xs glass-surface px-2 py-0.5 rounded-lg">
                <Icon name="Fingerprint" size={12} /> {data.id}
              </span>
              <span>{data.dosage}</span>
              <span className="capitalize">{data.forme}</span>
              {data.codeBarre !== 'N/A' && (
                <span className="font-mono text-xs">{data.codeBarre}</span>
              )}
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
              {data.prescription && (
                <Badge variant="info">Sur ordonnance</Badge>
              )}
              {!data.actif && (
                <Badge variant="error">Inactif</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar glass-surface">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Informations Générales */}
            <div className="glass-panel rounded-xl p-5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Icon name="Info" size={14} /> Informations générales
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 p-2 rounded-lg glass-surface">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Icon name="FlaskConical" size={14} className="text-primary dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Principe actif</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{data.principeActif}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg glass-surface">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <Icon name="Tag" size={14} className="text-slate-600 dark:text-slate-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Catégorie</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 capitalize">{data.categorie}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg glass-surface">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <Icon name="Building2" size={14} className="text-slate-600 dark:text-slate-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fabricant</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{data.fabricant}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 rounded-lg glass-surface">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon name="DollarSign" size={14} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prix unitaire</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{formatCurrency(data.prixUnitaire || 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock */}
            <div className="glass-panel rounded-xl p-5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Icon name="Package" size={14} /> Gestion du stock
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Stock actuel</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{data.stockActuel}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all ${stockStatus.color}`}
                      style={{ width: `${stockPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>Min: {data.stockMinimum}</span>
                    <span>Max: {data.stockMaximum}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-xl glass-surface p-3">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stock minimum</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{data.stockMinimum}</p>
                  </div>
                  <div className="rounded-xl glass-surface p-3">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stock maximum</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{data.stockMaximum}</p>
                  </div>
                </div>
                {data.dateExpiration && (
                  <div className="flex items-start gap-3 pt-3 mt-3 border-t border-white/20 dark:border-white/10">
                    <div className="w-8 h-8 rounded-lg glass-surface flex items-center justify-center flex-shrink-0">
                      <Icon name="Calendar" size={14} className="text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date d'expiration</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {formatDateInBusinessTimezone(data.dateExpiration)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {data.description && data.description !== 'Aucune description disponible' && (
              <div className="md:col-span-2 glass-panel rounded-xl p-5 shadow-sm">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Icon name="FileText" size={14} /> Description
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {data.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-1.5 border-t border-white/20 dark:border-white/10 glass-surface flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button
            variant="default"
            iconName="Edit"
            onClick={() => {
              onClose();
              window.location.href = `/operations-pharmacie?action=edit&medicationId=${data.id}`;
            }}
          >
            Modifier
          </Button>
        </div>
      </div>
    </AnimatedModal>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default MedicationDetailsModal;

