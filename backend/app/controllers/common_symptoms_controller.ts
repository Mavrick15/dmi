import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import CommonSymptom from '#models/common_symptom'
import { AppException } from '#exceptions/AppException'

export default class CommonSymptomsController {
  /**
   * Liste les symptômes communs
   */
  public async index({ request, response }: HttpContextContract) {
    try {
      const { category, search } = request.qs()

      let query = CommonSymptom.query().where('actif', true)

      if (category) {
        query = query.where('category', 'ilike', `%${category}%`)
      }

      if (search && search.length >= 2) {
        query = query.where('name', 'ilike', `%${search}%`)
      }

      const symptoms = await query
        .orderBy('frequence_utilisation', 'desc')
        .orderBy('ordre_affichage', 'asc')

      return response.ok({
        success: true,
        data: symptoms
      })
    } catch (error) {
      throw AppException.internal('Erreur lors de la récupération des symptômes', error)
    }
  }

  /**
   * Incrémente le compteur d'utilisation d'un symptôme
   */
  public async incrementUsage({ params, response }: HttpContextContract) {
    try {
      const symptom = await CommonSymptom.findOrFail(params.id)
      symptom.frequenceUtilisation = (symptom.frequenceUtilisation || 0) + 1
      await symptom.save()

      return response.ok({
        success: true,
        data: symptom
      })
    } catch (error) {
      throw AppException.internal('Erreur lors de la mise à jour', error)
    }
  }
}

