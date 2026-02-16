import { test } from '@japa/runner'
import { createPatientValidator, updatePatientValidator } from '#validators/patient'

test.group('Patient Validators', () => {
  test('create patient validator should accept valid data', async ({ assert }) => {
    const data = {
      nomComplet: 'Jane Doe',
      email: 'jane@example.com',
      telephone: '+1234567890',
      dateNaissance: new Date('1990-01-01'),
      sexe: 'feminin',
      assuranceMaladie: 'Assurance Test',
      numeroAssurance: '123456',
    }

    const result = await createPatientValidator.validate(data)
    assert.exists(result)
    assert.equal(result.nomComplet, 'Jane Doe')
    assert.equal(result.sexe, 'feminin')
  })

  test('create patient validator should accept data without email', async ({ assert }) => {
    const data = {
      nomComplet: 'John Doe',
      sexe: 'masculin',
    }

    const result = await createPatientValidator.validate(data)
    assert.exists(result)
    assert.equal(result.nomComplet, 'John Doe')
  })

  test('create patient validator should reject invalid sexe', async ({ assert }) => {
    const data = {
      nomComplet: 'John Doe',
      sexe: 'invalid',
    }

    await assert.rejects(
      () => createPatientValidator.validate(data),
      'Sexe validation should fail'
    )
  })

  test('update patient validator should accept partial data', async ({ assert }) => {
    const data = {
      nomComplet: 'Jane Updated',
      telephone: '+9876543210',
    }

    const result = await updatePatientValidator.validate(data)
    assert.exists(result)
    assert.equal(result.nomComplet, 'Jane Updated')
  })

  test('update patient validator should accept empty object', async ({ assert }) => {
    const data = {}

    const result = await updatePatientValidator.validate(data)
    assert.exists(result)
  })
})

