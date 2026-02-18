import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import api from '../../../lib/axios';
import { usePatientDetails } from '../../../hooks/usePatients';
import { normalizeApiResponse } from '../../../utils/apiNormalizers';
import { Loader2 } from 'lucide-react';

const EmptyBlock = ({ icon, title, description, className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-14 px-6 text-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 ${className}`}>
    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700 shadow-sm">
      <Icon name={icon} size={28} className="text-slate-400 dark:text-slate-500" />
    </div>
    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">{description}</p>
  </div>
);

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
        <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-12 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-primary" size={36} />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement des consultations...</p>
        </div>
      );
    }

    if (consultations.length === 0) {
      return <EmptyBlock icon="Stethoscope" title="Aucune consultation" description="Aucune consultation enregistrée pour ce patient." />;
    }

    return (
      <div className="space-y-4">
        {Array.isArray(consultations) && consultations.map((consultation, idx) => (
          <motion.div
            key={consultation.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.25 }}
            className="group relative flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 shrink-0 bg-primary rounded-l-xl" />
            <div className="relative z-10 flex-1 pl-4 pr-4 py-4">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <Icon name="Stethoscope" size={20} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {formatDate(consultation.dateConsultation)}
                  </h4>
                  {consultation.motifPrincipal && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                      {consultation.motifPrincipal}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {consultation.medecinName && (
                  <Badge variant="primary" size="sm" className="text-xs">
                    <Icon name="User" size={10} className="mr-1" />
                    {consultation.medecinName}
                  </Badge>
                )}
                {consultation.dureeConsultation && (
                  <Badge variant="info" size="sm" className="text-xs">
                    <Icon name="Clock" size={10} className="mr-1" />
                    {consultation.dureeConsultation} min
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {consultation.vitalSigns && (
                <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <h5 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase mb-2 flex items-center gap-1.5">
                    <Icon name="Activity" size={12} />
                    Constantes
                  </h5>
                  <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                    {consultation.vitalSigns.temperature != null && (
                      <span className="mr-3">Temp: {formatVitalValue(consultation.vitalSigns.temperature)}°C</span>
                    )}
                    {consultation.vitalSigns.bloodPressure && (
                      <span className="mr-3">TA: {consultation.vitalSigns.bloodPressure}</span>
                    )}
                    {consultation.vitalSigns.heartRate != null && (
                      <span>FC: {formatVitalValue(consultation.vitalSigns.heartRate)} bpm</span>
                    )}
                  </div>
                </div>
              )}
              {consultation.diagnosticPrincipal && (
                <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <h5 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase mb-1 flex items-center gap-1.5">
                    <Icon name="FileCheck" size={12} />
                    Diagnostic
                  </h5>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{consultation.diagnosticPrincipal}</p>
                </div>
              )}
            </div>

            {consultation.examenPhysique && (
              <div className="mb-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <h5 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
                  <Icon name="Eye" size={12} />
                  Examen physique
                </h5>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{consultation.examenPhysique}</p>
              </div>
            )}

            {consultation.planTraitement && (
              <div className="mb-3 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <h5 className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase mb-1.5 flex items-center gap-1.5">
                  <Icon name="Pill" size={12} />
                  Plan de traitement
                </h5>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{consultation.planTraitement}</p>
              </div>
            )}

            {Array.isArray(consultation.requestedExams) && consultation.requestedExams.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 self-center mr-1">Examens:</span>
                {consultation.requestedExams.map((exam, i) => (
                  <Badge key={i} variant="info" size="sm" className="text-xs">
                    <Icon name="TestTube" size={10} className="mr-0.5" />
                    {exam}
                  </Badge>
                ))}
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="ghost"
                size="sm"
                iconName="TestTube"
                onClick={() => navigate(`/analyses-laboratoire?patientId=${patient?.id}`)}
                className="rounded-xl w-full"
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
        <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-12 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-primary" size={36} />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement du dossier...</p>
        </div>
      );
    }

    const birthDateValue = patientData?.birthDate || patientData?.dateNaissance || patientData?.birth_date || patientData?.date_naissance;

    return (
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
        >
          <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Icon name="FileText" size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">Antécédents médicaux</h4>
          </div>
          <p className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {patientData?.medicalHistory || patientData?.antecedentsMedicaux || 'Aucun antécédent médical enregistré.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
        >
          <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Icon name="Heart" size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">Informations générales</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 text-sm">
            {[
              { label: 'Groupe sanguin', value: patientData?.bloodType || patientData?.groupeSanguin || 'Non renseigné', icon: 'Activity' },
              { label: 'Date de naissance', value: formatDateOnly(birthDateValue), icon: 'Calendar' },
              { label: 'Assurance', value: patientData?.insurance || patientData?.assuranceMaladie || 'Non renseigné', icon: 'ShieldCheck' },
              { label: 'Contact urgence', value: patientData?.contactUrgenceNom ? `${patientData.contactUrgenceNom} – ${patientData.contactUrgenceTelephone || ''}` : 'Non renseigné', icon: 'Phone' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon name={item.icon} size={14} className="text-primary" />
                  <span className="font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wide">{item.label}</span>
                </div>
                <p className="text-slate-900 dark:text-white font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  };

  const renderAllergies = () => {
    const allergies = patientData?.allergies || [];

    if (allergies.length === 0) {
      return (
        <EmptyBlock
          icon="CheckCircle"
          title="Aucune allergie enregistrée"
          description="Aucune allergie connue pour ce patient."
        />
      );
    }

    return (
      <div className="space-y-3">
        {Array.isArray(allergies) && allergies.map((allergy, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex overflow-hidden rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/80 dark:bg-rose-900/20 hover:shadow-md transition-all"
          >
            <div className="w-1 shrink-0 bg-rose-500" />
            <div className="flex items-center gap-3 p-4 flex-1">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                <Icon name="AlertTriangle" size={20} className="text-rose-600 dark:text-rose-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-rose-900 dark:text-rose-100">{allergy.name || allergy}</p>
                {allergy.severity && (
                  <Badge variant="error" size="sm" className="mt-1.5 text-xs">
                    Sévérité: {allergy.severity}
                  </Badge>
                )}
              </div>
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
        <EmptyBlock
          icon="Activity"
          title="Aucune constante vitale"
          description="Aucune constante vitale enregistrée pour ce patient."
        />
      );
    }

    const vitalItems = [
      { key: 'temperature', label: 'Temp.', value: '°C', icon: 'Activity', color: 'text-rose-500' },
      { key: 'bloodPressure', label: 'TA', value: '', icon: 'Activity', color: 'text-blue-500' },
      { key: 'heartRate', label: 'FC', value: ' bpm', icon: 'Heart', color: 'text-rose-500' },
      { key: 'respiratoryRate', label: 'FR', value: '/min', icon: 'Activity', color: 'text-emerald-500' },
      { key: 'oxygenSaturation', label: 'SpO2', value: '%', icon: 'Activity', color: 'text-blue-500' },
      { key: 'weight', label: 'Poids', value: ' kg', icon: 'Scale', color: 'text-purple-500' },
      { key: 'height', label: 'Taille', value: ' cm', icon: 'Ruler', color: 'text-indigo-500' },
      { key: 'bmi', label: 'IMC', value: '', icon: 'Activity', color: 'text-amber-500' },
    ];

    return (
      <div className="space-y-3">
        {Array.isArray(allVitals) && allVitals.map((vital, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-all"
          >
            <div className="w-1 shrink-0 bg-primary" />
            <div className="flex-1 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <Icon name="Activity" size={14} className="text-primary" />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {formatDate(vital.date)}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {vitalItems.filter(item => vital[item.key] != null && vital[item.key] !== '').map((item) => (
                  <div
                    key={item.key}
                    className="text-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
                  >
                    <Icon name={item.icon} size={16} className={`mx-auto mb-1 ${item.color}`} />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">{item.label}</p>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">
                      {formatVitalValue(vital[item.key])}{item.value}
                    </p>
                  </div>
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
      <EmptyBlock
        icon="UserX"
        title="Aucun patient sélectionné"
        description="Sélectionnez un patient pour afficher son dossier médical."
      />
    );
  }

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto custom-scrollbar pb-2">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border ${
              activeTab === tab.id
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Icon name={tab.icon} size={16} className={activeTab === tab.id ? 'text-white' : ''} />
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === tab.id ? 'bg-white/25' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
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

