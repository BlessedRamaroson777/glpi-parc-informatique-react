# Repository Requests — SQLite

## 1. Les deux façons de faire des requêtes

### ORM — `User.findAll()`
Pour les requêtes simples (CRUD basique).
```js
User.findAll({ where: { name: 'John' } });
```

### SQL brut — `sequelize.query()`
Pour les requêtes complexes (GROUP BY, SUBSTR, fonctions SQLite).
```js
sequelize.query(`SELECT * FROM users WHERE email LIKE :domain`, {
  replacements: { domain: '%@gmail.com' },
  type: QueryTypes.SELECT,
});
```

---

## 2. Les Replacements — passer des variables

Toujours utiliser les replacements pour éviter les injections SQL.

### Nommés `:nom` (recommandé)
```js
sequelize.query(
  `SELECT * FROM users WHERE email LIKE :domain AND age > :age`,
  {
    replacements: { domain: '%@gmail.com', age: 18 },
    type: QueryTypes.SELECT,
  }
);
```

### Positionnels `?`
```js
sequelize.query(
  `SELECT * FROM users WHERE email LIKE ? AND age > ?`,
  {
    replacements: ['%@gmail.com', 18],
    type: QueryTypes.SELECT,
  }
);
```

### ❌ Ne jamais faire
```js
// Injection SQL possible
`SELECT * FROM users WHERE email = '${email}'`
```

---

## 3. QueryTypes — type de retour

```js
const { QueryTypes } = require('sequelize');

QueryTypes.SELECT   // → tableau d'objets  [{ id: 1, name: '...' }]
QueryTypes.INSERT   // → [id, rowsAffected]
QueryTypes.UPDATE   // → [null, rowsAffected]
QueryTypes.DELETE   // → rowsAffected
```

---

## 4. Le `%` — uniquement pour LIKE sur du texte

```js
'%@gmail.com'   // tout ce qui FINIT par @gmail.com
'%john%'        // tout ce qui CONTIENT john
'john%'         // tout ce qui COMMENCE par john
```

```js
// ✅ Correct
{ email: { [Op.like]: '%@gmail.com' } }

// ❌ Inutile sur un nombre
{ age: { [Op.like]: '%18%' } }   // utiliser = > < à la place
```

---

## 5. Les Opérateurs ORM — `Op`

```js
const { Op } = require('sequelize');

// Comparaisons
{ age: { [Op.gt]: 18 } }           // age > 18
{ age: { [Op.gte]: 18 } }          // age >= 18
{ age: { [Op.lt]: 18 } }           // age < 18
{ age: { [Op.lte]: 18 } }          // age <= 18
{ age: { [Op.eq]: 18 } }           // age = 18
{ age: { [Op.ne]: 18 } }           // age != 18

// Texte
{ name: { [Op.like]: '%john%' } }      // LIKE '%john%'
{ name: { [Op.notLike]: '%john%' } }   // NOT LIKE '%john%'

// Listes
{ id: { [Op.in]: [1, 2, 3] } }         // IN (1, 2, 3)
{ id: { [Op.notIn]: [1, 2, 3] } }      // NOT IN (1, 2, 3)

// Intervalle
{ age: { [Op.between]: [18, 30] } }    // BETWEEN 18 AND 30

// ET / OU
{ [Op.and]: [{ age: { [Op.gt]: 18 } }, { name: { [Op.like]: '%john%' } }] }
{ [Op.or]:  [{ age: 18 }, { age: 25 }] }
```

---

## 6. Types SQLite — règles à respecter

### String / Text
```js
// ✅ Correct — LIKE avec %
replacements: { name: `%${keyword}%` }
`WHERE name LIKE :name`

// ✅ Correct — égalité exacte
replacements: { name: 'John' }
`WHERE name = :name`
```

### Integer
```js
// ✅ Toujours convertir avec parseInt() si ça vient de req.params / req.query
replacements: { id: parseInt(req.params.id) }
`WHERE id = :id`

// ✅ Comparaisons
`WHERE age > :age AND age < :max`
replacements: { age: 18, max: 30 }

// ❌ Ne pas utiliser LIKE sur un int
`WHERE id LIKE :id`   // inutile et incorrect
```

