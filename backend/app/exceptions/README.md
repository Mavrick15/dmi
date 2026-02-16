# Gestion Centralisée des Erreurs

Ce répertoire contient la gestion centralisée des erreurs pour l'application OpenClinic.

## Structure

- `handler.ts` : Handler principal qui intercepte toutes les exceptions et les transforme en réponses HTTP standardisées
- `AppException.ts` : Classe d'exception personnalisée pour l'application

## Utilisation

### Dans les Contrôleurs

Au lieu de retourner directement des réponses d'erreur, lancez des exceptions :

```typescript
import { AppException } from '../exceptions/AppException.js'

// ❌ Ancienne méthode (à éviter)
return response.badRequest({
  success: false,
  message: 'Format invalide'
})

// ✅ Nouvelle méthode (recommandée)
throw AppException.badRequest('Format invalide')
```

### Types d'Exceptions Disponibles

#### 1. Erreur de Validation
```typescript
throw AppException.validation('Les données fournies sont invalides', details)
```

#### 2. Ressource Introuvable
```typescript
throw AppException.notFound('Patient')
// Message: "Patient introuvable ou supprimée."
```

#### 3. Non Autorisé
```typescript
throw AppException.unauthorized('Session expirée')
```

#### 4. Accès Interdit
```typescript
throw AppException.forbidden(userName)
// Message: "Vous n'avez pas le droit [userName], Veuillez contacter l'Administrateur Système."
```

#### 5. Donnée Dupliquée
```typescript
throw AppException.duplicate('Cette adresse email')
// Message: "Cette adresse email existe déjà dans le système."
```

#### 6. Erreur de Dépendance
```typescript
throw AppException.dependency('Impossible de supprimer ce patient car il a des consultations.')
```

#### 7. Erreur de Requête
```typescript
throw AppException.badRequest('Format UUID invalide', details)
```

#### 8. Erreur Serveur
```typescript
throw AppException.internal('Erreur lors du chargement des données.', errorDetails)
```

### Exemple Complet

```typescript
import { HttpContext } from '@adonisjs/core/http'
import { AppException } from '../exceptions/AppException.js'
import { ApiResponse } from '../utils/ApiResponse.js'

export default class MyController {
  public async show({ params, response }: HttpContext) {
    try {
      const resource = await Resource.find(params.id)
      
      if (!resource) {
        throw AppException.notFound('Ressource')
      }
      
      return response.json(ApiResponse.success(resource))
    } catch (error) {
      // Si c'est déjà une AppException, elle sera gérée par le handler
      if (error instanceof AppException) {
        throw error
      }
      
      // Sinon, on la transforme en exception serveur
      throw AppException.internal('Erreur lors de la récupération de la ressource.')
    }
  }
}
```

## Handler Automatique

Le `handler.ts` intercepte automatiquement :

1. **AppException** : Exceptions personnalisées de l'application
2. **E_VALIDATION_ERROR** : Erreurs de validation VineJS
3. **E_ROW_NOT_FOUND** : Ressources introuvables (Lucid)
4. **E_UNAUTHORIZED_ACCESS** : Accès non autorisé
5. **E_INVALID_CREDENTIALS** : Identifiants invalides
6. **Erreurs PostgreSQL** :
   - `23505` : Violation de contrainte UNIQUE (doublon)
   - `23503` : Violation de clé étrangère (dépendance)
   - `22001` : Valeur trop longue
7. **Erreurs génériques** : Toutes les autres erreurs → 500

## Format de Réponse Standardisé

Toutes les erreurs suivent le format `ApiResponse.error()` :

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Message d'erreur lisible",
    "details": {} // Optionnel, pour les détails supplémentaires
  }
}
```

## Migration des Contrôleurs Existants

Pour migrer un contrôleur existant :

1. Importer `AppException` et `ApiResponse`
2. Remplacer `return response.xxx()` par `throw AppException.xxx()`
3. Utiliser `ApiResponse.success()` pour les réponses de succès
4. Tester que les erreurs sont bien interceptées par le handler

## Avantages

- ✅ **Centralisation** : Toute la logique d'erreur est au même endroit
- ✅ **Cohérence** : Format de réponse uniforme dans toute l'application
- ✅ **Maintenabilité** : Facile de modifier le comportement global
- ✅ **Sécurité** : Les détails d'erreur ne sont exposés qu'en développement
- ✅ **Simplicité** : Code plus propre dans les contrôleurs

