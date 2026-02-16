import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { useToast } from '../../../contexts/ToastContext';
import { useCurrency } from '../../../contexts/CurrencyContext';

const AppSettings = () => {
  const { showToast } = useToast();
  const { currency, availableCurrencies, changeCurrency, formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);

  const handleCurrencyChange = async (currencyCode) => {
    setLoading(true);
    try {
      const success = changeCurrency(currencyCode);
      if (success) {
        const currencyName = Array.isArray(availableCurrencies) ? availableCurrencies.find(c => c && c.code === currencyCode)?.name : '';
        showToast(`Devise changée en ${currencyName || currencyCode}`, 'success');
      } else {
        showToast('Erreur lors du changement de devise', 'error');
      }
    } catch (error) {
      showToast('Erreur lors du changement de devise', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <Icon name="DollarSign" size={14} /> Configuration de la devise
        </h3>
        
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Devise par défaut
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Sélectionnez la devise qui sera utilisée pour afficher tous les montants dans l'application.
            </p>
            <Select
              options={Array.isArray(availableCurrencies) ? availableCurrencies.map(c => {
                if (!c || typeof c !== 'object') return null;
                return {
                  value: c.code,
                  label: `${c.name || ''} (${c.symbol || ''})`
                };
              }).filter(Boolean) : []}
              value={currency.code}
              onChange={handleCurrencyChange}
              className={inputStyle}
              disabled={loading}
            />
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Aperçu du formatage
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Exemple d'affichage avec la devise sélectionnée
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(1234.56)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {currency.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <Icon name="Info" size={14} /> Informations
        </h3>
        
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Note importante</p>
              <p className="text-xs">
                Le changement de devise affecte uniquement l'affichage des montants dans l'interface. 
                Les montants stockés dans la base de données restent inchangés. 
                Pour convertir les montants existants, contactez votre administrateur système.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AppSettings;

