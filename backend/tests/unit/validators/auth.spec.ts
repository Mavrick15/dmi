import { test } from '@japa/runner'
import { registerValidator, loginValidator } from '#validators/auth'

test.group('Auth Validators', () => {
  test('register validator should accept valid data', async ({ assert }) => {
    const data = {
      nomComplet: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      role: 'patient',
      telephone: '+1234567890',
      adresse: '123 Main St',
    }

    const result = await registerValidator.validate(data)
    assert.exists(result)
    assert.equal(result.email, 'john@example.com')
    assert.equal(result.nomComplet, 'John Doe')
  })

  test('register validator should reject invalid email', async ({ assert }) => {
    const data = {
      nomComplet: 'John Doe',
      email: 'invalid-email',
      password: 'Password123!',
      role: 'patient',
    }

    await assert.rejects(
      () => registerValidator.validate(data),
      'Email validation should fail'
    )
  })

  test('register validator should reject short password', async ({ assert }) => {
    const data = {
      nomComplet: 'John Doe',
      email: 'john@example.com',
      password: 'short',
      role: 'patient',
    }

    await assert.rejects(
      () => registerValidator.validate(data),
      'Password validation should fail'
    )
  })

  test('register validator should reject invalid role', async ({ assert }) => {
    const data = {
      nomComplet: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      role: 'invalid_role',
    }

    await assert.rejects(
      () => registerValidator.validate(data),
      'Role validation should fail'
    )
  })

  test('login validator should accept valid credentials', async ({ assert }) => {
    const data = {
      email: 'john@example.com',
      password: 'Password123!',
    }

    const result = await loginValidator.validate(data)
    assert.exists(result)
    assert.equal(result.email, 'john@example.com')
  })

  test('login validator should reject invalid email format', async ({ assert }) => {
    const data = {
      email: 'not-an-email',
      password: 'Password123!',
    }

    await assert.rejects(
      () => loginValidator.validate(data),
      'Email validation should fail'
    )
  })
})

