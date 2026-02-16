# Documentation API OpenClinic

## Base URL

```
http://localhost:3333/api/v1
```

## Authentification

Toutes les routes protégées nécessitent un token d'authentification dans le header :

```
Authorization: Bearer <token>
```

Le token est obtenu via la route `/api/v1/auth/login` et expire après 7 jours.

---

## Endpoints

### Authentification

#### POST /auth/register
Inscription d'un nouvel utilisateur.

**Body:**
```json
{
  "nomComplet": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "role": "patient",
  "telephone": "+1234567890",
  "adresse": "123 Main St"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Utilisateur créé",
  "user": {
    "id": "uuid",
    "email": "john@example.com"
  }
}
```

#### POST /auth/login
Connexion d'un utilisateur.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "nomComplet": "John Doe",
    "role": "patient"
  },
  "token": "uuid-token"
}
```

#### GET /auth/me
Récupérer le profil de l'utilisateur connecté.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "nomComplet": "John Doe",
    "role": "patient",
    "avatar": null
  }
}
```

#### POST /auth/logout
Déconnexion (révocation du token).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

#### POST /auth/forgot-password
Demande de réinitialisation de mot de passe.

**Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "Si cet email existe, un lien a été envoyé."
}
```

#### POST /auth/reset-password
Réinitialisation du mot de passe avec token.

**Body:**
```json
{
  "token": "reset-token",
  "email": "john@example.com",
  "newPassword": "NewPassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Mot de passe modifié avec succès. Vous pouvez vous connecter."
}
```

---

### Patients

#### GET /patients
Liste des patients avec pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 12)
- `search` (string, optional)

**Response (200):**
```json
{
  "success": true,
  "meta": {
    "total": 100,
    "perPage": 12,
    "currentPage": 1,
    "lastPage": 9
  },
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "age": "30 ans",
      "gender": "Homme",
      "status": "Active"
    }
  ]
}
```

#### GET /patients/:id
Détails d'un patient.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "age": "30 ans",
    "birthDate": "01/01/1990",
    "gender": "Homme",
    "bloodType": "O+",
    "allergies": [],
    "medicalHistory": "Aucun antécédent noté",
    "appointments": [],
    "consultations": [],
    "documents": []
  }
}
```

#### POST /patients
Créer un nouveau patient.

**Headers:** `Authorization: Bearer <token>`  
**Permissions:** admin, gestionnaire, infirmiere

**Body:**
```json
{
  "nomComplet": "Jane Doe",
  "email": "jane@example.com",
  "telephone": "+1234567890",
  "dateNaissance": "1990-01-01",
  "sexe": "feminin",
  "assuranceMaladie": "Assurance Test",
  "numeroAssurance": "123456"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Dossier créé avec succès",
  "data": { ... }
}
```

#### PUT /patients/:id
Mettre à jour un patient.

**Headers:** `Authorization: Bearer <token>`  
**Permissions:** admin, gestionnaire, infirmiere

**Body:** (tous les champs sont optionnels)
```json
{
  "nomComplet": "Jane Updated",
  "telephone": "+9876543210"
}
```

#### DELETE /patients/:id
Supprimer un patient.

**Headers:** `Authorization: Bearer <token>`  
**Permissions:** admin

---

### Rendez-vous

#### GET /appointments
Liste des rendez-vous.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `patientId` (uuid, optional)
- `medecinId` (uuid, optional)
- `date` (YYYY-MM-DD, optional)
- `status` (string, optional)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "date": "2024-01-15",
      "time": "10:00",
      "patientName": "John Doe",
      "medecinName": "Dr. Smith",
      "status": "programme",
      "type": "Consultation",
      "priority": "normale"
    }
  ]
}
```

#### POST /appointments
Créer un rendez-vous.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "patientId": "uuid",
  "medecinId": "uuid",
  "dateHeure": "2024-01-15T10:00:00",
  "dureeMinutes": 30,
  "motif": "Consultation générale",
  "priorite": "normale",
  "notes": "Première visite"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Rendez-vous confirmé avec succès",
  "data": { ... }
}
```

#### PATCH /appointments/:id/status
Mettre à jour le statut d'un rendez-vous.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "statut": "termine",
  "notes": "Consultation terminée"
}
```

---

### Consultations

#### POST /consultations
Créer une consultation.

**Headers:** `Authorization: Bearer <token>`  
**Permissions:** docteur, infirmiere

**Body:**
```json
{
  "patientId": "uuid",
  "rendezVousId": "uuid",
  "consultationData": {
    "chiefComplaint": "Maux de tête",
    "duration": 30,
    "symptoms": ["Fièvre", "Fatigue"],
    "vitalSigns": {
      "temperature": 37.5,
      "bloodPressure": "120/80",
      "heartRate": 72
    },
    "examination": "Examen physique normal",
    "diagnosis": "Migraine",
    "treatment": "Repos et médicaments",
    "medications": [
      {
        "id": "uuid",
        "name": "Paracétamol",
        "dosage": "500mg",
        "frequency": "3x par jour",
        "duration": "5 jours"
      }
    ]
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Consultation et prescriptions enregistrées avec succès.",
  "data": { ... }
}
```

---

### Pharmacie

#### GET /pharmacy/inventory
Liste de l'inventaire des médicaments.

**Headers:** `Authorization: Bearer <token>`  
**Permissions:** admin, pharmacien, docteur, infirmiere

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `search` (string, optional)
- `category` (string, optional)
- `sort` (string, optional: 'name', 'stockActuel', 'dateExpiration')

**Response (200):**
```json
{
  "success": true,
  "meta": { ... },
  "data": [
    {
      "id": "uuid",
      "name": "Paracétamol",
      "category": "Comprimé",
      "currentStock": 150,
      "minStock": 50,
      "expiryDate": "2025-12-31",
      "status": "normal",
      "unitCost": 2.5
    }
  ]
}
```

#### POST /pharmacy/medications
Créer un médicament.

**Headers:** `Authorization: Bearer <token>`  
**Permissions:** admin, pharmacien

**Body:**
```json
{
  "nom": "Paracétamol",
  "principeActif": "Paracétamol",
  "dosage": "500mg",
  "forme": "Comprimé",
  "fabricant": "Laboratoire X",
  "prixUnitaire": 2.5,
  "stockActuel": 100,
  "stockMinimum": 50,
  "dateExpiration": "2025-12-31",
  "prescriptionRequise": false
}
```

#### GET /pharmacy/stats
Statistiques de la pharmacie.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalMedications": 150,
    "totalValue": 50000,
    "lowStock": 5,
    "expiringSoon": 3
  }
}
```

---

### Finance

#### GET /finance/overview
Vue d'ensemble financière.

**Headers:** `Authorization: Bearer <token>`  
**Permissions:** admin, gestionnaire

**Response (200):**
```json
{
  "success": true,
  "data": {
    "monthlyRevenue": 50000,
    "outstandingAmount": 5000,
    "invoicesCount": 120,
    "netProfit": 15000
  }
}
```

#### GET /finance/history
Historique des transactions.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)

#### GET /finance/outstanding
Factures impayées.

#### GET /finance/chart
Graphique des revenus.

---

## Codes d'erreur

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Accès interdit |
| 404 | Ressource introuvable |
| 409 | Conflit (doublon, etc.) |
| 422 | Erreur de validation |
| 429 | Trop de requêtes (rate limit) |
| 500 | Erreur serveur |

## Format des erreurs

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Message d'erreur descriptif",
    "details": "Détails supplémentaires (dev uniquement)"
  }
}
```

