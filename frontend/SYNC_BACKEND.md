# Synchronisation Frontend-Backend

Ce document récapitule les modifications apportées au frontend pour le synchroniser avec le backend AdonisJS.

## Modifications effectuées

### 1. Correction des hooks pour le format de réponse du backend

Le backend retourne systématiquement des réponses au format :
```json
{
  "success": true,
  "data": [...],
  "meta": {...} // pour les paginations
}
```

Tous les hooks ont été mis à jour pour accéder correctement à `response.data.data` au lieu de `response.data` directement.

### 2. Hooks modifiés

#### `usePatients.js`
- ✅ Ajout de `usePatientDetails(id)` pour récupérer les détails d'un patient
- ✅ Correction de l'accès aux données pour `usePatientsList` et `usePatientStats`
- ✅ Suppression de `scheduleAppointment` (déplacé vers `useAppointments.js`)

#### `useDashboard.js`
- ✅ Correction pour utiliser directement `response.data` (le backend retourne déjà la structure complète)

#### `usePharmacy.js`
- ✅ Correction de tous les hooks pour accéder à `response.data.data`
- ✅ Ajout de `useMedicationDetails(id)` pour récupérer les détails d'un médicament
- ✅ Correction de `useInventory` pour retourner `{ data, meta }` pour la pagination

#### `useFinance.js`
- ✅ Correction de tous les hooks pour accéder à `response.data.data`
- ✅ Ajout de `useFinanceHistory(params)` pour l'historique des transactions

#### `useDocuments.js`
- ✅ Correction pour gérer la pagination retournée par le backend
- ✅ Ajout de `usePatientDocuments(patientId)` pour récupérer les documents d'un patient
- ✅ Amélioration de `useDocumentMutations` avec `previewDocument` et `downloadDocument`

#### `useAdmin.js`
- ✅ Correction de tous les hooks pour accéder à `response.data.data`
- ✅ Ajout de `useUserDetails(id)` pour récupérer les détails d'un utilisateur

#### `useAuthQueries.js`
- ✅ Correction de `useSystemStatus` pour utiliser le bon endpoint `/health` (sans `/api/v1`)
- ✅ Ajout de `useGlobalSearch(query)` pour la recherche globale (omnisearch)

#### `useAnalytics.js`
- ✅ Correction de `useAdvancedAnalytics` pour accéder à `response.data.data`
- ✅ Ajout de hooks pour les statistiques :
  - `useStatsOverview()`
  - `useStatsPeriod(params)`
  - `useTopDoctors()`
  - `useRevenueStats(params)`

#### `useClinical.js`
- ✅ Correction de `useClinicalMutations` pour invalider les bonnes queries

### 3. Nouveaux hooks créés

#### `useAppointments.js` (NOUVEAU)
- `useAppointments(params)` - Liste des rendez-vous avec filtres
- `useDoctors()` - Liste des médecins disponibles
- `useAppointmentMutations()` - Mutations pour créer et mettre à jour les rendez-vous

#### `useExport.js` (NOUVEAU)
- `useExportMutations()` - Export de données :
  - `exportPatients(params)`
  - `exportConsultations(params)`
  - `exportInvoices(params)`

#### `useWebhooks.js` (NOUVEAU)
- `useWebhooks()` - Liste des webhooks enregistrés
- `useWebhookMutations()` - Mutations pour gérer les webhooks :
  - `registerWebhook(data)`
  - `deleteWebhook(data)`

## Endpoints du backend utilisés

