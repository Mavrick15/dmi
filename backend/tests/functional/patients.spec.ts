import { test } from '@japa/runner'
import { assert } from '@japa/assert'
import testUtils from '@adonisjs/core/services/test_utils'
import UserProfile from '#models/UserProfile'
import Patient from '#models/Patient'
import ApiToken from '#models/ApiToken'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

test.group('Patients API', (group) => {
  let authToken: string
  let adminUser: UserProfile

  group.each.setup(async () => {
    await testUtils.db().withGlobalTransaction()
    
    // Créer un utilisateur admin pour les tests
    adminUser = await UserProfile.create({
      email: 'admin@test.com',
      password: await hash.make('Password123!'),
      nomComplet: 'Admin Test',
      role: 'admin',
      actif: true,
    })

    // Créer un token pour l'authentification
    const token = await ApiToken.create({
      name: 'test_token',
      type: 'uuid',
      token: 'test-token-123',
      userId: adminUser.id,
      isRevoked: false,
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    authToken = token.token
  })

  group.each.teardown(() => testUtils.db().truncate())

  test('should list patients when authenticated', async ({ client }) => {
    // Créer un patient de test
    const user = await UserProfile.create({
      email: 'patient@test.com',
      password: await hash.make('Password123!'),
      nomComplet: 'Patient Test',
      role: 'patient',
      actif: true,
    })

    await Patient.create({
      userId: user.id,
      numeroPatient: 'PAT-001',
      dateNaissance: DateTime.now().minus({ years: 30 }),
      sexe: 'masculin',
    })

    const response = await client
      .get('/api/v1/patients')
      .header('Authorization', `Bearer ${authToken}`)

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
    assert.exists(response.body().data)
  })

  test('should reject unauthenticated requests', async ({ client }) => {
    const response = await client.get('/api/v1/patients')

    response.assertStatus(401)
  })

  test('should create a new patient', async ({ client, assert }) => {
    const response = await client
      .post('/api/v1/patients')
      .header('Authorization', `Bearer ${authToken}`)
      .json({
        nomComplet: 'New Patient',
        email: 'newpatient@test.com',
        telephone: '+1234567890',
        dateNaissance: '1990-01-01',
        sexe: 'feminin',
        assuranceMaladie: 'Test Assurance',
      })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      message: 'Dossier créé avec succès',
    })

    // Vérifier en base
    const patient = await Patient.query()
      .whereHas('user', (q) => q.where('email', 'newpatient@test.com'))
      .first()
    
    assert.exists(patient)
  })

  test('should get patient details', async ({ client, assert }) => {
    const user = await UserProfile.create({
      email: 'detail@test.com',
      password: await hash.make('Password123!'),
      nomComplet: 'Detail Patient',
      role: 'patient',
      actif: true,
    })

    const patient = await Patient.create({
      userId: user.id,
      numeroPatient: 'PAT-002',
      sexe: 'masculin',
    })

    const response = await client
      .get(`/api/v1/patients/${patient.id}`)
      .header('Authorization', `Bearer ${authToken}`)

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
    assert.equal(response.body().data.id, patient.id)
  })

  test('should update patient information', async ({ client, assert }) => {
    const user = await UserProfile.create({
      email: 'update@test.com',
      password: await hash.make('Password123!'),
      nomComplet: 'Update Patient',
      role: 'patient',
      actif: true,
    })

    const patient = await Patient.create({
      userId: user.id,
      numeroPatient: 'PAT-003',
      sexe: 'masculin',
    })

    const response = await client
      .put(`/api/v1/patients/${patient.id}`)
      .header('Authorization', `Bearer ${authToken}`)
      .json({
        nomComplet: 'Updated Name',
        telephone: '+9876543210',
      })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Dossier mis à jour avec succès',
    })

    // Vérifier la mise à jour
    await user.refresh()
    assert.equal(user.nomComplet, 'Updated Name')
  })
})

