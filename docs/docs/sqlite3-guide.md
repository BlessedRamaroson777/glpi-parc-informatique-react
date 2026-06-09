# Guide SQLite3 — Utilisation concrète

## Ouvrir une base de données

```bash
# Ouvrir (ou créer) une base
sqlite3 database/glpi.db

# Ouvrir avec le chemin absolu
sqlite3 /home/fetraniaina/Documents/glpi-newapp/backend-app/database/glpi.db
```

> Si le fichier n'existe pas, SQLite le crée automatiquement.

---

## Commandes internes (commencent par `.`)

Ces commandes se tapent directement dans le shell SQLite.

```bash
.help              # liste toutes les commandes disponibles
.quit              # quitter SQLite
.exit              # quitter SQLite (même chose)

.tables            # lister toutes les tables
.schema            # afficher la structure de toutes les tables
.schema users      # afficher la structure d'une table précise

.databases         # afficher la base de données active et son chemin
.mode column       # afficher les résultats en colonnes alignées
.headers on        # afficher les noms des colonnes dans les résultats
```

---

## Créer des tables

```sql
-- Table simple
CREATE TABLE users (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT    NOT NULL,
  email     TEXT    UNIQUE NOT NULL,
  active    INTEGER DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table avec clé étrangère
CREATE TABLE orders (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  userId    INTEGER NOT NULL,
  total     REAL    NOT NULL,
  status    TEXT    DEFAULT 'pending',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Créer seulement si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS products (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL,
  price REAL NOT NULL
);
```

---

## Modifier une table

```sql
-- Ajouter une colonne
ALTER TABLE users ADD COLUMN phone TEXT;

-- Renommer une colonne (SQLite >= 3.25)
ALTER TABLE users RENAME COLUMN phone TO mobile;

-- Renommer une table
ALTER TABLE users RENAME TO app_users;
```

> SQLite ne supporte pas `DROP COLUMN` dans les anciennes versions.

---

## Supprimer une table

```sql
DROP TABLE orders;
DROP TABLE IF EXISTS orders;  -- sans erreur si elle n'existe pas
```

---

## INSERT — Insérer des données

```sql
-- Insertion simple
INSERT INTO users (name, email) VALUES ('John Doe', 'john@gmail.com');

-- Insertion multiple
INSERT INTO users (name, email) VALUES
  ('Jane Doe',  'jane@gmail.com'),
  ('Bob Martin','bob@yahoo.com'),
  ('Alice Dupont','alice@outlook.com');

-- Insertion avec toutes les colonnes (dans l'ordre)
INSERT INTO users VALUES (NULL, 'Paul', 'paul@gmail.com', 1, CURRENT_TIMESTAMP);

-- Ignorer si doublon (email unique)
INSERT OR IGNORE INTO users (name, email) VALUES ('John', 'john@gmail.com');

-- Remplacer si doublon
INSERT OR REPLACE INTO users (name, email) VALUES ('John Updated', 'john@gmail.com');
```

---

## SELECT — Lire des données

```sql
-- Tout sélectionner
SELECT * FROM users;

-- Colonnes précises
SELECT id, name, email FROM users;

-- Avec alias
SELECT name AS nom, email AS mail FROM users;

-- Valeur distincte
SELECT DISTINCT status FROM orders;

-- Limiter les résultats
SELECT * FROM users LIMIT 10;

-- Pagination (page 2, 10 par page)
SELECT * FROM users LIMIT 10 OFFSET 10;

-- Trier
SELECT * FROM users ORDER BY name ASC;
SELECT * FROM users ORDER BY createdAt DESC;

-- Compter
SELECT COUNT(*) FROM users;
SELECT COUNT(*) AS total FROM users WHERE active = 1;
```

---

## WHERE — Filtrer

```sql
-- Égalité
SELECT * FROM users WHERE active = 1;
SELECT * FROM users WHERE name = 'John Doe';

-- Différent
SELECT * FROM users WHERE active != 0;

-- Comparaison
SELECT * FROM orders WHERE total > 100;
SELECT * FROM orders WHERE total BETWEEN 50 AND 200;

-- LIKE (recherche partielle)
SELECT * FROM users WHERE email LIKE '%@gmail.com';
SELECT * FROM users WHERE name  LIKE 'J%';        -- commence par J
SELECT * FROM users WHERE name  LIKE '%Doe%';     -- contient Doe

-- IN (liste de valeurs)
SELECT * FROM orders WHERE status IN ('pending', 'processing');

-- NULL
SELECT * FROM users WHERE phone IS NULL;
SELECT * FROM users WHERE phone IS NOT NULL;

-- Combinaisons
SELECT * FROM users WHERE active = 1 AND email LIKE '%@gmail.com';
SELECT * FROM orders WHERE status = 'pending' OR status = 'processing';
```

