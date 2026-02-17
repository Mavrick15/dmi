import { BaseSeeder } from '@adonisjs/lucid/seeders'
import CommonSymptom from '#models/common_symptom'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  async run() {
    const hasTable = await db.connection().schema.hasTable('common_symptoms')
    if (!hasTable) return

    const symptoms = [
      { name: 'Fièvre', category: 'Général', ordreAffichage: 1 },
      { name: 'Toux', category: 'Respiratoire', ordreAffichage: 2 },
      { name: 'Maux de tête', category: 'Neurologique', ordreAffichage: 3 },
      { name: 'Fatigue', category: 'Général', ordreAffichage: 4 },
      { name: 'Nausées', category: 'Digestif', ordreAffichage: 5 },
      { name: 'Douleur abdominale', category: 'Digestif', ordreAffichage: 6 },
      { name: 'Essoufflement', category: 'Respiratoire', ordreAffichage: 7 },
      { name: 'Vertiges', category: 'Neurologique', ordreAffichage: 8 },
      { name: 'Douleur thoracique', category: 'Cardiovasculaire', ordreAffichage: 9 }
    ]

    for (const symptomData of symptoms) {
      const existing = await CommonSymptom.findBy('name', symptomData.name)
      if (!existing) {
        await CommonSymptom.create({
          ...symptomData,
          actif: true,
          frequenceUtilisation: 0
        })
      }
    }
  }
}

