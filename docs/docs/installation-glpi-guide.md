# Guide d'installation GLPI 11.0.7 sur Ubuntu avec XAMPP

## Environnement

| Composant | Version |
|-----------|---------|
| OS | Ubuntu 26 |
| XAMPP | 8.2.12-0 |
| PHP (XAMPP) | 8.2.12 |
| MariaDB (local) | 11.8.6 |
| GLPI | 11.0.7 |

---

## 1. Installation de XAMPP

Télécharger et installer XAMPP pour Linux depuis https://www.apachefriends.org.

XAMPP s'installe dans `/opt/lampp/`.

### Lancer XAMPP sans sudo

Par défaut XAMPP nécessite `sudo`. Pour contourner la limitation du setuid
sur les scripts shell sous Linux, on compile un binaire C wrapper :

```bash
# Créer le wrapper C
sudo nano /opt/lampp/xampp_wrapper.c
```

Contenu du fichier :

```c
#include <unistd.h>

int main(int argc, char *argv[]) {
    setuid(0);
    setgid(0);
    execv("/opt/lampp/xampp.sh", argv);
    return 1;
}
```

```bash
# Compiler et configurer le wrapper
sudo gcc /opt/lampp/xampp_wrapper.c -o /opt/lampp/xampp_bin
sudo chown root:root /opt/lampp/xampp_bin
sudo chmod u+s /opt/lampp/xampp_bin

# Renommer le script original et créer le lien
sudo mv /opt/lampp/xampp /opt/lampp/xampp.sh
sudo ln -s /opt/lampp/xampp_bin /opt/lampp/xampp
```

On peut maintenant faire `/opt/lampp/xampp start` sans sudo.

---

## 2. Résoudre l'erreur apr_dbd_sqlite3.so

Au premier démarrage d'Apache, une erreur apparaît :

```
AH00526: Syntax error on line 44 of /opt/lampp/etc/extra/httpd-xampp.conf:
Can't load driver file apr_dbd_sqlite3.so
```

**Solution** — commenter la ligne dans `httpd-xampp.conf` :

```bash
sudo nano /opt/lampp/etc/extra/httpd-xampp.conf
```

Trouver la ligne à la ligne 44 et ajouter `#` devant :

```apache
#LoadFile /opt/lampp/lib/apr_dbd_sqlite3.so
```

---

## 3. Donner les permissions sur htdocs

Pour pouvoir modifier les fichiers sans sudo :

```bash
sudo chown -R fetraniaina:fetraniaina /opt/lampp/htdocs
sudo chmod -R 755 /opt/lampp/htdocs
```

---

## 4. Vérification des prérequis GLPI

### PHP (XAMPP)
```bash
/opt/lampp/bin/php -v
# PHP 8.2.12 ✅ (requis : 8.2 minimum)
```

### MariaDB local
```bash
mysql --version
# mysql from 11.8.6-MariaDB ✅ (requis : 10.6 minimum)
# Note : mysql et mariadb sont la même commande sur Ubuntu
```

### Extensions PHP obligatoires
```bash
/opt/lampp/bin/php -m | grep -iE "curl|gd|intl|mysqli|zlib|bcmath|mbstring|openssl|dom|fileinfo|filter|simplexml|tokenizer|xmlreader|xmlwriter|session"
```

Résultat obtenu — toutes présentes ✅ :
```
bcmath, curl, dom, fileinfo, filter, gd, intl, mbstring,
mysqli, openssl, session, SimpleXML, tokenizer, xmlreader, xmlwriter, zlib
```

### Extensions suggérées (non bloquantes)
- `Zend OPcache` — manquante (performances PHP légèrement réduites)
- `sodium` — manquante (performances légèrement réduites)

Ces deux extensions sont facultatives, GLPI fonctionne sans.

---

## 5. Créer la base de données

```bash
sudo mysql -u root
```

```sql
CREATE DATABASE glpi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

> On utilise le compte `root` directement sans créer d'utilisateur dédié.

---

## 6. Télécharger et extraire GLPI

```bash
# Télécharger dans /tmp
cd /tmp
wget https://github.com/glpi-project/glpi/releases/download/11.0.7/glpi-11.0.7.tgz