---

## UPDATE — Modifier des données

```sql
-- Modifier un enregistrement
UPDATE users SET name = 'John Updated' WHERE id = 1;

-- Modifier plusieurs colonnes
UPDATE users SET name = 'John Updated', active = 0 WHERE id = 1;

-- Modifier tous les enregistrements (attention !)
UPDATE orders SET status = 'archived' WHERE status = 'delivered';
```

---

## DELETE — Supprimer des données

```sql
-- Supprimer un enregistrement
DELETE FROM users WHERE id = 1;

-- Supprimer selon une condition
DELETE FROM orders WHERE status = 'cancelled';

-- Vider toute la table (attention !)
DELETE FROM users;
```

---

## JOIN — Jointures

```sql
-- INNER JOIN : seulement les lignes qui matchent des deux côtés
SELECT u.name, u.email, o.total, o.status
FROM users u
INNER JOIN orders o ON o.userId = u.id;

-- LEFT JOIN : tous les users, même ceux sans commande
SELECT u.name, u.email, o.total, o.status
FROM users u
LEFT JOIN orders o ON o.userId = u.id;

-- Jointure avec condition
SELECT u.name, o.total, o.status
FROM users u
INNER JOIN orders o ON o.userId = u.id
WHERE o.status = 'pending'
ORDER BY o.total DESC;

-- Jointure multiple
SELECT u.name, o.total, p.name AS product
FROM users u
INNER JOIN orders o    ON o.userId    = u.id
INNER JOIN products p  ON p.orderId   = o.id
WHERE u.active = 1;
```

---

## Agrégats & GROUP BY

```sql
-- Total des commandes par user
SELECT u.name, COUNT(o.id) AS nb_commandes, SUM(o.total) AS total_depense
FROM users u
LEFT JOIN orders o ON o.userId = u.id
GROUP BY u.id, u.name;

-- Commande moyenne
SELECT AVG(total) AS moyenne FROM orders;

-- Min / Max
SELECT MIN(total) AS min, MAX(total) AS max FROM orders;

-- HAVING (filtrer après GROUP BY)
SELECT u.name, COUNT(o.id) AS nb
FROM users u
JOIN orders o ON o.userId = u.id
GROUP BY u.id
HAVING nb > 2;

-- Compter par domaine email
SELECT
  SUBSTR(email, INSTR(email, '@') + 1) AS domain,
  COUNT(*) AS total
FROM users
GROUP BY domain
ORDER BY total DESC;
```

---

## Fonctions utiles

```sql
-- Texte
SELECT UPPER(name) FROM users;               -- JOHN DOE
SELECT LOWER(email) FROM users;              -- john@gmail.com
SELECT LENGTH(name) FROM users;              -- 8
SELECT SUBSTR(email, 1, 5) FROM users;       -- john@
SELECT REPLACE(email, '@', ' at ') FROM users;
SELECT TRIM('  hello  ');                    -- 'hello'

-- Nombres
SELECT ROUND(total, 2) FROM orders;          -- 150.50
SELECT ABS(-42);                             -- 42

-- Dates
SELECT CURRENT_TIMESTAMP;                    -- 2024-01-15 10:30:00
SELECT DATE('now');                          -- 2024-01-15
SELECT DATE('now', '-7 days');               -- 7 jours en arrière
SELECT STRFTIME('%Y', createdAt) FROM users; -- année de création

-- NULL
SELECT COALESCE(phone, 'Non renseigné') FROM users;  -- valeur par défaut si NULL
```

---

## Sous-requêtes

```sql
-- Users qui ont au moins une commande
SELECT * FROM users
WHERE id IN (SELECT DISTINCT userId FROM orders);

-- Users sans commande
SELECT * FROM users
WHERE id NOT IN (SELECT DISTINCT userId FROM orders);

-- Commandes au-dessus de la moyenne
SELECT * FROM orders
WHERE total > (SELECT AVG(total) FROM orders);
```

---

## Index — Optimiser les requêtes

```sql
-- Créer un index sur une colonne souvent filtrée
CREATE INDEX idx_users_email  ON users(email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_userId ON orders(userId);

-- Index unique
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Voir les index d'une table
PRAGMA index_list(users);

-- Supprimer un index
DROP INDEX idx_users_email;
```

---

## Transactions

```sql
-- Grouper plusieurs opérations (tout ou rien)
BEGIN TRANSACTION;
  INSERT INTO users (name, email) VALUES ('Test', 'test@gmail.com');
  INSERT INTO orders (userId, total) VALUES (last_insert_rowid(), 99.99);
COMMIT;

-- Annuler si erreur
BEGIN TRANSACTION;
  DELETE FROM users WHERE id = 1;
ROLLBACK;  -- annule tout
```

