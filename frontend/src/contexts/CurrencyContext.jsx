import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext({});

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency doit être utilisé dans un CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  // Devises disponibles
  const availableCurrencies = [
    { code: 'CDF', symbol: 'FC', name: 'Franc Congolais', locale: 'fr-CD' },
    { code: 'EUR', symbol: '€', name: 'Euro', locale: 'fr-FR' },
    { code: 'USD', symbol: '$', name: 'Dollar US', locale: 'en-US' },
    { code: 'XAF', symbol: 'FCFA', name: 'Franc CFA', locale: 'fr-FR' },
    { code: 'XOF', symbol: 'CFA', name: 'Franc CFA Ouest', locale: 'fr-FR' }
  ];

  // Charger la devise depuis localStorage ou utiliser FC par défaut
  const [currency, setCurrency] = useState(() => {
    try {
      const saved = localStorage.getItem('app_currency');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Vérifier que la devise existe toujours
        const found = availableCurrencies.find(c => c.code === parsed.code);
        return found || availableCurrencies[0]; // FC par défaut
      }
    } catch (e) {
      // En cas d'erreur, utiliser la devise par défaut
    }
    return availableCurrencies[0]; // FC (Franc Congolais) par défaut
  });

  // Sauvegarder la devise dans localStorage quand elle change
  useEffect(() => {
    try {
      localStorage.setItem('app_currency', JSON.stringify(currency));
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors de la sauvegarde de la devise:', e);
      }
    }
  }, [currency]);

  // Fonction pour formater un montant avec la devise configurée
  const formatCurrency = (amount, options = {}) => {
    const {
      showSymbol = true,
      minimumFractionDigits: minDigits = 2,
      maximumFractionDigits: maxDigits = 2,
      useLocaleFormat = true
    } = options;

    const amountNum = parseFloat(amount) || 0;

    // Valider et corriger les valeurs de fraction digits (doivent être entre 0 et 20)
    const minimumFractionDigits = Math.max(0, Math.min(20, Math.floor(minDigits || 0)));
    const maximumFractionDigits = Math.max(0, Math.min(20, Math.floor(maxDigits || 0)));
    
    // S'assurer que maximumFractionDigits >= minimumFractionDigits
    const finalMaxDigits = Math.max(minimumFractionDigits, maximumFractionDigits);

    if (useLocaleFormat) {
      try {
        const formatter = new Intl.NumberFormat(currency.locale, {
          style: showSymbol ? 'currency' : 'decimal',
          currency: currency.code,
          minimumFractionDigits,
          maximumFractionDigits: finalMaxDigits
        });
        return formatter.format(amountNum);
      } catch (e) {
        // Fallback si la locale n'est pas supportée
      }
    }

    // Format manuel avec le symbole
    // Utiliser directement currency.locale (format avec tiret, ex: 'en-US', 'fr-FR')
    const formatted = new Intl.NumberFormat(currency.locale, {
      minimumFractionDigits,
      maximumFractionDigits: finalMaxDigits,
    }).format(amountNum);

    if (showSymbol) {
      // Position du symbole selon la devise
      if (currency.code === 'USD' || currency.code === 'EUR') {
        return `${currency.symbol}${formatted}`;
      } else {
        return `${formatted} ${currency.symbol}`;
      }
    }

    return formatted;
  };

  // Fonction pour obtenir juste le symbole
  const getSymbol = () => currency.symbol;

  // Fonction pour obtenir le code de la devise
  const getCode = () => currency.code;

  // Fonction pour changer la devise
  const changeCurrency = (currencyCode) => {
    const found = availableCurrencies.find(c => c.code === currencyCode);
    if (found) {
      setCurrency(found);
      return true;
    }
    return false;
  };

  const value = {
    currency,
    availableCurrencies,
    formatCurrency,
    getSymbol,
    getCode,
    changeCurrency
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;

