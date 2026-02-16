import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  public async up() {
    // Ajouter toutes les colonnes pour les nouvelles fonctionnalités
    this.schema.alterTable(this.tableName, (table) => {
      // Phase 1: Versions, Tags, Accès
      table.integer('version').defaultTo(1).notNullable() // Version actuelle
      table.integer('parent_document_id').nullable().references('id').inTable('documents').onDelete('CASCADE') // Pour le versioning
      table.text('description').nullable() // Description détaillée
      table.text('tags').nullable() // Tags JSON: ["urgent", "confidentiel", ...]
      table.text('extracted_text').nullable() // Texte extrait via OCR
      table.boolean('is_signed').defaultTo(false) // Document signé
      table.boolean('is_archived').defaultTo(false) // Document archivé
      table.boolean('is_watermarked').defaultTo(false) // Document avec watermark
      table.string('status').defaultTo('draft') // draft, pending_approval, approved, rejected
      table.integer('approval_step').defaultTo(0) // Étape d'approbation actuelle
      table.uuid('approved_by').nullable().references('id').inTable('user_profiles').onDelete('SET NULL')
      table.timestamp('approved_at').nullable()
      table.timestamp('archived_at').nullable() // Date d'archivage
      table.timestamp('expires_at').nullable() // Date d'expiration (RGPD)
      table.string('access_level').defaultTo('private') // private, shared, public
      table.text('access_permissions').nullable() // JSON: { userIds: [], roleIds: [] }
      table.text('metadata').nullable() // Métadonnées JSON supplémentaires
      table.string('thumbnail_path').nullable() // Chemin vers la miniature
      table.integer('download_count').defaultTo(0) // Compteur de téléchargements
      table.integer('view_count').defaultTo(0) // Compteur de vues
      table.timestamp('last_viewed_at').nullable()
      table.uuid('last_viewed_by').nullable().references('id').inTable('user_profiles').onDelete('SET NULL')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('version')
      table.dropColumn('parent_document_id')
      table.dropColumn('description')
      table.dropColumn('tags')
      table.dropColumn('extracted_text')
      table.dropColumn('is_signed')
      table.dropColumn('is_archived')
      table.dropColumn('is_watermarked')
      table.dropColumn('status')
      table.dropColumn('approval_step')
      table.dropColumn('approved_by')
      table.dropColumn('approved_at')
      table.dropColumn('archived_at')
      table.dropColumn('expires_at')
      table.dropColumn('access_level')
      table.dropColumn('access_permissions')
      table.dropColumn('metadata')
      table.dropColumn('thumbnail_path')
      table.dropColumn('download_count')
      table.dropColumn('view_count')
      table.dropColumn('last_viewed_at')
      table.dropColumn('last_viewed_by')
    })
  }
}
