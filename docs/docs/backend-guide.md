# Backend App — Guide

## Structure

```
backend-app/
  database/
    glpi.db          # base SQLite
  src/
    app.js           # express + montage des routes
    db.js            # connexion SQLite
    tickets.js       # routes tickets
  server.js          # point d'entrée
  .env
```

`server.js` charge `.env` et démarre express. `app.js` regroupe toutes les routes. Chaque fichier de routes gère un domaine (tickets, users, etc.).

---

## Connexion DB — `src/db.js`

Utilise le module natif Node.js 22+ `node:sqlite`, synchrone, sans dépendance externe.

```js
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.resolve(process.env.DB_PATH));

module.exports = db;
```

`DB_PATH` est défini dans `.env` → `./database/glpi.db`.

---

## Fonctions utilitaires DB

`db` expose directement les méthodes SQLite. Les requêtes sont **synchrones**.

### Lire des lignes

```js
// Toutes les lignes
const rows = db.prepare('SELECT * FROM tickets').all();

// Une seule ligne (undefined si pas trouvée)
const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);

// Valeur scalaire
const count = db.prepare('SELECT COUNT(*) as n FROM tickets').get().n;
```

### Écrire

```js
// INSERT
const result = db.prepare('INSERT INTO tickets (ticketId) VALUES (?)').run(ticketId);
console.log(result.lastInsertRowid); // id généré

// UPDATE
const result = db.prepare('UPDATE tickets SET ticketId = ? WHERE id = ?').run(ticketId, id);
console.log(result.changes); // nb de lignes modifiées

// DELETE
const result = db.prepare('DELETE FROM tickets WHERE id = ?').run(id);
console.log(result.changes); // 0 si rien supprimé
```

### Paramètres nommés

```js
const row = db.prepare('SELECT * FROM tickets WHERE id = :id AND ticketId = :ticketId')
              .get({ id: 1, ticketId: 42 });
```

### Transaction

```js
const insert = db.prepare('INSERT INTO items (name) VALUES (?)');
const insertMany = db.transaction((items) => {
  for (const item of items) insert.run(item);
});
insertMany(['a', 'b', 'c']);
```

---

## Créer un nouveau fichier de routes

**1. Créer `src/[nom].js`**

```js
const { Router } = require('express');
const db = require('./db');

const router = Router();

// GET tous
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM [table]').all();
  res.json(rows);
});

// GET un par id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM [table] WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Introuvable' });
  res.json(row);
});

// POST créer
router.post('/', (req, res) => {
  const { champ1, champ2 } = req.body;
  if (!champ1) return res.status(400).json({ error: 'champ1 requis' });
  const result = db.prepare('INSERT INTO [table] (champ1, champ2) VALUES (?, ?)').run(champ1, champ2);
  res.status(201).json({ id: result.lastInsertRowid, champ1, champ2 });
});

// PUT modifier
router.put('/:id', (req, res) => {
  const { champ1 } = req.body;
  const result = db.prepare('UPDATE [table] SET champ1 = ? WHERE id = ?').run(champ1, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Introuvable' });
  res.json({ id: Number(req.params.id), champ1 });
});

// DELETE
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM [table] WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Introuvable' });
  res.json({ message: 'Supprimé' });
});

module.exports = router;
```

**2. Monter dans `src/app.js`**

```js
const express = require('express');
const tickets = require('./tickets');
const [nom]   = require('./[nom]');     // ajouter

const app = express();
app.use(express.json());
app.use('/api/tickets', tickets);
app.use('/api/[nom]',   [nom]);         // ajouter

module.exports = app;
```

---

## Routes disponibles — tickets

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/tickets` | tous les tickets |
| GET | `/api/tickets/:id` | un ticket par id |
| POST | `/api/tickets` | créer un ticket |
| PUT | `/api/tickets/:id` | modifier un ticket |
| DELETE | `/api/tickets/:id` | supprimer par id |
| GET | `/api/tickets/by-ticket/:ticketId` | rechercher par ticketId |
| DELETE | `/api/tickets/by-ticket/:ticketId` | supprimer par ticketId |

### Exemples avec curl

```bash
# Lister
curl http://localhost:3000/api/tickets

# Créer
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"ticketId": 42}'

# Modifier
curl -X PUT http://localhost:3000/api/tickets/1 \
  -H "Content-Type: application/json" \
  -d '{"ticketId": 99}'

# Supprimer
curl -X DELETE http://localhost:3000/api/tickets/1

