import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'activity_logs'

  async up() {
    // Changer la colonne description de varchar(255) à text pour permettre des descriptions plus longues
    this.schema.alterTable(this.tableName, (table) => {
      table.text('description').alter()
    })
  }

  async down() {
    // Revenir à varchar(255) si nécessaire
    this.schema.alterTable(this.tableName, (table) => {
      table.string('description', 255).alter()
    })
  }
}
