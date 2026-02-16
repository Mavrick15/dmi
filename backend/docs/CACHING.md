# Politique de cache (Redis / mémoire)

## Quand utiliser le cache

Mettre en cache **uniquement** :

- **Requêtes lourdes** : agrégations, stats, dashboards (plusieurs requêtes SQL ou calculs coûteux).
- **Requêtes très répétitives** : endpoints appelés souvent (ex. overview du dashboard, stats affichées sur plusieurs écrans).

## Quand ne pas utiliser le cache

- **Lecture simple par ID** : `GET /patients/:id`, `GET /factures/:id`, etc. — déjà rapides, pas de gain.
- **Listes paginées** : les paramètres (page, filtre) multiplient les clés et compliquent l’invalidation.
- **Données qui doivent être toujours à jour** : détail d’une facture après paiement, fiche patient en cours d’édition — risque d’afficher une ancienne valeur.

## Règle pratique

> Cache si la requête est **lente** ou **très souvent appelée**. Sinon, ne pas cacher.

## OpenClinic : à respecter

- **Ce qui est pertinent à cacher** : dashboard, stats (patients, analyses, documents, pharmacie, finance, admin, établissements) — agrégations, beaucoup de lectures, données qui peuvent avoir 1–2 minutes de retard.
- **À éviter** : cacher systématiquement chaque `GET /patients/:id`, chaque liste paginée, chaque détail de facture ou de consultation. Réserver le cache aux endpoints vraiment coûteux ou très sollicités.
- **Règle simple** :
  - Mettre en cache quand une requête est **lente** ou **très souvent appelée**.
  - Ne pas mettre en cache « partout » par principe.

## Ce qui est actuellement mis en cache

| Clé / préfixe           | Endpoint / usage              | TTL  | Invalidation                          |
|-------------------------|-------------------------------|------|----------------------------------------|
| `dashboard:data:*`      | Données dashboard             | 120s | Création patient                       |
| `patients:stats`        | GET stats patients            | 60s  | Création patient                       |
| `finance:overview`     | GET overview finance          | 120s | Création facture, paiement, MAJ, remb. |
| `analyses:stats`        | GET stats analyses            | 60s  | Création / MAJ / annulation analyse     |
| `documents:stats`       | GET stats documents           | 60s  | Création doc, signature, archivage     |
| `pharmacy:stats`        | GET stats pharmacie           | 60s  | Médicaments et mouvements d’inventaire |
| `stats:overview`        | GET stats/overview            | 120s | Création patient                       |
| `admin:stats:overview`  | GET admin/stats/overview      | 120s | Création patient, établissement        |
| `etablissements:stats`  | GET stats établissements     | 60s  | Création / MAJ établissement           |

## Invalidation

À chaque **écriture** qui affecte une donnée mise en cache, appeler :

- `CacheService.deleteAsync('cle')` pour une clé fixe ;
- `CacheService.deleteByPrefixAsync('prefix')` pour toutes les clés dont l’id commence par `prefix`.

Sans invalidation, les utilisateurs peuvent voir des données obsolètes.

## Voir ce qui est dans le cache

- **Script projet** (depuis `backend/`) :
  ```bash
  node scripts/list-cache-keys.js
  ```
  Affiche les clés avec leur TTL. Option `--show-values` pour un extrait des valeurs :
  ```bash
  node scripts/list-cache-keys.js --show-values
  ```

- **Redis CLI** (si installé localement) :
  ```bash
  redis-cli KEYS "cache:*"
  redis-cli TTL "cache:patients:stats"
  redis-cli GET "cache:patients:stats"
  ```
  Les clés en base sont préfixées par `cache:` (ex. `cache:dashboard:data:medecin:xxx`).
