import { BaseSeeder } from '@adonisjs/lucid/seeders'
import PaymentMethod from '../../app/models/payment_method.js'

export default class extends BaseSeeder {
  async run() {
    const paymentMethods = [
      {
        name: 'Espèces',
        code: 'especes',
        color: '#F59E0B',
        icon: 'DollarSign',
        description: 'Paiement en espèces',
        actif: true,
        ordreAffichage: 1
      },
      {
        name: 'Carte bancaire',
        code: 'carte',
        color: '#10B981',
        icon: 'CreditCard',
        description: 'Paiement par carte bancaire',
        actif: true,
        ordreAffichage: 2
      },
      {
        name: 'Chèque',
        code: 'cheque',
        color: '#3B82F6',
        icon: 'FileText',
        description: 'Paiement par chèque',
        actif: true,
        ordreAffichage: 3
      },
      {
        name: 'Virement',
        code: 'virement',
        color: '#8B5CF6',
        icon: 'ArrowRightLeft',
        description: 'Paiement par virement bancaire',
        actif: true,
        ordreAffichage: 4
      },
      {
        name: 'Assurance',
        code: 'assurance',
        color: '#06B6D4',
        icon: 'Shield',
        description: 'Paiement par assurance maladie',
        actif: true,
        ordreAffichage: 5
      },
      {
        name: 'Autre',
        code: 'autre',
        color: '#6B7280',
        icon: 'MoreHorizontal',
        description: 'Autre méthode de paiement',
        actif: true,
        ordreAffichage: 6
      }
    ]

    for (const methodData of paymentMethods) {
      const existing = await PaymentMethod.findBy('code', methodData.code)
      if (!existing) {
        await PaymentMethod.create(methodData)
      }
    }
  }
}