### Boolean
```js
// SQLite stocke les boolean comme 0 et 1
// ✅ Correct
replacements: { active: 1 }   // true
replacements: { active: 0 }   // false

// ❌ Eviter
replacements: { active: true }   // peut ne pas marcher en SQLite
replacements: { active: 'true' } // string, toujours faux
```

### Date
```js
// SQLite stocke les dates comme string au format ISO
// ✅ Correct
replacements: { date: '2024-06-25' }             // date simple
replacements: { date: new Date().toISOString() }  // datetime complet

// ✅ Fonctions SQLite pour les dates
`WHERE createdAt >= datetime('now', :days)`
replacements: { days: '-7 days' }

`WHERE createdAt >= date('now', '-1 month')`
`WHERE createdAt BETWEEN :start AND :end`
replacements: { start: '2024-01-01', end: '2024-12-31' }

// ❌ Format français — SQLite ne comprend pas
replacements: { date: '25/06/2024' }
```

---

## 7. Fonctions SQLite utiles

```sql
-- Texte
SUBSTR(email, INSTR(email, '@') + 1)   -- extraire domaine après @
UPPER(name)                             -- mettre en majuscule
LOWER(name)                             -- mettre en minuscule
LENGTH(name)                            -- longueur d'un texte
TRIM(name)                              -- supprimer espaces

-- Dates
datetime('now')                         -- date + heure actuelle
date('now')                             -- date actuelle
datetime('now', '-7 days')              -- il y a 7 jours
datetime('now', '+1 month')             -- dans 1 mois
strftime('%Y', createdAt)               -- extraire l'année
strftime('%m', createdAt)               -- extraire le mois
strftime('%d', createdAt)               -- extraire le jour

-- Nombres
COUNT(*)                                -- compter les lignes
SUM(amount)                             -- somme
AVG(amount)                             -- moyenne
MIN(amount)                             -- minimum
MAX(amount)                             -- maximum
ROUND(amount, 2)                        -- arrondir à 2 décimales
```

---

## 8. Exemples complets

### Pagination
```js
findWithPagination: async ({ page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  return await User.findAndCountAll({
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
},
```

### Recherche texte
```js
searchByName: async (keyword) => {
  return await User.findAll({
    where: { name: { [Op.like]: `%${keyword}%` } },
    order: [['name', 'ASC']],
  });
},
```

### Grouper par domaine email
```js
countByDomain: async () => {
  return await sequelize.query(
    `SELECT
       SUBSTR(email, INSTR(email, '@') + 1) AS domain,
       COUNT(*) AS total
     FROM users
     GROUP BY domain
     ORDER BY total DESC`,
    { type: QueryTypes.SELECT }
  );
},
```

### Filtrer par date récente
```js
findRecentUsers: async (days = 7) => {
  return await sequelize.query(
    `SELECT * FROM users
     WHERE createdAt >= datetime('now', :days)
     ORDER BY createdAt DESC`,
    {
      replacements: { days: `-${days} days` },
      type: QueryTypes.SELECT,
    }
  );
},
```

### Filtrer par domaine email
```js
findByEmailDomain: async (domain) => {
  return await sequelize.query(
    `SELECT * FROM users WHERE email LIKE :domain ORDER BY createdAt DESC`,
    {
      replacements: { domain: `%@${domain}` },
      type: QueryTypes.SELECT,
    }
  );
},
```

---

## 9. Résumé des règles

```
Type        Opérateur       Conversion            Eviter
────────    ─────────────   ───────────────────   ──────────────────
string      LIKE avec %     aucune                LIKE sans %
integer     = > < between   parseInt()            LIKE, string brut
boolean     = 1 ou = 0      convertir en 0/1      true/false, 'true'
date        datetime()      toISOString()         format DD/MM/YYYY
id          = :id           parseInt()            string de req.params
```
