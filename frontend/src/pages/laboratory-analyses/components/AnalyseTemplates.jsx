// Templates d'analyses prédéfinis pour prescription rapide
export const ANALYSE_TEMPLATES = {
  nfs: {
    name: 'Numération Formule Sanguine (NFS)',
    typeAnalyse: 'hematologie',
    description: 'Hémogramme complet avec formule leucocytaire',
    parametres: [
      { parametre: 'Hémoglobine', unite: 'g/dL', valeurNormaleMin: 12, valeurNormaleMax: 16 },
      { parametre: 'Hématocrite', unite: '%', valeurNormaleMin: 36, valeurNormaleMax: 46 },
      { parametre: 'Globules rouges', unite: 'M/µL', valeurNormaleMin: 4.2, valeurNormaleMax: 5.4 },
      { parametre: 'Globules blancs', unite: 'G/L', valeurNormaleMin: 4, valeurNormaleMax: 10 },
      { parametre: 'Plaquettes', unite: 'G/L', valeurNormaleMin: 150, valeurNormaleMax: 400 }
    ]
  },
  ionogramme: {
    name: 'Ionogramme Sanguin',
    typeAnalyse: 'biochimie',
    description: 'Électrolytes sanguins (Na, K, Cl)',
    parametres: [
      { parametre: 'Sodium (Na)', unite: 'mmol/L', valeurNormaleMin: 135, valeurNormaleMax: 145 },
      { parametre: 'Potassium (K)', unite: 'mmol/L', valeurNormaleMin: 3.5, valeurNormaleMax: 5.0 },
      { parametre: 'Chlore (Cl)', unite: 'mmol/L', valeurNormaleMin: 98, valeurNormaleMax: 107 }
    ]
  },
  fonction_renale: {
    name: 'Fonction Rénale',
    typeAnalyse: 'biochimie',
    description: 'Créatinine, Urée, Clairance',
    parametres: [
      { parametre: 'Créatinine', unite: 'mg/dL', valeurNormaleMin: 0.6, valeurNormaleMax: 1.2 },
      { parametre: 'Urée', unite: 'mg/dL', valeurNormaleMin: 10, valeurNormaleMax: 50 },
      { parametre: 'Clairance créatinine', unite: 'mL/min', valeurNormaleMin: 90, valeurNormaleMax: 120 }
    ]
  },
  fonction_hepatique: {
    name: 'Fonction Hépatique',
    typeAnalyse: 'biochimie',
    description: 'Transaminases, Bilirubine',
    parametres: [
      { parametre: 'ALAT (GPT)', unite: 'UI/L', valeurNormaleMin: 10, valeurNormaleMax: 40 },
      { parametre: 'ASAT (GOT)', unite: 'UI/L', valeurNormaleMin: 10, valeurNormaleMax: 40 },
      { parametre: 'Bilirubine totale', unite: 'mg/dL', valeurNormaleMin: 0.2, valeurNormaleMax: 1.2 }
    ]
  },
  lipidique: {
    name: 'Bilan Lipidique',
    typeAnalyse: 'biochimie',
    description: 'Cholestérol, Triglycérides',
    parametres: [
      { parametre: 'Cholestérol total', unite: 'mg/dL', valeurNormaleMin: 150, valeurNormaleMax: 200 },
      { parametre: 'HDL', unite: 'mg/dL', valeurNormaleMin: 40, valeurNormaleMax: 60 },
      { parametre: 'LDL', unite: 'mg/dL', valeurNormaleMin: 70, valeurNormaleMax: 130 },
      { parametre: 'Triglycérides', unite: 'mg/dL', valeurNormaleMin: 50, valeurNormaleMax: 150 }
    ]
  },
  glycemie: {
    name: 'Glycémie',
    typeAnalyse: 'biochimie',
    description: 'Taux de glucose sanguin',
    parametres: [
      { parametre: 'Glycémie à jeun', unite: 'mg/dL', valeurNormaleMin: 70, valeurNormaleMax: 100 },
      { parametre: 'HbA1c', unite: '%', valeurNormaleMin: 4, valeurNormaleMax: 6 }
    ]
  },
  crp: {
    name: 'Protéine C-Réactive (CRP)',
    typeAnalyse: 'biochimie',
    description: 'Marqueur inflammatoire',
    parametres: [
      { parametre: 'CRP', unite: 'mg/L', valeurNormaleMin: 0, valeurNormaleMax: 3 }
    ]
  },
  serologie_vih: {
    name: 'Sérologie VIH',
    typeAnalyse: 'serologie',
    description: 'Dépistage VIH',
    parametres: [
      { parametre: 'Test VIH', unite: '', valeurNormaleMin: null, valeurNormaleMax: null }
    ]
  },
  hemoculture: {
    name: 'Hémoculture',
    typeAnalyse: 'microbiologie',
    description: 'Culture sanguine',
    parametres: [
      { parametre: 'Hémoculture', unite: '', valeurNormaleMin: null, valeurNormaleMax: null }
    ]
  },
  radio_thorax: {
    name: 'Radiographie Thorax',
    typeAnalyse: 'imagerie',
    description: 'Radio pulmonaire',
    parametres: [
      { parametre: 'Radiographie', unite: '', valeurNormaleMin: null, valeurNormaleMax: null }
    ]
  }
};

export const getTemplateByName = (name) => {
  return ANALYSE_TEMPLATES[name] || null;
};

export const getTemplatesByType = (type) => {
  return Object.values(ANALYSE_TEMPLATES).filter(t => t.typeAnalyse === type);
};

export const getAllTemplates = () => {
  return Object.values(ANALYSE_TEMPLATES);
};

