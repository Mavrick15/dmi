import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Activer l'extension pg_trgm pour les index trigram (si pas déjà activée)
    this.schema.raw(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`)
    
    // Index pour optimiser les recherches textuelles dans quick_notes
    // Vérifier si la table existe avant de créer les index
    this.schema.raw(`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quick_notes') THEN
          -- Index B-tree pour recherches ILIKE
          CREATE INDEX IF NOT EXISTS idx_quick_notes_text_btree ON quick_notes(text);
          
          -- Index GIN avec trigram pour recherches ILIKE optimisées
          CREATE INDEX IF NOT EXISTS idx_quick_notes_text_trgm ON quick_notes USING gin(text gin_trgm_ops);
          
          -- Index pour optimiser les recherches par catégorie
          CREATE INDEX IF NOT EXISTS idx_quick_notes_category_search ON quick_notes(category);
          
          -- Index composite pour recherche par catégorie et visibilité
          CREATE INDEX IF NOT EXISTS idx_quick_notes_category_public ON quick_notes(category, is_public);
        END IF;
      END $$;
    `)

    // Index pour optimiser les recherches textuelles dans consultation_templates
    this.schema.raw(`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'consultation_templates') THEN
          -- Index B-tree pour recherches ILIKE sur le nom
          CREATE INDEX IF NOT EXISTS idx_templates_name_btree ON consultation_templates(name);
          
          -- Index GIN avec trigram pour recherches ILIKE optimisées
          CREATE INDEX IF NOT EXISTS idx_templates_name_trgm ON consultation_templates USING gin(name gin_trgm_ops);
          
          -- Index sur la description (recherche moins fréquente mais utile)
          CREATE INDEX IF NOT EXISTS idx_templates_description_trgm ON consultation_templates USING gin(description gin_trgm_ops) WHERE description IS NOT NULL;
          
          -- Index composite pour recherche par catégorie et visibilité
          CREATE INDEX IF NOT EXISTS idx_templates_category_public ON consultation_templates(category, is_public);
        END IF;
      END $$;
    `)

    // Index pour optimiser les recherches dans cim10_codes
    this.schema.raw(`
      DO $$
      BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cim10_codes') THEN
          -- Index sur le code (recherche exacte - peut déjà exister)
          CREATE INDEX IF NOT EXISTS idx_cim10_code_search ON cim10_codes(code);
          
          -- Index B-tree pour recherches ILIKE sur le nom
          CREATE INDEX IF NOT EXISTS idx_cim10_name_btree ON cim10_codes(name);
          
          -- Index GIN avec trigram pour recherches ILIKE optimisées
          CREATE INDEX IF NOT EXISTS idx_cim10_name_trgm ON cim10_codes USING gin(name gin_trgm_ops);
          
          -- Index composite pour recherche par catégorie et usage
          CREATE INDEX IF NOT EXISTS idx_cim10_category_usage ON cim10_codes(category, usage_count DESC);
        END IF;
      END $$;
    `)
  }

  async down() {
    // Suppression des index en ordre inverse
    this.schema.raw(`DROP INDEX IF EXISTS idx_cim10_category_usage;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_cim10_name_trgm;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_cim10_name_btree;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_cim10_code_search;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_templates_category_public;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_templates_description_trgm;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_templates_name_trgm;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_templates_name_btree;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_quick_notes_category_public;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_quick_notes_category_search;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_quick_notes_text_trgm;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_quick_notes_text_btree;`)
  }
}