# Rechercher par ticketId
curl http://localhost:3000/api/tickets/by-ticket/42
```

---

## Paramètres dans les requêtes préparées

### Positionnels `?`

L'ordre des `?` correspond à l'ordre des arguments passés à `.all()` / `.get()` / `.run()`.

```js
db.prepare('SELECT * FROM tickets WHERE id = ? AND ticketId = ?').get(1, 42);
//                                                                      ^  ^
//                                                               1er ?  2ème ?
```

### Nommés `:nom` / `@nom` / `$nom`

Plus lisible quand il y a beaucoup de champs. On passe un objet.

```js
db.prepare(`
  INSERT INTO tickets (ticketId, status, createdAt)
  VALUES (:ticketId, :status, :createdAt)
`).run({ ticketId: 42, status: 'open', createdAt: '2026-06-08' });
```

Les trois préfixes `:nom`, `@nom`, `$nom` sont équivalents — choisir un et s'y tenir.

---

## Types et formats des valeurs

SQLite stocke tout en 5 types natifs : `NULL`, `INTEGER`, `REAL`, `TEXT`, `BLOB`.  
Node.js fait la conversion automatiquement selon ce tableau :

| Valeur JS | Type SQLite stocké |
|-----------|-------------------|
| `null` / `undefined` | NULL |
| `true` / `false` | INTEGER (1 / 0) |
| `42` (entier) | INTEGER |
| `3.14` (flottant) | REAL |
| `'texte'` | TEXT |
| `Buffer` / `Uint8Array` | BLOB |

### Dates

SQLite n'a pas de type DATE natif — on stocke en TEXT au format ISO 8601, ou en INTEGER (timestamp Unix).

**Stocker une date (TEXT recommandé)**

```js
// Obtenir la date/heure actuelle au format ISO
const now = new Date().toISOString();
// → '2026-06-08T14:30:00.000Z'

// Juste la date (sans heure)
const today = new Date().toISOString().slice(0, 10);
// → '2026-06-08'

db.prepare('INSERT INTO tickets (ticketId, createdAt) VALUES (?, ?)').run(42, today);
```

**Stocker en timestamp Unix (INTEGER)**

```js
const ts = Math.floor(Date.now() / 1000); // secondes depuis 1970
db.prepare('INSERT INTO tickets (ticketId, createdAt) VALUES (?, ?)').run(42, ts);
```

**Lire et reconvertir en Date JS**

```js
const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(1);

// Si stocké en TEXT ISO
const date = new Date(row.createdAt);

// Si stocké en timestamp INTEGER
const date = new Date(row.createdAt * 1000);
```

**Filtrer par plage de dates**

```js
// tickets créés entre deux dates
db.prepare(`
  SELECT * FROM tickets
  WHERE createdAt BETWEEN ? AND ?
`).all('2026-01-01', '2026-06-30');

// tickets du jour
const today = new Date().toISOString().slice(0, 10);
db.prepare(`SELECT * FROM tickets WHERE createdAt LIKE ?`).all(`${today}%`);
```

### Booléens

SQLite n'a pas de type BOOLEAN — on stocke 0/1 en INTEGER.

```js
// Insérer
db.prepare('INSERT INTO tasks (done) VALUES (?)').run(true);   // stocke 1
db.prepare('INSERT INTO tasks (done) VALUES (?)').run(false);  // stocke 0

// Lire — SQLite retourne 0 ou 1, convertir si besoin
const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(1);
const isDone = row.done === 1;  // ou Boolean(row.done)

// Filtrer
db.prepare('SELECT * FROM tasks WHERE done = ?').all(1);  // tâches terminées
```

### Nombres — entiers vs décimaux

```js
// Entier : passer un Number entier ou une string numérique
db.prepare('UPDATE tickets SET priority = ? WHERE id = ?').run(3, id);

// Décimal : passer un Number avec virgule
db.prepare('UPDATE tickets SET cost = ? WHERE id = ?').run(12.50, id);

// Attention : req.params et req.query arrivent toujours en STRING
// → convertir avant d'insérer
const id = Number(req.params.id);        // ou parseInt(req.params.id, 10)
const cost = parseFloat(req.body.cost);
```

### NULL

```js
// Insérer NULL
db.prepare('INSERT INTO tickets (ticketId, closedAt) VALUES (?, ?)').run(42, null);

// Filtrer les NULL
db.prepare('SELECT * FROM tickets WHERE closedAt IS NULL').all();
db.prepare('SELECT * FROM tickets WHERE closedAt IS NOT NULL').all();
```

### Texte avec caractères spéciaux

Les paramètres préparés échappent automatiquement les quotes, apostrophes, etc. — ne jamais concaténer des valeurs dans la requête.

```js
// BIEN — paramètre préparé, safe
db.prepare("SELECT * FROM tickets WHERE title = ?").get("L'incident");

