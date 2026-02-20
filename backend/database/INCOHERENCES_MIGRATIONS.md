# Rapport d’incohérences et doublons (migrations / base)

## 1. Table inutile créée par erreur

**Migration :** `1766824853359_create_alter_analyses_medecin_id_nullables_table.ts`

- **Problème :** La migration crée une table nommée `alter_analyses_medecin_id_nullables` (colonnes : `id`, `created_at`, `updated_at`) au lieu de modifier la table `analyses`. Le nom laisse penser à un “alter” sur `analyses.medecin_id`, mais il n’y a aucun lien avec la table `analyses`.
- **Conséquence :** Une table inutile peut exister en base.
- **Correction :** Une migration de nettoyage a été ajoutée pour exécuter `DROP TABLE IF EXISTS alter_analyses_medecin_id_nullables`.

La vraie modification “medecin_id nullable” sur `analyses` est faite par **`1768000000006_create_alter_analyses_medecin_id_nullables_table.ts`** (alter réel sur `analyses`).

---

## 2. Doublon : table `facture_analyses`

**Migrations :**

- `1766780403345_create_create_facture_analyses_table.ts`
- `1768000000005_create_create_facture_analyses_table.ts`

Les deux gèrent la même table `facture_analyses` avec une logique “si la table n’existe pas, la créer”. La seconde ajoute aussi la FK vers `analyses` si elle manque. Aucune incohérence en exécution (pas de double création grâce aux gardes), mais **redondance** dans l’historique des migrations.

---

## 3. Doublon : index de recherche (search indexes)

**Migrations :**

- `1766642614802_create_add_search_indexes_clinical_after_tables_table.ts`
- `1767000000004_create_add_search_indexes_clinical_after_tables_table.ts`

Contenu **quasi identique** (mêmes index sur `quick_notes`, `consultation_templates`, `cim10_codes`). Les index sont créés avec `CREATE INDEX IF NOT EXISTS`, donc pas d’erreur en double exécution, mais **migration dupliquée** dans l’historique.

---

## 4. Typo dans un nom de fichier

**Fichier :** `1700000000007_inveent.ts`

- “inveent” au lieu de “invent” (inventaire). Le fichier crée `inventaire_mouvements` et `rapports_compliance`.  
- **Ne pas renommer** le fichier sans adapter l’historique des migrations (risque de “migration inconnue” ou re-exécution).

---

## 5. Nom de table cohérent : `resultats_analyse`

La table s’appelle bien **`resultats_analyse`** (sans ‘s’ final) partout (modèle, migrations, requêtes). Le nom de fichier `1766780331450_create_add_signature_annotation_to_resultats_analyses_table.ts` contient “resultats_analyses” avec un ‘s’ : c’est uniquement une **typo dans le nom du fichier**, pas une incohérence en base.

---

## 6. Résumé des actions recommandées

| Priorité | Action | Statut |
|----------|--------|--------|
| Faite     | Migration de nettoyage : `DROP TABLE IF EXISTS alter_analyses_medecin_id_nullables` | Fait (1769000000002) |
| Optionnel | Fusionner ou clarifier les deux migrations `facture_analyses` | Fait : 1766780403345 crée, 1768000000005 complète (FK + index) |
| Optionnel | Fusionner ou fusionner l’une des deux migrations “search indexes” |
| Info      | Garder le nom de fichier `inveent.ts` pour ne pas casser l’historique |
