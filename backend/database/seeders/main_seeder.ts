// backend/database/seeders/main_seeder.ts

import { BaseSeeder } from '@adonisjs/lucid/seeders'
import UserProfile from '#models/UserProfile'
import Patient from '#models/Patient'
import Medecin from '#models/Medecin'
import Medicament from '#models/Medicament'
import Facture from '#models/Facture'
import Transaction from '#models/Transaction'
import RendezVous from '#models/RendezVous'
import Consultation from '#models/Consultation'
import Prescription from '#models/Prescription'
import Fournisseur from '#models/Fournisseur'
import Etablissement from '#models/Etablissement'
import Document from '#models/Document'
import Notification from '#models/Notification'
import CommandeFournisseur from '#models/CommandeFournisseur'
import LigneCommandeFournisseur from '#models/LigneCommandeFournisseur'
import InventaireMouvement from '#models/InventaireMouvement'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import { randomUUID } from 'crypto'

export default class MainSeeder extends BaseSeeder {
  /**
   * Génère un numéro de patient au format "PAT-yymjsec" avec garantie d'unicité
   * yy: année (2 chiffres)
   * m: mois (1-9 pour janvier-septembre, A-C pour octobre-décembre)
   * j: jour (1-9 pour 1-9, A-V pour 10-31)
   * sec: combinaison de secondes + index pour garantir l'unicité (3 chiffres, 000-999)
   */
  private async generateUniquePatientNumber(index: number = 0): Promise<string> {
    const now = DateTime.now()
    const year = now.year.toString().slice(-2) // 2 derniers chiffres de l'année
    const month = now.month
    const day = now.day
    const seconds = now.second
    const milliseconds = now.millisecond
    
    // Conversion du mois : 1-9 pour janvier-septembre, A-C pour octobre-décembre
    const monthChar = month <= 9 ? month.toString() : String.fromCharCode(64 + month - 9) // A=10, B=11, C=12
    
    // Conversion du jour : 1-9 pour 1-9, A-V pour 10-31
    const dayChar = day <= 9 ? day.toString() : String.fromCharCode(64 + day - 9) // A=10, B=11, ..., V=31
    
    // Combiner secondes (0-59) + millisecondes (0-9) + index pour créer un nombre unique sur 3 chiffres
    // Format: (seconds * 10) + (milliseconds / 100) + (index % 10) pour rester dans 0-999
    // Mais pour plus de simplicité, utilisons: (seconds * 10) + (index % 10) + (milliseconds % 10)
    const uniqueValue = (seconds * 10 + (index % 10) + (milliseconds % 10)) % 1000
    const secStr = uniqueValue.toString().padStart(3, '0')
    
    let numeroPatient = `PAT-${year}${monthChar}${dayChar}${secStr}`
    
    // Vérifier l'unicité et ajouter un suffixe si nécessaire
    let attempts = 0
    const maxAttempts = 10
    while (attempts < maxAttempts) {
      const existing = await Patient.query().where('numeroPatient', numeroPatient).first()
      if (!existing) {
        break
      }
      // Si le numéro existe, utiliser l'index + un nombre aléatoire
      const fallbackValue = ((index * 10) + Math.floor(Math.random() * 10)) % 1000
      const fallbackStr = fallbackValue.toString().padStart(3, '0')
      numeroPatient = `PAT-${year}${monthChar}${dayChar}${fallbackStr}`
      attempts++
    }
    
    if (attempts >= maxAttempts) {
      // En dernier recours, utiliser un UUID court
      const uuidShort = randomUUID().substring(0, 6).toUpperCase()
      numeroPatient = `PAT-${year}${monthChar}${dayChar}${uuidShort}`
    }
    
    return numeroPatient
  }

  /**
   * Génère un numéro de commande au format "CMD-yymjXXX"
   */
  private generateOrderNumber(index: number = 0): string {
    const now = DateTime.now()
    const year = now.year.toString().slice(-2)
    const month = now.month
    const day = now.day
    
    const monthChar = month <= 9 ? month.toString() : String.fromCharCode(64 + month - 9)
    const dayChar = day <= 9 ? day.toString() : String.fromCharCode(64 + day - 9)
    // Utiliser l'index directement pour garantir l'unicité dans le seeder
    const uniqueNum = (index % 1000).toString().padStart(3, '0')
    
    return `CMD-${year}${monthChar}${dayChar}${uniqueNum}`
  }

  /**
   * Génère un numéro de facture au format "FACT-yymjXXX"
   */
  private generateInvoiceNumber(index: number = 0): string {
    const now = DateTime.now()
    const year = now.year.toString().slice(-2)
    const month = now.month
    const day = now.day
    
    const monthChar = month <= 9 ? month.toString() : String.fromCharCode(64 + month - 9)
    const dayChar = day <= 9 ? day.toString() : String.fromCharCode(64 + day - 9)
    // Utiliser l'index directement pour garantir l'unicité dans le seeder
    const uniqueNum = (index % 1000).toString().padStart(3, '0')
    
    return `FACT-${year}${monthChar}${dayChar}${uniqueNum}`
  }

  /**
   * Génère un numéro de lot au format "LOT-yymjXXX"
   */
  private generateLotNumber(index: number = 0): string {
    const now = DateTime.now()
    const year = now.year.toString().slice(-2)
    const month = now.month
    const day = now.day
    
    const monthChar = month <= 9 ? month.toString() : String.fromCharCode(64 + month - 9)
    const dayChar = day <= 9 ? day.toString() : String.fromCharCode(64 + day - 9)
    // Utiliser l'index directement pour garantir l'unicité dans le seeder
    const uniqueNum = (index % 1000).toString().padStart(3, '0')
    
    return `LOT-${year}${monthChar}${dayChar}${uniqueNum}`
  }

