/**
 * Transformateurs de données côté frontend
 * Normalisent et structurent les données reçues du backend
 */
import { formatTimeInBusinessTimezone, toBusinessDateKey } from './dateTime'

/**
 * Transforme les données du dashboard en structure cohérente
 */
export const transformDashboardData = (data) => {
  // Si les données sont null ou undefined
  if (!data) {
    return {
      metrics: {
        totalPatients: 0,
        appointments: 0,
        revenue: 0,
        alerts: 0,
        consultationsToday: 0,
        totalUsers: 0,
        activeUsers: 0,
        criticalPatients: 0
      },
      appointments: [],
      charts: { revenue: [] },
      widgets: {
        recentPatients: [],
        pendingTasks: [],
        systemAlerts: []
      },
      statistics: {
        consultationsToday: 0,
        totalUsers: 0,
        activeUsers: 0,
        criticalPatients: 0
      }
    }
  }

  // Si les données sont déjà structurées (nouveau format avec metrics, appointments, widgets)
  if (data.metrics && data.appointments && data.widgets) {
    return data
  }

  // Si les données ont un champ success mais pas la structure attendue
  if (data.success === false) {
    return {
      metrics: {
        totalPatients: 0,
        appointments: 0,
        revenue: 0,
        alerts: 0,
        consultationsToday: 0
      },
      appointments: [],
      charts: { revenue: [] },
      widgets: {
        recentPatients: [],
        pendingTasks: [],
        systemAlerts: []
      },
      statistics: {
        consultationsToday: 0
      }
    }
  }

  // Transformation depuis l'ancien format (rétrocompatibilité)
  return {
    metrics: {
      totalPatients: data.metrics?.totalPatients || data.metrics?.patients || 0,
      activePatients: data.metrics?.activePatients || data.metrics?.patients || 0, // Patients actifs
      patients: data.metrics?.activePatients || data.metrics?.patients || 0, // Alias pour compatibilité (patients actifs)
      appointments: data.metrics?.appointments || data.metrics?.appointmentsToday || 0,
      revenue: data.metrics?.revenue || data.metrics?.monthlyRevenue || 0,
      alerts: data.metrics?.alerts || data.metrics?.urgentAlerts || 0,
      consultationsToday: data.metrics?.consultationsToday || data.statistics?.consultationsToday || data.medicalStats?.consultationsToday || 0,
      totalUsers: data.metrics?.totalUsers || data.statistics?.totalUsers || 0,
      activeUsers: data.metrics?.activeUsers || data.statistics?.activeUsers || 0,
      criticalPatients: data.metrics?.criticalPatients || data.statistics?.criticalPatients || data.medicalStats?.criticalPatients || 0
    },
    appointments: normalizeAppointments(data.appointments || []),
    charts: {
      revenue: data.revenueChart || data.charts?.revenue || []
    },
    widgets: {
      recentPatients: normalizeRecentPatients(data.recentPatients || []),
      pendingTasks: normalizePendingTasks(data.pendingTasks || { documents: [] }),
      systemAlerts: normalizeSystemAlerts(data.alerts || { lowStock: [] })
    },
    statistics: {
      consultationsToday: data.statistics?.consultationsToday || data.medicalStats?.consultationsToday || 0,
      totalUsers: data.statistics?.totalUsers || data.metrics?.totalUsers || 0,
      activeUsers: data.statistics?.activeUsers || data.metrics?.activeUsers || 0,
      criticalPatients: data.statistics?.criticalPatients || data.medicalStats?.criticalPatients || data.metrics?.criticalPatients || 0
    }
  }
}

/**
 * Normalise les rendez-vous
 */
const normalizeAppointments = (appointments) => {
  if (!Array.isArray(appointments)) return []
  
  return appointments.map(apt => ({
    id: apt.id,
    patientId: apt.patientId || apt.patient?.id,
    patientName: apt.patientName || apt.patient?.name || 'Patient inconnu',
    medecinId: apt.medecinId || apt.medecin?.id,
    medecinName: apt.medecinName || apt.medecin?.name || 'Médecin inconnu',
    dateHeure: apt.dateHeure || apt.date_heure,
    date: apt.date || (apt.dateHeure ? toBusinessDateKey(apt.dateHeure) : null),
    time: apt.time || (apt.dateHeure ? formatTimeInBusinessTimezone(apt.dateHeure) : null),
    motif: apt.motif || apt.type || 'Consultation',
    statut: apt.statut || apt.status,
    priorite: apt.priorite || apt.priority || 'normale',
    duration: apt.duration || apt.dureeMinutes || 30,
    hasConsultation: apt.hasConsultation || false,
    notes: apt.notes || null
  }))
}

