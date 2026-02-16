import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import api from '../../../lib/axios';
import { usePatientDetails } from '../../../hooks/usePatients';
import { useAnalysesByPatient } from '../../../hooks/useAnalyses';
import { normalizeApiResponse, extractData } from '../../../utils/apiNormalizers';
import { Loader2 } from 'lucide-react';

const MedicalRecord = ({ patient }) => {
  const [activeTab, setActiveTab] = useState('consultations');

  // Fetch consultations avec normalisation
  const { data: consultationsData, isLoading: loadingConsultations } = useQuery({
    queryKey: ['consultations', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return { data: [] };
      const response = await api.get(`/consultations?patientId=${patient.id}`);
      // Normaliser la réponse API
      const normalized = normalizeApiResponse(response.data);
      return normalized;
    },
    enabled: !!patient?.id,
    retry: 1,
  });

  // Utiliser le hook usePatientDetails qui normalise et transforme correctement les données
  const { data: patientDetailsData, isLoading: loadingDetails } = usePatientDetails(patient?.id);

  const consultations = consultationsData?.data || [];
  // Utiliser les données transformées du hook, avec fallback sur le patient passé en props
  const patientData = patientDetailsData || patient;

  const tabs = [
    { id: 'consultations', label: 'Consultations', icon: 'Stethoscope', count: consultations.length },
    { id: 'history', label: 'Antécédents', icon: 'FileText', count: null },
    { id: 'allergies', label: 'Allergies', icon: 'AlertTriangle', count: patientData?.allergies?.length || 0 },
    { id: 'vitals', label: 'Constantes', icon: 'Activity', count: null },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'Non renseigné';
    
    // Si la date est déjà au format "dd/MM/yyyy" (format du backend)
    if (typeof dateString === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('/');
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      }
    }
    
    // Sinon, essayer de parser comme une date ISO ou autre format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Non renseigné';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatVitalValue = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    
    // Si c'est une chaîne qui contient "/" (tension artérielle), ne pas formater
    if (typeof value === 'string' && value.includes('/')) {
      return value;
    }
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return value;
    return numValue.toFixed(1);
  };

  const renderConsultations = () => {
    if (loadingConsultations) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      );
    }

    if (consultations.length === 0) {
      return (
        <EmptyState
          icon="FileText"
          title="Aucune consultation"
          description="Aucune consultation enregistrée pour ce patient."
        />
      );
    }

    return (
      <div className="space-y-5">
        {Array.isArray(consultations) && consultations.map((consultation, idx) => (
          <motion.div
            key={consultation.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            whileHover={{ y: -2, scale: 1.01 }}
            className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/10 transition-all duration-300 overflow-hidden"
          >
            {/* Gradient overlay au hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/3 group-hover:via-primary/2 group-hover:to-primary/0 transition-all duration-500 pointer-events-none rounded-2xl" />
            
            <div className="relative z-10">
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Icon name="Stethoscope" size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-xl text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                      Consultation du {formatDate(consultation.dateConsultation)}
                    </h4>
                    {consultation.motifPrincipal && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        <span className="font-semibold">Motif:</span> {consultation.motifPrincipal}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {consultation.medecinName && (
                    <Badge variant="primary" size="sm" className="shadow-sm">
                      <Icon name="User" size={12} className="mr-1" />
                      {consultation.medecinName}
                    </Badge>
                  )}
                  {consultation.dureeConsultation && (
                    <Badge variant="info" size="sm" className="shadow-sm">
                      <Icon name="Clock" size={12} className="mr-1" />
                      {consultation.dureeConsultation} min
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {consultation.vitalSigns && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="absolute top-2 right-2 w-8 h-8 bg-blue-200/50 dark:bg-blue-800/30 rounded-lg flex items-center justify-center">
                    <Icon name="Activity" size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <h5 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase mb-3 tracking-wider">Constantes Vitales</h5>
                  <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                    {consultation.vitalSigns.temperature && (
                      <div className="flex items-center gap-2">
                        <Icon name="Activity" size={14} className="text-blue-500" />
                        <span className="font-semibold">Temp:</span> {formatVitalValue(consultation.vitalSigns.temperature)}°C
                      </div>
                    )}
                    {consultation.vitalSigns.bloodPressure && (
                      <div className="flex items-center gap-2">
                        <Icon name="Activity" size={14} className="text-blue-500" />
                        <span className="font-semibold">TA:</span> {consultation.vitalSigns.bloodPressure} mmHg
                      </div>
                    )}
                    {consultation.vitalSigns.heartRate && (
                      <div className="flex items-center gap-2">
                        <Icon name="Heart" size={14} className="text-blue-500" />
                        <span className="font-semibold">FC:</span> {formatVitalValue(consultation.vitalSigns.heartRate)} bpm
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {consultation.diagnosticPrincipal && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="absolute top-2 right-2 w-8 h-8 bg-emerald-200/50 dark:bg-emerald-800/30 rounded-lg flex items-center justify-center">
                    <Icon name="FileCheck" size={16} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h5 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase mb-3 tracking-wider">Diagnostic</h5>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{consultation.diagnosticPrincipal}</p>
                </motion.div>
              )}
            </div>

            {consultation.examenPhysique && (
              <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <h5 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-3 flex items-center gap-2">
                  <Icon name="Eye" size={14} />
                  Examen Physique
                </h5>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{consultation.examenPhysique}</p>
              </div>
            )}

            {consultation.planTraitement && (
              <div className="mb-5 p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50">
                <h5 className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase mb-3 flex items-center gap-2">
                  <Icon name="Pill" size={14} />
                  Plan de Traitement
                </h5>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{consultation.planTraitement}</p>
              </div>
            )}

            {Array.isArray(consultation.requestedExams) && consultation.requestedExams.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 self-center">Examens:</span>
                {consultation.requestedExams.map((exam, idx) => (
                  <Badge key={idx} variant="info" size="sm" className="shadow-sm">
                    <Icon name="TestTube" size={12} className="mr-1" />
                    {exam}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Lien vers Analyses Labo */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="ghost"
                size="sm"
                iconName="TestTube"
                onClick={() => navigate(`/analyses-laboratoire?patientId=${patient?.id}`)}
                className="w-full"
              >
                Voir les analyses de ce patient
              </Button>
            </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderHistory = () => {
    if (loadingDetails) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      );
    }

    // Debug: vérifier les données disponibles
    const birthDateValue = patientData?.birthDate || patientData?.dateNaissance || patientData?.birth_date || patientData?.date_naissance;

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/50 dark:from-blue-900/0 dark:to-blue-900/10 group-hover:from-blue-50/50 group-hover:to-blue-100/50 dark:group-hover:from-blue-900/10 dark:group-hover:to-blue-900/20 transition-all duration-300 rounded-2xl" />
          <div className="relative z-10">
            <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Icon name="FileText" size={20} className="text-white" />
              </div>
              Antécédents Médicaux
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              {patientData?.medicalHistory || patientData?.antecedentsMedicaux || 'Aucun antécédent médical enregistré.'}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-emerald-50/50 dark:from-emerald-900/0 dark:to-emerald-900/10 group-hover:from-emerald-50/50 group-hover:to-emerald-100/50 dark:group-hover:from-emerald-900/10 dark:group-hover:to-emerald-900/20 transition-all duration-300 rounded-2xl" />
          <div className="relative z-10">
            <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Icon name="Heart" size={20} className="text-white" />
              </div>
              Informations Générales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Groupe Sanguin', value: patientData?.bloodType || patientData?.groupeSanguin || 'Non renseigné', icon: 'Activity' },
                { label: 'Date de Naissance', value: formatDateOnly(birthDateValue), icon: 'Calendar' },
                { label: 'Assurance', value: patientData?.insurance || patientData?.assuranceMaladie || 'Non renseigné', icon: 'ShieldCheck' },
                { label: 'Contact Urgence', value: patientData?.contactUrgenceNom ? `${patientData.contactUrgenceNom} - ${patientData.contactUrgenceTelephone || ''}` : 'Non renseigné', icon: 'Phone' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/30 dark:hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name={item.icon} size={16} className="text-primary" />
                    <span className="font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wide">{item.label}</span>
                  </div>
                  <p className="text-slate-900 dark:text-white font-medium">{item.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderAllergies = () => {
    const allergies = patientData?.allergies || [];

    if (allergies.length === 0) {
      return (
        <EmptyState
          icon="CheckCircle"
          title="Aucune allergie enregistrée"
          description="Aucune allergie connue pour ce patient."
        />
      );
    }

    return (
      <div className="space-y-4">
        {Array.isArray(allergies) && allergies.map((allergy, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.02, x: 4 }}
            className="group relative bg-gradient-to-r from-rose-50 to-rose-100/50 dark:from-rose-900/20 dark:to-rose-900/10 border-2 border-rose-200 dark:border-rose-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-lg hover:shadow-rose-500/10 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 to-rose-500/0 group-hover:from-rose-500/5 group-hover:to-rose-500/0 transition-all duration-300" />
            <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20 flex-shrink-0">
              <Icon name="AlertTriangle" size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-rose-900 dark:text-rose-100">{allergy.name || allergy}</p>
              {allergy.severity && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="error" size="sm" className="shadow-sm">
                    Sévérité: {allergy.severity}
                  </Badge>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderVitals = () => {
    // Récupérer toutes les constantes vitales des consultations
    const consultationsArray = Array.isArray(consultations) ? consultations : [];
    
    const allVitals = consultationsArray
      .map(c => {
        const vitals = c.vitalSigns || c.constantesVitales || {};
        // Vérifier si au moins une constante vitale est présente
        const hasVitals = vitals && typeof vitals === 'object' && Object.keys(vitals).some(key => 
          vitals[key] !== null && vitals[key] !== undefined && vitals[key] !== ''
        );
        
        if (!hasVitals) return null;
        
        return {
          date: c.dateConsultation,
          ...vitals
        };
      })
      .filter(v => v !== null)
      .reverse();

    if (allVitals.length === 0) {
      return (
        <EmptyState
          icon="Activity"
          title="Aucune constante vitale"
          description="Aucune constante vitale enregistrée pour ce patient."
        />
      );
    }

    return (
      <div className="space-y-4">
        {Array.isArray(allVitals) && allVitals.map((vital, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/0 transition-all duration-300 rounded-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                    <Icon name="Activity" size={16} className="text-primary" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {formatDate(vital.date)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'temperature', label: 'Température', value: vital.temperature, unit: '°C', icon: 'Activity', color: 'text-rose-500' },
                  { key: 'bloodPressure', label: 'Tension', value: vital.bloodPressure, unit: '', icon: 'Activity', color: 'text-blue-500' },
                  { key: 'heartRate', label: 'FC', value: vital.heartRate, unit: ' bpm', icon: 'Heart', color: 'text-rose-500' },
                  { key: 'respiratoryRate', label: 'FR', value: vital.respiratoryRate, unit: '/min', icon: 'Activity', color: 'text-emerald-500' },
                  { key: 'oxygenSaturation', label: 'SpO2', value: vital.oxygenSaturation, unit: '%', icon: 'Activity', color: 'text-blue-500' },
                  { key: 'weight', label: 'Poids', value: vital.weight, unit: ' kg', icon: 'Scale', color: 'text-purple-500' },
                  { key: 'height', label: 'Taille', value: vital.height, unit: ' cm', icon: 'Ruler', color: 'text-indigo-500' },
                  { key: 'bmi', label: 'IMC', value: vital.bmi, unit: ' kg/m²', icon: 'Activity', color: 'text-amber-500' },
                ].filter(item => vital[item.key]).map((item) => (
                  <motion.div
                    key={item.key}
                    whileHover={{ scale: 1.1 }}
                    className="text-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/30 dark:hover:border-primary/30 transition-all"
                  >
                    <Icon name={item.icon} size={18} className={`mx-auto mb-2 ${item.color}`} />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">{item.label}</p>
                    <p className="font-bold text-lg text-slate-900 dark:text-white">
                      {formatVitalValue(vital[item.key])}{item.unit}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  if (!patient) {
    return (
      <EmptyState
        icon="UserX"
        title="Aucun patient sélectionné"
        description="Veuillez sélectionner un patient pour afficher son dossier médical."
      />
    );
  }

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto custom-scrollbar pb-2">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/30'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Icon name={tab.icon} size={18} className={activeTab === tab.id ? 'text-white' : ''} />
            {tab.label}
            {tab.count !== null && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === tab.id
                  ? 'bg-white/25 text-white backdrop-blur-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-xl -z-10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'consultations' && renderConsultations()}
            {activeTab === 'history' && renderHistory()}
            {activeTab === 'allergies' && renderAllergies()}
            {activeTab === 'vitals' && renderVitals()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MedicalRecord;

