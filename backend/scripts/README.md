# 🧪 Scripts de Test - OpenClinic

Scripts automatisés pour tester les améliorations de l'application.

---

## 📋 Scripts Disponibles

### 1. `test-validations.sh`
Teste les validations de recherche sur tous les contrôleurs.

**Usage:**
```bash
./scripts/test-validations.sh <TOKEN>
```

**Exemple:**
```bash
./scripts/test-validations.sh "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Tests effectués:**
- ✅ Recherche trop courte (< 2 caractères) → Erreur 400
- ✅ Recherche trop longue (> 100 caractères) → Erreur 400
- ✅ Recherche valide (2-100 caractères) → Succès 200
- ✅ Recherche avec espaces (trim automatique) → Succès 200

**Contrôleurs testés:**
- PharmacyController
- DocumentsController
- EtablissementsController
- UsersController
- SuppliersController

---

### 2. `test-rate-limiting.sh`
Teste le rate limiting sur un endpoint spécifique.

**Usage:**
```bash
./scripts/test-rate-limiting.sh <TOKEN> [ENDPOINT] [MAX_REQUESTS]
```

**Exemple:**
```bash
# Test avec valeurs par défaut (100 requêtes sur /pharmacy/inventory)
./scripts/test-rate-limiting.sh "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Test personnalisé
./scripts/test-rate-limiting.sh "TOKEN" "/documents" 100
```

**Tests effectués:**
- ✅ Envoie MAX_REQUESTS + 1 requêtes rapidement
- ✅ Vérifie que les premières MAX_REQUESTS réussissent (200)
- ✅ Vérifie que la (MAX_REQUESTS + 1)ème retourne 429
- ✅ Affiche les statistiques détaillées

---

### 3. `test-all.sh`
Script de test complet qui exécute tous les tests.

**Usage:**
```bash
./scripts/test-all.sh <TOKEN>
```

**Exemple:**
```bash
./scripts/test-all.sh "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Tests effectués:**
1. ✅ Tests de validation de recherche
2. ✅ Tests de rate limiting
3. ✅ Vérification des routes protégées
4. ✅ Génération d'un rapport complet

**Résultats:**
- Les logs sont sauvegardés dans `./test-results-YYYYMMDD-HHMMSS/`
- Un résumé est affiché à la fin

---

## 🔑 Obtenir un Token

Pour obtenir un token d'authentification :

```bash
# Via curl
curl -X POST http://localhost:3333/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@example.com",
    "password": "votre_mot_de_passe"
  }'

# La réponse contiendra un token dans le champ "token"
```

---

## 🚀 Exécution Rapide

### Test Complet
```bash
# 1. Obtenir un token
TOKEN=$(curl -s -X POST http://localhost:3333/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.token')

# 2. Exécuter tous les tests
./scripts/test-all.sh "$TOKEN"
```

### Test Rapide (Validations uniquement)
```bash
TOKEN="votre_token"
./scripts/test-validations.sh "$TOKEN"
```

### Test Rate Limiting
```bash
TOKEN="votre_token"
./scripts/test-rate-limiting.sh "$TOKEN" "/pharmacy/inventory" 100
```

---

## 📊 Variables d'Environnement

Vous pouvez personnaliser l'URL de base :

```bash
export BASE_URL="http://localhost:3333/api/v1"
./scripts/test-all.sh "$TOKEN"
```

---

## ⚠️ Notes Importantes

1. **Rate Limiting** : Les tests de rate limiting envoient de nombreuses requêtes rapidement. Assurez-vous que le serveur peut gérer cette charge.

2. **Token** : Le token doit être valide et avoir les permissions nécessaires pour accéder aux endpoints testés.

3. **Performance** : Les tests peuvent prendre quelques secondes, surtout le test de rate limiting.

4. **Logs** : Tous les résultats sont sauvegardés dans des fichiers de log pour analyse ultérieure.

---

## 🐛 Dépannage

### Erreur: "Token d'authentification requis"
- Vérifiez que vous avez fourni un token valide
- Vérifiez que le token n'a pas expiré

### Erreur: "Connection refused"
- Vérifiez que le serveur backend est démarré
- Vérifiez l'URL de base (par défaut: http://localhost:3333/api/v1)

### Rate Limiting ne fonctionne pas
- Vérifiez que le middleware de rate limiting est activé
- Vérifiez les logs du serveur pour plus de détails

---

**Date de création** : Décembre 2024  
**Statut** : ✅ Scripts prêts pour utilisation

