# OpenClinic Backend

Backend API pour le système de gestion clinique OpenClinic, construit avec AdonisJS 6 et TypeScript.

## 📋 Table des matières

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Base de données](#base-de-données)
- [Démarrage](#démarrage)
- [Structure du projet](#structure-du-projet)
- [API Documentation](#api-documentation)
- [Sécurité](#sécurité)
- [Tests](#tests)

## 🔧 Prérequis

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm ou yarn

## 🚀 Installation

```bash
# Cloner le repository
git clone <repository-url>
cd backend

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Générer la clé d'application
node ace generate:key
```

## ⚙️ Configuration

### Variables d'environnement

Copiez `.env.example` vers `.env` et configurez les variables suivantes :

#### Base de données
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=openclinic_user
DB_PASSWORD=your_password
DB_DATABASE=openclinic_db
```

#### Application
```env
NODE_ENV=development
PORT=3333
APP_KEY=your-secret-key-here
```

#### Email (SMTP)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## 🗄️ Base de données

### Créer la base de données

```sql
CREATE DATABASE openclinic_db;
CREATE USER openclinic_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE openclinic_db TO openclinic_user;
```

### Exécuter les migrations

```bash
# Exécuter toutes les migrations
node ace migration:run

# Rollback la dernière migration
node ace migration:rollback
```

### Seeders (Données de test)

```bash
# Exécuter les seeders
node ace db:seed
```

## ▶️ Démarrage

### Mode développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3333`

### Mode production

```bash
# Build
npm run build

# Démarrer
npm start
```

## 📁 Structure du projet

```
backend/
├── app/
│   ├── controllers/      # Contrôleurs API
│   ├── models/           # Modèles Lucid ORM
│   ├── middleware/       # Middleware personnalisés
│   ├── validators/        # Validateurs VineJS
│   ├── services/         # Services métier
│   └── exceptions/        # Gestionnaire d'erreurs
├── config/               # Fichiers de configuration
├── database/
│   ├── migrations/       # Migrations de base de données
│   └── seeders/         # Seeders pour données de test
├── start/
│   ├── routes.ts         # Définition des routes
│   └── kernel.ts         # Configuration middleware
└── tests/               # Tests unitaires et fonctionnels
```

## 🔌 API Documentation

### Authentification

Toutes les routes protégées nécessitent un token d'authentification dans le header :

```
Authorization: Bearer <token>
```

### Endpoints principaux

#### Authentification
- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/logout` - Déconnexion
- `GET /api/v1/auth/me` - Profil utilisateur
- `POST /api/v1/auth/forgot-password` - Mot de passe oublié
- `POST /api/v1/auth/reset-password` - Réinitialisation

#### Patients
- `GET /api/v1/patients` - Liste des patients
- `GET /api/v1/patients/:id` - Détails d'un patient
- `POST /api/v1/patients` - Créer un patient
- `PUT /api/v1/patients/:id` - Mettre à jour
- `DELETE /api/v1/patients/:id` - Supprimer

#### Pharmacie
- `GET /api/v1/pharmacy/inventory` - Inventaire
- `GET /api/v1/pharmacy/stats` - Statistiques
- `POST /api/v1/pharmacy/medications` - Ajouter médicament
- `POST /api/v1/pharmacy/orders` - Créer commande

#### Consultations
- `POST /api/v1/consultations` - Créer consultation

#### Rendez-vous
- `GET /api/v1/appointments` - Liste des RDV
- `POST /api/v1/appointments` - Créer RDV

### Rôles et permissions

- **admin** : Accès complet
- **docteur** : Consultations, prescriptions
- **infirmiere** : Consultations, soins
- **pharmacien** : Gestion pharmacie
- **gestionnaire** : Administration, finances
- **patient** : Accès limité

## 🔒 Sécurité

### Authentification

- Tokens API avec expiration (7 jours par défaut)
- Hashage des mots de passe avec bcrypt
- Validation stricte des entrées avec VineJS

### Middleware

- `auth` : Vérifie l'authentification
- `role` : Vérifie les permissions par rôle

### Bonnes pratiques

- Ne jamais commiter le fichier `.env`
- Utiliser des mots de passe forts
- Activer HTTPS en production
- Configurer CORS correctement

## 🧪 Tests

Le projet utilise Japa comme framework de test.

### Exécuter les tests

```bash
# Exécuter tous les tests
npm test

# Tests unitaires uniquement
npm test -- --suite=unit

# Tests fonctionnels uniquement
npm test -- --suite=functional

# Tests avec couverture (si configuré)
npm test -- --coverage
```

### Structure des tests

```
tests/
├── unit/              # Tests unitaires (validateurs, services)
│   └── validators/
└── functional/        # Tests fonctionnels (endpoints API)
    ├── auth.spec.ts
    └── patients.spec.ts
```

### Écrire des tests

Exemple de test fonctionnel :

```typescript
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('My Feature', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(() => testUtils.db().truncate())

  test('should do something', async ({ client, assert }) => {
    const response = await client.get('/api/v1/endpoint')
    response.assertStatus(200)
    assert.exists(response.body().data)
  })
})
```

## 📝 Scripts disponibles

```bash
npm run dev          # Démarrage avec hot-reload
npm run build         # Build pour production
npm start             # Démarrer en production
npm test              # Exécuter les tests
npm run lint          # Linter le code
npm run format        # Formater le code
npm run typecheck     # Vérifier les types TypeScript
```

## 🛠️ Commandes Ace Personnalisées

Le projet inclut plusieurs commandes Ace utiles :

```bash
# Nettoyer les tokens expirés
node ace cleanup:tokens

# Créer un administrateur
node ace make:admin email@example.com "Nom Complet"

# Health check
node ace health:check

# Voir toutes les commandes
node ace list
```

Voir [Documentation des Commandes](./docs/COMMANDS.md) pour plus de détails.

## 🛠️ Technologies

- **Framework** : AdonisJS 6
- **Langage** : TypeScript
- **ORM** : Lucid ORM
- **Base de données** : PostgreSQL
- **Validation** : VineJS
- **Authentification** : Tokens API personnalisés

## 📚 Documentation

- [Documentation API](./docs/API.md) - Documentation complète de l'API
- [Guide de Déploiement](./docs/DEPLOYMENT.md) - Guide pour déployer en production

## 📄 Licence

UNLICENSED - Usage privé uniquement

## 👥 Support

Pour toute question ou problème, ouvrir une issue sur le repository.

## 🚀 Déploiement

Voir le [Guide de Déploiement](./docs/DEPLOYMENT.md) pour les instructions complètes.

### Déploiement rapide

```bash
# Build
npm run build

# Migrations
node ace migration:run

# Démarrer avec PM2
pm2 start ecosystem.config.js
```

