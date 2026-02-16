import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_profiles'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('email').notNullable().unique()
      table.string('nom_complet').notNullable()
      table.string('telephone').nullable()
      table.string('adresse').nullable()
      table.enum('role', ['admin', 'docteur', 'infirmiere', 'pharmacien', 'gestionnaire', 'patient', 'it_specialist']).defaultTo('patient')
      table.string('specialite').nullable()
      table.string('numero_licence').nullable()
      table.string('photo_profil').nullable()
      table.string('password').notNullable()
      table.boolean('actif').defaultTo(true)
      table.timestamp('date_creation').defaultTo(this.now())
      table.timestamp('date_modification', { useTz: true }).notNullable()
      table.timestamp('derniere_connexion').nullable()
    })

    // Index
    this.schema.raw(`CREATE INDEX idx_user_profiles_role ON ${this.tableName}(role)`)
    this.schema.raw(`CREATE INDEX idx_user_profiles_actif ON ${this.tableName}(actif)`)
  }

  public async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
