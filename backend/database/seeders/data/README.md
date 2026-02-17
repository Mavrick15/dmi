# Données CIM-10 OMS (Classification Internationale des Maladies, 10e révision)

Ce dossier contient les données de la **CIM-10** (classificateur OMS) utilisées dans l’onglet **Diagnostic** de la console clinique.

## Fichiers

- **cim10-oms-chapitres.json** : les 22 chapitres officiels CIM-10 (A00–B99 à U00–U99) avec libellés en français.
- **cim10-oms-codes.json** : sélection de codes de diagnostics (libellés français OMS) par chapitre.

## Enrichir la base

Pour ajouter d’autres codes CIM-10, éditer `cim10-oms-codes.json` et ajouter des objets au format :

```json
{
  "code": "XXX",
  "name": "Libellé officiel en français",
  "category": "Nom du chapitre (ex: Appareil circulatoire)",
  "parentCode": "Code du chapitre (ex: I00-I99)"
}
```

Puis relancer le seeder :

```bash
node ace db:seed
# ou uniquement le seeder CIM-10 si configuré
```

## Source officielle complète

La CIM-10 française complète (version PMSI, ~19 000 codes) est publiée par l’ANS / ATIH :

- [Terminologie CIM-10 (esante.gouv.fr)](https://esante.gouv.fr/terminologie-cim-10)
- Format FHIR/JSON disponible sur le serveur de terminologies d’esanté.

Pour une importation massive, un script peut être ajouté pour lire un export JSON/CSV de cette source et alimenter la table `cim10_codes`.