// MAL — injection SQL possible
db.prepare(`SELECT * FROM tickets WHERE title = '${title}'`).get(); // ❌
```

---

## Requêtes SQL fréquentes

```js
// Filtrer
db.prepare('SELECT * FROM tickets WHERE ticketId > ?').all(10);

// Trier
db.prepare('SELECT * FROM tickets ORDER BY id DESC').all();

// Paginer
db.prepare('SELECT * FROM tickets LIMIT ? OFFSET ?').all(10, 0);

// Jointure
db.prepare(`
  SELECT t.*, u.name AS user_name
  FROM tickets t
  JOIN users u ON t.userId = u.id
  WHERE t.id = ?
`).get(id);

// Aggrégat
db.prepare('SELECT ticketId, COUNT(*) as total FROM tickets GROUP BY ticketId').all();
```

---

## Query params dans les routes

Les paramètres d'URL (`?key=value`) arrivent dans `req.query`.

```js
// GET /api/tickets?status=open&limit=10&page=2
router.get('/', (req, res) => {
  const status = req.query.status;          // 'open' ou undefined
  const limit  = Number(req.query.limit)  || 20;
  const page   = Number(req.query.page)   || 1;
  const offset = (page - 1) * limit;

  let sql    = 'SELECT * FROM tickets';
  const args = [];

  if (status) {
    sql += ' WHERE status = ?';
    args.push(status);
  }

  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  args.push(limit, offset);

  const rows = db.prepare(sql).all(...args);
  res.json(rows);
});
```

---

## Gestion des erreurs

### Erreur 400 — données manquantes ou invalides

```js
router.post('/', (req, res) => {
  const { ticketId, status } = req.body;

  if (!ticketId) return res.status(400).json({ error: 'ticketId requis' });
  if (!['open', 'closed', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'status invalide' });
  }

  // ...
});
```

### Erreur 404 — ressource introuvable

```js
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Ticket introuvable' });
  res.json(row);
});
```

### Erreur 500 — erreur inattendue

Entourer les opérations DB avec try/catch quand elles peuvent échouer (contrainte UNIQUE, etc.).

```js
router.post('/', (req, res) => {
  try {
    const result = db.prepare('INSERT INTO users (email) VALUES (?)').run(req.body.email);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }
    res.status(500).json({ error: err.message });
  }
});
```

---

## Middleware utiles

### CORS — autoriser le frontend

Ajouter dans `src/app.js` avant les routes si le frontend tourne sur un port différent.

```js
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
```

### Logger simple

```js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

### Vérifier un token (auth basique)

```js
function auth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (token !== process.env.API_TOKEN) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  next();
}

// Utiliser sur une route ou un groupe de routes
router.delete('/:id', auth, (req, res) => { /* ... */ });
```

---

## Ajouter une table

Ouvrir la DB et créer la table :

```bash
sqlite3 ./database/glpi.db
```

```sql
CREATE TABLE IF NOT EXISTS users (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  name    TEXT NOT NULL,
  email   TEXT NOT NULL UNIQUE
);
```

Ou depuis Node au démarrage dans `db.js` :

```js
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
  )
`);
```

---

## Variables d'environnement — `.env`

```env
PORT=3000
NODE_ENV=development
DB_PATH=./database/glpi.db
```

Accès dans le code : `process.env.PORT`, etc. Toujours charger `dotenv` en premier dans `server.js`.

---

## Fonctions utilitaires réutilisables

Si plusieurs routes répètent la même logique, créer `src/utils.js`.

```js
// src/utils.js

const db = require('./db');

// Récupérer une ligne ou renvoyer 404
function getOrFail(res, table, id) {
  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  if (!row) { res.status(404).json({ error: 'Introuvable' }); return null; }
  return row;
}

// Date ISO courante
function now() {
  return new Date().toISOString();
}

// Date du jour (YYYY-MM-DD)
function today() {
  return new Date().toISOString().slice(0, 10);
}

// Convertir une valeur en entier sûr (défaut si NaN)
function toInt(val, fallback = 0) {
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
}

module.exports = { getOrFail, now, today, toInt };
```

Utilisation dans une route :

```js
const { getOrFail, now, toInt } = require('./utils');

router.get('/:id', (req, res) => {
  const row = getOrFail(res, 'tickets', req.params.id);
  if (!row) return;   // getOrFail a déjà renvoyé le 404
  res.json(row);
});

router.post('/', (req, res) => {
  const limit = toInt(req.query.limit, 20);
  const rows  = db.prepare('SELECT * FROM tickets LIMIT ?').all(limit);
  res.json(rows);
});
```

---

## Démarrer le serveur

```bash
# production
npm start

# développement (rechargement automatique)
npm run dev
```
