import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import CommonExam from '#models/common_exam'
import { AppException } from '#exceptions/AppException'

export default class CommonExamsController {
  /**
   * Liste les examens communs
   */
  public async index({ request, response }: HttpContextContract) {
    try {
      const { category, type, search } = request.qs()

      let query = CommonExam.query().where('actif', true)

      if (category) {
        query = query.where('category', 'ilike', `%${category}%`)
      }

      if (type) {
        query = query.where('type', 'ilike', `%${type}%`)
      }

      if (search && search.length >= 2) {
        query = query.where('name', 'ilike', `%${search}%`)
      }

      const exams = await query
        .orderBy('frequence_utilisation', 'desc')
        .orderBy('ordre_affichage', 'asc')

      return response.ok({
        success: true,
        data: exams
      })
    } catch (error) {
      throw AppException.internal('Erreur lors de la récupération des examens', error)
    }
  }

  /**
   * Incrémente le compteur d'utilisation d'un examen
   */
  public async incrementUsage({ params, response }: HttpContextContract) {
    try {
      const exam = await CommonExam.findOrFail(params.id)
      exam.frequenceUtilisation = (exam.frequenceUtilisation || 0) + 1
      await exam.save()

      return response.ok({
        success: true,
        data: exam
      })
    } catch (error) {
      throw AppException.internal('Erreur lors de la mise à jour', error)
    }
  }
}

