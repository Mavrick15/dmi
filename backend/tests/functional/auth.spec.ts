import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import UserProfile from '#models/UserProfile'
import hash from '@adonisjs/core/services/hash'

test.group('Auth API', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(() => testUtils.db().truncate())

  test('should register a new user', async ({ client, assert }) => {
    const response = await client.post('/api/v1/auth/register').json({
      nomComplet: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      role: 'patient',
    })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      message: 'Utilisateur créé',
    })

    // Vérifier que l'utilisateur existe en base
    const user = await UserProfile.findBy('email', 'test@example.com')
    assert.exists(user)
    assert.equal(user?.nomComplet, 'Test User')
  })

  test('should reject duplicate email on registration', async ({ client }) => {
    // Créer un utilisateur existant
    await UserProfile.create({
      email: 'existing@example.com',
      password: 'Password123!',
      nomComplet: 'Existing User',
      role: 'patient',
      actif: true,
    })

    const response = await client.post('/api/v1/auth/register').json({
      nomComplet: 'New User',
      email: 'existing@example.com',
      password: 'Password123!',
      role: 'patient',
    })

    response.assertStatus(422)
  })

  test('should login with valid credentials', async ({ client, assert }) => {
    // Créer un utilisateur
    const password = await hash.make('Password123!')
    await UserProfile.create({
      email: 'login@example.com',
      password: password,
      nomComplet: 'Login User',
      role: 'patient',
      actif: true,
    })

    const response = await client.post('/api/v1/auth/login').json({
      email: 'login@example.com',
      password: 'Password123!',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Connexion réussie',
    })
    assert.exists(response.body().token)
  })

  test('should reject login with invalid credentials', async ({ client }) => {
    const response = await client.post('/api/v1/auth/login').json({
      email: 'nonexistent@example.com',
      password: 'WrongPassword',
    })

    response.assertStatus(401)
  })

  test('should reject login for inactive user', async ({ client }) => {
    const password = await hash.make('Password123!')
    await UserProfile.create({
      email: 'inactive@example.com',
      password: password,
      nomComplet: 'Inactive User',
      role: 'patient',
      actif: false, // Compte désactivé
    })

    const response = await client.post('/api/v1/auth/login').json({
      email: 'inactive@example.com',
      password: 'Password123!',
    })

    response.assertStatus(403)
  })
})

