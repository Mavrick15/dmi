import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Cim10Code from '#models/Cim10Code'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Seeder CIM-10 OMS (Classification Internationale des Maladies, 10e révision - OMS).
 * Charge les 22 chapitres officiels et une base de codes diagnostics (libellés français OMS).
 * Données : database/seeders/data/cim10-oms-chapitres.json + cim10-oms-codes.json
 */
export default class extends BaseSeeder {
  private loadJson(filename: string): Record<string, unknown>[] {
    const dataPath = path.join(app.makePath('database/seeders/data'), filename)
    if (!fs.existsSync(dataPath)) return []
    const raw = fs.readFileSync(dataPath, 'utf-8')
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  }

  async run() {
    const chapters = this.loadJson('cim10-oms-chapitres.json')
    const codes = this.loadJson('cim10-oms-codes.json')
    const allCodes = [
      ...chapters.map((c) => ({
        code: c.code as string,
        name: c.name as string,
        category: c.category as string,
        parentCode: (c.parentCode as string) || null,
      })),
      ...codes.map((c) => ({
        code: c.code as string,
        name: c.name as string,
        category: c.category as string,
        parentCode: (c.parentCode as string) || null,
      })),
    ]

    if (allCodes.length === 0) {
      // Fallback minimal si les fichiers sont absents
      const fallback = [
        { code: 'A00-B99', name: 'Chapitre I - Maladies infectieuses et parasitaires', category: 'Maladies infectieuses et parasitaires', parentCode: null },
        { code: 'E11', name: 'Diabète sucré de type 2', category: 'Endocrinologie et métabolisme', parentCode: 'E00-E90' },
        { code: 'I10', name: 'Hypertension essentielle (primitive)', category: 'Appareil circulatoire', parentCode: 'I00-I99' },
        { code: 'J18', name: 'Pneumonie, organisme non précisé', category: 'Appareil respiratoire', parentCode: 'J00-J99' },
      ]
      await Cim10Code.updateOrCreateMany('code', fallback)
      return
    }

    await Cim10Code.updateOrCreateMany('code', allCodes)
  }
}

