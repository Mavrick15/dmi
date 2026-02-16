# Transformers - Documentation

## Vue d'ensemble

Les transformers sont des classes qui structurent et normalisent les données avant de les envoyer au frontend. Ils centralisent la logique de transformation et rendent le code plus maintenable.

## Structure

```
app/transformers/
├── BaseTransformer.ts      # Classe de base avec méthodes utilitaires
├── PatientTransformer.ts   # Transformation des données Patient
── DashboardTransformer.ts  # Transformation des données Dashboard
└── README.md               # Cette documentation
```

## Utilisation

### PatientTransformer

```typescript
import { PatientTransformer } from '#transformers/PatientTransformer'

// Transformer un seul patient
const patientData = PatientTransformer.transform(patient, detailed: boolean)

// Transformer plusieurs patients
const patientsData = PatientTransformer.transformMany(patients, detailed: boolean)
```

### DashboardTransformer

```typescript
import { DashboardTransformer } from '#transformers/DashboardTransformer'

const dashboardData = DashboardTransformer.transform({
  totalPatients,
  appointmentsToday,
  monthlyRevenue,
  urgentAlerts,
  todaysAppointmentsList,
  revenueChart,
  recentPatients,
  pendingDocuments,
  consultationsToday,
  lowStockMedications
})
```

## Avantages

1. **Séparation des responsabilités** : La logique de transformation est isolée
2. **Réutilisabilité** : Les transformers peuvent être utilisés dans plusieurs contrôleurs
3. **Maintenabilité** : Facile de modifier la structure des données
4. **Testabilité** : Les transformers peuvent être testés indépendamment
5. **Cohérence** : Structure de données uniforme dans toute l'application

## Bonnes pratiques

- Toujours utiliser les transformers pour les réponses API
- Ne pas mélanger la logique métier avec la transformation
- Documenter les structures de données transformées
- Maintenir la rétrocompatibilité lors des changements

