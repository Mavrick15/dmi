# Commandes Ace Personnalisées

OpenClinic inclut plusieurs commandes Ace personnalisées pour faciliter la gestion de l'application.

## Commandes Disponibles

### 1. Backup de la Base de Données

Crée une sauvegarde de la base de données PostgreSQL.

```bash
# Backup simple
node ace backup:database

# Backup compressé
node ace backup:database --compress

# Backup dans un répertoire spécifique
node ace backup:database --output=/path/to/backups
```

### 2. Envoyer les Rappels

Envoie des rappels de rendez-vous par email.

```bash
# Rappels quotidiens (pour demain)
node ace reminders:send --daily

# Rappels pour les RDV dans 24h (défaut)
node ace reminders:send

# Rappels pour les RDV dans X heures
node ace reminders:send --hours=48
```

### 3. Nettoyage des Tokens API

Nettoie les tokens API expirés et révoqués.

```bash
# Mode normal
node ace cleanup:tokens

# Mode dry-run (simulation)
node ace cleanup:tokens --dry-run
```

### 4. Nettoyage des Tokens de Réinitialisation

Nettoie les tokens de réinitialisation de mot de passe expirés.

```bash
# Mode normal
node ace cleanup:password-resets

# Mode dry-run
node ace cleanup:password-resets --dry-run
```

### 5. Créer un Administrateur

Crée un nouvel utilisateur administrateur.

```bash
# Avec mot de passe généré automatiquement
node ace make:admin email@example.com "Nom Complet"

# Avec mot de passe personnalisé
node ace make:admin email@example.com "Nom Complet" --password="MonMotDePasse123!"
```

**Exemple:**
```bash
node ace make:admin admin@openclinic.cd "Administrateur Principal"
```

### 6. Health Check

Vérifie la santé de l'application et de la base de données.

```bash
# Mode normal
node ace health:check

# Mode verbeux (plus de détails)
node ace health:check --verbose
```

## Commandes AdonisJS Standard

### Migrations

```bash
# Exécuter les migrations
node ace migration:run

# Rollback la dernière migration
node ace migration:rollback

# Voir le statut des migrations
node ace migration:status
```

### Seeders

```bash
# Exécuter les seeders
node ace db:seed
```

### Build

```bash
# Build pour la production
node ace build
```

## Automatisation

### Cron Jobs Recommandés

Ajoutez ces tâches à votre crontab pour automatiser le nettoyage :

```bash
# Backup quotidien à 1h du matin
0 1 * * * cd /path/to/backend && node ace backup:database --compress

# Nettoyer les tokens tous les jours à 2h du matin
0 2 * * * cd /path/to/backend && node ace cleanup:tokens

# Nettoyer les tokens de reset tous les jours à 3h du matin
0 3 * * * cd /path/to/backend && node ace cleanup:password-resets

# Envoyer les rappels quotidiens à 8h du matin
0 8 * * * cd /path/to/backend && node ace reminders:send --daily

# Envoyer les rappels horaires (toutes les heures)
0 * * * * cd /path/to/backend && node ace reminders:send --hours=24
```

### Script de Maintenance

Créez un script `scripts/maintenance.sh` :

```bash
#!/bin/bash
cd /path/to/backend

# Nettoyer les tokens
node ace cleanup:tokens
node ace cleanup:password-resets

# Health check
node ace health:check --verbose

echo "Maintenance terminée"
```

Rendez-le exécutable :
```bash
chmod +x scripts/maintenance.sh
```

## Intégration CI/CD

Ces commandes peuvent être utilisées dans vos pipelines CI/CD :

```yaml
# Exemple GitHub Actions
- name: Health Check
  run: node ace health:check

- name: Cleanup tokens
  run: node ace cleanup:tokens
```

