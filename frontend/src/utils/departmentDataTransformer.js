/**
 * Utilitaires pour transformer et agréger les données par département/spécialité
 */

// Palette de couleurs harmonieuses pour les départements
const DEPARTMENT_COLORS = [
  '#3B82F6', // Bleu primaire
  '#8B5CF6', // Violet
  '#10B981', // Vert émeraude
  '#F59E0B', // Ambre
  '#EF4444', // Rouge
  '#06B6D4', // Cyan
  '#EC4899', // Rose
  '#84CC16', // Vert lime
  '#F97316', // Orange
  '#6366F1', // Indigo
];

// Mapping des noms de spécialités vers des noms plus lisibles
const SPECIALTY_NAMES = {
  'Cardiologie': 'Cardiologie',
  'Neurologie': 'Neurologie',
  'Orthopédie': 'Orthopédie',
  'Pédiatrie': 'Pédiatrie',
  'Urgences': 'Urgences',
  'Médecine Générale': 'Médecine Générale',
  'Chirurgie': 'Chirurgie',
  'Dermatologie': 'Dermatologie',
  'Ophtalmologie': 'Ophtalmologie',
  'ORL': 'ORL',
  'Gynécologie': 'Gynécologie',
  'Psychiatrie': 'Psychiatrie',
  'Radiologie': 'Radiologie',
  'Anesthésie': 'Anesthésie',
  'Cardio': 'Cardiologie',
  'Neuro': 'Neurologie',
  'Ortho': 'Orthopédie',
  'Pédia': 'Pédiatrie',
};

/**
 * Normalise le nom d'une spécialité
 */
const normalizeSpecialtyName = (specialty) => {
  if (!specialty) return 'Autre';
  const trimmed = specialty.trim();
  return SPECIALTY_NAMES[trimmed] || trimmed;
};

/**
 * Agrège les données des médecins par département/spécialité
 * @param {Array} topDoctors - Liste des médecins avec leurs statistiques
 * @returns {Array} Données agrégées par département
 */
export const aggregateDepartmentData = (topDoctors) => {
  if (!topDoctors || !Array.isArray(topDoctors) || topDoctors.length === 0) {
    return [];
  }

  // Agrégation par spécialité
  const departmentMap = new Map();

  topDoctors.forEach((doctor) => {
    const specialty = normalizeSpecialtyName(doctor.specialite || doctor.speciality || 'Autre');
    const consultations = doctor.consultationsCount || doctor.consultations || 0;
    const revenue = doctor.revenue || 0;
    const patients = doctor.patientsCount || 0;

    if (departmentMap.has(specialty)) {
      const existing = departmentMap.get(specialty);
      existing.consultations += consultations;
      existing.revenue += revenue;
      existing.patients += patients;
      existing.doctorsCount += 1;
      existing.doctors.push({
        name: doctor.nomComplet || doctor.name,
        consultations: consultations
      });
    } else {
      departmentMap.set(specialty, {
        name: specialty,
        consultations: consultations,
        revenue: revenue,
        patients: patients,
        doctorsCount: 1,
        doctors: [{
          name: doctor.nomComplet || doctor.name,
          consultations: consultations
        }]
      });
    }
  });

  // Convertir en tableau et trier par nombre de consultations
  const aggregated = Array.from(departmentMap.values())
    .sort((a, b) => b.consultations - a.consultations);

  // Calculer le total pour les pourcentages
  const totalConsultations = aggregated.reduce((sum, dept) => sum + dept.consultations, 0);
  const totalRevenue = aggregated.reduce((sum, dept) => sum + dept.revenue, 0);

  // Formater les données pour le graphique avec métriques supplémentaires
  return aggregated.map((dept, index) => ({
    name: dept.name,
    value: dept.consultations,
    fill: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
    // Métriques supplémentaires
    percentage: totalConsultations > 0 ? ((dept.consultations / totalConsultations) * 100).toFixed(1) : 0,
    revenue: dept.revenue,
    revenuePercentage: totalRevenue > 0 ? ((dept.revenue / totalRevenue) * 100).toFixed(1) : 0,
    patients: dept.patients,
    doctorsCount: dept.doctorsCount,
    topDoctor: dept.doctors[0]?.name || 'N/A',
    // Données pour tooltip enrichi
    tooltipData: {
      consultations: dept.consultations,
      revenue: dept.revenue,
      patients: dept.patients,
      doctors: dept.doctorsCount,
      percentage: totalConsultations > 0 ? ((dept.consultations / totalConsultations) * 100).toFixed(1) : 0
    }
  }));
};

/**
 * Génère des données par défaut si aucune donnée n'est disponible
 */
export const getDefaultDepartmentData = () => {
  return [
    { name: 'Cardiologie', value: 0, fill: DEPARTMENT_COLORS[0], percentage: 0, revenue: 0, patients: 0, doctorsCount: 0 },
    { name: 'Neurologie', value: 0, fill: DEPARTMENT_COLORS[1], percentage: 0, revenue: 0, patients: 0, doctorsCount: 0 },
    { name: 'Orthopédie', value: 0, fill: DEPARTMENT_COLORS[2], percentage: 0, revenue: 0, patients: 0, doctorsCount: 0 },
    { name: 'Pédiatrie', value: 0, fill: DEPARTMENT_COLORS[3], percentage: 0, revenue: 0, patients: 0, doctorsCount: 0 },
    { name: 'Urgences', value: 0, fill: DEPARTMENT_COLORS[4], percentage: 0, revenue: 0, patients: 0, doctorsCount: 0 }
  ];
};

