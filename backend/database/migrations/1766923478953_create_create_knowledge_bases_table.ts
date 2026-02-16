import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'knowledge_bases'

  async up() {
    // Vérifier si la table existe déjà (ancienne migration)
    const hasTable = await this.schema.hasTable('create_knowledge_bases')
    if (hasTable) {
      await this.schema.renameTable('create_knowledge_bases', this.tableName)
    }

    // Vérifier si la table existe déjà
    if (!(await this.schema.hasTable(this.tableName))) {
      this.schema.createTable(this.tableName, (table) => {
        table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
        
        // Type de connaissance : 'protocols', 'medications', 'diagnostics', 'procedures', 'guidelines'
        table.string('type').notNullable().index()
        
        // Informations communes
        table.string('title').nullable() // Pour protocols, procedures, guidelines
        table.string('name').nullable() // Pour medications, diagnostics
        table.text('description').nullable()
        table.string('category').nullable() // Catégorie médicale (Cardiologie, Neurologie, etc.)
        table.string('code').nullable() // Code CIM-10 pour diagnostics, code unique pour autres
        table.string('urgency').defaultTo('standard') // 'standard', 'priority', 'urgent'
        
        // Champs spécifiques aux médicaments
        table.text('dosage').nullable()
        table.text('contraindications').nullable()
        table.text('interactions').nullable()
        table.text('side_effects').nullable()
        
        // Champs spécifiques aux diagnostics
        table.text('criteria').nullable()
        table.text('examinations').nullable()
        table.text('differential').nullable()
        
        // Champs spécifiques aux procédures
        table.text('indication').nullable()
        table.jsonb('steps').nullable() // Array de strings
        table.text('complications').nullable()
        
        // Champs spécifiques aux directives
        table.jsonb('content').nullable() // Object avec les différentes sections
        
        // Tags pour la recherche
        table.jsonb('tags').nullable() // Array de strings
        
        // Métadonnées
        table.date('last_updated').nullable()
        table.boolean('actif').defaultTo(true)
        table.integer('ordre_affichage').defaultTo(0)
        
        table.timestamp('created_at', { useTz: true }).notNullable()
        table.timestamp('updated_at', { useTz: true }).notNullable()
      })

      // Index pour les recherches
      this.schema.raw(`CREATE INDEX idx_knowledge_bases_type ON ${this.tableName}(type)`)
      this.schema.raw(`CREATE INDEX idx_knowledge_bases_category ON ${this.tableName}(category)`)
      this.schema.raw(`CREATE INDEX idx_knowledge_bases_actif ON ${this.tableName}(actif)`)
      this.schema.raw(`CREATE INDEX idx_knowledge_bases_type_actif ON ${this.tableName}(type, actif)`)
      
      // Index GIN pour la recherche full-text sur tags
      this.schema.raw(`CREATE INDEX idx_knowledge_bases_tags ON ${this.tableName} USING GIN(tags)`)
    } else {
      // Si la table existe, ajouter les colonnes manquantes
      const hasType = await this.schema.hasColumn(this.tableName, 'type')
      if (!hasType) {
        this.schema.alterTable(this.tableName, (table) => {
          table.string('type').notNullable().index()
          table.string('title').nullable()
          table.string('name').nullable()
          table.text('description').nullable()
          table.string('category').nullable()
          table.string('code').nullable()
          table.string('urgency').defaultTo('standard')
          table.text('dosage').nullable()
          table.text('contraindications').nullable()
          table.text('interactions').nullable()
          table.text('side_effects').nullable()
          table.text('criteria').nullable()
          table.text('examinations').nullable()
          table.text('differential').nullable()
          table.text('indication').nullable()
          table.jsonb('steps').nullable()
          table.text('complications').nullable()
          table.jsonb('content').nullable()
          table.jsonb('tags').nullable()
          table.date('last_updated').nullable()
          table.boolean('actif').defaultTo(true)
          table.integer('ordre_affichage').defaultTo(0)
        })
      }
    }
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}