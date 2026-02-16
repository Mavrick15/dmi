import { test } from '@japa/runner'
import { assert } from '@japa/assert'
import testUtils from '@adonisjs/core/services/test_utils'
import UserProfile from '#models/UserProfile'
import Medicament from '#models/Medicament'
import ApiToken from '#models/ApiToken'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

test.group('Pharmacy API', (group) => {
  let authToken: string
  let adminUser: UserProfile
  let pharmacienUser: UserProfile

  group.each.setup(async () => {
    await testUtils.db().withGlobalTransaction()
    
    // Créer un utilisateur admin
    adminUser = await UserProfile.create({
      email: 'admin@pharmacy.test',
      password: await hash.make('Password123!'),
      nomComplet: 'Admin Pharmacy',
      role: 'admin',
      actif: true,
    })

    // Créer un utilisateur pharmacien
    pharmacienUser = await UserProfile.create({
      email: 'pharmacien@test.com',
      password: await hash.make('Password123!'),
      nomComplet: 'Pharmacien Test',
      role: 'pharmacien',
      actif: true,
    })

    // Créer un token pour l'admin
    const token = await ApiToken.create({
      name: 'test_token',
      type: 'uuid',
      token: 'pharmacy-test-token',
      userId: adminUser.id,
      isRevoked: false,
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    authToken = token.token
  })

  group.each.teardown(() => testUtils.db().truncate())

  test('should list inventory when authenticated', async ({ client }) => {
    // Créer un médicament de test
    await Medicament.create({
      nom: 'Paracétamol Test',
      principeActif: 'Paracétamol',
      dosage: '500mg',
      stockActuel: 100,
      stockMinimum: 50,
      statutStock: 'en_stock',
      prixUnitaire: 2.5,
      prescriptionRequise: false,
    })

    const response = await client
      .get('/api/v1/pharmacy/inventory')
      .header('Authorization', `Bearer ${authToken}`)

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
    assert.exists(response.body().data)
    assert.isArray(response.body().data)
  })

  test('should create a medication as admin', async ({ client, assert }) => {
    const response = await client
      .post('/api/v1/pharmacy/medications')
      .header('Authorization', `Bearer ${authToken}`)
      .json({
        nom: 'Ibuprofène',
        principeActif: 'Ibuprofène',
        dosage: '400mg',
        forme: 'Comprimé',
        stockActuel: 200,
        stockMinimum: 100,
        prixUnitaire: 3.5,
        prescriptionRequise: true,
      })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      message: 'Médicament ajouté avec succès.',
    })

    // Vérifier en base
    const medicament = await Medicament.findBy('nom', 'Ibuprofène')
    assert.exists(medicament)
    assert.equal(medicament?.stockActuel, 200)
  })

  test('should get pharmacy stats', async ({ client }) => {
    // Créer quelques médicaments
    await Medicament.create({
      nom: 'Med 1',
      stockActuel: 100,
      stockMinimum: 50,
      statutStock: 'en_stock',
      prixUnitaire: 10,
    })

    await Medicament.create({
      nom: 'Med 2',
      stockActuel: 20,
      stockMinimum: 50,
      statutStock: 'stock_faible',
      prixUnitaire: 15,
    })

    const response = await client
      .get('/api/v1/pharmacy/stats')
      .header('Authorization', `Bearer ${authToken}`)

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
    assert.exists(response.body().data.totalMedications)
    assert.isNumber(response.body().data.totalMedications)
  })

  test('should reject unauthenticated requests', async ({ client }) => {
    const response = await client.get('/api/v1/pharmacy/inventory')
    response.assertStatus(401)
  })
})