  /**
   * Génère un numéro d'analyse au format "ANL-yymjXXX"
   */
  private generateAnalyseNumber(index: number = 0): string {
    const now = DateTime.now()
    const year = now.year.toString().slice(-2)
    const month = now.month
    const day = now.day
    
    const monthChar = month <= 9 ? month.toString() : String.fromCharCode(64 + month - 9)
    const dayChar = day <= 9 ? day.toString() : String.fromCharCode(64 + day - 9)
    // Utiliser l'index directement pour garantir l'unicité dans le seeder
    const uniqueNum = (index % 1000).toString().padStart(3, '0')
    
    return `ANL-${year}${monthChar}${dayChar}${uniqueNum}`
  }

  public async run() {
    console.log('🌱 Démarrage du Seeding "OpenClinic" (Version Enrichie)...')

    // 1. Nettoyage complet (Attention à l'ordre des FK)
    await db.rawQuery(`
      TRUNCATE TABLE 
        prescriptions, consultations, transactions_financieres, factures, 
        rendez_vous, inventaire_mouvements, lignes_commande_fournisseur, 
        commandes_fournisseurs, documents, notifications,
        fournisseurs, medicaments, patients, medecins, etablissements, 
        user_profiles, api_tokens
      RESTART IDENTITY CASCADE
    `)

    const password = await hash.make('Password123!')

    // --------------------------------------------------------
    // 2. Établissements (Plusieurs)
    // --------------------------------------------------------
    const etablissements = await Etablissement.createMany([
      {
        nom: 'Cmedith_Lemba',
        adresse: 'Clinique Lemba Foire — Avenue Labue n°13, Lemba Foire',
        telephone: '+243 999 952 335',
        email: 'contact.lemba@cmedith.cd',
        typeEtablissement: 'centre_medical',
        actif: true
      },
      {
        nom: 'Cmedith_Gombe',
        adresse: 'Cabinet Centre-Ville — Boulevard du 30 Juin n°364, En face de la grande poste',
        telephone: '+243 999 952 335',
        email: 'contact.gombe@cmedith.cd',
        typeEtablissement: 'centre_medical',
        actif: true
      }
    ])
    console.log(`✅ ${etablissements.length} Établissements créés`)

    // --------------------------------------------------------
    // 3. Staff & Utilisateurs (Enrichi)
    // --------------------------------------------------------
    
    // Admin
    await UserProfile.create({
      email: 'admin@openclinic.cd',
      password,
      nomComplet: 'Administrateur Système',
      role: 'admin',
      actif: true
    })

    // Gestionnaires
    await UserProfile.createMany([
      { email: 'finance@openclinic.cd', password, nomComplet: 'Jean Comptable', role: 'gestionnaire', actif: true },
      { email: 'gestion@openclinic.cd', password, nomComplet: 'Marie Gestion', role: 'gestionnaire', actif: true }
    ])

    // Pharmaciens
    const pharmaciens = await UserProfile.createMany([
      { email: 'pharma1@openclinic.cd', password, nomComplet: 'Marie Curie', role: 'pharmacien', actif: true },
      { email: 'pharma2@openclinic.cd', password, nomComplet: 'Louis Pasteur', role: 'pharmacien', actif: true },
      { email: 'pharma3@openclinic.cd', password, nomComplet: 'Alexander Fleming', role: 'pharmacien', actif: true }
    ])

    // Médecins (Médecine générale + Médecin biologiste)
    const doctorsData: { name: string; email: string; spec: string; doctorRole: 'docteur_clinique' | 'docteur_labo' }[] = [
      { name: 'Dr. Gregory House', email: 'house', spec: 'Médecine Interne', doctorRole: 'docteur_clinique' },
      { name: 'Dr. Derek Shepherd', email: 'shepherd', spec: 'Neurochirurgie', doctorRole: 'docteur_clinique' },
      { name: 'Dr. Meredith Grey', email: 'grey', spec: 'Chirurgie Générale', doctorRole: 'docteur_clinique' },
      { name: 'Dr. Stephen Strange', email: 'strange', spec: 'Traumatologie', doctorRole: 'docteur_clinique' },
      { name: 'Dr. Michaela Quinn', email: 'quinn', spec: 'Pédiatrie', doctorRole: 'docteur_clinique' },
      { name: 'Dr. Leonard McCoy', email: 'mccoy', spec: 'Cardiologie', doctorRole: 'docteur_clinique' },
      { name: 'Dr. James Wilson', email: 'wilson', spec: 'Oncologie', doctorRole: 'docteur_labo' },
      { name: 'Dr. Lisa Cuddy', email: 'cuddy', spec: 'Endocrinologie', doctorRole: 'docteur_clinique' },
      { name: 'Dr. Eric Foreman', email: 'foreman', spec: 'Neurologie', doctorRole: 'docteur_clinique' },
      { name: 'Dr. Allison Cameron', email: 'cameron', spec: 'Immunologie', doctorRole: 'docteur_labo' },
      { name: 'Dr. Robert Chase', email: 'chase', spec: 'Chirurgie Cardiaque', doctorRole: 'docteur_clinique' },
      { name: 'Dr. Chris Taub', email: 'taub', spec: 'Chirurgie Plastique', doctorRole: 'docteur_clinique' },
      { name: 'Dr. Remy Hadley', email: 'hadley', spec: 'Psychiatrie', doctorRole: 'docteur_clinique' },
      { name: 'Dr. Lawrence Kutner', email: 'kutner', spec: 'Médecine du Sport', doctorRole: 'docteur_clinique' },
      { name: 'Dr. Amber Volakis', email: 'volakis', spec: 'Radiologie', doctorRole: 'docteur_labo' },
      { name: 'Dr. Martha Masters', email: 'masters', spec: 'Gynécologie', doctorRole: 'docteur_clinique' },
      { name: 'Dr. Jessica Adams', email: 'adams', spec: 'Dermatologie', doctorRole: 'docteur_clinique' },
      { name: 'Dr. Chi Park', email: 'park', spec: 'Ophtalmologie', doctorRole: 'docteur_clinique' },
      { name: 'Dr. Dominika Petrovic', email: 'petrovic', spec: 'Urologie', doctorRole: 'docteur_clinique' },
      { name: 'Dr. Marcus Andrews', email: 'andrews', spec: 'ORL', doctorRole: 'docteur_labo' }
    ]

    const doctorsList: Medecin[] = []
    for (const d of doctorsData) {
      const u = await UserProfile.create({
        email: `${d.email}@openclinic.cd`,
        password,
        nomComplet: d.name,
        role: d.doctorRole,
        actif: true
      })
      
      const med = await Medecin.create({
        userId: u.id,
        numeroOrdre: `ORD-${randomUUID().substring(0, 8).toUpperCase()}`,
        specialite: d.spec,
        etablissementId: etablissements[Math.floor(Math.random() * etablissements.length)].id,
        disponible: Math.random() > 0.2 // 80% disponibles
      })
      doctorsList.push(med)
    }
    console.log(`✅ ${doctorsList.length} Médecins créés`)

    // Infirmières
    const infirmieres = await UserProfile.createMany([
      { email: 'nurse1@openclinic.cd', password, nomComplet: 'Carla Espinosa', role: 'infirmiere', actif: true },
      { email: 'nurse2@openclinic.cd', password, nomComplet: 'Jackie Peyton', role: 'infirmiere', actif: true },
      { email: 'nurse3@openclinic.cd', password, nomComplet: 'Carol Hathaway', role: 'infirmiere', actif: true },
      { email: 'nurse4@openclinic.cd', password, nomComplet: 'Abby Lockhart', role: 'infirmiere', actif: true }
    ])

    // --------------------------------------------------------
    // 4. Fournisseurs (Enrichi)
    // --------------------------------------------------------
    const fournisseurs = await Fournisseur.createMany([
      { nom: 'MedPharma Distribution', contactNom: 'Paul Martin', email: 'commandes@medpharma.com', telephone: '0810001111', delaiLivraisonMoyen: 2, actif: true },
      { nom: 'Global Health Supplies', contactNom: 'Sarah Connor', email: 'sales@globalhealth.com', telephone: '0820002222', delaiLivraisonMoyen: 5, actif: true },
      { nom: 'BioTech Congo', contactNom: 'Dr. No', email: 'info@biotech.cd', telephone: '0990003333', delaiLivraisonMoyen: 1, actif: true },
      { nom: 'PharmaExpress RDC', contactNom: 'Jean Kabila', email: 'contact@pharmaexpress.cd', telephone: '0814444444', delaiLivraisonMoyen: 3, actif: true },
      { nom: 'Santé Plus Distribution', contactNom: 'Marie Tshisekedi', email: 'info@santepius.cd', telephone: '0825555555', delaiLivraisonMoyen: 4, actif: true }
    ])
    console.log(`✅ ${fournisseurs.length} Fournisseurs créés`)

    // --------------------------------------------------------
    // 5. Pharmacie (Inventaire Très Enrichi - 80+ médicaments)
    // --------------------------------------------------------
    const medsData = [
      // Analgésiques / Anti-inflammatoires
      { nom: 'Paracétamol', principeActif: 'Paracétamol', dosage: '1000mg', forme: 'Comprimé', stock: 500, min: 100, prix: 2.50 },
      { nom: 'Paracétamol', principeActif: 'Paracétamol', dosage: '500mg', forme: 'Comprimé', stock: 850, min: 200, prix: 1.50 },
      { nom: 'Ibuprofène', principeActif: 'Ibuprofène', dosage: '400mg', forme: 'Gélule', stock: 300, min: 50, prix: 3.20 },
      { nom: 'Ibuprofène', principeActif: 'Ibuprofène', dosage: '200mg', forme: 'Comprimé', stock: 600, min: 100, prix: 2.00 },
      { nom: 'Dicloflénac', principeActif: 'Diclofénac', dosage: '50mg', forme: 'Comprimé', stock: 120, min: 30, prix: 4.50 },
      { nom: 'Aspirine', principeActif: 'Acide acétylsalicylique', dosage: '500mg', forme: 'Comprimé', stock: 400, min: 100, prix: 1.80 },
      { nom: 'Tramadol', principeActif: 'Tramadol', dosage: '50mg', forme: 'Gélule', stock: 150, min: 50, prix: 6.50 },
      
      // Antibiotiques
      { nom: 'Amoxicilline', principeActif: 'Amoxicilline', dosage: '1g', forme: 'Comprimé', stock: 120, min: 50, prix: 5.80 },
      { nom: 'Amoxicilline', principeActif: 'Amoxicilline', dosage: '500mg', forme: 'Gélule', stock: 200, min: 80, prix: 4.20 },
      { nom: 'Azithromycine', principeActif: 'Azithromycine', dosage: '250mg', forme: 'Comprimé', stock: 40, min: 40, prix: 8.90 },
      { nom: 'Azithromycine', principeActif: 'Azithromycine', dosage: '500mg', forme: 'Comprimé', stock: 30, min: 30, prix: 12.50 },
      { nom: 'Ciprofloxacine', principeActif: 'Ciprofloxacine', dosage: '500mg', forme: 'Comprimé', stock: 80, min: 20, prix: 7.20 },
      { nom: 'Doxycycline', principeActif: 'Doxycycline', dosage: '100mg', forme: 'Gélule', stock: 90, min: 30, prix: 6.80 },
      { nom: 'Céphalexine', principeActif: 'Céphalexine', dosage: '500mg', forme: 'Gélule', stock: 100, min: 40, prix: 5.50 },
      { nom: 'Clarithromycine', principeActif: 'Clarithromycine', dosage: '250mg', forme: 'Comprimé', stock: 60, min: 25, prix: 9.20 },

      // Cardiologie
      { nom: 'Amlodipine', principeActif: 'Amlodipine', dosage: '5mg', forme: 'Comprimé', stock: 200, min: 50, prix: 6.00 },
      { nom: 'Amlodipine', principeActif: 'Amlodipine', dosage: '10mg', forme: 'Comprimé', stock: 150, min: 40, prix: 7.50 },
      { nom: 'Bisoprolol', principeActif: 'Bisoprolol', dosage: '10mg', forme: 'Comprimé', stock: 15, min: 30, prix: 5.50 },
      { nom: 'Bisoprolol', principeActif: 'Bisoprolol', dosage: '5mg', forme: 'Comprimé', stock: 25, min: 20, prix: 4.80 },
      { nom: 'Furosémide', principeActif: 'Furosémide', dosage: '40mg', forme: 'Comprimé', stock: 90, min: 20, prix: 3.10 },
      { nom: 'Lisinopril', principeActif: 'Lisinopril', dosage: '10mg', forme: 'Comprimé', stock: 110, min: 30, prix: 5.20 },
      { nom: 'Atorvastatine', principeActif: 'Atorvastatine', dosage: '20mg', forme: 'Comprimé', stock: 180, min: 50, prix: 8.50 },
      { nom: 'Métoprolol', principeActif: 'Métoprolol', dosage: '50mg', forme: 'Comprimé', stock: 95, min: 25, prix: 4.90 },

      // Gastro
      { nom: 'Oméprazole', principeActif: 'Oméprazole', dosage: '20mg', forme: 'Gélule', stock: 45, min: 50, prix: 4.10 },
      { nom: 'Oméprazole', principeActif: 'Oméprazole', dosage: '40mg', forme: 'Gélule', stock: 35, min: 30, prix: 5.80 },
      { nom: 'Gaviscon', principeActif: 'Alginate de sodium', dosage: '10ml', forme: 'Sirop', stock: 60, min: 10, prix: 5.00 },
      { nom: 'Lansoprazole', principeActif: 'Lansoprazole', dosage: '30mg', forme: 'Gélule', stock: 50, min: 20, prix: 5.20 },
      { nom: 'Dompéridone', principeActif: 'Dompéridone', dosage: '10mg', forme: 'Comprimé', stock: 70, min: 20, prix: 3.50 },
      { nom: 'Metoclopramide', principeActif: 'Metoclopramide', dosage: '10mg', forme: 'Comprimé', stock: 55, min: 15, prix: 2.80 },

      // Respiratoire
      { nom: 'Ventoline', principeActif: 'Salbutamol', dosage: '100µg', forme: 'Inhalateur', stock: 80, min: 20, prix: 6.50 },
      { nom: 'Budesonide', principeActif: 'Budesonide', dosage: '200µg', forme: 'Inhalateur', stock: 40, min: 15, prix: 12.00 },
      { nom: 'Salbutamol', principeActif: 'Salbutamol', dosage: '5mg', forme: 'Nébulisation', stock: 30, min: 10, prix: 8.50 },

      // Diabète
      { nom: 'Metformine', principeActif: 'Metformine', dosage: '500mg', forme: 'Comprimé', stock: 250, min: 80, prix: 3.50 },
      { nom: 'Metformine', principeActif: 'Metformine', dosage: '850mg', forme: 'Comprimé', stock: 180, min: 60, prix: 4.20 },
      { nom: 'Glibenclamide', principeActif: 'Glibenclamide', dosage: '5mg', forme: 'Comprimé', stock: 120, min: 40, prix: 4.80 },
      { nom: 'Insuline NPH', principeActif: 'Insuline', dosage: '100 UI/ml', forme: 'Injection', stock: 50, min: 20, prix: 15.00 },

      // Urgence / Divers
      { nom: 'Spasfon', principeActif: 'Phloroglucinol', dosage: '80mg', forme: 'Comprimé', stock: 0, min: 20, prix: 3.90 },
      { nom: 'Sérum Physiologique', principeActif: 'Chlorure de sodium', dosage: '500ml', forme: 'Injection', stock: 100, min: 50, prix: 2.00 },
      { nom: 'Sérum Physiologique', principeActif: 'Chlorure de sodium', dosage: '250ml', forme: 'Injection', stock: 150, min: 60, prix: 1.50 },
      { nom: 'Bétadine', principeActif: 'Povidone iodée', dosage: '125ml', forme: 'Topique', stock: 25, min: 10, prix: 4.20 },
      { nom: 'Chlorhexidine', principeActif: 'Chlorhexidine', dosage: '100ml', forme: 'Topique', stock: 40, min: 15, prix: 3.80 },
      { nom: 'Adrénaline', principeActif: 'Épinéphrine', dosage: '1mg/ml', forme: 'Injection', stock: 20, min: 10, prix: 25.00 },
      { nom: 'Dextrose', principeActif: 'Glucose', dosage: '5% 500ml', forme: 'Perfusion', stock: 60, min: 30, prix: 3.50 },

      // Vitamines & Suppléments
      { nom: 'Vitamine D3', principeActif: 'Cholécalciférol', dosage: '1000 UI', forme: 'Gélule', stock: 200, min: 50, prix: 2.50 },
      { nom: 'Vitamine C', principeActif: 'Acide ascorbique', dosage: '1000mg', forme: 'Comprimé', stock: 300, min: 100, prix: 1.80 },
      { nom: 'Fer', principeActif: 'Sulfate ferreux', dosage: '200mg', forme: 'Comprimé', stock: 150, min: 40, prix: 3.20 },
      { nom: 'Acide Folique', principeActif: 'Acide folique', dosage: '5mg', forme: 'Comprimé', stock: 120, min: 30, prix: 2.80 },

      // Antihistaminiques
      { nom: 'Loratadine', principeActif: 'Loratadine', dosage: '10mg', forme: 'Comprimé', stock: 180, min: 50, prix: 3.50 },
      { nom: 'Cétirizine', principeActif: 'Cétirizine', dosage: '10mg', forme: 'Comprimé', stock: 160, min: 40, prix: 3.80 },
      { nom: 'Desloratadine', principeActif: 'Desloratadine', dosage: '5mg', forme: 'Comprimé', stock: 90, min: 25, prix: 4.50 },

      // Antifongiques
      { nom: 'Fluconazole', principeActif: 'Fluconazole', dosage: '150mg', forme: 'Comprimé', stock: 70, min: 20, prix: 7.50 },
      { nom: 'Clotrimazole', principeActif: 'Clotrimazole', dosage: '1%', forme: 'Crème', stock: 50, min: 15, prix: 4.20 },

      // Antipaludéens
      { nom: 'Artéméther-Luméfantrine', principeActif: 'Artéméther', dosage: '20/120mg', forme: 'Comprimé', stock: 200, min: 80, prix: 8.00 },
      { nom: 'Quinine', principeActif: 'Quinine', dosage: '300mg', forme: 'Comprimé', stock: 100, min: 40, prix: 5.50 },
      { nom: 'Chloroquine', principeActif: 'Chloroquine', dosage: '250mg', forme: 'Comprimé', stock: 80, min: 30, prix: 4.80 },

      // Antihypertenseurs supplémentaires
      { nom: 'Hydrochlorothiazide', principeActif: 'Hydrochlorothiazide', dosage: '25mg', forme: 'Comprimé', stock: 110, min: 30, prix: 3.20 },
      { nom: 'Losartan', principeActif: 'Losartan', dosage: '50mg', forme: 'Comprimé', stock: 95, min: 25, prix: 6.50 },
      { nom: 'Valsartan', principeActif: 'Valsartan', dosage: '80mg', forme: 'Comprimé', stock: 75, min: 20, prix: 7.20 },

      // Antidépresseurs
      { nom: 'Sertraline', principeActif: 'Sertraline', dosage: '50mg', forme: 'Comprimé', stock: 60, min: 20, prix: 8.50 },
      { nom: 'Fluoxétine', principeActif: 'Fluoxétine', dosage: '20mg', forme: 'Comprimé', stock: 55, min: 18, prix: 9.00 },

      // Anticonvulsivants
      { nom: 'Phénytoïne', principeActif: 'Phénytoïne', dosage: '100mg', forme: 'Comprimé', stock: 40, min: 15, prix: 6.80 },
      { nom: 'Carbamazépine', principeActif: 'Carbamazépine', dosage: '200mg', forme: 'Comprimé', stock: 45, min: 15, prix: 7.50 }
    ]

    const createdMeds: Medicament[] = []
    for (const m of medsData) {
      let statut: 'en_stock' | 'stock_faible' | 'rupture_stock' = 'en_stock'
      if (m.stock === 0) statut = 'rupture_stock'
      else if (m.stock <= m.min) statut = 'stock_faible'

      const med = await Medicament.create({
        nom: m.nom,
        principeActif: m.principeActif,
        dosage: m.dosage,
        forme: m.forme,
        stockActuel: m.stock,
        stockMinimum: m.min,
        prixUnitaire: m.prix,
        statutStock: statut,
        dateExpiration: DateTime.now().plus({ months: Math.floor(Math.random() * 24) + 2 }),
        prescriptionRequise: true,
        fabricant: fournisseurs[Math.floor(Math.random() * fournisseurs.length)].nom
      })
      createdMeds.push(med)
    }
    console.log(`✅ ${createdMeds.length} Médicaments créés (avec ruptures simulées)`)

    // --------------------------------------------------------
    // 6. Patients (100+ patients avec données variées)
    // --------------------------------------------------------
    const prenoms = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Paul', 'Julie', 'Marc', 'Claire', 'Luc', 'Anne', 'Thomas', 'Camille', 'David', 'Laura', 'Nicolas', 'Emma', 'Antoine', 'Léa', 'Julien', 'Sarah', 'Alexandre', 'Manon', 'Maxime', 'Chloé', 'Romain', 'Émilie', 'Vincent', 'Marion', 'Guillaume', 'Pauline']
    const noms = ['Dupont', 'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Lefevre', 'Mercier', 'Dupuis', 'Lambert', 'Bonnet', 'François']
    const nomsAfricains = ['Diop', 'Traoré', 'Diallo', 'Ba', 'Ndiaye', 'Sarr', 'Cissé', 'Fall', 'Sy', 'Kane', 'Niang', 'Thiam', 'Gueye', 'Seck', 'Mbaye', 'Sow', 'Faye', 'Diaw', 'Ndao', 'Wade']
    
    const allNoms = [...noms, ...nomsAfricains]
    const patientsList: Patient[] = []
    const totalPatients = 120

    for (let i = 0; i < totalPatients; i++) {
      const prenom = prenoms[Math.floor(Math.random() * prenoms.length)]
      const nom = allNoms[Math.floor(Math.random() * allNoms.length)]
      const nomComplet = `${prenom} ${nom}`
      
      const pUser = await UserProfile.create({
        email: `${prenom.toLowerCase()}.${nom.toLowerCase()}.${i}@patient.com`,
        password,
        nomComplet,
        role: 'patient',
        actif: true,
        telephone: `081${Math.floor(Math.random() * 9000000) + 1000000}`,
        adresse: `${Math.floor(Math.random() * 200) + 1} Avenue ${['Kasa-Vubu', '30 Juin', 'Lumumba', 'Wamba', 'Kabila'][Math.floor(Math.random() * 5)]}, Kinshasa`
      })
      
      const age = 5 + Math.floor(Math.random() * 75)
      // Génération du numéro de patient au format "yymjsec" avec un offset pour éviter les collisions
      const numeroPatient = await this.generateUniquePatientNumber(i)
      const patient = await Patient.create({
        userId: pUser.id,
        numeroPatient: numeroPatient,
        dateNaissance: DateTime.now().minus({ years: age }),
        sexe: Math.random() > 0.5 ? 'masculin' : 'feminin',
        assuranceMaladie: ['CNSS', 'Privé', 'Mutuelle', 'Aucune'][Math.floor(Math.random() * 4)],
        numeroAssurance: Math.random() > 0.3 ? `ASS-${Math.floor(Math.random() * 999999)}` : null,
        groupeSanguin: ['A+', 'O+', 'B+', 'AB+', 'A-', 'O-', 'B-', 'AB-'][Math.floor(Math.random() * 8)],
        contactUrgenceNom: `${prenoms[Math.floor(Math.random() * prenoms.length)]} ${allNoms[Math.floor(Math.random() * allNoms.length)]}`,
        contactUrgenceTelephone: `082${Math.floor(Math.random() * 9000000) + 1000000}`,
        antecedentsMedicaux: Math.random() > 0.5 ? ['Hypertension', 'Diabète', 'Asthme', 'Allergies'][Math.floor(Math.random() * 4)] : null
      })
      patientsList.push(patient)
    }
    console.log(`✅ ${patientsList.length} Patients créés`)

    // --------------------------------------------------------
    // 7. Historique Médical Complet (Rendez-vous, Consultations, Prescriptions, Factures)
    // --------------------------------------------------------
    const motifs = [
      'Consultation générale', 'Suivi médical', 'Contrôle de routine', 'Symptômes grippaux',
      'Douleurs abdominales', 'Maux de tête', 'Fièvre', 'Toux persistante', 'Fatigue chronique',
      'Examen de santé', 'Vaccination', 'Bilan sanguin', 'Prescription renouvellement',
      'Douleurs articulaires', 'Problèmes digestifs', 'Troubles du sommeil', 'Stress',
      'Allergies', 'Problèmes cutanés', 'Consultation urgente', 'Suivi post-opératoire'
    ]
    
    const diagnostics = [
      'Symptômes grippaux légers', 'Infection respiratoire', 'Hypertension artérielle',
      'Gastrite', 'Migraine', 'Rhume', 'Bronchite', 'Anémie', 'Diabète type 2',
      'Arthrite', 'Dermatite', 'Allergie saisonnière', 'Insomnie', 'Anxiété',
      'Déshydratation', 'Hypotension', 'Hypercholestérolémie', 'Reflux gastro-œsophagien'
    ]

    let totalRdv = 0
    let totalConsultations = 0
    let totalPrescriptions = 0
    let totalFactures = 0

    for (const patient of patientsList) {
      // Chaque patient a entre 2 et 8 visites passées
      const historyCount = 2 + Math.floor(Math.random() * 7)

      for (let i = 0; i < historyCount; i++) {
        const daysAgo = 5 + (i * 25) + Math.floor(Math.random() * 15)
        const date = DateTime.now().minus({ days: daysAgo })
        const doc = doctorsList[Math.floor(Math.random() * doctorsList.length)]
        const hour = 8 + Math.floor(Math.random() * 9)
        const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)]

        // Rendez-vous
        const rdv = await RendezVous.create({
          patientId: patient.id,
          medecinId: doc.id,
          dateHeure: date.set({ hour, minute }),
          dureeMinutes: [15, 30, 45, 60][Math.floor(Math.random() * 4)],
          statut: 'termine',
          motif: motifs[Math.floor(Math.random() * motifs.length)],
          priorite: (['normale', 'urgente', 'faible'] as const)[Math.floor(Math.random() * 3)],
          notes: Math.random() > 0.7 ? 'Patient ponctuel' : null
        })
        totalRdv++

        // Consultation
        const diagnostic = diagnostics[Math.floor(Math.random() * diagnostics.length)]
        const consult = await Consultation.create({
          patientId: patient.id,
          medecinId: doc.id,
          rendezVousId: rdv.id,
          dateConsultation: date,
          motifPrincipal: rdv.motif,
          diagnosticPrincipal: diagnostic,
          dureeConsultation: rdv.dureeMinutes - 5,
          constantesVitales: {
            tension: `${11 + Math.floor(Math.random() * 3)}/${7 + Math.floor(Math.random() * 2)}`,
            temperature: 36.5 + (Math.random() * 1.5),
            poids: 50 + Math.floor(Math.random() * 50),
            taille: 150 + Math.floor(Math.random() * 50),
            frequenceCardiaque: 60 + Math.floor(Math.random() * 40)
          },
          symptomesAssocies: { symptomes: ['Fièvre', 'Fatigue', 'Douleurs', 'Nausées'][Math.floor(Math.random() * 4)] },
          examenPhysique: 'Examen clinique normal',
          planTraitement: 'Traitement symptomatique',
          notesConsultation: `Patient réceptif au traitement. Suivi recommandé.`
        })
        totalConsultations++

        // Prescription (70% des consultations ont une prescription)
        if (Math.random() > 0.3) {
          const nbMedicaments = 1 + Math.floor(Math.random() * 3)
          for (let j = 0; j < nbMedicaments; j++) {
            const medToPrescribe = createdMeds[Math.floor(Math.random() * createdMeds.length)]
            await Prescription.create({
              consultationId: consult.id,
              medicamentId: medToPrescribe.id,
              quantite: 1 + Math.floor(Math.random() * 3),
              posologie: ['1 comprimé matin et soir', '1 comprimé 3 fois par jour', '1 comprimé le soir', '2 comprimés matin et soir'][Math.floor(Math.random() * 4)],
              dureeTraitement: `${3 + Math.floor(Math.random() * 7)} jours`,
              delivre: true,
              datePrescription: date
            })
            totalPrescriptions++
          }
        }

        // Facture & Transaction (80% des consultations sont facturées)
        if (Math.random() > 0.2) {
          const amount = 20 + Math.floor(Math.random() * 80)
          const facture = await Facture.create({
            patientId: patient.id,
            consultationId: consult.id,
            numeroFacture: this.generateInvoiceNumber(totalFactures),
            montantTotal: amount,
            montantPaye: Math.random() > 0.15 ? amount : Math.floor(amount * 0.5), // 85% payées complètement
            statut: Math.random() > 0.15 ? 'payee' : (Math.random() > 0.5 ? 'en_attente' : 'en_retard'),
            dateEmission: date,
            dateEcheance: date.plus({ days: 30 })
          })
          totalFactures++

          if (facture.montantPaye > 0) {
            await Transaction.create({
              factureId: facture.id,
              typeTransaction: 'consultation',
              montant: facture.montantPaye,
              methodePaiement: ['Carte', 'Espèces', 'Mobile Money', 'Virement'][Math.floor(Math.random() * 4)],
              dateTransaction: date.plus({ days: Math.floor(Math.random() * 5) }),
              numeroTransaction: `TXN-${randomUUID().substring(0, 10).toUpperCase()}`
            })
          }
        }
      }

