import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import PermissionGuard from '../../../components/PermissionGuard';
import Button from '../../../components/ui/Button';
import { usePatientDetails } from '../../../hooks/usePatients';
import { usePermissions } from '../../../hooks/usePermissions';
import AppointmentsList from './AppointmentsList';
import DocumentsList from './DocumentsList';
import MedicalRecord from './MedicalRecord';
import PatientAnalysesHistory from './PatientAnalysesHistory';

const PatientDetailsModal = ({ isOpen, onClose, patient, onEdit, onSchedule }) => {
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState('overview');

  // Utiliser React Query pour récupérer les données à jour du patient
  const patientId = patient?.id;
  const { data: freshPatientData, refetch: refetchPatient, isLoading: isLoadingPatient } = usePatientDetails(patientId);

  // Utiliser les données fraîches si disponibles, sinon utiliser le patient passé en props
  const currentPatient = freshPatientData || patient;
  const isMinimalPatient = patient && typeof patient === 'object' && Object.keys(patient).length <= 1 && 'id' in patient;

  // Rafraîchir les données quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && patientId) {
      refetchPatient();
    }
  }, [isOpen, patientId, refetchPatient]);

  if (!isOpen) return null;
  if (patientId && isMinimalPatient && isLoadingPatient) {
    return ReactDOM.createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
          <Icon name="Loader2" size={40} className="animate-spin text-primary" />
          <p className="text-slate-600 dark:text-slate-400">Chargement du dossier patient…</p>
        </div>
      </div>,
      document.body
    );
  }
  if (!currentPatient) return null;

  // --- Fonction pour normaliser et formater les allergies ---
  const normalizeAllergies = (allergies) => {
    if (!allergies) return '';

    let allergiesArray = [];

    // Si c'est déjà un tableau
    if (Array.isArray(allergies)) {
      allergiesArray = allergies
        .filter(a => a !== null && a !== undefined)
        .map(a => typeof a === 'string' ? a.trim() : String(a).trim())
        .filter(a => a !== '');
    }
    // Si c'est une chaîne
    else if (typeof allergies === 'string') {
      let cleaned = allergies.trim();

      // Si la chaîne commence par [ et finit par ], c'est du JSON
      if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
        try {
          // Parser directement comme JSON
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed)) {
            allergiesArray = parsed
              .filter(a => a !== null && a !== undefined)
              .map(a => typeof a === 'string' ? a.trim() : String(a).trim())
              .filter(a => a !== '');
          }
        } catch (e) {
          // Si le parsing échoue, retirer manuellement les crochets et guillemets
          // Retirer [ et ]
          cleaned = cleaned.slice(1, -1).trim();
          // Retirer tous les guillemets simples et doubles
          cleaned = cleaned.replace(/["']/g, '');
          // Séparer par virgules et nettoyer
          const items = cleaned.split(',').map(a => a.trim()).filter(a => a !== '');
          allergiesArray = items;
        }
      }
      // Si c'est une chaîne simple (sans crochets)
      else {
        // Essayer de parser comme JSON d'abord (au cas où)
        try {
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed)) {
            allergiesArray = parsed
              .filter(a => a !== null && a !== undefined)
              .map(a => typeof a === 'string' ? a.trim() : String(a).trim())
              .filter(a => a !== '');
          } else {
            // Si ce n'est pas un tableau, traiter comme une seule valeur
            allergiesArray = [cleaned];
          }
        } catch (e) {
          // Si ce n'est pas du JSON, traiter comme une chaîne simple
          // Retirer les guillemets s'il y en a
          cleaned = cleaned.replace(/^["']|["']$/g, '');
          // Séparer par virgules
          const items = cleaned.split(',').map(a => a.trim()).filter(a => a !== '');
          allergiesArray = items.length > 0 ? items : [cleaned];
        }
      }
    }
    // Si c'est un objet, extraire les valeurs
    else if (typeof allergies === 'object' && allergies !== null) {
      const values = Object.values(allergies);
      allergiesArray = values
        .filter(a => a !== null && a !== undefined)
        .map(a => typeof a === 'string' ? a.trim() : String(a).trim())
        .filter(a => a !== '');
    }

    // Retourner une chaîne formatée (séparée par des virgules), sans crochets ni accolades
    if (allergiesArray.length === 0) return '';

    // Joindre les éléments avec des virgules et s'assurer qu'il n'y a pas de caractères indésirables
    const result = allergiesArray
      .map(a => String(a).trim().replace(/[\[\]{}"]/g, '')) // Nettoyer chaque élément
      .filter(a => a !== '')
      .join(', ');

    return result;
  };

  // --- Fonction pour nettoyer les chaînes d'adresse ---
  const cleanAddressString = (str) => {
    if (!str || typeof str !== 'string') return str;
    // Retirer les crochets, accolades et guillemets si présents
    return str.replace(/[\[\]{}"]/g, '').trim();
  };

  // --- Normalisation des données ---
  const data = {
    name: currentPatient.name || 'Patient Inconnu',
    id: currentPatient.numeroPatient || currentPatient.id || 'N/A',
    age: currentPatient.age || '--',
    gender: currentPatient.gender || 'Non spécifié',
    birthDate: currentPatient.birthDate || 'N/A',
    avatar: currentPatient.avatar,
    phone: currentPatient.phone || 'Non renseigné',
    email: currentPatient.email || 'Non renseigné',
    address: cleanAddressString(currentPatient.address) || 'Non renseignée',
    city: cleanAddressString(currentPatient.city) || '',
    postalCode: cleanAddressString(currentPatient.postalCode) || '',
    country: cleanAddressString(currentPatient.country) || '',
    lastVisit: currentPatient.lastVisit || 'Jamais',
    insurance: currentPatient.insurance || 'Aucune',
    insuranceNumber: currentPatient.insuranceNumber || 'N/A',
    bloodType: currentPatient.groupeSanguin || currentPatient.bloodType || 'N/A',
    status: currentPatient.status || 'Inactive',
    allergies: normalizeAllergies(currentPatient.allergies),
    medicalHistory: currentPatient.medicalHistory ? [{ date: 'Passé', type: 'Note', title: 'Antécédents', doctor: 'Système', note: currentPatient.medicalHistory }] : [],
    // Informations supplémentaires (currentPatient pour cohérence quand le modal est ouvert avec seulement { id })
    placeOfBirth: currentPatient.placeOfBirth || '',
    contactUrgenceNom: currentPatient.contactUrgenceNom || '',
    contactUrgenceTelephone: currentPatient.contactUrgenceTelephone || '',
    contactUrgenceRelation: currentPatient.contactUrgenceRelation || '',
    profession: currentPatient.profession || '',
    maritalStatus: currentPatient.maritalStatus || '',
    language: currentPatient.language || '',
    currentMedications: currentPatient.currentMedications || '',
    familyHistory: currentPatient.familyHistory || '',
    vaccinations: currentPatient.vaccinations || '',
    disabilities: currentPatient.disabilities || '',
    organDonor: currentPatient.organDonor || false
  };

  // Mock de données pour la timeline si vide
  if (data.medicalHistory.length === 0 || (data.medicalHistory.length === 1 && data.medicalHistory[0].date === 'Passé')) {
    data.medicalHistory = [
      { date: '2024-10-15', type: 'Consultation', title: 'Douleur thoracique', doctor: 'Dr. Sarah Chen' },
      { date: '2024-08-20', type: 'Examen', title: 'Prise de sang annuelle', doctor: 'Labo Central' },
      ...data.medicalHistory
    ];
  }

  const tabs = [
    { id: 'overview', label: 'Synthèse', icon: 'LayoutDashboard' },
    { id: 'medical', label: 'Dossier Médical', icon: 'Activity' },
    { id: 'analyses', label: 'Analyses', icon: 'TestTube' },
    { id: 'appointments', label: 'Rendez-vous', icon: 'CalendarClock' },
    { id: 'documents', label: 'Documents', icon: 'FolderOpen' },
  ];

  // --- Composant Interne : Chronologie ---
  const MedicalTimeline = () => (
    <div className="space-y-6">
      <div className="mb-4">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Historique Récent</h4>
      </div>
      <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-8">
        {Array.isArray(data.medicalHistory) && data.medicalHistory.map((event, idx) => (
          <div key={idx} className="relative pl-6">
            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-primary"></div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/20 transition-colors">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase">{event.type}</span>
                <span className="text-xs text-slate-400">{event.date}</span>
              </div>
              <h5 className="font-bold text-slate-800 dark:text-white text-sm">{event.title}</h5>
              <p className="text-xs text-slate-500 mt-1">Praticien: {event.doctor}</p>
              {event.note && <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 italic">"{event.note}"</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // --- Composant Interne : Contenu Principal ---
  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Colonne Gauche : Infos Contact & Admin */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Icon name="Contact" size={14} /> Coordonnées
          </h4>
          <div className="space-y-4 text-sm">
            <div className="group flex items-start gap-3">
              <div className="mt-0.5 text-slate-400"><Icon name="Phone" size={16} /></div>
              <div>
                <p className="text-xs text-slate-400">Téléphone</p>
                <p className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">{data.phone}</p>
              </div>
            </div>
            <div className="group flex items-start gap-3">
              <div className="mt-0.5 text-slate-400"><Icon name="Mail" size={16} /></div>
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="font-medium text-slate-700 dark:text-slate-200 break-all">{data.email}</p>
              </div>
            </div>
            <div className="group flex items-start gap-3">
              <div className="mt-0.5 text-slate-400"><Icon name="MapPin" size={16} /></div>
              <div className="flex-1">
                <p className="text-xs text-slate-400">Adresse</p>
                {data.address && data.address !== 'Non renseignée' ? (
                  <p className="font-medium text-slate-700 dark:text-slate-200">{data.address}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">Non renseignée</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact d'urgence */}
        {(data.contactUrgenceNom || data.contactUrgenceTelephone) && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-5">
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Icon name="AlertCircle" size={14} /> Contact d'urgence
            </h4>
            <div className="space-y-2 text-sm">
              {data.contactUrgenceNom && (
                <p className="font-semibold text-amber-900 dark:text-amber-100">{data.contactUrgenceNom}</p>
              )}
              {data.contactUrgenceRelation && (
                <p className="text-xs text-amber-700 dark:text-amber-300">Relation: {data.contactUrgenceRelation}</p>
              )}
              {data.contactUrgenceTelephone && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Icon name="Phone" size={12} />
                  {data.contactUrgenceTelephone}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Informations personnelles */}
        {(data.placeOfBirth || data.profession || data.maritalStatus) && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Icon name="User" size={14} /> Informations personnelles
            </h4>
            <div className="space-y-3 text-sm">
              {data.placeOfBirth && (
                <div className="group flex items-start gap-3">
                  <div className="mt-0.5 text-slate-400"><Icon name="MapPin" size={16} /></div>
                  <div>
                    <p className="text-xs text-slate-400">Lieu de naissance</p>
                    <p className="font-medium text-slate-700 dark:text-slate-200">{data.placeOfBirth}</p>
                  </div>
                </div>
              )}
              {data.profession && (
                <div className="group flex items-start gap-3">
                  <div className="mt-0.5 text-slate-400"><Icon name="Briefcase" size={16} /></div>
                  <div>
                    <p className="text-xs text-slate-400">Profession</p>
                    <p className="font-medium text-slate-700 dark:text-slate-200">{data.profession}</p>
                  </div>
                </div>
              )}
              {data.maritalStatus && (
                <div className="group flex items-start gap-3">
                  <div className="mt-0.5 text-slate-400"><Icon name="Heart" size={16} /></div>
                  <div>
                    <p className="text-xs text-slate-400">Situation familiale</p>
                    <p className="font-medium text-slate-700 dark:text-slate-200">{data.maritalStatus}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-5">
          <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-3">Assurance</h4>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{data.insurance}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-mono mt-0.5">{data.insuranceNumber}</p>
            </div>
            <Icon name="ShieldCheck" className="text-blue-300 dark:text-blue-700" size={32} />
          </div>
        </div>
      </div>

      {/* Colonne Droite : Données Médicales & Historique */}
      <div className="lg:col-span-2 space-y-6">
        {/* Constantes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-xl text-center">
            <span className="text-xs text-rose-600 dark:text-rose-400 font-bold block mb-1">Groupe</span>
            <span className="text-xl font-black text-rose-700 dark:text-rose-300">{data.bloodType}</span>
          </div>
        </div>

        {/* Informations médicales supplémentaires */}
        {(data.allergies || data.currentMedications || data.familyHistory || data.vaccinations || data.disabilities || data.organDonor) && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Icon name="Activity" size={14} /> Informations médicales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {data.allergies && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/30">
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mb-1 flex items-center gap-1">
                    <Icon name="AlertCircle" size={12} /> Allergies & Risques
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{data.allergies}</p>
                </div>
              )}
              {data.currentMedications && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1 flex items-center gap-1">
                    <Icon name="Pill" size={12} /> Médicaments actuels
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{data.currentMedications}</p>
                </div>
              )}
              {data.familyHistory && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1 flex items-center gap-1">
                    <Icon name="Users" size={12} /> Antécédents familiaux
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{data.familyHistory}</p>
                </div>
              )}
              {data.vaccinations && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-bold mb-1 flex items-center gap-1">
                    <Icon name="Shield" size={12} /> Vaccinations
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{data.vaccinations}</p>
                </div>
              )}
              {data.disabilities && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mb-1 flex items-center gap-1">
                    <Icon name="AlertTriangle" size={12} /> Handicaps
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{data.disabilities}</p>
                </div>
              )}
              {data.organDonor && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/30">
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mb-1 flex items-center gap-1">
                    <Icon name="Heart" size={12} /> Donneur d'organes
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">Oui</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Historique */}
        <MedicalTimeline />
      </div>
    </div>
  );

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] my-auto rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
      >

        {/* En-tête Global */}
        <div className="bg-white dark:bg-slate-900 p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-6 items-center sm:items-start relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><Icon name="X" size={24} /></button>

          <div className="relative flex-shrink-0">
            <Image src={data.avatar} alt={data.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-lg border-4 border-white dark:border-slate-800" />
            <span className={`absolute -bottom-2 -right-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white rounded-full ${data.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}>
              {data.status}
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{data.name}</h2>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 rounded"><Icon name="Fingerprint" size={12} /> {data.id}</span>
              <span className="hidden sm:inline">•</span>
              <span>{data.age}</span>
              <span className="hidden sm:inline">•</span>
              <span className="capitalize">{data.gender}</span>
              <span className="hidden sm:inline">•</span>
              <span>Né(e) le {data.birthDate}</span>
            </div>

            <div className="flex justify-center sm:justify-start gap-3 mt-4 pt-2">
              <PermissionGuard requiredPermission="patient_edit">
                <Button variant="outline" size="sm" iconName="Edit" onClick={() => onEdit(currentPatient)} disabled={!hasPermission('patient_edit')} className="dark:border-slate-700 dark:text-slate-200">Modifier</Button>
              </PermissionGuard>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="relative flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 overflow-x-auto custom-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                        relative flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap z-10
                        ${activeTab === tab.id ? 'text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}
                    `}
            >
              <Icon name={tab.icon} size={18} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                    mass: 0.5
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Content Body - Avec transitions fluides et hauteur fixe */}
        <div className="flex-1 overflow-hidden bg-slate-50/30 dark:bg-black/20 relative">
          <div className="h-full overflow-y-auto p-6 md:p-8 custom-scrollbar">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{
                  duration: 0.2,
                  ease: [0.4, 0, 0.2, 1] // ease-out
                }}
                className="w-full"
              >
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'medical' && <MedicalRecord patient={currentPatient} />}
                {activeTab === 'analyses' && <PatientAnalysesHistory patient={currentPatient} />}
                {activeTab === 'appointments' && (
                  <AppointmentsList
                    patient={currentPatient}
                    onOpenScheduler={onSchedule}
                    onSelectAppointment={(appointment) => {
                      // Optionnel : action quand on sélectionne un rendez-vous
                      if (process.env.NODE_ENV === 'development') {
                        console.log('Rendez-vous sélectionné:', appointment);
                      }
                    }}
                  />
                )}
                {activeTab === 'documents' && <DocumentsList patient={currentPatient} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default PatientDetailsModal;