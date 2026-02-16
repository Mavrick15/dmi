import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import AnimatedModal from '../../../components/ui/AnimatedModal';
import ImageCropModal from '../../../components/ui/ImageCropModal';
import { Checkbox } from '../../../components/ui/Checkbox';
import { usePermissions } from '../../../hooks/usePermissions';
import { useToast } from '../../../contexts/ToastContext';
import { usePatientDetails } from '../../../hooks/usePatients';
import { Upload, X } from 'lucide-react';
import Image from '../../../components/AppImage';

// Composant de section avec titre - défini en dehors pour éviter les re-renders
const Section = ({ title, icon, children, className = "" }) => (
  <div className={`space-y-3 ${className}`}>
    {title && (
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
        <div className="p-1.5 bg-primary/10 dark:bg-primary/20 rounded-lg">
          <Icon name={icon} size={16} className="text-primary dark:text-blue-400" />
        </div>
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{title}</h3>
      </div>
    )}
    {children}
  </div>
);

const PatientRegistrationModal = ({ isOpen, onClose, onSubmit, patient = null }) => {
  const { hasPermission } = usePermissions();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Récupérer les détails complets du patient si un ID est fourni
  const { data: patientDetails, isLoading: isLoadingPatientDetails } = usePatientDetails(patient?.id);
  
  // Utiliser les détails complets si disponibles, sinon utiliser le patient fourni
  const fullPatientData = patientDetails || patient;
  
  const [formData, setFormData] = useState({
    // Identité
    firstName: '', lastName: '', dateOfBirth: '', gender: 'masculin', placeOfBirth: '',
    // Contact
    phone: '', email: '', address: '', city: 'Kinshasa', postalCode: '', country: 'RD Congo',
    // Contact d'urgence
    emergencyContact: '', emergencyPhone: '', emergencyRelation: '',
    // Professionnel
    profession: '', maritalStatus: '', language: 'li',
    // Assurance
    insurance: 'CPAM', insuranceNumber: '',
    // Médical
    bloodType: '', allergies: [], currentMedications: '', familyHistory: '',
    medicalHistory: '', vaccinations: '', disabilities: '', organDonor: false,
    // Consentements
    consentTreatment: false, consentData: false
  });
  const [errors, setErrors] = useState({});
  const [allergyInput, setAllergyInput] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const fileInputRef = useRef(null);
  const prevIsOpenRef = useRef(false);
  const prevPatientIdRef = useRef(null);
  
  // Générer les initiales
  const getInitials = () => {
    const firstName = formData.firstName || '';
    const lastName = formData.lastName || '';
    if (firstName && lastName) {
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }
    return '?';
  };

  const { showToast } = useToast(); 

  // Effet pour charger les données quand la modale s'ouvre
  useEffect(() => {
    // Ne réinitialiser que lorsque la modale s'ouvre (passe de fermée à ouverte)
    if (!prevIsOpenRef.current && isOpen) {
      const currentPatientId = patient?.id || null;
      
      // Si on est en mode édition et que les détails sont en cours de chargement, attendre
      if (patient?.id && isLoadingPatientDetails) {
        // Mettre à jour les références pour éviter de réinitialiser
        prevIsOpenRef.current = isOpen;
        prevPatientIdRef.current = currentPatientId;
        return;
      }
      
      // Utiliser les données complètes si disponibles
      const dataToUse = patientDetails || patient;
      
      if (dataToUse) {
        const nameParts = dataToUse.name ? dataToUse.name.split(' ') : ['', ''];
        
        let dob = '';
        if (dataToUse.birthDate && dataToUse.birthDate !== 'N/A') {
           const parts = dataToUse.birthDate.split('/');
           if(parts.length === 3) dob = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }

        // Gérer les allergies (peuvent être un array ou un string)
        let allergiesArray = [];
        if (dataToUse.allergies) {
          if (Array.isArray(dataToUse.allergies)) {
            allergiesArray = dataToUse.allergies;
          } else if (typeof dataToUse.allergies === 'string') {
            allergiesArray = dataToUse.allergies.split(',').map(a => a.trim()).filter(a => a);
          } else if (typeof dataToUse.allergies === 'object') {
            allergiesArray = Object.values(dataToUse.allergies).filter(a => a);
          }
        }

        setFormData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          dateOfBirth: dob,
          gender: dataToUse.gender === 'Homme' || dataToUse.gender === 'masculin' ? 'masculin' : 'feminin',
          placeOfBirth: dataToUse.placeOfBirth || '',
          phone: dataToUse.phone !== 'Non renseigné' ? dataToUse.phone : '',
          email: dataToUse.email !== 'Non renseigné' ? dataToUse.email : '',
          address: dataToUse.address !== 'Non renseignée' ? dataToUse.address : '',
          city: dataToUse.city || 'Kinshasa', 
          postalCode: dataToUse.postalCode || '',
          country: dataToUse.country || 'RD Congo',
          emergencyContact: dataToUse.contactUrgenceNom || '',
          emergencyPhone: dataToUse.contactUrgenceTelephone || '',
          emergencyRelation: dataToUse.contactUrgenceRelation || '',
          profession: dataToUse.profession || '',
          maritalStatus: dataToUse.maritalStatus || '',
          language: dataToUse.language || 'li',
          insurance: dataToUse.insurance !== 'Aucune' ? dataToUse.insurance : 'CPAM',
          insuranceNumber: dataToUse.insuranceNumber || '',
          bloodType: dataToUse.bloodType || dataToUse.groupeSanguin || '',
          allergies: allergiesArray,
          currentMedications: dataToUse.currentMedications || '',
          familyHistory: dataToUse.familyHistory || '',
          medicalHistory: dataToUse.medicalHistory !== 'Aucun antécédent noté' ? dataToUse.medicalHistory : '',
          vaccinations: dataToUse.vaccinations || '',
          disabilities: dataToUse.disabilities || '',
          organDonor: dataToUse.organDonor || false,
          consentTreatment: true,
          consentData: true
        });
        setActiveStep(0);
        // Charger l'avatar existant si disponible
        if (dataToUse?.avatar) {
          setAvatarPreview(dataToUse.avatar);
        } else {
          setAvatarPreview(null);
        }
      } else {
        setFormData({
        firstName: '', lastName: '', dateOfBirth: '', gender: 'masculin', placeOfBirth: '',
        phone: '', email: '', address: '', city: 'Kinshasa', postalCode: '', country: 'RD Congo',
          emergencyContact: '', emergencyPhone: '', emergencyRelation: '',
          profession: '', maritalStatus: '', language: 'li',
          insurance: 'CPAM', insuranceNumber: '',
          bloodType: '', allergies: [], currentMedications: '', familyHistory: '',
          medicalHistory: '', vaccinations: '', disabilities: '', organDonor: false,
          consentTreatment: false, consentData: false
        });
        setActiveStep(0);
        // Réinitialiser l'avatar en mode création
        setAvatarPreview(null);
      }
      setErrors({});
      setAllergyInput('');
      setAvatarFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    
    // Mettre à jour les références
    if (isOpen) {
      prevIsOpenRef.current = isOpen;
      prevPatientIdRef.current = patient?.id || null;
    } else if (!isOpen && prevIsOpenRef.current) {
      // Réinitialiser les références quand la modale se ferme
      prevIsOpenRef.current = false;
      prevPatientIdRef.current = null;
    }
  }, [isOpen, patient?.id, isLoadingPatientDetails]);

  // Effet séparé pour mettre à jour le formulaire quand les détails du patient sont chargés
  useEffect(() => {
    // Seulement si la modale est ouverte et qu'on a des détails de patient
    if (isOpen && patient?.id && patientDetails && !isLoadingPatientDetails) {
      const nameParts = patientDetails.name ? patientDetails.name.split(' ') : ['', ''];
      
      let dob = '';
      if (patientDetails.birthDate && patientDetails.birthDate !== 'N/A') {
         const parts = patientDetails.birthDate.split('/');
         if(parts.length === 3) dob = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }

      // Gérer les allergies (peuvent être un array ou un string)
      let allergiesArray = [];
      if (patientDetails.allergies) {
        if (Array.isArray(patientDetails.allergies)) {
          allergiesArray = patientDetails.allergies;
        } else if (typeof patientDetails.allergies === 'string') {
          allergiesArray = patientDetails.allergies.split(',').map(a => a.trim()).filter(a => a);
        } else if (typeof patientDetails.allergies === 'object') {
          allergiesArray = Object.values(patientDetails.allergies).filter(a => a);
        }
      }

      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        dateOfBirth: dob,
        gender: patientDetails.gender === 'Homme' || patientDetails.gender === 'masculin' ? 'masculin' : 'feminin',
        placeOfBirth: patientDetails.placeOfBirth || '',
        phone: patientDetails.phone !== 'Non renseigné' ? patientDetails.phone : '',
        email: patientDetails.email !== 'Non renseigné' ? patientDetails.email : '',
        address: patientDetails.address !== 'Non renseignée' ? patientDetails.address : '',
        city: patientDetails.city || 'Kinshasa', 
        postalCode: patientDetails.postalCode || '',
          country: patientDetails.country || 'RD Congo',
        emergencyContact: patientDetails.contactUrgenceNom || '',
        emergencyPhone: patientDetails.contactUrgenceTelephone || '',
        emergencyRelation: patientDetails.contactUrgenceRelation || '',
        profession: patientDetails.profession || '',
        maritalStatus: patientDetails.maritalStatus || '',
        language: patientDetails.language || 'li',
        insurance: patientDetails.insurance !== 'Aucune' ? patientDetails.insurance : 'CPAM',
        insuranceNumber: patientDetails.insuranceNumber || '',
        bloodType: patientDetails.bloodType || patientDetails.groupeSanguin || '',
        allergies: allergiesArray,
        currentMedications: patientDetails.currentMedications || '',
        familyHistory: patientDetails.familyHistory || '',
        medicalHistory: patientDetails.medicalHistory !== 'Aucun antécédent noté' ? patientDetails.medicalHistory : '',
        vaccinations: patientDetails.vaccinations || '',
        disabilities: patientDetails.disabilities || '',
        organDonor: patientDetails.organDonor || false,
        consentTreatment: true,
        consentData: true
      });
      // Charger l'avatar existant si disponible
      if (patientDetails.avatar) {
        setAvatarPreview(patientDetails.avatar);
      }
    }
  }, [isOpen, patient?.id, patientDetails, isLoadingPatientDetails]);

  const steps = [
    { id: 'identity', label: 'Identité', icon: 'User' },
    { id: 'contact', label: 'Contact', icon: 'Phone' },
    { id: 'professional', label: 'Professionnel', icon: 'Briefcase' },
    { id: 'insurance', label: 'Assurance', icon: 'Shield' },
    { id: 'medical', label: 'Médical', icon: 'Activity' },
    { id: 'summary', label: 'Résumé', icon: 'CheckCircle' }
  ];

  const genderOptions = [
    { value: 'masculin', label: 'Homme' },
    { value: 'feminin', label: 'Femme' },
  ];

  const insuranceOptions = [
    { value: 'CPAM', label: 'CPAM' },
    { value: 'Mutuelle', label: 'Mutuelle' },
    { value: 'Privée', label: 'Assurance privée' },
    { value: 'Aucune', label: 'Aucune assurance' }
  ];

  const bloodTypeOptions = [
    { value: '', label: 'Non renseigné' },
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' }
  ];

  const maritalStatusOptions = [
    { value: '', label: 'Non renseigné' },
    { value: 'celibataire', label: 'Célibataire' },
    { value: 'marie', label: 'Marié(e)' },
    { value: 'divorce', label: 'Divorcé(e)' },
    { value: 'veuf', label: 'Veuf(ve)' },
    { value: 'pacs', label: 'PACS' },
    { value: 'concubinage', label: 'Concubinage' }
  ];

  const emergencyRelationOptions = [
    { value: '', label: 'Relation' },
    { value: 'conjoint', label: 'Conjoint(e)' },
    { value: 'parent', label: 'Parent' },
    { value: 'enfant', label: 'Enfant' },
    { value: 'frere', label: 'Frère/Sœur' },
    { value: 'ami', label: 'Ami(e)' },
    { value: 'autre', label: 'Autre' }
  ];

  const languageOptions = [
    { value: 'li', label: 'Lingala' },
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'Anglais' },
    { value: 'ar', label: 'Arabe' },
    { value: 'es', label: 'Espagnol' },
    { value: 'pt', label: 'Portugais' },
  ];

  const rdcProvinces = [
    { value: '', label: 'Sélectionner une province' },
    { value: 'bas-uele', label: 'Bas-Uele' },
    { value: 'equateur', label: 'Équateur' },
    { value: 'haut-katanga', label: 'Haut-Katanga' },
    { value: 'haut-lomami', label: 'Haut-Lomami' },
    { value: 'haut-uele', label: 'Haut-Uele' },
    { value: 'ituri', label: 'Ituri' },
    { value: 'kasai', label: 'Kasaï' },
    { value: 'kasai-central', label: 'Kasaï-Central' },
    { value: 'kasai-oriental', label: 'Kasaï-Oriental' },
    { value: 'kinshasa', label: 'Kinshasa' },
    { value: 'kong-central', label: 'Kongo-Central' },
    { value: 'kwango', label: 'Kwango' },
    { value: 'kwilu', label: 'Kwilu' },
    { value: 'lomami', label: 'Lomami' },
    { value: 'lualaba', label: 'Lualaba' },
    { value: 'mai-ndombe', label: 'Mai-Ndombe' },
    { value: 'maniema', label: 'Maniema' },
    { value: 'mongala', label: 'Mongala' },
    { value: 'nord-kivu', label: 'Nord-Kivu' },
    { value: 'nord-ubangi', label: 'Nord-Ubangi' },
    { value: 'sankuru', label: 'Sankuru' },
    { value: 'sud-kivu', label: 'Sud-Kivu' },
    { value: 'sud-ubangi', label: 'Sud-Ubangi' },
    { value: 'tanganyika', label: 'Tanganyika' },
    { value: 'tshopo', label: 'Tshopo' },
    { value: 'tshuapa', label: 'Tshuapa' }
  ];

  // Gestion des allergies
  const handleAddAllergy = () => {
    if (allergyInput.trim()) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, allergyInput.trim()]
      }));
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (index) => {
    setFormData(prev => ({
      ...prev,
      allergies: Array.isArray(prev.allergies) ? prev.allergies.filter((_, i) => i !== index) : []
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        showToast('Veuillez sélectionner une image valide', 'error');
        return;
      }
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('L\'image ne doit pas dépasser 5MB', 'error');
        return;
      }
      // Ouvrir le modal de recadrage
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedFile) => {
    setAvatarFile(croppedFile);
    // Créer une preview de l'image recadrée
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(croppedFile);
    setIsCropModalOpen(false);
    setImageToCrop(null);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }, [errors]);

  const validateStep = (stepIndex) => {
    const newErrors = {};
    let isValid = true;

    if (stepIndex === 0) {
      // Identité
      if (!formData.firstName?.trim()) newErrors.firstName = 'Requis';
      if (!formData.lastName?.trim()) newErrors.lastName = 'Requis';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Requis';
    } else if (stepIndex === 1) {
      // Contact
      if (!formData.phone?.trim()) newErrors.phone = 'Requis';
    }
    
    // Le step 5 (Summary) vérifie les consentements
    if (stepIndex === 5) {
      if (!formData.consentTreatment) newErrors.consentTreatment = 'Consentement requis';
      if (!formData.consentData) newErrors.consentData = 'Consentement requis';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
    }
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
        showToast("Veuillez remplir tous les champs obligatoires.", 'warning');
    }
  };

  const handleBack = () => setActiveStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
        showToast("Veuillez accepter les consentements.", 'error');
        return;
    }
    setLoading(true);

    try {
        // Préparation du payload
        const emailToSend = formData.email && formData.email.trim() !== '' 
            ? formData.email 
            : `patient.${Date.now()}@clinique.local`;

        // Préparer l'adresse complète pour le backend (UserProfile)
        const fullAddress = [formData.address, formData.postalCode, formData.city, formData.country]
          .filter(Boolean)
          .join(', ');

        // Si un nouveau fichier avatar est sélectionné, utiliser FormData
        // Sinon, utiliser JSON normal
        if (avatarFile) {
          const formDataPayload = new FormData();
          formDataPayload.append('nomComplet', `${formData.firstName} ${formData.lastName}`);
          formDataPayload.append('email', emailToSend);
          if (formData.phone) formDataPayload.append('telephone', formData.phone);
          if (fullAddress || formData.address) formDataPayload.append('adresse', fullAddress || formData.address);
          if (formData.dateOfBirth) formDataPayload.append('dateNaissance', formData.dateOfBirth);
          if (formData.gender) formDataPayload.append('sexe', formData.gender);
          if (formData.placeOfBirth) formDataPayload.append('lieuNaissance', formData.placeOfBirth);
          if (formData.city) formDataPayload.append('ville', formData.city);
          if (formData.postalCode) formDataPayload.append('codePostal', formData.postalCode);
          if (formData.country) formDataPayload.append('pays', formData.country);
          if (formData.emergencyContact) formDataPayload.append('contactUrgenceNom', formData.emergencyContact);
          if (formData.emergencyPhone) formDataPayload.append('contactUrgenceTelephone', formData.emergencyPhone);
          if (formData.emergencyRelation) formDataPayload.append('contactUrgenceRelation', formData.emergencyRelation);
          if (formData.profession) formDataPayload.append('profession', formData.profession);
          if (formData.maritalStatus) formDataPayload.append('situationFamiliale', formData.maritalStatus);
          if (formData.language) formDataPayload.append('langue', formData.language);
          if (formData.insurance) formDataPayload.append('assuranceMaladie', formData.insurance);
          if (formData.insuranceNumber) formDataPayload.append('numeroAssurance', formData.insuranceNumber);
          if (formData.bloodType) formDataPayload.append('groupeSanguin', formData.bloodType);
          if (formData.allergies.length > 0) formDataPayload.append('allergies', JSON.stringify(formData.allergies));
          if (formData.medicalHistory) formDataPayload.append('antecedentsMedicaux', formData.medicalHistory);
          if (formData.currentMedications) formDataPayload.append('medicamentsActuels', formData.currentMedications);
          if (formData.familyHistory) formDataPayload.append('antecedentsFamiliaux', formData.familyHistory);
          if (formData.vaccinations) formDataPayload.append('vaccinations', formData.vaccinations);
          if (formData.disabilities) formDataPayload.append('handicaps', formData.disabilities);
          formDataPayload.append('donneurOrganes', formData.organDonor ? 'true' : 'false');
          // Envoyer le fichier avec le nom 'file' (le backend cherche 'file' ou 'avatar')
          formDataPayload.append('file', avatarFile);
          
          if (patient) {
            formDataPayload.append('id', patient.id);
            if (patient.userId) formDataPayload.append('userId', patient.userId);
          }

          await onSubmit(formDataPayload);
        } else {
          const payload = {
              nomComplet: `${formData.firstName} ${formData.lastName}`,
              email: emailToSend,
              telephone: formData.phone,
              adresse: fullAddress || formData.address || null,
              // Informations Patient
              dateNaissance: formData.dateOfBirth,
              sexe: formData.gender,
              lieuNaissance: formData.placeOfBirth || null,
              ville: formData.city || null,
              codePostal: formData.postalCode || null,
              pays: formData.country || 'RD Congo',
              // Contact d'urgence
              contactUrgenceNom: formData.emergencyContact || null,
              contactUrgenceTelephone: formData.emergencyPhone || null,
              contactUrgenceRelation: formData.emergencyRelation || null,
              // Professionnel
              profession: formData.profession || null,
              situationFamiliale: formData.maritalStatus || null,
              langue: formData.language || 'li',
              // Assurance
              assuranceMaladie: formData.insurance || null,
              numeroAssurance: formData.insuranceNumber || null,
              // Médical
              groupeSanguin: formData.bloodType || null,
              allergies: formData.allergies.length > 0 ? formData.allergies : null,
              antecedentsMedicaux: formData.medicalHistory || null,
              medicamentsActuels: formData.currentMedications || null,
              antecedentsFamiliaux: formData.familyHistory || null,
              vaccinations: formData.vaccinations || null,
              handicaps: formData.disabilities || null,
              donneurOrganes: formData.organDonor || false,
              // Si on a supprimé l'avatar (pas de preview et pas de fichier), envoyer null
              ...(patient && !avatarPreview && !avatarFile ? { avatar: null } : {}),
          };

          if (patient) {
              payload.id = patient.id; 
              payload.userId = patient.userId;
          }

          await onSubmit(payload);
        }
        
        // Le parent (index.jsx) se charge d'afficher le toast de succès/échec et de fermer la modale.
        setLoading(false);
    } catch (error) {
        // Erreur gérée par l'intercepteur axios et affichée via globalError
        setLoading(false);
        // Le parent gère le toast d'échec global ici
    }
  };

  if (!isOpen) return null;

  const inputClassName = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-primary/20";
  const textareaClassName = "w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all resize-none";

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Identité
        return (
          <div className="space-y-4">
            {/* Avatar Upload Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Icon name="Image" size={12} /> Photo de profil
              </label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div 
                    className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center relative group cursor-pointer transition-all hover:border-primary/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {avatarPreview ? (
                      <>
                        <Image 
                          src={avatarPreview} 
                          className="w-full h-full object-cover" 
                          alt="Avatar preview"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            className="p-1 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-colors"
                            title="Changer la photo"
                          >
                            <Upload size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAvatar();
                            }}
                            className="p-1 bg-rose-500 hover:bg-rose-600 rounded-full text-white transition-colors"
                            title="Supprimer la photo"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-slate-400 dark:text-slate-500 text-xl font-bold">
                          {getInitials()}
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <Upload size={16} className="text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {avatarFile && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Photo sélectionnée ({(avatarFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                  {!avatarPreview && !avatarFile && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Cliquez pour ajouter une photo
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Image Crop Modal */}
            <ImageCropModal
              isOpen={isCropModalOpen}
              onClose={() => {
                setIsCropModalOpen(false);
                setImageToCrop(null);
              }}
              imageSrc={imageToCrop}
              onCrop={handleCropComplete}
              aspectRatio={1}
            />

            <Section title="Informations personnelles" icon="User">
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  label="Prénom *" 
                  value={formData.firstName} 
                  onChange={e => handleInputChange('firstName', e.target.value)} 
                  error={errors.firstName} 
                  className={inputClassName} 
                />
                <Input 
                  label="Nom *" 
                  value={formData.lastName} 
                  onChange={e => handleInputChange('lastName', e.target.value)} 
                  error={errors.lastName} 
                  className={inputClassName} 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  label="Date de naissance *" 
                  type="date" 
                  value={formData.dateOfBirth} 
                  onChange={e => handleInputChange('dateOfBirth', e.target.value)} 
                  error={errors.dateOfBirth} 
                  className={inputClassName} 
                />
                <Select 
                  label="Sexe *" 
                  options={genderOptions} 
                  value={formData.gender} 
                  onChange={v => handleInputChange('gender', v)} 
                  buttonClassName={inputClassName} 
                />
              </div>
              <Select 
                label="Lieu de naissance" 
                options={rdcProvinces} 
                value={formData.placeOfBirth} 
                onChange={v => handleInputChange('placeOfBirth', v)} 
                buttonClassName={inputClassName} 
              />
            </Section>
          </div>
        );
      
      case 1: // Contact
        return (
          <div className="space-y-4">
            <Section title="Coordonnées" icon="Phone">
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  label="Téléphone *" 
                  type="tel" 
                  value={formData.phone} 
                  onChange={e => handleInputChange('phone', e.target.value)} 
                  error={errors.phone}
                  className={inputClassName} 
                />
                <Input 
                  label="Email (Optionnel)" 
                  type="email" 
                  value={formData.email} 
                  onChange={e => handleInputChange('email', e.target.value)} 
                  className={inputClassName} 
                />
              </div>
            </Section>

            <Section title="Adresse" icon="MapPin">
              <Input 
                label="Adresse complète" 
                value={formData.address} 
                onChange={e => handleInputChange('address', e.target.value)} 
                placeholder="Rue, numéro..."
                className={inputClassName} 
              />
              <div className="grid grid-cols-3 gap-3">
                <Input 
                  label="Code Postal" 
                  value={formData.postalCode} 
                  onChange={e => handleInputChange('postalCode', e.target.value)} 
                  className={inputClassName} 
                />
                <Input 
                  label="Ville" 
                  value={formData.city} 
                  onChange={e => handleInputChange('city', e.target.value)} 
                  className={inputClassName} 
                />
                <Input 
                  label="Pays" 
                  value={formData.country} 
                  readOnly
                  className={inputClassName} 
                />
              </div>
            </Section>

            <Section title="Contact d'urgence" icon="AlertCircle">
              <div className="grid grid-cols-3 gap-3">
                <Input 
                  label="Nom du contact" 
                  value={formData.emergencyContact} 
                  onChange={e => handleInputChange('emergencyContact', e.target.value)} 
                  className={inputClassName} 
                />
                <Input 
                  label="Téléphone" 
                  type="tel" 
                  value={formData.emergencyPhone} 
                  onChange={e => handleInputChange('emergencyPhone', e.target.value)} 
                  className={inputClassName} 
                />
                <Select 
                  label="Relation" 
                  options={emergencyRelationOptions} 
                  value={formData.emergencyRelation} 
                  onChange={v => handleInputChange('emergencyRelation', v)} 
                  buttonClassName={inputClassName} 
                />
              </div>
            </Section>
          </div>
        );
      
      case 2: // Professionnel
        return (
          <div className="space-y-4">
            <Section title="Informations professionnelles" icon="Briefcase">
              <Input 
                label="Profession" 
                value={formData.profession} 
                onChange={e => handleInputChange('profession', e.target.value)} 
                placeholder="Ex: Enseignant, Commerçant, Retraité..."
                className={inputClassName} 
              />
              <div className="grid grid-cols-2 gap-3">
                <Select 
                  label="Situation familiale" 
                  options={maritalStatusOptions} 
                  value={formData.maritalStatus} 
                  onChange={v => handleInputChange('maritalStatus', v)} 
                  buttonClassName={inputClassName} 
                />
                <Select 
                  label="Langue préférée" 
                  options={languageOptions} 
                  value={formData.language} 
                  onChange={v => handleInputChange('language', v)} 
                  buttonClassName={inputClassName} 
                />
              </div>
            </Section>
          </div>
        );
      
      case 3: // Assurance
        return (
          <div className="space-y-4">
            <Section title="Couverture médicale" icon="Shield">
              <div className="grid grid-cols-2 gap-3">
                <Select 
                  label="Type d'assurance" 
                  options={insuranceOptions} 
                  value={formData.insurance} 
                  onChange={v => handleInputChange('insurance', v)} 
                  buttonClassName={inputClassName} 
                />
                <Input 
                  label="N° Sécu / Assurance" 
                  value={formData.insuranceNumber} 
                  onChange={e => handleInputChange('insuranceNumber', e.target.value)} 
                  placeholder="Ex: 1 23 45 67 890 12 34"
                  className={inputClassName} 
                />
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Icon name="Info" size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Le numéro de sécurité sociale est confidentiel et sécurisé. Il permet de faciliter les démarches administratives.
                  </p>
                </div>
              </div>
            </Section>
          </div>
        );
      
      case 4: // Médical
        return (
          <div className="space-y-4">
            <Section title="Informations vitales" icon="Activity">
              <div className="grid grid-cols-2 gap-3">
                <Select 
                  label="Groupe sanguin" 
                  options={bloodTypeOptions} 
                  value={formData.bloodType} 
                  onChange={v => handleInputChange('bloodType', v)} 
                  buttonClassName={inputClassName} 
                />
                <div className="flex items-center gap-2 pt-6">
                  <Checkbox 
                    label="Donneur d'organes" 
                    checked={formData.organDonor} 
                    onChange={e => handleInputChange('organDonor', e.target.checked)} 
                    className="dark:text-white" 
                  />
                </div>
              </div>
            </Section>

            <Section title="Allergies" icon="AlertTriangle">
              <div className="flex gap-2 mb-3">
                <Input 
                  value={allergyInput} 
                  onChange={e => setAllergyInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddAllergy()}
                  placeholder="Ajouter une allergie (Ex: Pénicilline, Arachides...)"
                  className={inputClassName}
                />
                <Button 
                  type="button"
                  onClick={handleAddAllergy}
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <Icon name="Plus" size={16} />
                </Button>
              </div>
              {Array.isArray(formData.allergies) && formData.allergies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.allergies.map((allergy, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 rounded-lg text-sm font-medium border border-rose-200 dark:border-rose-800"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(index)}
                        className="hover:text-rose-900 dark:hover:text-rose-100 transition-colors"
                      >
                        <Icon name="X" size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {formData.allergies.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">Aucune allergie enregistrée</p>
              )}
            </Section>

            <Section title="Antécédents médicaux" icon="FileText">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Antécédents personnels
                  </label>
                  <textarea
                    className={`${textareaClassName} min-h-[80px]`}
                    value={formData.medicalHistory}
                    onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                    placeholder="Maladies chroniques, chirurgies passées, hospitalisations..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Antécédents familiaux
                  </label>
                  <textarea
                    className={`${textareaClassName} min-h-[80px]`}
                    value={formData.familyHistory}
                    onChange={(e) => handleInputChange('familyHistory', e.target.value)}
                    placeholder="Maladies héréditaires, antécédents familiaux importants..."
                  />
                </div>
              </div>
            </Section>

            <Section title="Traitements et vaccinations" icon="Pill">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Médicaments actuels
                  </label>
                  <textarea
                    className={`${textareaClassName} min-h-[80px]`}
                    value={formData.currentMedications}
                    onChange={(e) => handleInputChange('currentMedications', e.target.value)}
                    placeholder="Liste des médicaments pris régulièrement..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Vaccinations
                  </label>
                  <textarea
                    className={`${textareaClassName} min-h-[80px]`}
                    value={formData.vaccinations}
                    onChange={(e) => handleInputChange('vaccinations', e.target.value)}
                    placeholder="Vaccins reçus et dates (Ex: COVID-19 - 2021, Grippe - 2023)..."
                  />
                </div>
              </div>
            </Section>

            <Section title="Informations complémentaires" icon="Info">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Handicaps ou limitations
                </label>
                <textarea
                  className={`${textareaClassName} min-h-[80px]`}
                  value={formData.disabilities}
                  onChange={(e) => handleInputChange('disabilities', e.target.value)}
                  placeholder="Handicaps, limitations fonctionnelles, besoins spécifiques..."
                />
              </div>
            </Section>
          </div>
        );
      
      case 5: // Résumé & Consentement
        return (
          <div className="space-y-4">
            <Section title="Récapitulatif" icon="FileText">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-slate-400 text-xs uppercase block font-medium">Patient</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formData.firstName} {formData.lastName}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 text-xs uppercase block font-medium">Né(e) le</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formData.dateOfBirth || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 text-xs uppercase block font-medium">Téléphone</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formData.phone || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 text-xs uppercase block font-medium">Email</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formData.email || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 text-xs uppercase block font-medium">Assurance</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formData.insurance}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 text-xs uppercase block font-medium">Groupe sanguin</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formData.bloodType || 'Non renseigné'}</span>
                  </div>
                  {formData.allergies.length > 0 && (
                    <div className="col-span-2 space-y-1">
                      <span className="text-slate-400 text-xs uppercase block font-medium">Allergies</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{formData.allergies.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </Section>

            <Section title="Consentements" icon="ShieldCheck">
              <div className="space-y-3">
                <div className={`p-4 rounded-lg border transition-colors ${errors.consentTreatment ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'}`}>
                  <Checkbox 
                    label="Je confirme l'exactitude des informations médicales et autorise leur utilisation pour les soins." 
                    checked={formData.consentTreatment} 
                    onChange={e => handleInputChange('consentTreatment', e.target.checked)} 
                    className="dark:text-white" 
                    error={errors.consentTreatment} 
                  />
                </div>
                <div className={`p-4 rounded-lg border transition-colors ${errors.consentData ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'}`}>
                  <Checkbox 
                    label="J'accepte le traitement des données personnelles conformément au RGPD." 
                    checked={formData.consentData} 
                    onChange={e => handleInputChange('consentData', e.target.checked)} 
                    className="dark:text-white" 
                    error={errors.consentData} 
                  />
                </div>
              </div>
            </Section>
          </div>
        );
      
      default: 
        return null;
    }
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} usePortal={true}>
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-800/50 flex justify-between items-center">
          <div>
             <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
               <Icon name={patient ? "Edit" : "UserPlus"} size={22} className="text-primary" />
               {patient ? 'Mise à jour Dossier' : 'Admission Patient'}
             </h2>
             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Étape {activeStep + 1} sur {steps.length}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-slate-200 dark:hover:bg-slate-700">
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Stepper Visual */}
        <div className="px-8 pt-6 pb-4 bg-slate-50/30 dark:bg-slate-800/30">
            <div className="flex justify-between relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full -z-10" />
                <div className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary to-blue-600 rounded-full -z-10 transition-all duration-500 ease-out" style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }} />
                {steps.map((s, i) => (
                    <div key={s.id} className="flex flex-col items-center gap-2 bg-slate-50/30 dark:bg-slate-800/30 px-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${i <= activeStep ? 'bg-gradient-to-br from-primary to-blue-600 text-white border-primary shadow-lg shadow-primary/30 scale-110' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-600'}`}>
                            {i < activeStep ? <Icon name="Check" size={14} strokeWidth={3} /> : <Icon name={s.icon} size={14} />}
                        </div>
                        <span className={`text-[10px] font-semibold uppercase tracking-wide transition-colors ${i <= activeStep ? 'text-primary dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                            {s.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar min-h-[450px] max-h-[60vh]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
            <Button 
              variant="ghost" 
              onClick={activeStep === 0 ? onClose : handleBack} 
              disabled={loading}
              className="hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {activeStep === 0 ? 'Annuler' : 'Précédent'}
            </Button>
            
            {activeStep === steps.length - 1 ? (
                <Button 
                  onClick={handleSubmit} 
                  loading={loading} 
                  disabled={patient ? !hasPermission('patient_edit') : !hasPermission('patient_create')}
                  iconName="Check" 
                  className="shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                >
                  {patient ? 'Mettre à jour' : 'Créer le dossier'}
                </Button>
            ) : (
                <Button 
                  onClick={handleNext} 
                  iconName="ArrowRight" 
                  iconPosition="right"
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                >
                  Suivant
                </Button>
            )}
        </div>
      </div>
    </AnimatedModal>
  );
};

export default PatientRegistrationModal;
