import { BaseSeeder } from '@adonisjs/lucid/seeders'
import ConsultationTemplate from '#models/ConsultationTemplate'
import QuickNote from '#models/QuickNote'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  async run() {
    const hasTemplates = await db.connection().schema.hasTable('consultation_templates')
    const hasNotes = await db.connection().schema.hasTable('quick_notes')
    if (!hasTemplates && !hasNotes) return

    // Templates par défaut
    const templates = [
      {
        name: 'Consultation Générale',
        category: 'Généraliste',
        description: 'Template standard pour consultation générale',
        isPublic: true,
        createdBy: null,
        templateData: {
          symptoms: ['Fatigue', 'Maux de tête'],
          commonExams: ['NFS (Hémogramme)', 'Ionogramme sanguin'],
        }
      },
      {
        name: 'Consultation Pédiatrique',
        category: 'Pédiatrie',
        description: 'Template adapté pour consultation pédiatrique',
        isPublic: true,
        createdBy: null,
        templateData: {
          symptoms: ['Fièvre', 'Toux'],
          commonExams: ['Test Paludisme', 'NFS (Hémogramme)'],
        }
      },
      {
        name: 'Consultation Urgence',
        category: 'Urgence',
        description: 'Template pour consultation d\'urgence',
        isPublic: true,
        createdBy: null,
        templateData: {
          symptoms: ['Douleur thoracique', 'Essoufflement'],
          commonExams: ['ECG', 'Radio Thorax'],
        }
      },
      {
        name: 'Suivi Chronique',
        category: 'Suivi',
        description: 'Template pour suivi de maladie chronique',
        isPublic: true,
        createdBy: null,
        templateData: {
          symptoms: [],
          commonExams: ['Créatinine', 'CRP'],
        }
      },
      {
        name: 'Consultation Gynécologique',
        category: 'Gynécologie',
        description: 'Template pour consultation gynécologique',
        isPublic: true,
        createdBy: null,
        templateData: {
          symptoms: [],
          commonExams: ['Échographie Abdominale'],
        }
      },
    ]

    // Notes rapides par défaut
    const notes = [
      { text: 'Patient asymptomatique', category: 'Examen', isPublic: true, createdBy: null },
      { text: 'État général conservé', category: 'Examen', isPublic: true, createdBy: null },
      { text: 'Pas de signe d\'infection', category: 'Examen', isPublic: true, createdBy: null },
      { text: 'Surveillance clinique', category: 'Suivi', isPublic: true, createdBy: null },
      { text: 'Réévaluation si persistance', category: 'Suivi', isPublic: true, createdBy: null },
      { text: 'Conseils hygiéno-diététiques', category: 'Traitement', isPublic: true, createdBy: null },
      { text: 'Repos relatif recommandé', category: 'Traitement', isPublic: true, createdBy: null },
      { text: 'Hydratation abondante', category: 'Traitement', isPublic: true, createdBy: null },
    ]

    if (hasTemplates) {
      for (const template of templates) {
        await ConsultationTemplate.updateOrCreate(
          { name: template.name },
          template
        )
      }
    }

    if (hasNotes) {
      for (const note of notes) {
        await QuickNote.updateOrCreate(
          { text: note.text },
          note
        )
      }
    }
  }
}