### Authentification
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/me`

### Dashboard
- `GET /api/v1/dashboard`

### Patients
- `GET /api/v1/patients`
- `GET /api/v1/patients/:id`
- `GET /api/v1/patients/stats`
- `POST /api/v1/patients`
- `PUT /api/v1/patients/:id`
- `DELETE /api/v1/patients/:id`

### Rendez-vous
- `GET /api/v1/appointments`
- `POST /api/v1/appointments`
- `PATCH /api/v1/appointments/:id/status`
- `GET /api/v1/doctors`

### Consultations
- `POST /api/v1/consultations`

### Documents
- `GET /api/v1/documents`
- `GET /api/v1/patients/:patientId/documents`
- `POST /api/v1/documents`
- `GET /api/v1/documents/:id/preview`
- `GET /api/v1/documents/:id/download`
- `POST /api/v1/documents/:id/sign`
- `DELETE /api/v1/documents/:id`

### Pharmacie
- `GET /api/v1/pharmacy/stats`
- `GET /api/v1/pharmacy/inventory`
- `GET /api/v1/pharmacy/medications/:id/details`
- `GET /api/v1/pharmacy/alerts`
- `GET /api/v1/pharmacy/search`
- `GET /api/v1/pharmacy/analytics`
- `GET /api/v1/pharmacy/orders/pending`
- `GET /api/v1/pharmacy/orders/recent`
- `POST /api/v1/pharmacy/medications`
- `PUT /api/v1/pharmacy/medications/:id`
- `DELETE /api/v1/pharmacy/medications/:id`
- `POST /api/v1/pharmacy/inventory/adjust`
- `POST /api/v1/pharmacy/orders`
- `POST /api/v1/pharmacy/orders/:id/receive`

### Fournisseurs
- `GET /api/v1/suppliers`
- `POST /api/v1/suppliers`
- `DELETE /api/v1/suppliers/:id`

### Finance
- `GET /api/v1/finance/overview`
- `GET /api/v1/finance/outstanding`
- `GET /api/v1/finance/chart`
- `GET /api/v1/finance/history`

### Administration
- `GET /api/v1/users`
- `GET /api/v1/users/:id`
- `POST /api/v1/users`
- `PUT /api/v1/users/:id`
- `DELETE /api/v1/users/:id`
- `GET /api/v1/establishments`
- `POST /api/v1/establishments`
- `DELETE /api/v1/establishments/:id`
- `GET /api/v1/audit`

### Statistiques
- `GET /api/v1/stats/overview`
- `GET /api/v1/stats/period`
- `GET /api/v1/stats/top-doctors`
- `GET /api/v1/stats/revenue`

### Recherche
- `GET /api/v1/search/global?q=...`

### Exports
- `GET /api/v1/export/patients`
- `GET /api/v1/export/consultations`
- `GET /api/v1/export/invoices`

### Webhooks
- `GET /api/v1/webhooks`
- `POST /api/v1/webhooks`
- `DELETE /api/v1/webhooks`

### Health Check
- `GET /health` (sans /api/v1 car route publique)

## Configuration Axios

Le fichier `src/lib/axios.js` est déjà correctement configuré :
- Base URL : `/api/v1` en production, `http://10.0.0.2:5040/api/v1` en développement
- Injection automatique du token Bearer depuis `localStorage.getItem('auth_token')`
- Gestion des erreurs 401 (déconnexion automatique)
- Support des uploads de fichiers (FormData)

## Notes importantes

1. **Format de réponse** : Tous les hooks doivent maintenant gérer le format `{ success: true, data: [...] }` du backend.

2. **Pagination** : Les endpoints paginés retournent `{ success: true, data: [...], meta: {...} }`. Les hooks comme `useInventory` et `useDocuments` gèrent maintenant correctement cette structure.

3. **Gestion des erreurs** : L'intercepteur Axios standardise les messages d'erreur dans `error.userMessage` pour un affichage cohérent dans l'UI.

4. **Token d'authentification** : Le token est automatiquement injecté dans toutes les requêtes via l'intercepteur Axios.

5. **Exports** : Les exports utilisent `responseType: 'blob'` pour gérer les téléchargements de fichiers.

## Prochaines étapes

- [ ] Tester tous les hooks avec le backend réel
- [ ] Vérifier que les composants utilisent correctement les nouveaux hooks
- [ ] Ajouter la gestion d'erreurs spécifique pour chaque hook si nécessaire
- [ ] Documenter les paramètres attendus par chaque hook