/**
 * Normalise les patients récents
 */
const normalizeRecentPatients = (patients) => {
  if (!Array.isArray(patients)) return []
  
  return patients.map(p => ({
    id: p.id,
    name: p.name || p.user?.nomComplet || `Patient ${p.numeroPatient}`,
    numeroPatient: p.numeroPatient,
    createdAt: p.createdAt || p.created_at || p.user?.createdAt || null,
    lastVisit: p.lastVisit || p.last_visit || null,
    avatar: p.avatar || p.user?.photoProfil || null
  }))
}

/**
 * Normalise les tâches en attente
 */
const normalizePendingTasks = (tasks) => {
  const documents = Array.isArray(tasks.documents) ? tasks.documents : []
  
  return documents.map(doc => ({
    id: doc.id,
    title: doc.title || doc.titre,
    patientName: doc.patientName || doc.patient?.name || 'N/A',
    category: doc.category,
    createdAt: doc.createdAt || doc.created_at
  }))
}

/**
 * Normalise les alertes système
 */
const normalizeSystemAlerts = (alerts) => {
  const lowStock = Array.isArray(alerts.lowStock) ? alerts.lowStock : []
  
  return lowStock.map(med => ({
    id: med.id,
    name: med.name || med.nom,
    stockActuel: med.stockActuel || med.stock_actuel || 0,
    stockMinimum: med.stockMinimum || med.stock_minimum || 0,
    unite: med.unite || 'unité'
  }))
}

/**
 * Transforme les données de patient
 */
export const transformPatientData = (data) => {
  if (!data) return null
  
  return {
    id: data.id,
    userId: data.userId,
    numeroPatient: data.numeroPatient,
    name: data.name,
    email: data.email || 'Non renseigné',
    phone: data.phone || 'Non renseigné',
    address: data.address || 'Non renseignée',
    avatar: data.avatar || null,
    age: data.age,
    birthDate: data.birthDate || data.birth_date || data.dateNaissance || data.date_naissance,
    gender: data.gender || data.sexe,
    bloodType: data.bloodType || data.groupeSanguin || 'N/A',
    insurance: data.insurance || data.assuranceMaladie || 'Aucune',
    insuranceNumber: data.insuranceNumber || data.numeroAssurance || '',
    status: data.status || (data.user?.actif ? 'Active' : 'Inactive'),
    lastVisit: data.lastVisit || data.last_visit,
    allergies: (() => {
      if (!data.allergies) return [];
      if (Array.isArray(data.allergies)) return data.allergies;
      if (typeof data.allergies === 'string') {
        try {
          // Essayer de parser comme JSON
          const parsed = JSON.parse(data.allergies);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          // Si ce n'est pas du JSON valide, traiter comme une chaîne simple
          const items = data.allergies.split(',').map(a => a.trim()).filter(a => a !== '');
          return items;
        }
      }
      return [];
    })(),
    medicalHistory: data.medicalHistory || data.antecedentsMedicaux || 'Aucun antécédent noté',
    appointments: data.appointments || [],
    consultations: data.consultations || [],
    documents: data.documents || [],
    // Nouveaux champs ajoutés
    placeOfBirth: data.placeOfBirth || data.lieuNaissance || '',
    city: data.city || data.ville || '',
    postalCode: data.postalCode || data.codePostal || '',
    country: data.country || data.pays || 'France',
    contactUrgenceNom: data.contactUrgenceNom || '',
    contactUrgenceTelephone: data.contactUrgenceTelephone || '',
    contactUrgenceRelation: data.contactUrgenceRelation || '',
    profession: data.profession || '',
    maritalStatus: data.maritalStatus || data.situationFamiliale || '',
    language: data.language || data.langue || 'li',
    currentMedications: data.currentMedications || data.medicamentsActuels || '',
    familyHistory: data.familyHistory || data.antecedentsFamiliaux || '',
    vaccinations: data.vaccinations || '',
    disabilities: data.disabilities || data.handicaps || '',
    organDonor: data.organDonor || data.donneurOrganes || false
  }
}

/**
 * Transforme une liste de patients
 */
export const transformPatientsList = (response) => {
  if (!response || !response.success) {
    return {
      data: [],
      meta: {
        current_page: 1,
        per_page: 12,
        total: 0,
        last_page: 1
      }
    }
  }

  return {
    data: Array.isArray(response.data) 
      ? response.data.map(transformPatientData)
      : [],
    meta: response.meta || {
      current_page: response.current_page || 1,
      per_page: response.per_page || response.limit || 12,
      total: response.total || 0,
      last_page: response.last_page || response.lastPage || 1
    }
  }
}

