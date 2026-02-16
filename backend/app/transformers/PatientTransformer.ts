import { BaseTransformer } from './BaseTransformer.js'
import type Patient from '#models/Patient'

/**
 * Transformer pour les données Patient
 * Centralise la logique de sérialisation des patients
 */
export class PatientTransformer extends BaseTransformer {
  /**
   * Transforme un patient en format API standard
   */
  static transform(patient: Patient, detailed: boolean = false): any {
    const transformer = new PatientTransformer()
    return transformer.serialize(patient, detailed)
  }

  /**
   * Transforme une liste de patients
   */
  static transformMany(patients: Patient[], detailed: boolean = false): any[] {
    return patients.map(p => this.transform(p, detailed))
  }

  /**
   * Sérialise un patient
   */
  private serialize(patient: Patient, detailed: boolean): any {
    // Calcul de l'âge
    const age = this.calculateAge(patient.dateNaissance)
    
    // Formatage des données de base
    const baseData = {
      id: patient.id,
      userId: patient.userId,
      numeroPatient: patient.numeroPatient,
      
      // Informations personnelles
      name: this.getPatientName(patient),
      email: this.getValue(patient.user?.email, 'Non renseigné'),
      phone: this.getPhone(patient),
      address: this.getValue(patient.user?.adresse, 'Non renseignée'),
      avatar: patient.user?.photoProfil || null,
      
      // Informations médicales
      age: age,
      birthDate: this.formatDate(patient.dateNaissance),
      gender: this.formatGender(patient.sexe),
      bloodType: this.getValue(patient.groupeSanguin, 'N/A'),
      
      // Informations administratives
      insurance: this.getValue(patient.assuranceMaladie, 'Aucune'),
      insuranceNumber: this.getValue(patient.numeroAssurance, ''),
      status: patient.user?.actif ? 'Active' : 'Inactive',
      lastVisit: this.formatDate(patient.updatedAt),
      
      // Informations médicales détaillées
      allergies: this.normalizeArray<string>(patient.allergies),
      medicalHistory: this.getValue(patient.antecedentsMedicaux, 'Aucun antécédent noté'),
      
      // Contacts d'urgence
      contactUrgenceNom: patient.contactUrgenceNom,
      contactUrgenceTelephone: patient.contactUrgenceTelephone,
      contactUrgenceRelation: patient.contactUrgenceRelation,
      
      // Informations complémentaires
      placeOfBirth: patient.lieuNaissance,
      city: patient.ville,
      postalCode: patient.codePostal,
      country: patient.pays,
      profession: patient.profession,
      maritalStatus: patient.situationFamiliale,
      language: patient.langue,
      currentMedications: patient.medicamentsActuels,
      familyHistory: patient.antecedentsFamiliaux,
      vaccinations: patient.vaccinations,
      disabilities: patient.handicaps,
      organDonor: patient.donneurOrganes
    }

    // Si mode détaillé, ajouter les relations
    if (detailed) {
      return {
        ...baseData,
        appointments: this.serializeAppointments(patient),
        consultations: this.serializeConsultations(patient),
        documents: this.serializeDocuments(patient)
      }
    }

    return baseData
  }

  /**
   * Calcule l'âge à partir de la date de naissance
   */
  private calculateAge(dateNaissance: any): number | null {
    if (!dateNaissance) return null
    try {
      return Math.floor(Math.abs(dateNaissance.diffNow('years').years))
    } catch {
      return null
    }
  }

  /**
   * Récupère le nom du patient
   */
  private getPatientName(patient: Patient): string {
    return patient.user?.nomComplet || 'Dossier Incomplet'
  }

  /**
   * Récupère le téléphone du patient
   */
  private getPhone(patient: Patient): string {
    return patient.user?.telephone || 
           patient.contactUrgenceTelephone || 
           'Non renseigné'
  }

  /**
   * Formate le genre
   */
  private formatGender(sexe: string | null | undefined): string {
    const genderMap: Record<string, string> = {
      'masculin': 'Homme',
      'feminin': 'Femme',
      'autre': 'Autre'
    }
    return genderMap[sexe || ''] || 'Non spécifié'
  }

  /**
   * Sérialise les rendez-vous
   */
  private serializeAppointments(patient: Patient): any[] {
    const rendezVous = this.normalizeArray(patient.$preloaded.rendezVous)
    return rendezVous.map((r: any) => ({
      id: r.id,
      date: r.dateHeure?.toISODate(),
      time: r.dateHeure?.toFormat('HH:mm'),
      type: r.motif || r.statut,
      status: r.statut,
      medecin: r.medecin?.user?.nomComplet
    }))
  }

  /**
   * Sérialise les consultations
   */
  private serializeConsultations(patient: Patient): any[] {
    const consultations = this.normalizeArray(patient.$preloaded.consultations)
    return consultations.map((c: any) => ({
      id: c.id,
      date: c.dateConsultation?.toISODate(),
      diagnostic: c.diagnosticPrincipal,
      notes: c.examenPhysique,
      medecin: c.medecin?.user?.nomComplet
    }))
  }

  /**
   * Sérialise les documents
   */
  private serializeDocuments(patient: Patient): any[] {
    const documents = this.normalizeArray(patient.$preloaded.documents)
    return documents.map((d: any) => ({
      id: d.id,
      title: d.titre,
      category: d.category,
      createdAt: this.formatDate(d.createdAt),
      status: d.statut
    }))
  }
}

