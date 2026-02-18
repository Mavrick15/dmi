import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import PermissionGuard from '../../../components/PermissionGuard';
import { usePermissions } from '../../../hooks/usePermissions';
import api from '../../../lib/axios'; 
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useClinicalMutations, useCommonSymptoms, useCommonExams } from '../../../hooks/useClinical';
import { generatePrescriptionPDF, generateConsultationPDF } from '../../../utils/pdfGenerator';
import ConsultationAnalyses from './ConsultationAnalyses';
import CIM10Search from './CIM10Search';
import ConsultationTemplates from './ConsultationTemplates';
import MedicalCalculators from './MedicalCalculators';
import QuickNotes from './QuickNotes';

const ConsultationWorkflow = ({ patient, appointmentId = null, onSaveConsultation }) => {
  const { hasPermission } = usePermissions();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [validatedSteps, setValidatedSteps] = useState(new Set());
  const [showCIM10Search, setShowCIM10Search] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCalculators, setShowCalculators] = useState(false);
  const [showQuickNotes, setShowQuickNotes] = useState(false);
  const [quickNotesTarget, setQuickNotesTarget] = useState(null);
  const [selectedCIM10Code, setSelectedCIM10Code] = useState(null);
  const { showToast } = useToast();
  const { user } = useAuth();
  const { saveConsultation } = useClinicalMutations(); 

  // --- ÉTATS POUR LA RECHERCHE MÉDICAMENT ---
  const [medQuery, setMedQuery] = useState('');
  const [medResults, setMedResults] = useState([]);
  const [isSearchingMed, setIsSearchingMed] = useState(false);

  // --- ÉTAT DU MÉDICAMENT EN COURS DE CONFIGURATION (BROUILLON) ---
  const [currentMedDraft, setCurrentMedDraft] = useState(null);

  // --- CHRONOMÈTRE DE CONSULTATION ---
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerKey, setTimerKey] = useState(0); // Clé pour réinitialiser le timer

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timerKey]); // Réinitialiser le timer quand timerKey change

  // --- VALIDATION DES CONSTANTES VITALES ---
  const [vitalSignsErrors, setVitalSignsErrors] = useState({});

  const validateVitalSign = (field, value) => {
    const errors = { ...vitalSignsErrors };
    const numValue = parseFloat(value);

    switch (field) {
      case 'temperature':
        if (value && (isNaN(numValue) || numValue < 30 || numValue > 45)) {
          errors.temperature = 'La température doit être entre 30°C et 45°C';
        } else {
          delete errors.temperature;
        }
        break;
      case 'bloodPressure':
        if (value && !/^\d{2,3}\/\d{2,3}$/.test(value)) {
          errors.bloodPressure = 'Format invalide. Utilisez le format XX/XX (ex: 120/80)';
        } else {
          delete errors.bloodPressure;
        }
        break;
      case 'heartRate':
        if (value && (isNaN(numValue) || numValue < 30 || numValue > 200)) {
          errors.heartRate = 'La fréquence cardiaque doit être entre 30 et 200 bpm';
        } else {
          delete errors.heartRate;
        }
        break;
      case 'respiratoryRate':
        if (value && (isNaN(numValue) || numValue < 10 || numValue > 40)) {
          errors.respiratoryRate = 'La fréquence respiratoire doit être entre 10 et 40 /min';
        } else {
          delete errors.respiratoryRate;
        }
        break;
      case 'oxygenSaturation':
        if (value && (isNaN(numValue) || numValue < 0 || numValue > 100)) {
          errors.oxygenSaturation = 'La saturation O2 doit être entre 0% et 100%';
        } else {
          delete errors.oxygenSaturation;
        }
        break;
      case 'weight':
        if (value && (isNaN(numValue) || numValue < 1 || numValue > 300)) {
          errors.weight = 'Le poids doit être entre 1 et 300 kg';
        } else {
          delete errors.weight;
        }
        break;
      case 'height':
        if (value && (isNaN(numValue) || numValue < 50 || numValue > 250)) {
          errors.height = 'La taille doit être entre 50 et 250 cm';
        } else {
          delete errors.height;
        }
        break;
      default:
        break;
    }

    setVitalSignsErrors(errors);
  };

  // Fonction pour calculer l'IMC automatiquement
  const calculateBMI = useCallback((weight, height) => {
    if (weight && height && height > 0) {
      const weightNum = parseFloat(weight);
      const heightNum = parseFloat(height);
      if (!isNaN(weightNum) && !isNaN(heightNum) && weightNum > 0 && heightNum > 0) {
        const heightInMeters = heightNum / 100; // Convertir cm en m
        const bmi = weightNum / (heightInMeters * heightInMeters);
        return parseFloat(bmi.toFixed(2));
      }
    }
    return null;
  }, []);

  // --- RECHERCHE MÉDICAMENTS (Auto-complétion) ---
  useEffect(() => {
    if (medQuery.length < 2) {
        setMedResults([]);
        return;
    }
    const delayDebounceFn = setTimeout(async () => {
        setIsSearchingMed(true);
        try {
            const response = await api.get(`/pharmacy/search?q=${medQuery}`);
            if (response.data.success) {
                setMedResults(response.data.data);
            }
        } catch (error) {
            // Erreur silencieuse - l'utilisateur peut continuer sans autocomplétion
            if (process.env.NODE_ENV === 'development') {
              console.warn('Erreur lors de la recherche de médicaments:', error);
            }
        } finally {
            setIsSearchingMed(false);
        }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [medQuery]);

  // --- DONNÉES GLOBALES DE LA CONSULTATION ---
  const [consultationData, setConsultationData] = useState({
    consultationId: null, // ID de la consultation sauvegardée
    chiefComplaint: '',
    symptoms: [],
    vitalSigns: {
      temperature: '',
      bloodPressure: '',
      heartRate: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      weight: '', // Poids en kg
      height: '', // Taille en cm
      bmi: null // IMC calculé automatiquement
    },
    examination: '',
    diagnosis: '',
    diagnosisCode: null, // Code CIM-10
    treatment: '', 
    medications: [], // Liste finale des médicaments prescrits
    requestedExams: [], 
    followUp: '',
    consultationNotes: '' 
  });

  const consultationSteps = [
    { id: 'complaint', label: 'Motif', icon: 'MessageSquare' },
    { id: 'vitals', label: 'Constantes', icon: 'Activity' },
    { id: 'examination', label: 'Examen', icon: 'Stethoscope' },
    { id: 'diagnosis', label: 'Diagnostic', icon: 'FileText' },
    { id: 'treatment', label: 'Prescription', icon: 'Pill' },
    { id: 'followup', label: 'Suivi & Notes', icon: 'Calendar' }
  ];

  // Récupérer les symptômes et examens depuis le backend
  const { data: symptomsData = [] } = useCommonSymptoms();
  const { data: examsData = [] } = useCommonExams();
  
  // Extraire les noms pour la compatibilité avec le code existant
  const commonSymptoms = useMemo(() => {
    if (!Array.isArray(symptomsData)) return [];
    return symptomsData.map(s => s?.name).filter(name => name && typeof name === 'string');
  }, [symptomsData]);
  const commonExams = useMemo(() => {
    if (!Array.isArray(examsData)) return [];
    return examsData.map(e => e?.name).filter(name => name && typeof name === 'string');
  }, [examsData]);

  // --- HELPERS GÉNÉRAUX ---
  const handleSymptomToggle = useCallback((symptom) => {
    setConsultationData(prev => ({
      ...prev,
      symptoms: Array.isArray(prev.symptoms) && prev.symptoms.includes(symptom) 
        ? prev.symptoms.filter(s => s !== symptom) 
        : [...(Array.isArray(prev.symptoms) ? prev.symptoms : []), symptom]
    }));
  }, []);

  const handleExamToggle = useCallback((exam) => {
    setConsultationData(prev => ({
      ...prev,
      requestedExams: Array.isArray(prev.requestedExams) && prev.requestedExams.includes(exam) 
        ? prev.requestedExams.filter(e => e !== exam) 
        : [...(Array.isArray(prev.requestedExams) ? prev.requestedExams : []), exam]
    }));
  }, []);

  const handleVitalSignChange = useCallback((field, value) => {
    setConsultationData(prev => {
      const updatedVitalSigns = { ...prev.vitalSigns, [field]: value };
      
      // Calculer l'IMC automatiquement si le poids ou la taille change
      if (field === 'weight' || field === 'height') {
        const bmi = calculateBMI(
          field === 'weight' ? value : updatedVitalSigns.weight,
          field === 'height' ? value : updatedVitalSigns.height
        );
        updatedVitalSigns.bmi = bmi;
      }
      
      return { ...prev, vitalSigns: updatedVitalSigns };
    });
    // Valider la valeur en temps réel
    validateVitalSign(field, value);
  }, [calculateBMI]);

  // --- VALIDATION DES ÉTAPES ---
  const validateStep = (stepId) => {
    switch (stepId) {
      case 'complaint':
        // Le motif principal est requis
        if (!consultationData.chiefComplaint || consultationData.chiefComplaint.trim().length < 3) {
          showToast('Veuillez remplir le motif principal de la consultation (minimum 3 caractères).', 'error');
          return false;
        }
        return true;

      case 'vitals':
        // Les constantes vitales sont optionnelles, mais si remplies, elles doivent être valides
        // Vérifier qu'il n'y a pas d'erreurs de validation
        if (Object.keys(vitalSignsErrors).length > 0) {
          showToast('Veuillez corriger les erreurs dans les constantes vitales avant de continuer.', 'error');
          return false;
        }
        return true;

      case 'examination':
        // L'examen physique est requis
        if (!consultationData.examination || consultationData.examination.trim().length < 3) {
          showToast('Veuillez remplir l\'examen clinique (minimum 3 caractères).', 'error');
          return false;
        }
        return true;

      case 'diagnosis':
        // Le diagnostic est requis
        if (!consultationData.diagnosis || consultationData.diagnosis.trim().length < 3) {
          showToast('Veuillez remplir le diagnostic principal (minimum 3 caractères).', 'error');
          return false;
        }
        return true;

      case 'treatment':
        // Le traitement est optionnel, mais si des médicaments sont ajoutés, ils doivent être complets
        // Cette étape est toujours valide car le traitement peut être vide
        return true;

      case 'followup':
        // Le suivi est optionnel
        return true;

      default:
        return true;
    }
  };

  // --- GESTION DU FLUX DE PRESCRIPTION (PANIER) ---

  // 1. L'utilisateur clique sur un résultat de recherche
  const selectMedFromSearch = (res) => {
      // On initialise le brouillon avec une quantité par défaut de 1
      setCurrentMedDraft({
          id: res.value,
          name: res.label?.split(' - ')[0] || res.label || 'Médicament', // On garde juste le nom, on enlève le stock
          dosage: '',
          frequency: '',
          duration: '',
          quantity: 1 // Quantité par défaut
      });
      // On nettoie la recherche
      setMedQuery('');
      setMedResults([]);
  };

  // 2. L'utilisateur clique sur "Valider et Ajouter"
  const validateAndAddMed = () => {
      // Validation minimale
      if (!currentMedDraft || !currentMedDraft.dosage || !currentMedDraft.frequency) {
          showToast("Veuillez indiquer au moins le dosage et la posologie.", 'warning');
          return;
      }

      // Ajout à la liste principale
      setConsultationData(prev => ({
          ...prev,
          medications: [...prev.medications, currentMedDraft]
      }));

      // Reset du brouillon pour permettre une nouvelle recherche
      setCurrentMedDraft(null); 
      showToast(`${currentMedDraft.name} ajouté à l'ordonnance.`, 'success');
  };

  // 3. Supprimer un médicament de la liste
  const removeMedFromList = (index) => {
      const newMeds = [...consultationData.medications];
      newMeds.splice(index, 1);
      setConsultationData(prev => ({ ...prev, medications: newMeds }));
  };

  // --- RÉINITIALISATION DU FORMULAIRE ---
  const resetConsultationForm = () => {
    // Réinitialiser les données de consultation
    setConsultationData({
      consultationId: null,
      chiefComplaint: '',
      symptoms: [],
      vitalSigns: {
        temperature: '',
        bloodPressure: '',
        heartRate: '',
        respiratoryRate: '',
        oxygenSaturation: ''
      },
      examination: '',
      diagnosis: '',
      diagnosisCode: null,
      diagnosisCodeId: null,
      treatment: '', 
      medications: [],
      requestedExams: [], 
      followUp: '',
      consultationNotes: '' 
    });

    // Réinitialiser les états de navigation
    setActiveStep(0);
    setValidatedSteps(new Set());

    // Réinitialiser le chronomètre (en changeant la clé, le useEffect redémarre)
    setSecondsElapsed(0);
    setTimerKey(prev => prev + 1);

    // Réinitialiser les sélections
    setSelectedCIM10Code(null);
    setCurrentMedDraft(null);
    setMedQuery('');
    setMedResults([]);
    setVitalSignsErrors({});

    // Fermer les modales ouvertes
    setShowCIM10Search(false);
    setShowTemplates(false);
    setShowCalculators(false);
    setShowQuickNotes(false);
  };

  // --- SAUVEGARDE ET IMPRESSION ---
  
  const handleSaveConsultation = async () => {
    if (!patient?.id) {
      showToast('Aucun patient sélectionné', 'error');
      return;
    }
    
    setLoading(true);
    try {
      // Calculer la durée en minutes à partir du compteur (minimum 1 minute)
      const durationInMinutes = Math.max(1, Math.ceil(secondsElapsed / 60));

      // Préparer le payload avec toutes les informations nécessaires pour l'audit et les notifications
      const payload = {
        patientId: patient.id,
        rendezVousId: appointmentId || null, 
        consultationData: {
            ...consultationData,
            duration: durationInMinutes,
            // S'assurer que les médicaments contiennent toutes les informations pour l'audit
            medications: consultationData.medications?.map(med => ({
              id: med.id,
              name: med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration,
              quantity: med.quantity || 1, // Quantité prescrite
              // Informations supplémentaires pour l'audit
              prescribedAt: new Date().toISOString(),
              prescribedBy: user?.id || null
            })) || []
        },
      };

      // Utiliser le hook de mutation pour sauvegarder la consultation
      const result = await saveConsultation.mutateAsync(payload);

      // Stocker l'ID de la consultation sauvegardée
      const savedConsultationId = result?.data?.id || result?.id;
      if (savedConsultationId) {
        setConsultationData(prev => ({ ...prev, consultationId: savedConsultationId }));
      }

      // NOTE: La réduction de stock se fera uniquement lorsque le pharmacien valide la prescription
      // Le stock reste intact lors de la création de la prescription

      // Réinitialiser le formulaire avant d'appeler le callback parent
      // Le parent va réinitialiser l'état complet (patient, etc.)
      resetConsultationForm();
      
      // Appeler le callback parent qui va réinitialiser tout l'état
      // (patient sélectionné, rendez-vous, etc.)
      if (onSaveConsultation) {
        onSaveConsultation(result?.data || result);
      }
      
    } catch (error) {
      // L'erreur est gérée par le hook
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur enregistrement:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPrescription = () => {
    if (consultationData.medications.length === 0 && !consultationData.treatment && consultationData.requestedExams.length === 0) {
        showToast("Veuillez sélectionner des médicaments ou examens avant d'imprimer.", 'warning');
        return;
    }
    generatePrescriptionPDF(
        consultationData, 
        patient, 
        user?.nomComplet 
    );
    showToast("Ordonnance générée.", 'success');
  };

  // --- GESTION DES RACCOURCIS CLAVIER ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Enter : Passer à l'étape suivante ou sauvegarder
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Vérifier si l'élément actif est un textarea (autoriser les sauts de ligne)
        const activeElement = document.activeElement;
        const isTextarea = activeElement && activeElement.tagName === 'TEXTAREA';
        
        // Si c'est un textarea, ne rien faire (permettre les sauts de ligne)
        if (isTextarea) {
          return;
        }
        
        // Si c'est un autre élément de formulaire (input, select, etc.), 
        // empêcher le comportement par défaut et valider l'étape
        if (activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'SELECT' ||
          activeElement.tagName === 'BUTTON'
        )) {
          e.preventDefault();
        }
        
        // Si on est à la dernière étape, sauvegarder la consultation
        if (activeStep === consultationSteps.length - 1) {
          if (hasPermission('consultation_create')) {
            handleSaveConsultation();
          }
        } else {
          // Sinon, passer à l'étape suivante
          const currentStepId = consultationSteps[activeStep].id;
          if (validateStep(currentStepId)) {
            setValidatedSteps(prev => new Set([...prev, activeStep]));
            setActiveStep(p => Math.min(consultationSteps.length - 1, p + 1));
          }
        }
      }
      
      // Ctrl+Enter : Sauvegarder directement (raccourci rapide)
      if (e.key === 'Enter' && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        if (hasPermission('consultation_create')) {
          handleSaveConsultation();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeStep, consultationSteps.length, hasPermission, handleSaveConsultation, validateStep]);

  const handleExportConsultation = () => {
    if (!consultationData.chiefComplaint && !consultationData.examination && !consultationData.diagnosis) {
      showToast("Veuillez remplir au moins le motif, l'examen ou le diagnostic avant d'exporter.", 'warning');
      return;
    }
    const durationInMinutes = Math.max(1, Math.ceil(secondsElapsed / 60));
    generateConsultationPDF(
      consultationData,
      patient,
      user?.nomComplet,
      durationInMinutes
    );
    showToast("Compte-rendu de consultation généré.", 'success');
  };

  const formatTimer = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const inputClassName = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white";

  // --- RENDU DES ÉTAPES DU WIZARD ---
  const renderStepContent = () => {
    const currentStep = consultationSteps[activeStep];
    switch (currentStep.id) {
      case 'complaint':
        return (
          <div className="space-y-6">
            {/* Motif principal */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <Icon name="MessageSquare" size={18} className="text-primary dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Motif principal</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Raison de la consultation (min. 3 caractères)</p>
                </div>
              </div>
              <textarea
                autoFocus
                placeholder="Ex: douleur thoracique, fièvre, contrôle annuel..."
                value={consultationData.chiefComplaint}
                onChange={(e) => setConsultationData(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                className={`w-full min-h-[100px] p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y ${inputClassName} placeholder-slate-400`}
                rows={3}
              />
            </div>
            {/* Symptômes associés */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Icon name="List" size={18} className="text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Symptômes associés</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Cochez les symptômes mentionnés par le patient</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Array.isArray(commonSymptoms) && commonSymptoms.map((symptom) => {
                  if (!symptom || typeof symptom !== 'string') return null;
                  const isChecked = Array.isArray(consultationData.symptoms) && consultationData.symptoms.includes(symptom);
                  return (
                    <div
                      key={symptom}
                      className={`p-3 rounded-xl border transition-all duration-200 ${
                        isChecked
                          ? 'bg-primary/10 border-primary/40 dark:bg-primary/20 dark:border-primary/50'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <Checkbox
                        label={symptom}
                        checked={isChecked}
                        onChange={() => handleSymptomToggle(symptom)}
                        className="dark:text-white"
                      />
                    </div>
                  );
                }).filter(Boolean)}
              </div>
              {consultationData.symptoms?.length > 0 && (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {consultationData.symptoms.length} symptôme{(consultationData.symptoms.length > 1) ? 's' : ''} sélectionné{(consultationData.symptoms.length > 1) ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        );
      case 'vitals':
        return (
          <div className="space-y-6">
            {/* Constantes vitales */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <Icon name="Activity" size={18} className="text-primary dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Constantes vitales</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Température, tension, fréquence cardiaque, etc.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Température (°C)"
                    type="number"
                    placeholder="36.5"
                    value={consultationData.vitalSigns.temperature}
                    onChange={(e) => handleVitalSignChange('temperature', e.target.value)}
                    className={`${inputClassName} ${vitalSignsErrors.temperature ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  {vitalSignsErrors.temperature && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <Icon name="AlertTriangle" size={12} />
                      {vitalSignsErrors.temperature}
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    label="Tension (mmHg)"
                    type="text"
                    placeholder="120/80"
                    value={consultationData.vitalSigns.bloodPressure}
                    onChange={(e) => handleVitalSignChange('bloodPressure', e.target.value)}
                    className={`${inputClassName} ${vitalSignsErrors.bloodPressure ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  {vitalSignsErrors.bloodPressure && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <Icon name="AlertTriangle" size={12} />
                      {vitalSignsErrors.bloodPressure}
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    label="Fréquence cardiaque (bpm)"
                    type="number"
                    placeholder="72"
                    value={consultationData.vitalSigns.heartRate}
                    onChange={(e) => handleVitalSignChange('heartRate', e.target.value)}
                    className={`${inputClassName} ${vitalSignsErrors.heartRate ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  {vitalSignsErrors.heartRate && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <Icon name="AlertTriangle" size={12} />
                      {vitalSignsErrors.heartRate}
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    label="Fréquence respiratoire (/min)"
                    type="number"
                    placeholder="16"
                    value={consultationData.vitalSigns.respiratoryRate}
                    onChange={(e) => handleVitalSignChange('respiratoryRate', e.target.value)}
                    className={`${inputClassName} ${vitalSignsErrors.respiratoryRate ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  {vitalSignsErrors.respiratoryRate && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <Icon name="AlertTriangle" size={12} />
                      {vitalSignsErrors.respiratoryRate}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Saturation O₂ (%)"
                    type="number"
                    placeholder="98"
                    value={consultationData.vitalSigns.oxygenSaturation}
                    onChange={(e) => handleVitalSignChange('oxygenSaturation', e.target.value)}
                    className={`${inputClassName} ${vitalSignsErrors.oxygenSaturation ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  {vitalSignsErrors.oxygenSaturation && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <Icon name="AlertTriangle" size={12} />
                      {vitalSignsErrors.oxygenSaturation}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Données anthropométriques */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Icon name="User" size={18} className="text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Poids et taille</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">IMC calculé automatiquement</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Poids (kg)"
                    type="number"
                    step="0.1"
                    placeholder="70"
                    value={consultationData.vitalSigns.weight}
                    onChange={(e) => handleVitalSignChange('weight', e.target.value)}
                    className={`${inputClassName} ${vitalSignsErrors.weight ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  {vitalSignsErrors.weight && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <Icon name="AlertTriangle" size={12} />
                      {vitalSignsErrors.weight}
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    label="Taille (cm)"
                    type="number"
                    placeholder="170"
                    value={consultationData.vitalSigns.height}
                    onChange={(e) => handleVitalSignChange('height', e.target.value)}
                    className={`${inputClassName} ${vitalSignsErrors.height ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  {vitalSignsErrors.height && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <Icon name="AlertTriangle" size={12} />
                      {vitalSignsErrors.height}
                    </p>
                  )}
                </div>
              </div>
              {consultationData.vitalSigns.bmi && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/10 border border-emerald-200 dark:border-emerald-800/50">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 dark:bg-emerald-600 flex items-center justify-center">
                        <Icon name="Activity" size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">IMC</p>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{consultationData.vitalSigns.bmi} <span className="text-sm font-normal text-emerald-600 dark:text-emerald-400">kg/m²</span></p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
                      consultationData.vitalSigns.bmi < 18.5
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        : consultationData.vitalSigns.bmi < 25
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : consultationData.vitalSigns.bmi < 30
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                      {consultationData.vitalSigns.bmi < 18.5 ? 'Insuffisance pondérale' : consultationData.vitalSigns.bmi < 25 ? 'Poids normal' : consultationData.vitalSigns.bmi < 30 ? 'Surpoids' : 'Obésité'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'examination':
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                    <Icon name="Stethoscope" size={18} className="text-primary dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Examen clinique</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Observations physiques (min. 3 caractères)</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Zap"
                  onClick={() => {
                    setQuickNotesTarget('examination');
                    setShowQuickNotes(true);
                  }}
                  className="shrink-0 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Notes rapides
                </Button>
              </div>
              <textarea
                placeholder="Ex: état général conservé, auscultation cardio-pulmonaire normale, abdomen souple..."
                value={consultationData.examination}
                onChange={(e) => setConsultationData(prev => ({ ...prev, examination: e.target.value }))}
                className={`w-full min-h-[180px] p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y ${inputClassName} placeholder-slate-400`}
                rows={6}
              />
            </div>
          </div>
        );
      case 'diagnosis':
        return (
          <div className="space-y-6">
            {/* Bloc Diagnostic principal */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <Icon name="Stethoscope" size={18} className="text-primary dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Diagnostic principal</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Saisissez ou choisissez un code CIM-10 OMS</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="Ex: hypertension, diabète, pneumonie..."
                  value={consultationData.diagnosis}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, diagnosis: e.target.value }))}
                  className={`flex-1 ${inputClassName}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Search"
                  onClick={() => setShowCIM10Search(true)}
                  className="shrink-0 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  CIM-10
                </Button>
              </div>
              {selectedCIM10Code && (
                <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg font-mono text-sm font-bold bg-emerald-200/80 dark:bg-emerald-800/50 text-emerald-800 dark:text-emerald-200">
                        {selectedCIM10Code.code}
                      </span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">CIM-10 OMS</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-snug">
                      {selectedCIM10Code.name}
                    </p>
                    {selectedCIM10Code.category && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{selectedCIM10Code.category}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCIM10Code(null);
                      setConsultationData(prev => ({ ...prev, diagnosisCode: null }));
                    }}
                    className="shrink-0 p-2 rounded-lg hover:bg-emerald-200/60 dark:hover:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 transition-colors"
                    title="Retirer le code"
                  >
                    <Icon name="X" size={18} />
                  </button>
                </div>
              )}
            </div>
            {/* Aide au diagnostic */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Icon name="Info" size={16} />
                <span className="text-sm font-medium">Aide au diagnostic</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {consultationData.symptoms.length > 0
                  ? 'Suggestions basées sur les symptômes saisis (analyse en cours).'
                  : 'Saisissez des symptômes à l\'étape précédente pour obtenir des suggestions.'}
              </p>
            </div>
          </div>
        );
      
      // --- ÉTAPE PRESCRIPTION ---
      case 'treatment':
        return (
          <div className="space-y-6">
            {/* Carte Médicaments */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <Icon name="Pill" size={18} className="text-primary dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Médicaments</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Recherchez et ajoutez les médicaments à l'ordonnance</p>
                </div>
              </div>

              {!currentMedDraft ? (
                <div className="relative">
                  <input
                    type="text"
                    className={`w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm ${inputClassName}`}
                    placeholder="Ex: Paracétamol, Amoxicilline..."
                    value={medQuery}
                    onChange={(e) => setMedQuery(e.target.value)}
                    autoFocus
                  />
                  {isSearchingMed && <Icon name="Loader2" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" />}
                  {Array.isArray(medResults) && medResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto custom-scrollbar">
                      {medResults.map(res => {
                        if (!res || typeof res !== 'object') return null;
                        return (
                          <button
                            key={res.value || Math.random()}
                            type="button"
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 border-b last:border-0 border-slate-100 dark:border-slate-800 flex justify-between items-center transition-colors group"
                            onClick={() => selectMedFromSearch(res)}
                          >
                            <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-primary text-sm">
                              {typeof res.label === 'string' ? res.label.split(' - ')[0] : (res.label || 'N/A')}
                            </span>
                            {typeof res.label === 'string' && res.label.includes(' - ') && (
                              <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{res.label.split(' - ')[1]}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-primary rounded-lg text-white"><Icon name="Pill" size={18} /></div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{currentMedDraft.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Posologie</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setCurrentMedDraft(null)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-rose-500 transition-colors">
                      <Icon name="X" size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <Input label="Dosage" placeholder="500 mg" value={currentMedDraft.dosage} onChange={e => setCurrentMedDraft({ ...currentMedDraft, dosage: e.target.value })} className="bg-white dark:bg-slate-900 text-sm" />
                    <Input label="Posologie" placeholder="1 matin, 1 soir" value={currentMedDraft.frequency} onChange={e => setCurrentMedDraft({ ...currentMedDraft, frequency: e.target.value })} className="bg-white dark:bg-slate-900 text-sm" />
                    <Input label="Durée" placeholder="5 jours" value={currentMedDraft.duration} onChange={e => setCurrentMedDraft({ ...currentMedDraft, duration: e.target.value })} className="bg-white dark:bg-slate-900 text-sm" />
                    <Input label="Quantité" type="number" min="1" placeholder="10" value={currentMedDraft.quantity || 1} onChange={e => setCurrentMedDraft({ ...currentMedDraft, quantity: parseInt(e.target.value) || 1 })} className="bg-white dark:bg-slate-900 text-sm" />
                  </div>
                  <Button fullWidth className="bg-primary hover:bg-blue-600 text-white h-10 text-sm font-semibold" onClick={validateAndAddMed}>
                    <Icon name="Check" size={18} className="mr-2" /> Valider et ajouter
                  </Button>
                </div>
              )}

              {Array.isArray(consultationData.medications) && consultationData.medications.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Icon name="List" size={12} /> Ordonnance ({consultationData.medications.length})
                  </h4>
                  {consultationData.medications.map((med, idx) => {
                    if (!med || typeof med !== 'object') return null;
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="shrink-0 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 p-1.5 rounded-lg"><Icon name="Check" size={14} /></div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">{med.name || 'Médicament'}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex gap-1.5 flex-wrap">
                              {med.dosage && <span className="bg-slate-200/60 dark:bg-slate-700 px-1.5 py-0.5 rounded">{med.dosage}</span>}
                              {med.frequency && <span className="bg-slate-200/60 dark:bg-slate-700 px-1.5 py-0.5 rounded">{med.frequency}</span>}
                              {med.duration && <span className="bg-slate-200/60 dark:bg-slate-700 px-1.5 py-0.5 rounded">{med.duration}</span>}
                              {med.quantity && <span className="text-emerald-600 dark:text-emerald-400 font-medium">Qté {med.quantity}</span>}
                            </div>
                          </div>
                        </div>
                        <button type="button" onClick={() => removeMedFromList(idx)} className="shrink-0 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg" title="Retirer"><Icon name="Trash2" size={16} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Carte Examens complémentaires */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Icon name="FileText" size={18} className="text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Examens complémentaires</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Prescrire des examens ou analyses</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-primary dark:text-blue-400 bg-primary/10 dark:bg-primary/20 px-2.5 py-1 rounded-full">
                  {Array.isArray(consultationData.requestedExams) ? consultationData.requestedExams.length : 0}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {commonExams.map((exam, index) => {
                  const isSelected = consultationData.requestedExams.includes(exam);
                  return (
                    <button
                      type="button"
                      key={index}
                      onClick={() => handleExamToggle(exam)}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-primary border-primary text-white'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary/40'
                      }`}
                    >
                      {isSelected ? <Icon name="Check" size={14} /> : <div className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-600" />}
                      <span className="flex-1 truncate">{exam}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Échographie abdominale..."
                  value={consultationData.customExam || ''}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, customExam: e.target.value }))}
                  className={`flex-1 ${inputClassName} text-sm`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && consultationData.customExam?.trim()) {
                      e.preventDefault();
                      handleExamToggle(consultationData.customExam.trim());
                      setConsultationData(prev => ({ ...prev, customExam: '' }));
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (consultationData.customExam?.trim()) {
                      handleExamToggle(consultationData.customExam.trim());
                      setConsultationData(prev => ({ ...prev, customExam: '' }));
                      showToast('Examen ajouté', 'success');
                    }
                  }}
                  disabled={!consultationData.customExam?.trim()}
                  className="shrink-0"
                >
                  <Icon name="Plus" size={14} className="mr-1" /> Ajouter
                </Button>
              </div>
              {Array.isArray(consultationData.requestedExams) && consultationData.requestedExams.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Prescrits :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {consultationData.requestedExams.map((exam, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 text-xs font-medium rounded-lg">
                        {exam}
                        <button type="button" onClick={() => handleExamToggle(exam)} className="hover:bg-primary/20 dark:hover:bg-primary/30 rounded p-0.5"><Icon name="X" size={12} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Analyses (si consultation sauvegardée) */}
            {consultationData.consultationId && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
                <ConsultationAnalyses consultationId={consultationData.consultationId} patientId={patient?.id} />
              </div>
            )}

            {/* Carte Conseils / Traitement libre */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Icon name="Info" size={18} className="text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Conseils et traitement libre</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Hygiène de vie, recommandations...</p>
                </div>
              </div>
              <textarea
                className={`w-full min-h-[100px] p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y ${inputClassName} placeholder-slate-400`}
                placeholder="Conseils hygiéno-diététiques, repos, autres..."
                value={consultationData.treatment}
                onChange={(e) => setConsultationData(prev => ({ ...prev, treatment: e.target.value }))}
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-2 pt-2">
                 <PermissionGuard requiredPermission="prescription_create">
                   <div className="flex items-center gap-2">
                     <Button 
                        variant="outline" 
                        size="sm"
                        iconName="Printer" 
                        onClick={handlePrintPrescription} 
                        disabled={consultationData.medications.length === 0 && !consultationData.treatment && consultationData.requestedExams.length === 0} 
                        className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                     >
                        Ordonnance PDF
                     </Button>
                     <Button 
                        variant="outline" 
                        size="sm"
                        iconName="Download" 
                        onClick={handleExportConsultation} 
                        disabled={!consultationData.chiefComplaint && !consultationData.examination && !consultationData.diagnosis} 
                        className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                     >
                        Export Consultation
                     </Button>
                   </div>
                 </PermissionGuard>
            </div>
          </div>
        );

      case 'followup':
        return (
          <div className="space-y-6">
            {/* Instructions de suivi */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <Icon name="Calendar" size={18} className="text-primary dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Instructions de suivi</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Prochaine consultation, surveillance, rappels</p>
                </div>
              </div>
              <Input
                placeholder="Ex: contrôle dans 3 mois, surveillance tension..."
                value={consultationData.followUp}
                onChange={(e) => setConsultationData(prev => ({ ...prev, followUp: e.target.value }))}
                className={inputClassName}
              />
            </div>
            {/* Notes privées */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Icon name="Lock" size={18} className="text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Notes privées</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Non visibles sur l'ordonnance ni à l'export</p>
                </div>
              </div>
              <textarea
                className={`w-full min-h-[120px] p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y ${inputClassName} placeholder-slate-400`}
                placeholder="Notes internes, rappels pour la prochaine consultation..."
                value={consultationData.consultationNotes}
                onChange={(e) => setConsultationData(prev => ({ ...prev, consultationNotes: e.target.value }))}
              />
            </div>
          </div>
        );
      default: return null;
    }
  };

  if (!patient) return (
    <div className="h-full flex flex-col items-center justify-center p-10">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <Icon name="UserPlus" size={32} className="text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Sélectionnez un patient</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Choisissez un dossier dans la liste à gauche pour ouvrir la consultation</p>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        scale: 0.3, 
        x: -400,
        rotate: -15,
        filter: "blur(10px)"
      }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        x: 0,
        rotate: 0,
        filter: "blur(0px)"
      }}
      transition={{
        type: "spring",
        stiffness: 150,
        damping: 15,
        mass: 1,
        duration: 1
      }}
      className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      {/* Header Consultation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-primary/5 dark:from-slate-800/50 dark:via-slate-900 dark:to-primary/10 flex justify-between items-center"
      >
          <div className="flex items-center gap-4">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-primary/30"
              >
                {patient.name.charAt(0)}
              </motion.div>
              <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{patient.name}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                    <span>{patient.age}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span>{patient.gender}</span>
                    {patient.numeroPatient && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span className="font-mono text-slate-400 dark:text-slate-500">{patient.numeroPatient}</span>
                      </>
                    )}
                  </p>
              </div>
          </div>
          <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    iconName="Calculator"
                    onClick={() => setShowCalculators(true)}
                    className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 hover:border-primary/30 hover:text-primary"
                  >
                    Calculatrices
                  </Button>
                </motion.div>
              </div>
              <span className="font-mono text-sm font-semibold tabular-nums text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Icon name="Clock" size={14} className="text-slate-400 dark:text-slate-500" />
                {formatTimer(secondsElapsed)}
              </span>
          </div>
      </motion.div>

      {/* Navigation Steps - Avec indicateur animé */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50"
      >
        <div className="flex gap-2 overflow-x-auto custom-scrollbar flex-1">
          {Array.isArray(consultationSteps) && consultationSteps.map((s, i) => {
            if (!s || typeof s !== 'object') return null;
            const isActive = activeStep === i;
            const isValidated = validatedSteps.has(i);
            
            return (
              <motion.button 
                key={s.id} 
                onClick={()=>setActiveStep(i)} 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 whitespace-nowrap z-10 ${
                  isActive 
                    ? 'text-white shadow-lg shadow-primary/30' 
                    : isValidated
                      ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-800 shadow-sm hover:shadow-md'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeStepIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 rounded-xl -z-10 shadow-lg"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                      mass: 0.5
                    }}
                  />
                )}
                {isValidated ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <Icon name="Check" size={16} className="text-emerald-600 dark:text-emerald-400" />
                    </motion.div>
                    <span>{s.label}</span>
                  </>
                ) : (
                  <>
                    <Icon name={s.icon} size={16}/> 
                    <span>{s.label}</span>
                  </>
                )}
              </motion.button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          iconName="FileText"
          onClick={() => setShowTemplates(true)}
          className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 flex-shrink-0"
        >
          Templates
        </Button>
      </motion.div>

      {/* Main Content Scrollable - Avec transitions fluides et hauteur fixe */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="flex-1 overflow-hidden bg-white dark:bg-slate-900 relative"
      >
          <div className="h-full overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Step Content - Avec transitions fluides */}
              <div className="relative min-h-[450px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{
                      duration: 0.2,
                      ease: [0.4, 0, 0.2, 1] // ease-out
                    }}
                    className="w-full"
                  >
                    {renderStepContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
      </motion.div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
          <Button variant="ghost" onClick={() => setActiveStep(p => Math.max(0, p - 1))} disabled={activeStep === 0}>
            <Icon name="ArrowLeft" size={16} className="mr-2"/> Retour
          </Button>
          
          {activeStep === consultationSteps.length - 1 ? (
              <PermissionGuard requiredPermission="consultation_create">
                <Button variant="default" onClick={handleSaveConsultation} loading={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                   <Icon name="Check" size={18} className="mr-2"/> Enregistrer
                </Button>
              </PermissionGuard>
          ) : (
              <Button onClick={() => {
                const currentStepId = consultationSteps[activeStep].id;
                // Valider l'étape actuelle avant de passer à la suivante
                if (validateStep(currentStepId)) {
                  setValidatedSteps(prev => new Set([...prev, activeStep]));
                  setActiveStep(p => Math.min(consultationSteps.length - 1, p + 1));
                }
              }}>
                 Continuer <Icon name="ArrowRight" size={16} className="ml-2"/>
              </Button>
          )}
      </div>

      {/* CIM-10 Search Modal */}
      <AnimatePresence>
        {showCIM10Search && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99998] flex items-center justify-center p-4"
            onClick={() => setShowCIM10Search(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recherche CIM-10 OMS</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Code ou libellé</p>
                </div>
                <button
                  onClick={() => setShowCIM10Search(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Icon name="X" size={20} className="text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <CIM10Search
                  onSelect={(item) => {
                    setSelectedCIM10Code(item);
                    setConsultationData(prev => ({ 
                      ...prev, 
                      diagnosisCode: item.code,
                      diagnosisCodeId: item.id || null,
                      diagnosis: prev.diagnosis || item.name 
                    }));
                    setShowCIM10Search(false);
                    showToast(`Code CIM-10 ${item.code} sélectionné`, 'success');
                  }}
                  selectedCode={selectedCIM10Code?.code}
                  onClose={() => setShowCIM10Search(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Templates Modal */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99998] flex items-center justify-center p-4"
            onClick={() => setShowTemplates(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Templates de Consultation</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sélectionnez un template pour pré-remplir la consultation</p>
                </div>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Icon name="X" size={20} className="text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <ConsultationTemplates
                  onSelectTemplate={(template) => {
                    // Récupérer les données du template (peut être dans template.data ou template.templateData)
                    const templateData = template.data || template.templateData || {};
                    
                    // Appliquer le template aux données de consultation en mappant tous les champs
                    setConsultationData(prev => {
                      const updated = { ...prev };
                      
                      // Motif principal (chiefComplaint)
                      if (templateData.chiefComplaint && typeof templateData.chiefComplaint === 'string') {
                        updated.chiefComplaint = templateData.chiefComplaint;
                      }
                      
                      // Symptômes (symptoms)
                      if (Array.isArray(templateData.symptoms) && templateData.symptoms.length > 0) {
                        updated.symptoms = [...templateData.symptoms];
                      }
                      
                      // Constantes vitales (vitalSigns) - optionnel, peut ne pas être dans le validateur mais supporté
                      if (templateData.vitalSigns && typeof templateData.vitalSigns === 'object') {
                        updated.vitalSigns = {
                          ...prev.vitalSigns,
                          ...templateData.vitalSigns
                        };
                      }
                      
                      // Examen clinique (examination)
                      if (templateData.examination && typeof templateData.examination === 'string') {
                        updated.examination = templateData.examination;
                      }
                      
                      // Diagnostic (diagnosis)
                      if (templateData.diagnosis && typeof templateData.diagnosis === 'string') {
                        updated.diagnosis = templateData.diagnosis;
                      }
                      
                      // Code CIM-10 (diagnosisCode) - optionnel
                      if (templateData.diagnosisCode) {
                        updated.diagnosisCode = templateData.diagnosisCode;
                      }
                      if (templateData.diagnosisCodeId) {
                        updated.diagnosisCodeId = templateData.diagnosisCodeId;
                      }
                      
                      // Traitement (treatment)
                      if (templateData.treatment && typeof templateData.treatment === 'string') {
                        updated.treatment = templateData.treatment;
                      }
                      
                      // Médicaments (medications) - optionnel, peut ne pas être dans le validateur mais supporté
                      if (Array.isArray(templateData.medications) && templateData.medications.length > 0) {
                        updated.medications = [...templateData.medications];
                      }
                      
                      // Examens demandés (commonExams dans le template -> requestedExams dans le formulaire)
                      if (Array.isArray(templateData.requestedExams) && templateData.requestedExams.length > 0) {
                        updated.requestedExams = [...templateData.requestedExams];
                      } else if (Array.isArray(templateData.commonExams) && templateData.commonExams.length > 0) {
                        // Support pour le format défini dans le validateur (commonExams)
                        updated.requestedExams = [...templateData.commonExams];
                      }
                      
                      // Suivi (followUp) - optionnel
                      if (templateData.followUp && typeof templateData.followUp === 'string') {
                        updated.followUp = templateData.followUp;
                      }
                      
                      // Notes de consultation (consultationNotes) - optionnel
                      if (templateData.consultationNotes && typeof templateData.consultationNotes === 'string') {
                        updated.consultationNotes = templateData.consultationNotes;
                      }
                      
                      return updated;
                    });
                    
                    // Si un code CIM-10 est présent, mettre à jour la sélection
                    if (templateData.diagnosisCode || templateData.diagnosisCodeId) {
                      setSelectedCIM10Code({
                        code: templateData.diagnosisCode,
                        id: templateData.diagnosisCodeId,
                        label: templateData.diagnosisLabel || templateData.diagnosisCode
                      });
                    }
                    
                    setShowTemplates(false);
                    showToast(`Template "${template.name}" chargé avec succès`, 'success');
                  }}
                  onClose={() => setShowTemplates(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calculators Modal */}
      <AnimatePresence>
        {showCalculators && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99998] flex items-center justify-center p-4"
            onClick={() => setShowCalculators(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                    <Icon name="Calculator" size={20} className="text-primary dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Calculatrices médicales</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">IMC, clairance, scores cliniques</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCalculators(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
                >
                  <Icon name="X" size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <MedicalCalculators onClose={() => setShowCalculators(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Notes Modal */}
      <AnimatePresence>
        {showQuickNotes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99998] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowQuickNotes(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{
                duration: 0.2,
                ease: [0.4, 0, 0.2, 1]
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col my-auto"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notes Rapides</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sélectionnez une note à insérer</p>
                </div>
                <button
                  onClick={() => setShowQuickNotes(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Icon name="X" size={20} className="text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <QuickNotes
                  onInsertNote={(noteText) => {
                    if (quickNotesTarget === 'examination') {
                      setConsultationData(prev => ({
                        ...prev,
                        examination: prev.examination ? `${prev.examination}\n${noteText}` : noteText
                      }));
                    } else if (quickNotesTarget === 'treatment') {
                      setConsultationData(prev => ({
                        ...prev,
                        treatment: prev.treatment ? `${prev.treatment}\n${noteText}` : noteText
                      }));
                    } else if (quickNotesTarget === 'followup') {
                      setConsultationData(prev => ({
                        ...prev,
                        followUp: prev.followUp ? `${prev.followUp}\n${noteText}` : noteText
                      }));
                    }
                    setShowQuickNotes(false);
                  }}
                  onClose={() => setShowQuickNotes(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ConsultationWorkflow;