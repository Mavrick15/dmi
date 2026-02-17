import { BaseSeeder } from '@adonisjs/lucid/seeders'
import CommonExam from '#models/common_exam'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  async run() {
    const hasTable = await db.connection().schema.hasTable('common_exams')
    if (!hasTable) return

    const exams = [
      { name: 'NFS (Hémogramme)', category: 'Biologie', type: 'Sang', ordreAffichage: 1 },
      { name: 'Ionogramme sanguin', category: 'Biologie', type: 'Sang', ordreAffichage: 2 },
      { name: 'Créatinine', category: 'Biologie', type: 'Sang', ordreAffichage: 3 },
      { name: 'CRP', category: 'Biologie', type: 'Sang', ordreAffichage: 4 },
      { name: 'Radio Thorax', category: 'Imagerie', type: 'Radiographie', ordreAffichage: 5 },
      { name: 'ECG', category: 'Fonctionnel', type: 'Cardiologie', ordreAffichage: 6 },
      { name: 'Échographie Abdominale', category: 'Imagerie', type: 'Échographie', ordreAffichage: 7 },
      { name: 'Test Paludisme', category: 'Biologie', type: 'Sang', ordreAffichage: 8 },
      { name: 'Glycémie à jeun', category: 'Biologie', type: 'Sang', ordreAffichage: 9 }
    ]

    for (const examData of exams) {
      const existing = await CommonExam.findBy('name', examData.name)
      if (!existing) {
        await CommonExam.create({
          ...examData,
          actif: true,
          frequenceUtilisation: 0
        })
      }
    }
  }
}