---

## Commandes utiles en shell

```bash
# Exécuter une requête sans entrer dans le shell
sqlite3 database/glpi.db "SELECT * FROM users;"

# Exporter en CSV
sqlite3 -csv database/glpi.db "SELECT * FROM users;" > users.csv

# Importer un fichier SQL
sqlite3 database/glpi.db < script.sql

# Afficher en mode table propre
sqlite3 database/glpi.db -column -header "SELECT * FROM users;"

# Backup
sqlite3 database/glpi.db ".backup database/glpi_backup.db"
```

---

## Affichage propre dans le shell SQLite

```bash
sqlite3 database/glpi.db

# Activer l'affichage lisible
.headers on
.mode column

# Puis lancer tes requêtes
SELECT * FROM users;
# id  name      email
# --  --------  ---------------
# 1   John Doe  john@gmail.com
```

---

## PRAGMA — Informations & configuration

```sql
PRAGMA table_info(users);        -- colonnes d'une table (nom, type, nullable...)
PRAGMA foreign_keys = ON;        -- activer les clés étrangères
PRAGMA integrity_check;          -- vérifier l'intégrité de la base
PRAGMA database_list;            -- lister les bases attachées
```

---

## SQLite vs MySQL — Comparaison

### Différences générales

| Aspect | SQLite | MySQL |
|---|---|---|
| Installation | Aucune, fichier unique | Serveur à installer |
| Connexion | Fichier local | Host / port / user / password |
| Utilisateurs | Aucun | Gestion des droits par user |
| Concurrent | Limité (1 écriture à la fois) | Haute concurrence |
| Taille max | ~281 TB (en pratique ~1 GB conseillé) | Illimitée |
| Usage idéal | Dev, petites applis, mobile | Production, multi-utilisateurs |

---

### Syntaxe — Ce qui est identique

```sql
-- SELECT, INSERT, UPDATE, DELETE → identiques
SELECT * FROM users WHERE active = 1;
INSERT INTO users (name, email) VALUES ('John', 'john@gmail.com');
UPDATE users SET name = 'John' WHERE id = 1;
DELETE FROM users WHERE id = 1;

-- JOIN → identiques
SELECT u.name, o.total FROM users u INNER JOIN orders o ON o.userId = u.id;

-- GROUP BY, HAVING, ORDER BY, LIMIT → identiques
SELECT status, COUNT(*) AS total FROM orders GROUP BY status HAVING total > 5;
```

---

### Syntaxe — Ce qui diffère

#### Types de données

| SQLite | MySQL | Notes |
|---|---|---|
| `INTEGER` | `INT`, `BIGINT` | SQLite accepte n'importe quel type comme alias |
| `TEXT` | `VARCHAR(255)`, `TEXT` | SQLite n'a pas de longueur max sur TEXT |
| `REAL` | `FLOAT`, `DOUBLE` | Identique en pratique |
| `BLOB` | `BLOB` | Identique |
| Pas de `BOOLEAN` | `BOOLEAN` (alias TINYINT) | SQLite utilise `INTEGER` (0 ou 1) |
| Pas de `DATE` natif | `DATE`, `DATETIME` | SQLite stocke les dates en TEXT ou INTEGER |

```sql
-- MySQL
CREATE TABLE users (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  active    BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT NOW()
);

-- SQLite équivalent
CREATE TABLE users (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,
  active    INTEGER DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

#### Auto-increment

```sql
-- MySQL
id INT AUTO_INCREMENT PRIMARY KEY

-- SQLite
id INTEGER PRIMARY KEY AUTOINCREMENT
```

---

#### Dates et fonctions de date

```sql
-- Date actuelle
SELECT NOW();              -- MySQL
SELECT CURRENT_TIMESTAMP;  -- SQLite

-- Formater une date
SELECT DATE_FORMAT(createdAt, '%Y-%m') FROM users;   -- MySQL
SELECT STRFTIME('%Y-%m', createdAt)    FROM users;   -- SQLite

-- Ajouter des jours
SELECT DATE_ADD(createdAt, INTERVAL 7 DAY) FROM users;  -- MySQL
SELECT DATE(createdAt, '+7 days')           FROM users;  -- SQLite

-- Soustraire des jours
SELECT DATE_SUB(NOW(), INTERVAL 7 DAY);         -- MySQL
SELECT DATE('now', '-7 days');                   -- SQLite

