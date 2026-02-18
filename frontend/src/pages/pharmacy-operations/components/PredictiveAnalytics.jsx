import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import api from '../../../lib/axios';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { useToast } from '../../../contexts/ToastContext';

const PredictiveAnalytics = ({ onCreateOrder, onViewMedication }) => {
  const { formatCurrency } = useCurrency();
  const { showToast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('3months');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [data, setData] = useState({
      forecastData: [],
      distributionData: [],
      reorderRecommendations: []
  });
  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);

  const periodOptions = [
    { value: '1month', label: '1 mois' },
    { value: '3months', label: '3 mois' },
    { value: '6months', label: '6 mois' },
    { value: '1year', label: '1 an' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'Toutes catégories' },
    { value: 'antibiotics', label: 'Antibiotiques' },
    { value: 'analgesics', label: 'Analgésiques' },
    { value: 'diabetes', label: 'Diabète' },
    { value: 'cardiovascular', label: 'Cardiovasculaire' }
  ];
  
  const fetchData = async () => {
    setLoading(true);
    try {
        const response = await api.get('/pharmacy/analytics', {
            params: { period: selectedPeriod, category: selectedCategory }
        });
        if (response.data.success) {
            // Normaliser les données pour s'assurer qu'elles sont des tableaux
            const normalizedData = {
                forecastData: Array.isArray(response.data.forecastData) ? response.data.forecastData : (Array.isArray(response.data.data?.forecastData) ? response.data.data.forecastData : []),
                distributionData: Array.isArray(response.data.distributionData) ? response.data.distributionData : (Array.isArray(response.data.data?.distributionData) ? response.data.data.distributionData : []),
                reorderRecommendations: Array.isArray(response.data.reorderRecommendations) ? response.data.reorderRecommendations : (Array.isArray(response.data.data?.reorderRecommendations) ? response.data.data.reorderRecommendations : [])
            };
            if (process.env.NODE_ENV === 'development') {
                console.log('[PredictiveAnalytics] Données reçues:', normalizedData);
            }
            setData(normalizedData);
        } else {
            // Si le backend renvoie un succès=false, on réinitialise
             setData({ forecastData: [], distributionData: [], reorderRecommendations: [] });
        }
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Erreur chargement analyses prédictives:", error);
        }
        // Si erreur réseau, on affiche l'état vide
        setData({ forecastData: [], distributionData: [], reorderRecommendations: [] });
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, selectedCategory]);


  const reorderRecommendations = data.reorderRecommendations;

  // Fonction pour créer une commande à partir d'une recommandation
  const handleCreateOrderFromRecommendation = async (recommendation) => {
    if (!recommendation || !recommendation.medication) {
      showToast('Informations de recommandation incomplètes', 'error');
      return;
    }

    try {
      setLoadingOrder(true);
      // Rechercher le médicament par nom
      const medResponse = await api.get(`/pharmacy/search?q=${encodeURIComponent(recommendation.medication)}`);
      const medications = medResponse.data.data || medResponse.data || [];
      
      if (medications.length === 0) {
        showToast(`Médicament "${recommendation.medication}" introuvable`, 'error');
        return;
      }

      const medication = medications[0];
      
      // Si onCreateOrder est fourni, l'utiliser (nécessite supplierId)
      if (onCreateOrder && medication.supplierId) {
        onCreateOrder(medication.supplierId, medication.supplier || 'Fournisseur');
        // Le modal CreateOrderModal devra être pré-rempli avec ce médicament
        // Pour l'instant, on ouvre juste le modal
      } else {
        showToast('Fournisseur non disponible pour ce médicament', 'error');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors de la création de commande:', error);
      }
      showToast('Erreur lors de la création de la commande', 'error');
    } finally {
      setLoadingOrder(false);
    }
  };

  // Fonction pour créer une commande avec les 3 premières recommandations
  const handleCreateOrderFromTop3 = async () => {
    if (!reorderRecommendations || reorderRecommendations.length === 0) {
      showToast('Aucune recommandation disponible', 'info');
      return;
    }

    const top3 = reorderRecommendations
      .filter(rec => rec && rec.recommendedOrder > 0)
      .slice(0, 3);

    if (top3.length === 0) {
      showToast('Aucune recommandation nécessitant une commande', 'info');
      return;
    }

    try {
      setLoadingOrder(true);
      showToast(`Création de commande pour ${top3.length} médicament(s)...`, 'info');
      
      // Pour chaque recommandation, créer une commande
      // Note: Dans un cas réel, on pourrait créer une commande groupée
      // Pour l'instant, on ouvre le modal avec le premier médicament
      await handleCreateOrderFromRecommendation(top3[0]);
      
      if (top3.length > 1) {
        showToast(`Commande créée. ${top3.length - 1} autre(s) médicament(s) à commander.`, 'info');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors de la création de commande groupée:', error);
      }
      showToast('Erreur lors de la création de la commande', 'error');
    } finally {
      setLoadingOrder(false);
    }
  };

  // Fonction pour voir les détails d'un médicament
  const handleViewMedication = async (recommendation) => {
    if (!recommendation || !recommendation.medication) {
      showToast('Informations de recommandation incomplètes', 'error');
      return;
    }

    try {
      // Rechercher le médicament par nom
      const medResponse = await api.get(`/pharmacy/search?q=${encodeURIComponent(recommendation.medication)}`);
      const medications = medResponse.data.data || medResponse.data || [];
      
      if (medications.length === 0) {
        showToast(`Médicament "${recommendation.medication}" introuvable`, 'error');
        return;
      }

      const medication = medications[0];
      
      // Si onViewMedication est fourni, l'utiliser
      if (onViewMedication) {
        onViewMedication(medication);
      } else {
        // Sinon, ouvrir les détails via l'API
        const detailsResponse = await api.get(`/pharmacy/medications/${medication.id}/details`);
        // Afficher les détails dans une modale ou console pour debug
        if (process.env.NODE_ENV === 'development') {
          console.log('Détails du médicament:', detailsResponse.data);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors de la récupération des détails:', error);
      }
      showToast('Erreur lors de la récupération des détails', 'error');
    }
  };

  // Fonction pour générer le rapport IA
  const handleGenerateReport = async () => {
    if (!reorderRecommendations || reorderRecommendations.length === 0) {
      showToast('Aucune recommandation à exporter', 'info');
      return;
    }

    try {
      const recommendationsToExport = reorderRecommendations.filter(rec => rec && rec.recommendedOrder > 0);
      
      if (recommendationsToExport.length === 0) {
        showToast('Aucune recommandation nécessitant une commande', 'info');
        return;
      }

      // Créer le CSV
      const headers = [
        'Médicament',
        'Urgence',
        'Stock Actuel',
        'Besoin Prévu',
        'Quantité Recommandée',
        'Rupture Estimée',
        'Confiance (%)',
        'Raison'
      ];

      const csvRows = [
        headers.join(','),
        ...recommendationsToExport.map(rec => {
          const row = [
            `"${(rec.medication || '').replace(/"/g, '""')}"`,
            `"${(rec.urgency || 'low').replace(/"/g, '""')}"`,
            rec.currentStock || 0,
            rec.predictedNeed || 0,
            rec.recommendedOrder || 0,
            `"${(rec.estimatedStockout || 'N/A').replace(/"/g, '""')}"`,
            rec.confidence || 0,
            `"${(rec.reason || '').replace(/"/g, '""')}"`
          ];
          return row.join(',');
        })
      ];

      // Ajouter un résumé
      csvRows.push('');
      csvRows.push('Résumé');
      csvRows.push(`Total recommandations,${recommendationsToExport.length}`);
      csvRows.push(`Urgentes,${recommendationsToExport.filter(r => r.urgency === 'high').length}`);
      csvRows.push(`Modérées,${recommendationsToExport.filter(r => r.urgency === 'medium').length}`);
      csvRows.push(`Faibles,${recommendationsToExport.filter(r => r.urgency === 'low').length}`);
      csvRows.push(`Quantité totale recommandée,${recommendationsToExport.reduce((sum, r) => sum + (r.recommendedOrder || 0), 0)}`);

      // Créer le blob et télécharger
      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `rapport_ia_recommandations_${date}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('Rapport IA exporté avec succès', 'success');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors de l\'export du rapport:', error);
      }
      showToast('Erreur lors de l\'export du rapport', 'error');
    }
  };

  const getUrgencyStyle = (urgency) => {
    switch (urgency) {
      case 'high': return { bg: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800', label: 'Urgent' };
      case 'medium': return { bg: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800', label: 'Modéré' };
      default: return { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800', label: 'Faible' };
    }
  };

  // Tooltip Chart personnalisé
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl text-xs">
          <p className="font-bold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
          <div className="space-y-1.5">
            {Array.isArray(payload) && payload.map((entry, index) => {
              if (!entry || typeof entry !== 'object') return null;
              return (
              <div key={index} className="flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                  {entry.name}
                </span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                  {entry.name === 'Revenus' || entry.name === 'Dépenses' ? formatCurrency(entry.value) : entry.value}
                </span>
              </div>
            );
          }).filter(Boolean)}
          </div>
        </div>
      );
    }
    return null;
  };

  const inputClassName = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white";

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-[600px] text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
           <Icon name="Loader2" className="animate-spin mb-3" size={32} />
           <p>Chargement des analyses prédictives...</p>
        </div>
    );
  }
  
  // Si TOUTES les données sont vides après chargement (pas de mouvement dans les 6 derniers mois)
  const hasAnyData = (Array.isArray(data.forecastData) && data.forecastData.length > 0) || 
                     (Array.isArray(data.distributionData) && data.distributionData.length > 0) || 
                     (Array.isArray(data.reorderRecommendations) && data.reorderRecommendations.length > 0);
  
  if (!hasAnyData && !loading) {
       return (
          <div className="flex flex-col items-center justify-center h-[600px] text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
              <Icon name="Database" size={40} className="mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Pas de données de consommation</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm">
                  Aucun mouvement de sortie enregistré sur la période sélectionnée. Veuillez enregistrer des sorties de stock pour générer des analyses.
              </p>
          </div>
       )
  }


  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/20 rounded-xl flex items-center justify-center text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-900/50">
               <Icon name="TrendingUp" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Analyse & Prévision</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Basé sur les mouvements des {selectedPeriod.replace('months', 'mois')}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="sm:w-40"><Select options={periodOptions} value={selectedPeriod} onChange={setSelectedPeriod} buttonClassName={inputClassName} /></div>
            <div className="sm:w-48"><Select options={categoryOptions} value={selectedCategory} onChange={setSelectedCategory} buttonClassName={inputClassName} /></div>
            <Button 
              variant="outline" 
              iconName="RefreshCw" 
              className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={fetchData}
              disabled={loading}
            >
              {loading ? 'Actualisation...' : 'Actualiser'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Usage Forecast Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-slate-800 dark:text-white">Consommation sur 6 mois (Sorties)</h4>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-blue-500 rounded-full"></span><span className="text-slate-500 dark:text-slate-400">Réel</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span><span className="text-slate-500 dark:text-slate-400">Prévu</span></div>
            </div>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.forecastData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} itemStyle={{ color: '#1e293b', fontSize: '12px', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="predicted" stroke="#10B981" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution (Pie Chart) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col">
          <h4 className="font-bold text-slate-800 dark:text-white mb-2">Répartition par Catégorie</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Distribution de la consommation attendue</p>
          
          <div className="relative h-[280px] w-full">
            {Array.isArray(data.distributionData) && data.distributionData.length > 0 && data.distributionData.some(item => item && typeof item === 'object' && (item.value > 0 || item.percentage > 0)) ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {data.distributionData.map((entry, index) => {
                        if (!entry || typeof entry !== 'object') return null;
                        return (
                          <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} />
                        );
                      }).filter(Boolean)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} itemStyle={{ color: '#1e293b', fontSize: '12px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-slate-800 dark:text-white">100%</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                <Icon name="PieChart" size={32} className="mb-2 opacity-50" />
                <p className="text-sm">Aucune donnée disponible</p>
                <p className="text-xs mt-1 opacity-75">Les données de répartition par catégorie seront disponibles après enregistrement de sorties de stock</p>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            {Array.isArray(data.distributionData) && data.distributionData.map((item, index) => {
              if (!item || typeof item !== 'object') return null;
              return (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || '#3B82F6' }}></div>
                    <span className="text-slate-600 dark:text-slate-300">{item.name || ''}</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{typeof item.value === 'number' ? item.value : 0}%</span>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </div>
      </div>

      {/* Reorder Recommendations */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
          <div>
             <h4 className="font-bold text-slate-800 dark:text-white">Recommandations de Commande</h4>
             <p className="text-xs text-slate-500 dark:text-slate-400">Basé sur {selectedCategory === 'all' ? 'toutes les catégories' : selectedCategory} pour les {selectedPeriod.replace('months', 'mois')}</p>
          </div>
          <Button 
            variant="default" 
            iconName="ShoppingCart" 
            size="sm" 
            className="shadow-md shadow-primary/20"
            onClick={handleCreateOrderFromTop3}
            disabled={loadingOrder || !reorderRecommendations || reorderRecommendations.length === 0}
          >
            {loadingOrder ? 'Création...' : 'Commander les 3'}
          </Button>
        </div>

        <div className="p-6 grid gap-4 max-h-[500px] overflow-y-auto custom-scrollbar">
          {reorderRecommendations && reorderRecommendations.length > 0 ? (
            Array.isArray(reorderRecommendations) && reorderRecommendations.map((rec) => {
              if (!rec || typeof rec !== 'object') return null;
              const style = getUrgencyStyle(rec.urgency);
              return (
               <div key={rec.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-primary/30 transition-all group">
                 <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                   
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-3 mb-1">
                       <h5 className="font-bold text-slate-900 dark:text-white text-sm">{rec.medication}</h5>
                       <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${style.bg} ${style.text}`}>{style.label}</span>
                     </div>
                     <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Icon name="Info" size={12} />
                        {rec.reason}
                     </div>
                   </div>

                   <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-xs w-full lg:w-auto lg:border-l border-slate-200 dark:border-slate-700 lg:pl-4">
                      <div>
                         <span className="block text-slate-400 dark:text-slate-500 mb-0.5">Stock</span>
                         <span className="font-semibold text-slate-700 dark:text-slate-200">{rec.currentStock}</span>
                      </div>
                      <div>
                         <span className="block text-slate-400 dark:text-slate-500 mb-0.5">Besoin</span>
                         <span className="font-semibold text-slate-700 dark:text-slate-200">{rec.predictedNeed}</span>
                      </div>
                      <div>
                         <span className="block text-slate-400 dark:text-slate-500 mb-0.5">Orde</span>
                         <span className={`font-bold ${rec.recommendedOrder > 0 ? 'text-primary' : 'text-emerald-500'}`}>
                            {rec.recommendedOrder > 0 ? `+${rec.recommendedOrder}` : 'OK'}
                         </span>
                      </div>
                      <div>
                         <span className="block text-slate-400 dark:text-slate-500 mb-0.5">Rupture</span>
                         <span className={`font-semibold ${rec.urgency === 'high' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>{rec.estimatedStockout}</span>
                      </div>
                   </div>

                   <div className="flex flex-col items-center shrink-0">
                        <div className="text-xs font-bold text-primary mb-1">{rec.confidence}%</div>
                        <div className="text-[9px] text-slate-400 uppercase">Confiance</div>
                   </div>
                   
                   <div className="flex flex-col gap-2">
                     {rec.recommendedOrder > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          iconName="ShoppingCart" 
                          className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-slate-700 text-primary hover:bg-primary/10"
                          onClick={() => handleCreateOrderFromRecommendation(rec)}
                          disabled={loadingOrder}
                          title="Créer une commande"
                        />
                     )}
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       iconName="Eye" 
                       className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                       onClick={() => handleViewMedication(rec)}
                       title="Voir les détails"
                     />
                   </div>

                 </div>
              </div>
             );
            })
          ) : (
              <div className="text-center py-10 text-slate-400">Aucune recommandation de commande pour cette période/catégorie.</div>
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
           <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Icon name="Brain" size={14} className="text-primary" />
              <span>Analyse IA: {Array.isArray(reorderRecommendations) ? reorderRecommendations.filter(r => r && typeof r.recommendedOrder === 'number' && r.recommendedOrder > 0).length : 0} commandes suggérées.</span>
           </div>
           <Button 
             variant="ghost" 
             size="sm" 
             iconName="FileText" 
             className="text-xs h-7 dark:text-slate-400 dark:hover:bg-slate-800"
             onClick={handleGenerateReport}
           >
             Rapport IA
           </Button>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalytics;