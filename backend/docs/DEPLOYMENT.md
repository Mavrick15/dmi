# Guide de Déploiement - OpenClinic Backend

## Prérequis

- Node.js >= 18.x
- PostgreSQL >= 14.x
- PM2 (pour la gestion des processus en production)
- Nginx (optionnel, pour reverse proxy)

## Configuration de Production

### 1. Variables d'environnement

Créez un fichier `.env` avec les variables suivantes :

```env
NODE_ENV=production
PORT=3333
HOST=0.0.0.0
APP_KEY=your-very-secure-random-key-min-32-chars
TZ=Africa/Kinshasa
LOG_LEVEL=info

# Base de données
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=openclinic_prod
DB_PASSWORD=your-secure-password
DB_DATABASE=openclinic_prod

# CORS
CORS_ALLOWED_ORIGINS=https://openclinic.cd,https://www.openclinic.cd

# Email
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USERNAME=your-email@domain.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@openclinic.cd

# Frontend
FRONTEND_URL=https://openclinic.cd

# Redis (optionnel : rate limiting)
REDIS_HOST=10.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
```

### 2. Redis (optionnel)

Si vous utilisez Redis/Valkey pour le rate limiting.

**Redis sur la même machine que le backend**

- Dans le `.env` : `REDIS_HOST=127.0.0.1` (pas besoin d’ouvrir le port 6379 vers l’extérieur).
- Installer Valkey/Redis localement, configurer comme ci‑dessous, puis `node scripts/check-redis.js` pour vérifier.

**Configurer Redis/Valkey avec les mêmes valeurs que le .env**

Pour que le backend se connecte avec :
- `REDIS_HOST=127.0.0.1`
- `REDIS_PORT=6379`
- `REDIS_PASSWORD=ben123`
- `REDIS_DB=0`

sur la machine où tourne Redis/Valkey, appliquer la configuration suivante.

- **Valkey** (fichier `/etc/valkey/valkey.conf`) :
  ```ini
  bind 127.0.0.1
  port 6379
  requirepass ben123
  ```
- **Redis** (fichier `/etc/redis/redis.conf`) : idem (mêmes directives).

Commandes typiques (après installation de `valkey` ou `redis`) :
```bash
# Valkey (Rocky / RHEL)
sudo sed -i 's/^bind .*/bind 127.0.0.1/' /etc/valkey/valkey.conf
echo "requirepass ben123" | sudo tee -a /etc/valkey/valkey.conf
sudo systemctl restart valkey

# Redis (si vous utilisez redis au lieu de valkey)
sudo sed -i 's/^bind .*/bind 127.0.0.1/' /etc/redis/redis.conf
echo "requirepass ben123" | sudo tee -a /etc/redis/redis.conf
sudo systemctl restart redis
```
Le port par défaut est déjà 6379 et la base 0 ; inutile de les modifier sauf besoin particulier.

**Backend sur l’hôte, Redis/Valkey dans une VM**

- Dans le `.env` de l’hôte : `REDIS_HOST=` l’IP de la VM (ex. `10.0.0.1`).
- Dans la VM : installer Valkey (ou Redis), ouvrir le port 6379 et autoriser les connexions depuis l’hôte (voir ci‑dessous).
- Vérifier la connectivité depuis l’hôte : `ping 10.0.0.1` puis `node scripts/check-redis.js` depuis le dossier backend.

**Installation sur Rocky Linux (VM, ex. Rocky 10)**

Exécuter dans la VM sous Rocky Linux (Valkey est compatible Redis et fourni dans les dépôts, dnf pour Rocky 9/10) :

```bash
# Installer Valkey
sudo dnf install -y valkey

# Configurer : écoute sur toutes les interfaces
sudo sed -i 's/^bind .*/bind 0.0.0.0/' /etc/valkey/valkey.conf
# Mot de passe (même que REDIS_PASSWORD sur l'hôte) : éditer /etc/valkey/valkey.conf et ajouter/modifier la ligne requirepass VOTRE_MOT_DE_PASSE

# Démarrer et activer au boot
sudo systemctl enable --now valkey

# Ouvrir le port 6379 (firewalld)
sudo firewall-cmd --permanent --add-port=6379/tcp
sudo firewall-cmd --reload
```

Si le paquet `valkey` n’est pas disponible, utiliser Redis : `sudo dnf install -y redis` puis adapter les chemins (`/etc/redis/redis.conf`) et le service (`redis`).

1. **Ouvrir le port 6379** (pare-feu **dans la VM**) :
   ```bash
   # Depuis le repo backend :
   chmod +x scripts/open-redis-port.sh
   sudo ./scripts/open-redis-port.sh
   ```
   Ou manuellement :
   - **firewalld** : `sudo firewall-cmd --permanent --add-port=6379/tcp && sudo firewall-cmd --reload`
   - **ufw** : `sudo ufw allow 6379/tcp && sudo ufw reload`

2. **Autoriser les connexions distantes** : dans la config Redis (`redis.conf`), vérifier :
   - `bind 0.0.0.0` (ou `bind 10.0.0.1`) pour accepter les connexions depuis le réseau
   - `protected-mode yes` avec un `requirepass` défini (recommandé)

3. Redémarrer le service après modification : `sudo systemctl restart redis` ou `sudo systemctl restart valkey` (Valkey est compatible Redis).

4. **Vérifier la connexion** depuis la machine du backend :
   ```bash
   cd backend && node scripts/check-redis.js
   ```
   Si vous voyez « Redis: PONG — connexion OK », le backend pourra utiliser Redis/Valkey.

**Dépannage (backend sur l’hôte, Redis/Valkey en VM)**  
- Le ping vers la VM fonctionne mais `check-redis.js` donne ECONNREFUSED : tester le port TCP depuis l’hôte :
  ```bash
  nc -zv 10.0.0.1 6379
  ```
  Si `nc` échoue : pare-feu (vérifier les règles qui autorisent le port 6379 depuis l’IP de l’hôte) ou routage. Si `nc` réussit : le souci peut venir du mot de passe (Valkey exige AUTH) — vérifier que `REDIS_PASSWORD` dans le `.env` de l’hôte correspond à la config Valkey.  
- **Faire écouter Valkey sur toutes les interfaces** (souvent nécessaire quand le client est sur l’hôte et Valkey en VM) : dans la VM, éditer la config Valkey (ex. `/etc/valkey/valkey.conf` ou `/etc/valkey/valkey.conf`) et mettre `bind 0.0.0.0`, puis `sudo systemctl restart valkey`. Vérifier avec `ss -tlnp | grep 6379` que l’écoute est bien sur `*:6379`.
- Si `nc -zv 10.0.0.1 6379` depuis l’hôte donne toujours « Connection refused » après un `bind 0.0.0.0` : dans la VM, vérifier le pare-feu (`sudo firewall-cmd --list-all`) et s’assurer que la zone utilisée par l’interface (ex. 10.0.0.1) autorise le port 6379/tcp ; au besoin ouvrir explicitement : `sudo firewall-cmd --permanent --zone=public --add-port=6379/tcp && sudo firewall-cmd --reload`.

### 3. Génération de la clé d'application

```bash
node ace generate:key
```

Copiez la clé générée dans `APP_KEY` de votre `.env`.

### 4. Base de données

#### Créer la base de données

```sql
CREATE DATABASE openclinic_prod;
CREATE USER openclinic_prod WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE openclinic_prod TO openclinic_prod;
```

#### Exécuter les migrations

```bash
node ace migration:run
```

### 5. Build de l'application

```bash
npm run build
```

### 6. Déploiement avec PM2

#### Installation de PM2

```bash
npm install -g pm2
```

#### Créer un fichier `ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'openclinic-backend',
    script: './build/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
}
```

#### Démarrer avec PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Commandes PM2 utiles

```bash
pm2 status          # Voir le statut
pm2 logs            # Voir les logs
pm2 restart all      # Redémarrer
pm2 stop all         # Arrêter
pm2 delete all       # Supprimer
```

### 7. Configuration Nginx (Optionnel)

```nginx
server {
    listen 80;
    server_name api.openclinic.cd;

    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.openclinic.cd;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 8. Sécurité

#### Firewall

```bash
# Autoriser uniquement les ports nécessaires
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

#### SSL/TLS

Utilisez Let's Encrypt pour obtenir un certificat SSL gratuit :

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.openclinic.cd
```

#### Sécuriser PostgreSQL

Modifiez `/etc/postgresql/14/main/pg_hba.conf` :

```
host    openclinic_prod    openclinic_prod    127.0.0.1/32    scram-sha-256
```

### 9. Monitoring

#### Health Check

L'endpoint `/` retourne le statut de l'application :

```bash
curl http://localhost:3333/
# {"status":"ok","version":"1.0.0"}
```

#### Logs

Les logs sont disponibles via PM2 :

```bash
pm2 logs openclinic-backend
```

Ou directement dans les fichiers :
- `logs/pm2-error.log`
- `logs/pm2-out.log`

### 10. Mises à jour

#### Processus de mise à jour

```bash
# 1. Sauvegarder la base de données
pg_dump openclinic_prod > backup_$(date +%Y%m%d).sql

# 2. Pull les dernières modifications
git pull origin main

# 3. Installer les dépendances
npm install

# 4. Exécuter les migrations
node ace migration:run

# 5. Build
npm run build

# 6. Redémarrer PM2
pm2 restart openclinic-backend
```

### 11. Sauvegarde

#### Script de sauvegarde automatique

Créez `/etc/cron.daily/backup-openclinic.sh` :

```bash
#!/bin/bash
BACKUP_DIR="/backups/openclinic"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Sauvegarder la base de données
pg_dump openclinic_prod > $BACKUP_DIR/db_$DATE.sql

# Compresser
gzip $BACKUP_DIR/db_$DATE.sql

# Supprimer les sauvegardes de plus de 30 jours
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

Rendre exécutable :

```bash
chmod +x /etc/cron.daily/backup-openclinic.sh
```

## Dépannage

### L'application ne démarre pas

1. Vérifier les logs : `pm2 logs`
2. Vérifier les variables d'environnement
3. Vérifier la connexion à la base de données
4. Vérifier que le port n'est pas déjà utilisé

### Erreurs de base de données

1. Vérifier que PostgreSQL est démarré : `sudo systemctl status postgresql`
2. Vérifier les permissions utilisateur
3. Vérifier les migrations : `node ace migration:status`

### Performance

1. Vérifier les index de base de données
2. Analyser les requêtes lentes avec `EXPLAIN ANALYZE`
3. Ajuster le nombre d'instances PM2 selon les ressources

## Support

Pour toute question ou problème, consulter les logs ou ouvrir une issue.

