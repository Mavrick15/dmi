# Sécurité : Session unique par compte

## 🔒 Fonctionnalité implémentée

Le système garantit maintenant qu'**un seul utilisateur peut être connecté avec un compte à la fois**. Lorsqu'un utilisateur se connecte, toutes les autres sessions actives de ce compte sont automatiquement déconnectées.

## ✅ Modifications apportées

### Backend

1. **TokenService** (`app/services/TokenService.ts`)
   - ✅ Modification de `createTokenPair()` pour révoquer automatiquement tous les autres tokens actifs
   - ✅ Amélioration de `revokeAllUserTokens()` pour ne révoquer que les tokens non expirés
   - ✅ Garantit qu'un seul token actif existe par utilisateur à la fois

2. **AuthController** (`app/controllers/auth_controller.ts`)
   - ✅ Message informatif lors de la connexion : "Les autres sessions ont été déconnectées pour des raisons de sécurité"

3. **AuthMiddleware** (`app/middleware/auth_middleware.ts`)
   - ✅ Message d'erreur amélioré : "Votre session a été déconnectée car une nouvelle connexion a été établie avec ce compte"

### Frontend

4. **Intercepteur Axios** (`src/lib/axios.js`)
   - ✅ Détection automatique des tokens révoqués
   - ✅ Nettoyage automatique des tokens et redirection vers la page de connexion
   - ✅ Message d'erreur clair pour l'utilisateur

5. **AuthContext** (`src/contexts/AuthContext.jsx`)
   - ✅ Gestion améliorée des sessions révoquées
   - ✅ Redirection avec paramètre `reason=session_revoked`

6. **Page de connexion** (`src/pages/login-portal/index.jsx`)
   - ✅ Affichage d'un message d'alerte si la session a été révoquée
   - ✅ Message informatif expliquant pourquoi la déconnexion a eu lieu

## 🔄 Comportement

### Scénario 1 : Nouvelle connexion
1. Utilisateur A se connecte avec son compte → Token A créé
2. Utilisateur B se connecte avec le même compte → Token A révoqué, Token B créé
3. Utilisateur A fait une requête → Reçoit une erreur 401 "Token révoqué"
4. Utilisateur A est automatiquement redirigé vers la page de connexion
5. Un message s'affiche : "Votre session a été déconnectée car une nouvelle connexion a été établie"

### Scénario 2 : Refresh token
- Le refresh token fonctionne normalement (même session)
- Seule une **nouvelle connexion** révoque les autres sessions

## 🛡️ Sécurité

- ✅ Empêche le partage de comptes
- ✅ Empêche les connexions simultanées non autorisées
- ✅ Audit trail : toutes les connexions sont loggées
- ✅ Messages clairs pour l'utilisateur

## 📝 Notes

- Les tokens expirés sont automatiquement nettoyés
- Seuls les tokens actifs (non expirés) sont révoqués lors d'une nouvelle connexion
- Le système est transparent pour l'utilisateur (redirection automatique)

---

**Date :** 2026-01-20  
**Statut :** ✅ Implémenté et testé
