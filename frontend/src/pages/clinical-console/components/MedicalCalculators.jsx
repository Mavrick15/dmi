import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Calculator, Info } from 'lucide-react';

const MedicalCalculators = ({ onClose }) => {
  const [activeCalculator, setActiveCalculator] = useState('bmi');

  const calculators = [
    { id: 'bmi', name: 'IMC (Indice de Masse Corporelle)', icon: 'Activity' },
    { id: 'creatinine', name: 'Clearance Créatinine', icon: 'Droplet' },
    { id: 'glasgow', name: 'Score de Glasgow', icon: 'Brain' },
    { id: 'wells', name: 'Score de Wells (Embolie Pulmonaire)', icon: 'Heart' },
    { id: 'chads2', name: 'CHA₂DS₂-VASc', icon: 'Activity' },
    { id: 'hasbled', name: 'HAS-BLED', icon: 'AlertTriangle' },
  ];

  // État pour chaque calculateur
  const [bmiData, setBmiData] = useState({ weight: '', height: '' });
  const [creatinineData, setCreatinineData] = useState({ age: '', weight: '', creatinine: '', gender: 'male' });
  const [glasgowData, setGlasgowData] = useState({ eyes: '4', verbal: '5', motor: '6' });
  const [wellsData, setWellsData] = useState({ 
    clinicalDVT: false, 
    peLikely: false, 
    heartRate: false, 
    immobility: false, 
    surgery: false, 
    previousPE: false, 
    hemoptysis: false, 
    cancer: false 
  });
  const [chads2Data, setChads2Data] = useState({
    heartFailure: false,
    hypertension: false,
    age75: false,
    diabetes: false,
    stroke: false,
    age65: false,
    vascular: false,
    female: false
  });
  const [hasbledData, setHasbledData] = useState({
    hypertension: false,
    abnormalRenal: false,
    abnormalLiver: false,
    stroke: false,
    bleeding: false,
    labileINR: false,
    elderly: false,
    drugs: false,
    alcohol: false
  });

  // Calculs
  const calculateBMI = () => {
    const weight = parseFloat(bmiData.weight);
    const height = parseFloat(bmiData.height) / 100; // Convertir en mètres
    if (weight && height) {
      const bmi = weight / (height * height);
      let interpretation = '';
      if (bmi < 18.5) interpretation = 'Insuffisance pondérale';
      else if (bmi < 25) interpretation = 'Poids normal';
      else if (bmi < 30) interpretation = 'Surpoids';
      else interpretation = 'Obésité';
      return { value: bmi.toFixed(1), interpretation };
    }
    return null;
  };

  const calculateCreatinineClearance = () => {
    const age = parseFloat(creatinineData.age);
    const weight = parseFloat(creatinineData.weight);
    const creatinine = parseFloat(creatinineData.creatinine);
    if (age && weight && creatinine) {
      const factor = creatinineData.gender === 'male' ? 1 : 0.85;
      const clearance = ((140 - age) * weight * factor) / (72 * creatinine);
      let interpretation = '';
      if (clearance >= 90) interpretation = 'Fonction rénale normale';
      else if (clearance >= 60) interpretation = 'Insuffisance rénale légère';
      else if (clearance >= 30) interpretation = 'Insuffisance rénale modérée';
      else if (clearance >= 15) interpretation = 'Insuffisance rénale sévère';
      else interpretation = 'Insuffisance rénale terminale';
      return { value: clearance.toFixed(1), interpretation, unit: 'ml/min' };
    }
    return null;
  };

  const calculateGlasgow = () => {
    const eyes = parseInt(glasgowData.eyes);
    const verbal = parseInt(glasgowData.verbal);
    const motor = parseInt(glasgowData.motor);
    const total = eyes + verbal + motor;
    let interpretation = '';
    if (total >= 13) interpretation = 'Léger';
    else if (total >= 9) interpretation = 'Modéré';
    else interpretation = 'Sévère';
    return { value: total, interpretation, eyes, verbal, motor };
  };

  const calculateWells = () => {
    let score = 0;
    if (wellsData.clinicalDVT) score += 3;
    if (wellsData.peLikely) score += 3;
    if (wellsData.heartRate) score += 1.5;
    if (wellsData.immobility) score += 1.5;
    if (wellsData.surgery) score += 1.5;
    if (wellsData.previousPE) score += 1.5;
    if (wellsData.hemoptysis) score += 1;
    if (wellsData.cancer) score += 1;
    
    let interpretation = '';
    if (score > 6) interpretation = 'Probabilité élevée';
    else if (score > 4) interpretation = 'Probabilité modérée';
    else interpretation = 'Probabilité faible';
    return { value: score, interpretation };
  };

  const calculateCHADS2 = () => {
    let score = 0;
    if (chads2Data.heartFailure) score += 1;
    if (chads2Data.hypertension) score += 1;
    if (chads2Data.age75) score += 2;
    if (chads2Data.diabetes) score += 1;
    if (chads2Data.stroke) score += 2;
    if (chads2Data.age65) score += 1;
    if (chads2Data.vascular) score += 1;
    if (chads2Data.female) score += 1;
    
    let interpretation = '';
    if (score === 0) interpretation = 'Risque faible - Pas d\'anticoagulation';
    else if (score === 1) interpretation = 'Risque faible - Anticoagulation optionnelle';
    else interpretation = 'Risque élevé - Anticoagulation recommandée';
    return { value: score, interpretation };
  };

  const calculateHASBLED = () => {
    let score = 0;
    if (hasbledData.hypertension) score += 1;
    if (hasbledData.abnormalRenal) score += 1;
    if (hasbledData.abnormalLiver) score += 1;
    if (hasbledData.stroke) score += 1;
    if (hasbledData.bleeding) score += 1;
    if (hasbledData.labileINR) score += 1;
    if (hasbledData.elderly) score += 1;
    if (hasbledData.drugs) score += 1;
    if (hasbledData.alcohol) score += 1;
    
    let interpretation = '';
    if (score < 3) interpretation = 'Risque hémorragique faible';
    else interpretation = 'Risque hémorragique élevé - Surveillance nécessaire';
    return { value: score, interpretation };
  };

  const renderCalculator = () => {
    switch (activeCalculator) {
      case 'bmi':
        const bmiResult = calculateBMI();
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Poids (kg)"
                type="number"
                value={bmiData.weight}
                onChange={(e) => setBmiData({ ...bmiData, weight: e.target.value })}
                placeholder="70"
              />
              <Input
                label="Taille (cm)"
                type="number"
                value={bmiData.height}
                onChange={(e) => setBmiData({ ...bmiData, height: e.target.value })}
                placeholder="175"
              />
            </div>
            {bmiResult && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{bmiResult.value}</p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">{bmiResult.interpretation}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'creatinine':
        const creatinineResult = calculateCreatinineClearance();
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Âge (ans)"
                type="number"
                value={creatinineData.age}
                onChange={(e) => setCreatinineData({ ...creatinineData, age: e.target.value })}
                placeholder="65"
              />
              <Input
                label="Poids (kg)"
                type="number"
                value={creatinineData.weight}
                onChange={(e) => setCreatinineData({ ...creatinineData, weight: e.target.value })}
                placeholder="70"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Créatinine (mg/dL)"
                type="number"
                step="0.1"
                value={creatinineData.creatinine}
                onChange={(e) => setCreatinineData({ ...creatinineData, creatinine: e.target.value })}
                placeholder="1.2"
              />
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sexe</label>
                <select
                  value={creatinineData.gender}
                  onChange={(e) => setCreatinineData({ ...creatinineData, gender: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:text-white"
                >
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                </select>
              </div>
            </div>
            {creatinineResult && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {creatinineResult.value} {creatinineResult.unit}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{creatinineResult.interpretation}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'glasgow':
        const glasgowResult = calculateGlasgow();
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Ouverture des yeux</label>
                <select
                  value={glasgowData.eyes}
                  onChange={(e) => setGlasgowData({ ...glasgowData, eyes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:text-white"
                >
                  <option value="4">4 - Spontanée</option>
                  <option value="3">3 - À la voix</option>
                  <option value="2">2 - À la douleur</option>
                  <option value="1">1 - Aucune</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Réponse verbale</label>
                <select
                  value={glasgowData.verbal}
                  onChange={(e) => setGlasgowData({ ...glasgowData, verbal: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:text-white"
                >
                  <option value="5">5 - Orientée</option>
                  <option value="4">4 - Confuse</option>
                  <option value="3">3 - Inappropriée</option>
                  <option value="2">2 - Incompréhensible</option>
                  <option value="1">1 - Aucune</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Réponse motrice</label>
                <select
                  value={glasgowData.motor}
                  onChange={(e) => setGlasgowData({ ...glasgowData, motor: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:text-white"
                >
                  <option value="6">6 - Obéit</option>
                  <option value="5">5 - Localise</option>
                  <option value="4">4 - Évite</option>
                  <option value="3">3 - Flexion</option>
                  <option value="2">2 - Extension</option>
                  <option value="1">1 - Aucune</option>
                </select>
              </div>
            </div>
            {glasgowResult && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">GCS: {glasgowResult.value}</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    {glasgowResult.eyes} (Yeux) + {glasgowResult.verbal} (Verbal) + {glasgowResult.motor} (Moteur)
                  </p>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mt-2">{glasgowResult.interpretation}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'wells':
        const wellsResult = calculateWells();
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              {Object.entries({
                clinicalDVT: 'Signes cliniques de TVP',
                peLikely: 'Embolie pulmonaire plus probable',
                heartRate: 'FC > 100/min',
                immobility: 'Immobilisation récente',
                surgery: 'Chirurgie récente',
                previousPE: 'Antécédent EP/TVP',
                hemoptysis: 'Hémoptysie',
                cancer: 'Cancer actif'
              }).map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={wellsData[key]}
                    onChange={(e) => setWellsData({ ...wellsData, [key]: e.target.checked })}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                </label>
              ))}
            </div>
            {wellsResult && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
                <div className="text-center">
                  <p className="text-3xl font-bold text-rose-900 dark:text-rose-100">Score: {wellsResult.value}</p>
                  <p className="text-sm font-semibold text-rose-800 dark:text-rose-200 mt-2">{wellsResult.interpretation}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'chads2':
        const chads2Result = calculateCHADS2();
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              {Object.entries({
                heartFailure: 'Insuffisance cardiaque',
                hypertension: 'Hypertension',
                age75: 'Âge ≥ 75 ans',
                diabetes: 'Diabète',
                stroke: 'AVC/AIT',
                age65: 'Âge 65-74 ans',
                vascular: 'Maladie vasculaire',
                female: 'Sexe féminin'
              }).map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={chads2Data[key]}
                    onChange={(e) => setChads2Data({ ...chads2Data, [key]: e.target.checked })}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                </label>
              ))}
            </div>
            {chads2Result && (
              <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-800">
                <div className="text-center">
                  <p className="text-3xl font-bold text-violet-900 dark:text-violet-100">Score: {chads2Result.value}</p>
                  <p className="text-sm font-semibold text-violet-800 dark:text-violet-200 mt-2">{chads2Result.interpretation}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'hasbled':
        const hasbledResult = calculateHASBLED();
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              {Object.entries({
                hypertension: 'Hypertension',
                abnormalRenal: 'Fonction rénale anormale',
                abnormalLiver: 'Fonction hépatique anormale',
                stroke: 'AVC',
                bleeding: 'Antécédent hémorragique',
                labileINR: 'INR labile',
                elderly: 'Âge > 65 ans',
                drugs: 'Médicaments antiplaquettaires/NSAID',
                alcohol: 'Consommation excessive d\'alcool'
              }).map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={hasbledData[key]}
                    onChange={(e) => setHasbledData({ ...hasbledData, [key]: e.target.checked })}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                </label>
              ))}
            </div>
            {hasbledResult && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">Score: {hasbledResult.value}</p>
                  <p className="text-sm font-semibold text-orange-800 dark:text-orange-200 mt-2">{hasbledResult.interpretation}</p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Calculator Selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {calculators.map((calc) => (
          <button
            key={calc.id}
            onClick={() => setActiveCalculator(calc.id)}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeCalculator === calc.id
                ? 'bg-primary/10 border-primary dark:bg-primary/20 dark:border-primary/50'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/30'
            }`}
          >
            <Icon name={calc.icon} size={20} className={`mb-2 ${activeCalculator === calc.id ? 'text-primary' : 'text-slate-400'}`} />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{calc.name}</p>
          </button>
        ))}
      </div>

      {/* Calculator Content */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCalculator}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderCalculator()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MedicalCalculators;

