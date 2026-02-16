# Correction de l'erreur CORS Rocket.new

## 🔍 Problème identifié

L'erreur CORS provenait des scripts de tracking Rocket.new qui tentaient de faire des requêtes vers `https://application.rocket.new/preview/v1/track` depuis `https://openclinic.cd`.

## ✅ Solution appliquée

Les scripts Rocket.new ont été **supprimés** du fichier `index.html` :
- `rocket-web.js` (supprimé)
- `rocket-shot.js` (supprimé)

## 🔧 Actions à faire

### 1. Vider le cache du navigateur

L'erreur peut encore apparaître si le navigateur utilise une version mise en cache de `index.html`.

**Solutions :**
- **Chrome/Edge** : `Ctrl+Shift+R` (Windows/Linux) ou `Cmd+Shift+R` (Mac) pour un hard refresh
- **Firefox** : `Ctrl+F5` (Windows/Linux) ou `Cmd+Shift+R` (Mac)
- Ou vider le cache manuellement dans les paramètres du navigateur

### 2. Vérifier que les scripts ne sont plus présents

Ouvrez les outils de développement (F12) et vérifiez dans l'onglet **Network** ou **Réseau** que les requêtes vers `application.rocket.new` n'apparaissent plus.

### 3. Si l'erreur persiste

Si l'erreur persiste après avoir vidé le cache :

1. **Vérifier le fichier index.html en production**
   ```bash
   # Si vous utilisez un serveur web, vérifiez que le fichier index.html déployé
   # ne contient pas les scripts Rocket.new
   ```

2. **Désactiver le plugin component-tagger temporairement** (si nécessaire)
   - Le plugin `@dhiwise/component-tagger` dans `vite.config.mjs` peut être lié à Rocket.new
   - Si nécessaire, vous pouvez le désactiver en commentant la ligne `tagger()` dans `vite.config.mjs`

3. **Vérifier les extensions du navigateur**
   - Certaines extensions peuvent injecter des scripts
   - Testez en mode navigation privée

## 📝 Note

Les scripts Rocket.new étaient des outils de tracking/analytics fournis avec le template initial. Ils ne sont pas nécessaires pour le fonctionnement de l'application OpenClinic.

Si vous souhaitez ajouter du tracking, utilisez plutôt :
- Google Analytics
- Matomo (open source)
- Plausible Analytics (respectueux de la vie privée)

---

**Date :** 2026-01-20  
**Statut :** ✅ Résolu
