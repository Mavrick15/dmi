# Utilitaires Frontend - Documentation

## Vue d'ensemble

Les utilitaires frontend normalisent et structurent les données reçues du backend pour une utilisation cohérente dans l'application.

## Structure

```
src/utils/
├── dataTransformers.js    # Transformateurs de données (Dashboard, Patients, etc.)
├── apiNormalizers.js      # Normalisateurs de réponses API
├── errorHelpers.js        # Gestion des erreurs
├── pdfGenerator.js        # Génération de PDF
└── cn.js                  # Utilitaires CSS
```

## Utilisation

### dataTransformers.js

```javascript
import { transformDashboardData, transformPatientData, transformPatientsList } from '../utils/dataTransformers'

// Transformer les données du dashboard
const dashboard = transformDashboardData(apiResponse)

// Transformer un patient
const patient = transformPatientData(apiResponse)

// Transformer une liste de patients
const patientsList = transformPatientsList(apiResponse)
```

### apiNormalizers.js

```javascript
import { normalizeApiResponse, extractData, extractPagination, isSuccess } from '../utils/apiNormalizers'

// Normaliser une réponse API
const normalized = normalizeApiResponse(response)

// Extraire les données
const data = extractData(response)

// Extraire la pagination
const pagination = extractPagination(response)

// Vérifier le succès
if (isSuccess(response)) {
  // Traiter les données
}
```

## Avantages

1. **Normalisation** : Toutes les données suivent la même structure
2. **Rétrocompatibilité** : Gère les anciens et nouveaux formats
3. **Sécurité** : Validation et normalisation des données
4. **Maintenabilité** : Un seul endroit pour modifier la logique de transformation