-- Différence entre deux dates
SELECT DATEDIFF('2024-12-31', '2024-01-01');     -- MySQL → 365
SELECT JULIANDAY('2024-12-31') - JULIANDAY('2024-01-01'); -- SQLite → 365.0
```

---

#### Fonctions texte

```sql
-- Concaténation
SELECT CONCAT(name, ' - ', email) FROM users;   -- MySQL
SELECT name || ' - ' || email     FROM users;   -- SQLite

-- Extraire une partie de texte
SELECT SUBSTRING(email, 1, 5) FROM users;  -- MySQL
SELECT SUBSTR(email, 1, 5)    FROM users;  -- SQLite (SUBSTRING marche aussi)

-- Position d'un caractère
SELECT LOCATE('@', email) FROM users;   -- MySQL
SELECT INSTR(email, '@')  FROM users;   -- SQLite
```

---

#### Requêtes complexes — Différences pratiques

```sql
-- ① LIMIT avec OFFSET
SELECT * FROM users LIMIT 10 OFFSET 20;   -- MySQL & SQLite identiques ✓

-- ② INSERT OR IGNORE (SQLite) vs INSERT IGNORE (MySQL)
INSERT OR IGNORE INTO users (name, email) VALUES ('John', 'john@gmail.com');  -- SQLite
INSERT IGNORE  INTO users (name, email) VALUES ('John', 'john@gmail.com');    -- MySQL

-- ③ UPSERT
-- MySQL
INSERT INTO users (name, email) VALUES ('John', 'john@gmail.com')
ON DUPLICATE KEY UPDATE name = 'John';

-- SQLite
INSERT INTO users (name, email) VALUES ('John', 'john@gmail.com')
ON CONFLICT(email) DO UPDATE SET name = 'John';

-- ④ Récupérer le dernier ID inséré
SELECT LAST_INSERT_ID();      -- MySQL
SELECT last_insert_rowid();   -- SQLite

-- ⑤ Afficher les tables
SHOW TABLES;        -- MySQL
.tables             -- SQLite (commande interne)

-- ⑥ Afficher la structure d'une table
DESCRIBE users;              -- MySQL
PRAGMA table_info(users);    -- SQLite

-- ⑦ RIGHT JOIN
-- MySQL : supporté ✓
SELECT * FROM orders o RIGHT JOIN users u ON u.id = o.userId;

-- SQLite : non supporté ✗ → inverser avec LEFT JOIN
SELECT * FROM users u LEFT JOIN orders o ON o.userId = u.id;

-- ⑧ FULL OUTER JOIN
-- MySQL (>= 8.0) : supporté ✓
-- SQLite : non supporté ✗ → simuler avec UNION
SELECT u.name, o.total FROM users u LEFT  JOIN orders o ON o.userId = u.id
UNION
SELECT u.name, o.total FROM users u RIGHT JOIN orders o ON o.userId = u.id;
-- En SQLite on combine deux LEFT JOIN inversés
SELECT u.name, o.total FROM users u LEFT JOIN orders o ON o.userId = u.id
UNION
SELECT u.name, o.total FROM orders o LEFT JOIN users u ON u.id = o.userId;
```

---

#### Clés étrangères

```sql
-- MySQL : actives par défaut
-- SQLite : désactivées par défaut, à activer manuellement

PRAGMA foreign_keys = ON;  -- à faire à chaque connexion en SQLite
```

---

### Résumé — Ce qu'il faut retenir

| Fonctionnalité | SQLite | MySQL |
|---|---|---|
| `AUTO_INCREMENT` | `AUTOINCREMENT` | `AUTO_INCREMENT` |
| `NOW()` | `CURRENT_TIMESTAMP` | `NOW()` |
| `CONCAT()` | `\|\|` ou `CONCAT()` | `CONCAT()` |
| `LOCATE()` | `INSTR()` | `LOCATE()` |
| `DATE_FORMAT()` | `STRFTIME()` | `DATE_FORMAT()` |
| `DATE_ADD()` | `DATE('now', '+N days')` | `DATE_ADD()` |
| `INSERT IGNORE` | `INSERT OR IGNORE` | `INSERT IGNORE` |
| `ON DUPLICATE KEY` | `ON CONFLICT DO UPDATE` | `ON DUPLICATE KEY UPDATE` |
| `LAST_INSERT_ID()` | `last_insert_rowid()` | `LAST_INSERT_ID()` |
| `DESCRIBE` | `PRAGMA table_info()` | `DESCRIBE` |
| `RIGHT JOIN` | ✗ (inverser en LEFT JOIN) | ✓ |
| `FULL OUTER JOIN` | ✗ (simuler avec UNION) | ✓ (>= 8.0) |
| Clés étrangères | Désactivées par défaut | Actives par défaut |
