import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Cim10Code from '#models/Cim10Code'

export default class extends BaseSeeder {
  async run() {
    const codes = [
      // Maladies infectieuses
      { code: 'A00-B99', name: 'Maladies infectieuses et parasitaires', category: 'Infectieux', parentCode: null },
      { code: 'A09', name: 'Gastro-entérite et colite d\'origine infectieuse présumée', category: 'Infectieux', parentCode: 'A00-B99' },
      { code: 'B34', name: 'Infection virale, site non précisé', category: 'Infectieux', parentCode: 'A00-B99' },
      
      // Tumeurs
      { code: 'C00-D48', name: 'Tumeurs', category: 'Oncologie', parentCode: null },
      
      // Endocrinologie
      { code: 'E00-E90', name: 'Maladies endocriniennes, nutritionnelles et métaboliques', category: 'Endocrinologie', parentCode: null },
      { code: 'E10', name: 'Diabète sucré de type 1', category: 'Endocrinologie', parentCode: 'E00-E90' },
      { code: 'E11', name: 'Diabète sucré de type 2', category: 'Endocrinologie', parentCode: 'E00-E90' },
      
      // Psychiatrie
      { code: 'F00-F99', name: 'Troubles mentaux et du comportement', category: 'Psychiatrie', parentCode: null },
      { code: 'F32', name: 'Épisode dépressif', category: 'Psychiatrie', parentCode: 'F00-F99' },
      { code: 'F41', name: 'Autres troubles anxieux', category: 'Psychiatrie', parentCode: 'F00-F99' },
      
      // Neurologie
      { code: 'G00-G99', name: 'Maladies du système nerveux', category: 'Neurologie', parentCode: null },
      
      // Ophtalmologie
      { code: 'H00-H59', name: 'Maladies de l\'œil et de ses annexes', category: 'Ophtalmologie', parentCode: null },
      
      // ORL
      { code: 'H60-H95', name: 'Maladies de l\'oreille et de l\'apophyse mastoïde', category: 'ORL', parentCode: null },
      
      // Cardiologie
      { code: 'I00-I99', name: 'Maladies du système circulatoire', category: 'Cardiologie', parentCode: null },
      { code: 'I10', name: 'Hypertension essentielle (primitive)', category: 'Cardiologie', parentCode: 'I00-I99' },
      { code: 'I20', name: 'Angine de poitrine', category: 'Cardiologie', parentCode: 'I00-I99' },
      { code: 'I21', name: 'Infarctus aigu du myocarde', category: 'Cardiologie', parentCode: 'I00-I99' },
      
      // Pneumologie
      { code: 'J00-J99', name: 'Maladies de l\'appareil respiratoire', category: 'Pneumologie', parentCode: null },
      { code: 'J18', name: 'Pneumonie, organisme non précisé', category: 'Pneumologie', parentCode: 'J00-J99' },
      { code: 'J44', name: 'Autre maladie pulmonaire obstructive chronique', category: 'Pneumologie', parentCode: 'J00-J99' },
      
      // Gastro-entérologie
      { code: 'K00-K93', name: 'Maladies de l\'appareil digestif', category: 'Gastro-entérologie', parentCode: null },
      { code: 'K25', name: 'Ulcère gastrique', category: 'Gastro-entérologie', parentCode: 'K00-K93' },
      { code: 'K59', name: 'Autres troubles fonctionnels de l\'intestin', category: 'Gastro-entérologie', parentCode: 'K00-K93' },
      
      // Dermatologie
      { code: 'L00-L99', name: 'Maladies de la peau et du tissu cellulaire sous-cutané', category: 'Dermatologie', parentCode: null },
      
      // Rhumatologie
      { code: 'M00-M99', name: 'Maladies du système ostéo-articulaire, des muscles et du tissu conjonctif', category: 'Rhumatologie', parentCode: null },
      { code: 'M54', name: 'Dorsalgie', category: 'Rhumatologie', parentCode: 'M00-M99' },
      { code: 'M79', name: 'Autres affections des tissus mous, non classées ailleurs', category: 'Rhumatologie', parentCode: 'M00-M99' },
      
      // Urologie
      { code: 'N00-N99', name: 'Maladies de l\'appareil génito-urinaire', category: 'Urologie', parentCode: null },
      { code: 'N18', name: 'Insuffisance rénale chronique', category: 'Urologie', parentCode: 'N00-N99' },
      { code: 'N39', name: 'Autres affections de l\'appareil urinaire', category: 'Urologie', parentCode: 'N00-N99' },
      
      // Gynécologie
      { code: 'O00-O99', name: 'Grossesse, accouchement et puerpéralité', category: 'Gynécologie', parentCode: null },
      
      // Pédiatrie
      { code: 'P00-P96', name: 'Affections dont l\'origine se situe dans la période périnatale', category: 'Pédiatrie', parentCode: null },
      
      // Génétique
      { code: 'Q00-Q99', name: 'Malformations congénitales et anomalies chromosomiques', category: 'Génétique', parentCode: null },
      
      // Symptômes
      { code: 'R00-R99', name: 'Symptômes, signes et résultats anormaux d\'examens', category: 'Symptômes', parentCode: null },
      { code: 'R06', name: 'Anomalies de la respiration', category: 'Symptômes', parentCode: 'R00-R99' },
      { code: 'R50', name: 'Fièvre d\'origine inconnue', category: 'Symptômes', parentCode: 'R00-R99' },
      { code: 'R51', name: 'Céphalée', category: 'Symptômes', parentCode: 'R00-R99' },
      
      // Traumatologie
      { code: 'S00-T98', name: 'Lésions traumatiques, empoisonnements et certaines autres conséquences de causes externes', category: 'Traumatologie', parentCode: null },
      
      // Codes spéciaux
      { code: 'U00-U99', name: 'Codes à usage spécial', category: 'Spécial', parentCode: null },
      
      // Causes externes
      { code: 'V01-Y98', name: 'Causes externes de morbidité et de mortalité', category: 'Externe', parentCode: null },
      
      // Facteurs
      { code: 'Z00-Z99', name: 'Facteurs influençant l\'état de santé et motifs de recours aux services de santé', category: 'Facteurs', parentCode: null },
    ]

    await Cim10Code.updateOrCreateMany('code', codes)
  }
}