      // Rendez-vous futurs (60% des patients ont un RDV futur)
      if (Math.random() > 0.4) {
        const futureDays = 1 + Math.floor(Math.random() * 30)
        const futureDate = DateTime.now().plus({ days: futureDays })
        const futureHour = 8 + Math.floor(Math.random() * 9)
        const futureMinute = [0, 15, 30, 45][Math.floor(Math.random() * 4)]
        
        await RendezVous.create({
          patientId: patient.id,
          medecinId: doctorsList[Math.floor(Math.random() * doctorsList.length)].id,
          dateHeure: futureDate.set({ hour: futureHour, minute: futureMinute }),
          dureeMinutes: 30,
          statut: (['programme', 'en_cours'] as const)[Math.floor(Math.random() * 2)],
          motif: motifs[Math.floor(Math.random() * motifs.length)],
          priorite: (['normale', 'urgente'] as const)[Math.floor(Math.random() * 2)]
        })
        totalRdv++
      }
    }

    console.log(`✅ ${totalRdv} Rendez-vous créés`)
    console.log(`✅ ${totalConsultations} Consultations créées`)
    console.log(`✅ ${totalPrescriptions} Prescriptions créées`)
    console.log(`✅ ${totalFactures} Factures créées`)

    // --------------------------------------------------------
    // 8. Documents (Pour certains patients)
    // --------------------------------------------------------
    const documentTypes = ['Radiographie', 'Analyse sanguine', 'Rapport médical', 'Ordonnance', 'Certificat médical', 'Échographie', 'ECG']
    let totalDocuments = 0

    for (let i = 0; i < Math.min(50, patientsList.length); i++) {
      const patient = patientsList[Math.floor(Math.random() * patientsList.length)]
      const nbDocs = 1 + Math.floor(Math.random() * 3)
      
      for (let j = 0; j < nbDocs; j++) {
        await Document.create({
          patientId: patient.id,
          uploadedBy: doctorsList[Math.floor(Math.random() * doctorsList.length)].userId,
          title: documentTypes[Math.floor(Math.random() * documentTypes.length)],
          category: ['medical', 'laboratory', 'radiology'][Math.floor(Math.random() * 3)],
          filePath: `/documents/${randomUUID()}.pdf`,
          originalName: `document_${j + 1}.pdf`,
          mimeType: 'application/pdf',
          size: 100000 + Math.floor(Math.random() * 500000)
        })
        totalDocuments++
      }
    }
    console.log(`✅ ${totalDocuments} Documents créés`)

    // --------------------------------------------------------
    // 9. Notifications (Pour les utilisateurs)
    // --------------------------------------------------------
    const allUsers = await UserProfile.all()
    const notificationTypes = ['info', 'success', 'warning', 'error', 'critical']
    const notificationCategories = ['patient', 'appointment', 'pharmacy', 'finance', 'system']
    let totalNotifications = 0

    for (const user of allUsers) {
      const nbNotifs = 3 + Math.floor(Math.random() * 8)
      
      for (let i = 0; i < nbNotifs; i++) {
        const daysAgo = Math.floor(Math.random() * 30)
        const isRead = Math.random() > 0.4
        const isArchived = Math.random() > 0.8

        await Notification.create({
          userId: user.id,
          type: (notificationTypes as any)[Math.floor(Math.random() * notificationTypes.length)],
          title: [
            'Nouveau patient enregistré',
            'Rendez-vous confirmé',
            'Stock faible détecté',
            'Facture impayée',
            'Consultation programmée',
            'Prescription délivrée',
            'Rapport disponible',
            'Système mis à jour'
          ][Math.floor(Math.random() * 8)],
          message: 'Message de notification généré automatiquement pour les tests.',
          category: notificationCategories[Math.floor(Math.random() * notificationCategories.length)],
          targetId: Math.random() > 0.5 ? patientsList[Math.floor(Math.random() * patientsList.length)].id : null,
          targetType: Math.random() > 0.5 ? 'patient' : null,
          isRead: isRead,
          readAt: isRead ? DateTime.now().minus({ days: daysAgo }) : null,
          isArchived: isArchived
        })
        totalNotifications++
      }
    }
    console.log(`✅ ${totalNotifications} Notifications créées`)

    // --------------------------------------------------------
    // 10. Commandes Fournisseurs & Mouvements d'Inventaire
    // --------------------------------------------------------
    const statutsCommandes = ['commandee', 'partiellement_recue', 'recue', 'annulee']
    let totalCommandes = 0
    let totalMouvements = 0

    // Commandes passées (20 commandes)
    for (let i = 0; i < 20; i++) {
      const fournisseur = fournisseurs[Math.floor(Math.random() * fournisseurs.length)]
      const dateCommande = DateTime.now().minus({ days: 5 + Math.floor(Math.random() * 60) })
      const statut = statutsCommandes[Math.floor(Math.random() * statutsCommandes.length)]
      
      const commande = await CommandeFournisseur.create({
        numeroCommande: this.generateOrderNumber(totalCommandes),
        fournisseurId: fournisseur.id,
        statut: statut as any,
        dateCommande: dateCommande,
        dateLivraisonEstimee: dateCommande.plus({ days: fournisseur.delaiLivraisonMoyen }),
        montantTotal: 0,
        creePar: pharmaciens[Math.floor(Math.random() * pharmaciens.length)].id
      })

      // Lignes de commande (2 à 5 médicaments par commande)
      const nbLignes = 2 + Math.floor(Math.random() * 4)
      let montantTotal = 0

      for (let j = 0; j < nbLignes; j++) {
        const medicament = createdMeds[Math.floor(Math.random() * createdMeds.length)]
        const quantite = 10 + Math.floor(Math.random() * 50)
        const prixUnitaire = (medicament.prixUnitaire || 0) * 0.7 // Prix d'achat (30% de marge)
        const ligneTotal = quantite * prixUnitaire
        montantTotal += ligneTotal

        await LigneCommandeFournisseur.create({
          commandeId: commande.id,
          medicamentId: medicament.id,
          quantiteCommandee: quantite,
          quantiteRecue: statut === 'recue' ? quantite : (statut === 'partiellement_recue' ? Math.floor(quantite * 0.6) : 0),
          prixUnitaireAchat: prixUnitaire
        })

        // Mouvement d'inventaire si commande reçue
        if (statut === 'recue' || statut === 'partiellement_recue') {
          const quantiteRecue = statut === 'recue' ? quantite : Math.floor(quantite * 0.6)
          await InventaireMouvement.create({
            medicamentId: medicament.id,
            typeMouvement: 'entree',
            quantite: quantiteRecue,
            prixUnitaire: prixUnitaire,
            raison: `Réception Commande ${commande.numeroCommande}`,
            numeroLot: this.generateLotNumber(totalMouvements),
            commandeFournisseurId: commande.id,
            utilisateurId: pharmaciens[Math.floor(Math.random() * pharmaciens.length)].id
          })
          totalMouvements++

          // Mise à jour du stock
          medicament.stockActuel += quantiteRecue
          await medicament.save()
        }
      }

      commande.montantTotal = montantTotal
      await commande.save()
      totalCommandes++
    }

    // Commandes en attente (5 commandes)
    for (let i = 0; i < 5; i++) {
      const fournisseur = fournisseurs[Math.floor(Math.random() * fournisseurs.length)]
      const dateCommande = DateTime.now().minus({ days: Math.floor(Math.random() * 5) })
      
      const commande = await CommandeFournisseur.create({
        numeroCommande: this.generateOrderNumber(totalCommandes + i),
        fournisseurId: fournisseur.id,
        statut: 'commandee',
        dateCommande: dateCommande,
        dateLivraisonEstimee: dateCommande.plus({ days: fournisseur.delaiLivraisonMoyen }),
        montantTotal: 0,
        creePar: pharmaciens[Math.floor(Math.random() * pharmaciens.length)].id
      })

      const nbLignes = 2 + Math.floor(Math.random() * 4)
      let montantTotal = 0

      for (let j = 0; j < nbLignes; j++) {
        const medicament = createdMeds[Math.floor(Math.random() * createdMeds.length)]
        const quantite = 10 + Math.floor(Math.random() * 50)
        const prixUnitaire = (medicament.prixUnitaire || 0) * 0.7
        montantTotal += quantite * prixUnitaire

        await LigneCommandeFournisseur.create({
          commandeId: commande.id,
          medicamentId: medicament.id,
          quantiteCommandee: quantite,
          quantiteRecue: 0,
          prixUnitaireAchat: prixUnitaire
        })
      }

      commande.montantTotal = montantTotal
      await commande.save()
      totalCommandes++
    }

    console.log(`✅ ${totalCommandes} Commandes fournisseurs créées`)
    console.log(`✅ ${totalMouvements} Mouvements d'inventaire créés`)

    // --------------------------------------------------------
    // 11. Factures impayées (Pour le dashboard)
    // --------------------------------------------------------
    for (let i = 0; i < 15; i++) {
      const patient = patientsList[Math.floor(Math.random() * patientsList.length)]
      const daysAgo = 10 + Math.floor(Math.random() * 30)
      
      await Facture.create({
        patientId: patient.id,
        numeroFacture: this.generateInvoiceNumber(totalFactures + i),
        montantTotal: 50 + Math.floor(Math.random() * 200),
        montantPaye: 0,
        statut: (['en_attente', 'en_retard'] as const)[Math.floor(Math.random() * 2)],
        dateEmission: DateTime.now().minus({ days: daysAgo }),
        dateEcheance: DateTime.now().minus({ days: daysAgo - 20 })
      })
    }

    console.log('✅ Factures impayées créées')

    // --------------------------------------------------------
    // Résumé Final
    // --------------------------------------------------------
    console.log('\n📊 RÉSUMÉ DU SEEDING:')
    console.log(`   - ${etablissements.length} Établissements`)
    console.log(`   - ${doctorsList.length} Médecins`)
    console.log(`   - ${pharmaciens.length} Pharmaciens`)
    console.log(`   - ${infirmieres.length} Infirmières`)
    console.log(`   - ${fournisseurs.length} Fournisseurs`)
    console.log(`   - ${createdMeds.length} Médicaments`)
    console.log(`   - ${patientsList.length} Patients`)
    console.log(`   - ${totalRdv} Rendez-vous`)
    console.log(`   - ${totalConsultations} Consultations`)
    console.log(`   - ${totalPrescriptions} Prescriptions`)
    console.log(`   - ${totalFactures} Factures`)
    console.log(`   - ${totalDocuments} Documents`)
    console.log(`   - ${totalNotifications} Notifications`)
    console.log(`   - ${totalCommandes} Commandes fournisseurs`)
    console.log(`   - ${totalMouvements} Mouvements d'inventaire`)
    console.log('\n🚀 Seeding terminé avec succès !')
  }
}
