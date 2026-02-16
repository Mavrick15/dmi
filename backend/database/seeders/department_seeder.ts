import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Department from '../../app/models/department.js'

export default class extends BaseSeeder {
  async run() {
    // Départements par défaut
    const departments = [
      {
        nom: 'Cardiologie',
        code: 'CARDIO',
        description: 'Département de cardiologie et maladies cardiovasculaires',
        couleur: '#3B82F6',
        ordreAffichage: 1,
        actif: true
      },
      {
        nom: 'Neurologie',
        code: 'NEURO',
        description: 'Département de neurologie et troubles neurologiques',
        couleur: '#8B5CF6',
        ordreAffichage: 2,
        actif: true
      },
      {
        nom: 'Orthopédie',
        code: 'ORTHO',
        description: 'Département d\'orthopédie et traumatologie',
        couleur: '#10B981',
        ordreAffichage: 3,
        actif: true
      },
      {
        nom: 'Pédiatrie',
        code: 'PEDIA',
        description: 'Département de pédiatrie et soins aux enfants',
        couleur: '#F59E0B',
        ordreAffichage: 4,
        actif: true
      },
      {
        nom: 'Urgences',
        code: 'URG',
        description: 'Département des urgences médicales',
        couleur: '#EF4444',
        ordreAffichage: 5,
        actif: true
      },
      {
        nom: 'Médecine Générale',
        code: 'MEDGEN',
        description: 'Département de médecine générale',
        couleur: '#06B6D4',
        ordreAffichage: 6,
        actif: true
      },
      {
        nom: 'Chirurgie',
        code: 'CHIR',
        description: 'Département de chirurgie générale et spécialisée',
        couleur: '#EC4899',
        ordreAffichage: 7,
        actif: true
      },
      {
        nom: 'Dermatologie',
        code: 'DERMA',
        description: 'Département de dermatologie',
        couleur: '#84CC16',
        ordreAffichage: 8,
        actif: true
      },
      {
        nom: 'Ophtalmologie',
        code: 'OPHTA',
        description: 'Département d\'ophtalmologie',
        couleur: '#F97316',
        ordreAffichage: 9,
        actif: true
      },
      {
        nom: 'Gynécologie',
        code: 'GYNECO',
        description: 'Département de gynécologie et obstétrique',
        couleur: '#6366F1',
        ordreAffichage: 10,
        actif: true
      },
      {
        nom: 'Laboratoire d\'Analyses Médicales',
        code: 'LAB',
        description: 'Laboratoire d\'analyses médicales et biologiques',
        couleur: '#14B8A6',
        ordreAffichage: 11,
        actif: true
      },
      {
        nom: 'Imagerie Médicale',
        code: 'IMAG',
        description: 'Service d\'imagerie médicale et radiologie',
        couleur: '#A855F7',
        ordreAffichage: 12,
        actif: true
      }
    ]

    // Créer les départements s'ils n'existent pas déjà
    for (const deptData of departments) {
      const existing = await Department.findBy('code', deptData.code)
      if (!existing) {
        await Department.create(deptData)
      }
    }
  }
}