# Ou si déjà téléchargé ailleurs
tar -xzf /home/fetraniaina/Documents/apk/glpi-11.0.7.tgz -C /opt/lampp/htdocs/
```

Structure obtenue dans `/opt/lampp/htdocs/glpi/` :

```
CHANGELOG.md  INSTALL.md   README.md   apirest.md  bin     config
css           files        front       inc         install lib
locales       marketplace  plugins     public      routes  src
templates     vendor       version
```

> ⚠️ GLPI 11 utilise `/opt/lampp/htdocs/glpi/public/` comme dossier public (pas la racine).

---

## 7. Permissions des fichiers GLPI

```bash
sudo chown -R daemon:daemon /opt/lampp/htdocs/glpi
sudo chmod -R 775 /opt/lampp/htdocs/glpi
```

---

## 8. Configurer Apache de XAMPP

### 8.1 Ajouter le VirtualHost

```bash
sudo nano /opt/lampp/etc/httpd.conf
```

Ajouter à la fin du fichier :

```apache
Listen 8081

<VirtualHost *:8081>
    DocumentRoot "/opt/lampp/htdocs/glpi/public"
    <Directory "/opt/lampp/htdocs/glpi/public">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### 8.2 Créer le fichier .htaccess

```bash
sudo nano /opt/lampp/htdocs/glpi/public/.htaccess
```

Contenu :

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.php [L]
</IfModule>
```

### 8.3 Vérifier que mod_rewrite est activé

Dans `/opt/lampp/etc/httpd.conf`, vérifier que cette ligne est décommentée :

```apache
LoadModule rewrite_module modules/mod_rewrite.so
```

---

## 9. Démarrer XAMPP et tester

```bash
sudo /opt/lampp/xampp start
# ou avec le wrapper : /opt/lampp/xampp start
```

Vérifier qu'Apache écoute sur le port 8081 :

```bash
sudo netstat -tlnp | grep :8081
```

Ouvrir dans le navigateur : **http://localhost:8081**

---

## 10. Installation via le navigateur

Ouvrir **http://localhost:8081** et suivre l'assistant :

### Étape 0 — Vérification de compatibilité
Tous les prérequis sont validés (voir section 4). Cliquer **Continuer**.

### Étape 1 — Connexion à la base de données

| Champ | Valeur |
|-------|--------|
| Serveur SQL | `127.0.0.1` |
| Utilisateur SQL | `root` |
| Mot de passe SQL | `ton_mot_de_passe_root` |

Cliquer **Continuer**, puis sélectionner la base **glpi**.

### Étape 2 — Initialisation
GLPI initialise la base de données automatiquement.

### Étape 3 — Fin d'installation
Installation terminée. Cliquer **Utiliser GLPI**.

---

## 11. Comptes par défaut

| Login | Mot de passe | Rôle |
|-------|-------------|------|
| `glpi` | `glpi` | Super administrateur |
| `tech` | `tech` | Technicien |
| `normal` | `normal` | Utilisateur normal |
| `post-only` | `postonly` | Création tickets uniquement |

> ⚠️ Changer tous ces mots de passe immédiatement après la première connexion.

---

## 12. Accès

| URL | Description |
|-----|-------------|
| `http://localhost:8081` | Interface GLPI |
| `http://localhost:8081/apirest.php` | API V1 (Legacy) |
| `http://localhost:8081/api.php/v2.3` | API V2 (OAuth2) |

---

## Commandes utiles

```bash
# Démarrer XAMPP
sudo /opt/lampp/xampp start

# Arrêter XAMPP
sudo /opt/lampp/xampp stop

# Redémarrer Apache uniquement
sudo /opt/lampp/bin/apachectl restart

# Voir les logs Apache
sudo tail -f /opt/lampp/logs/error_log

# Vérifier les ports en écoute
sudo netstat -tlnp | grep -E ":80|:8081|:3306"

# Se connecter à MariaDB
sudo mysql -u root
```