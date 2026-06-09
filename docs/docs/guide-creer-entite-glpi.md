# Guide : Créer une entité GLPI en JavaScript

Ce guide explique étape par étape comment créer une classe entité JS
pour n'importe quelle ressource de l'API GLPI V2.

---

## C'est quoi une entité ?

Une entité c'est une classe JS qui représente un objet GLPI (User, Ticket, Computer...).
Elle contient :
- les **données** de l'objet (ses champs)
- les **méthodes** pour communiquer avec l'API (save, update, delete, getBy...)

Au lieu d'appeler `api.post(...)` partout dans ton code, tu fais juste `user.save()`.

---

## Étape 1 — Trouver l'endpoint dans le swagger

Ouvre le fichier `swagger.json` et cherche la section `paths`.

Pour un `User` tu cherches `/Administration/User` :

```json
"/Administration/User": {
  "get":  { ... },   → liste
  "post": { ... }    → créer
},
"/Administration/User/{id}": {
  "get":    { ... }, → détail
  "patch":  { ... }, → modifier
  "delete": { ... }  → supprimer
}
```

> L'endpoint de ta classe sera la partie après la base URL.
> Ex : `Administration/User`, `Assistance/Ticket`, `Assets/Computer`

---

## Étape 2 — Trouver les attributs dans le swagger

Dans `swagger.json`, cherche la section `components.schemas.NomDeLaClasse`.

Pour `User` :

```json
"components": {
  "schemas": {
    "User": {
      "properties": {
        "id":        { "type": "integer", "readOnly": true },
        "username":  { "type": "string" },
        "password":  { "type": "string", "writeOnly": true },
        ...
      }
    }
  }
}
```

### Les règles à respecter selon les propriétés swagger

| Propriété swagger | Signification | Que faire dans ta classe |
|-------------------|---------------|--------------------------|
| `readOnly: true` | L'API le retourne mais tu ne peux pas l'envoyer | Mettre dans le constructeur, **exclure** de `toCreate()` et `toUpdate()` |
| `writeOnly: true` | Tu peux l'envoyer mais l'API ne le retourne jamais | Mettre dans `toCreate()`, **exclure** de `toUpdate()` |
| `type: object` avec `x-full-schema` | C'est une relation vers une autre entité | Stocker `{ id, name }`, envoyer uniquement `{ id }` |
| `type: array` | Tableau | Initialiser à `[]` dans le constructeur |
| `enum: [1,2,3...]` | Valeur limitée | Documenter les valeurs possibles en commentaire |
| `format: date-time` | Date ISO 8601 | String `"2026-06-03T08:00:00Z"` |
| `format: password` | Mot de passe | Ne jamais logger, writeOnly en général |

### Exemple de lecture du swagger pour User

```
id            → integer, readOnly      → dans constructeur uniquement
username      → string                 → constructeur + toCreate + toUpdate
password      → string, writeOnly      → constructeur + toCreate seulement
location      → object, x-full-schema  → stocker {id,name}, envoyer {id}
is_active     → boolean                → constructeur + toCreate + toUpdate
date_creation → string, readOnly       → constructeur uniquement
```

---

## Étape 3 — Structure de base d'une entité

Voici le squelette à copier-coller pour créer n'importe quelle entité :

```javascript
// entities/MonEntite.js
import api from '../utils/api-v2.js'

class MonEntite {

  // L'endpoint API correspondant à cette entité
  endpoint = 'Section/MonEntite'

  // ─── Constructeur ──────────────────────────────────────────────────────────
  constructor(data = {}) {
    // Champs simples
    this.id    = data.id    ?? null   // readOnly
    this.name  = data.name  ?? ''
    // ...

    // Champs relations (objet avec id + name)
    this.location = data.location ?? null  // { id, name }

    // Champs tableaux
    this.emails = data.emails ?? []
  }

  // ─── Méthodes statiques ────────────────────────────────────────────────────

  // Construire une instance depuis les données brutes de l'API
  static fromData(data) {
    const obj = Object.create(MonEntite.prototype)
    Object.assign(obj, data)
    obj.endpoint = 'Section/MonEntite'
    return obj
  }

  // ─── Méthodes CRUD ────────────────────────────────────────────────────────

  async save()           { /* voir étape 4 */ }
  async getById(id)      { /* voir étape 4 */ }
  async getAll(params)   { /* voir étape 4 */ }
  async update()         { /* voir étape 4 */ }
  async delete()         { /* voir étape 4 */ }

  // ─── Méthodes utilitaires ─────────────────────────────────────────────────

  async getBy(fieldName, value)      { /* voir étape 5 */ }
  async getByNot(fieldName, value)   { /* voir étape 5 */ }
  async getIncl(includeIds)          { /* voir étape 5 */ }
  async getExcl(excludeIds)          { /* voir étape 5 */ }
}

export default MonEntite
```

---

## Étape 4 — Les méthodes CRUD

### save() — Créer

Envoie les données vers l'API et retourne l'objet créé.
N'inclure que les champs non-readOnly.

```javascript
async save() {
  const created = await api.post(this.endpoint, {
    name:     this.name,
    // Ne pas inclure : id, date_creation, date_mod (readOnly)
    // Pour les relations, envoyer seulement { id }
    location: this.location ? { id: this.location.id } : null,
  })
  return MonEntite.fromData(created)
}
```

### getById() — Lire un seul

```javascript
async getById(id) {
  const data = await api.get(`${this.endpoint}/${id}`)
  return MonEntite.fromData(data)
}
```

### getAll() — Lire tous

Accepte des `params` pour filtrer, trier, paginer.

```javascript
async getAll(params = {}) {
  const data = await api.get(this.endpoint, params)
  // L'API retourne un tableau
  return data.map(item => MonEntite.fromData(item))
}
```

Exemples d'utilisation :

```javascript
// Tous sans filtre
await entite.getAll()

// Avec filtre et pagination
await entite.getAll({ filter: 'is_active==true', limit: 50, start: 0 })

// Trié
await entite.getAll({ sort: 'date_creation:desc' })
```

### update() — Modifier

```javascript
async update() {
  if (!this.id) throw new Error(`Impossible de modifier sans ID`)

  const updated = await api.patch(`${this.endpoint}/${this.id}`, {
    name:     this.name,
    location: this.location ? { id: this.location.id } : null,
    // Ne pas inclure les champs writeOnly (password...) ni readOnly
  })
  return MonEntite.fromData(updated)
}
```

### delete() — Supprimer

```javascript
async delete() {
  if (!this.id) throw new Error(`Impossible de supprimer sans ID`)
  await api.delete(`${this.endpoint}/${this.id}`)
}
```

---

## Étape 5 — Les méthodes utilitaires

### getBy() — Filtrer par champ (côté client)

Récupère tous les éléments puis filtre localement.
Pratique pour les petits datasets ou quand l'API ne supporte pas le filtre.

```javascript
async getBy(fieldName, value) {
  if (value === undefined || value === null || value === '') return []

  const all    = await this.getAll()
  const values = Array.isArray(value) ? value : [value]
  const normalized = values.map(v => String(v))

  return all.filter(item => {
    const v = item[fieldName]
    if (v === undefined || v === null) return false
    if (Array.isArray(v)) return v.map(String).some(iv => normalized.includes(iv))
    return normalized.includes(String(v))
  })
}
```

Exemples :

```javascript
// Un seul utilisateur par username
await user.getBy('username', 'jdupont')

// Plusieurs tickets par statut
await ticket.getBy('status', [1, 2])
```

### getByNot() — Exclure par champ (côté client)

Inverse de `getBy` — retourne tout SAUF les éléments correspondants.

```javascript
async getByNot(fieldName, value) {
  if (value === undefined || value === null || value === '') return await this.getAll()

  const all    = await this.getAll()
  const values = Array.isArray(value) ? value : [value]
  const normalized = values.map(v => String(v))

  return all.filter(item => {
    const v = item[fieldName]
    if (v === undefined || v === null) return true
    if (Array.isArray(v)) return !v.map(String).some(iv => normalized.includes(iv))
    return !normalized.includes(String(v))
  })
}
```

Exemples :

```javascript
// Tous les tickets sauf ceux fermés (status 5)
await ticket.getByNot('status', 5)

// Tous les users sauf les supprimés et inactifs
await user.getByNot('is_active', false)
```

### getIncl() — Inclure par IDs

Retourne seulement les éléments dont l'ID est dans la liste.

```javascript
async getIncl(includeIds = []) {
  const included = new Set(includeIds.map(id => Number(id)))
  const all      = await this.getAll()
  return all.filter(item => included.has(Number(item.id)))
}
```

Exemple :

```javascript
// Récupérer seulement les users 1, 5 et 12
await user.getIncl([1, 5, 12])
```

### getExcl() — Exclure par IDs

Retourne tout SAUF les éléments dont l'ID est dans la liste.

```javascript
async getExcl(excludeIds = []) {
  const excluded = new Set(excludeIds.map(id => Number(id)))
  const all      = await this.getAll()
  return all.filter(item => !excluded.has(Number(item.id)))
}
```

Exemple :

```javascript
// Tous les computers sauf ceux déjà assignés
await computer.getExcl([3, 7, 42])
```

### getByApi() — Filtrer par champ (côté serveur) ⭐ recommandé pour gros datasets

Utilise le filtre RSQL de l'API directement — plus performant que côté client.

```javascript
async getByApi(fieldName, value) {
  if (value === undefined || value === null || value === '') return []

  const values     = Array.isArray(value) ? value : [value]
  const normalized = values.map(v => String(v).trim()).filter(s => s !== '')

  if (normalized.length === 0) return []

  // RSQL : field==value ou field=in=(v1,v2)
  const filter = normalized.length === 1
    ? `${fieldName}=="${normalized[0]}"`
    : `${fieldName}=in=(${normalized.join(',')})`

  const data = await api.get(this.endpoint, { filter })
  return data.map(item => MonEntite.fromData(item))
}
```

### getByNotApi() — Exclure par champ (côté serveur)

```javascript
async getByNotApi(fieldName, value) {
  if (value === undefined || value === null || value === '') return []

  const values     = Array.isArray(value) ? value : [value]
  const normalized = values.map(v => String(v).trim()).filter(s => s !== '')

  if (normalized.length === 0) return []

  const filter = normalized.length === 1
    ? `${fieldName}!="${normalized[0]}"`
    : `${fieldName}=out=(${normalized.join(',')})`

  const data = await api.get(this.endpoint, { filter })
  return data.map(item => MonEntite.fromData(item))
}
```

---

## Étape 6 — Fonctions à ajouter selon le besoin

Ces fonctions ne sont pas obligatoires mais très utiles selon les cas.

### exists() — Vérifier si un élément existe

```javascript
async exists(id) {
  try {
    await this.getById(id)
    return true
  } catch {
    return false
  }
}
```

### count() — Compter les résultats

```javascript
async count(params = {}) {
  const data = await this.getAll({ ...params, limit: 1 })
  // GLPI retourne souvent un header X-Total-Count
  // Sinon on compte le tableau
  return Array.isArray(data) ? data.length : 0
}
```

### findOne() — Récupérer le premier résultat

```javascript
async findOne(params = {}) {
  const data = await this.getAll({ ...params, limit: 1 })
  return data.length > 0 ? data[0] : null
}
```

---

## Étape 7 — Exemple complet : entité Ticket

Voici un exemple complet appliquant toutes les étapes précédentes.

**Attributs trouvés dans le swagger** (`components.schemas.Ticket`) :

```
id              → integer, readOnly
name            → string              (titre du ticket)
content         → string              (description)
status          → integer, enum       (1=nouveau, 2=en cours, 3=en attente, 4=résolu, 5=fermé)
type            → integer, enum       (1=incident, 2=demande)
urgency         → integer, enum       (1=très basse ... 6=majeure)
priority        → integer, enum       (1=très basse ... 6=majeure)
date_creation   → string, readOnly
date_mod        → string, readOnly
itilcategory    → object, relation    → { id, name }
```

**Endpoint trouvé dans paths** : `/Assistance/Ticket`

```javascript
// entities/Ticket.js
import api from '../utils/api-v2.js'

// Constantes pour les valeurs enum
export const TICKET_STATUS = {
  NOUVEAU:     1,
  EN_COURS:    2,
  EN_ATTENTE:  3,
  RESOLU:      4,
  FERME:       5,
}

export const TICKET_TYPE = {
  INCIDENT: 1,
  DEMANDE:  2,
}

export const TICKET_URGENCY = {
  TRES_BASSE: 1,
  BASSE:      2,
  MOYENNE:    3,
  HAUTE:      4,
  TRES_HAUTE: 5,
  MAJEURE:    6,
}

class Ticket {
  endpoint = 'Assistance/Ticket'

  constructor(data = {}) {
    this.id           = data.id           ?? null   // readOnly
    this.name         = data.name         ?? ''
    this.content      = data.content      ?? ''
    this.status       = data.status       ?? TICKET_STATUS.NOUVEAU
    this.type         = data.type         ?? TICKET_TYPE.INCIDENT
    this.urgency      = data.urgency      ?? TICKET_URGENCY.MOYENNE
    this.priority     = data.priority     ?? TICKET_URGENCY.MOYENNE
    this.date_creation = data.date_creation ?? null  // readOnly
    this.date_mod     = data.date_mod     ?? null    // readOnly
    this.itilcategory = data.itilcategory ?? null    // relation { id, name }
  }

  static fromData(data) {
    const obj = Object.create(Ticket.prototype)
    Object.assign(obj, data)
    obj.endpoint = 'Assistance/Ticket'
    return obj
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async save() {
    const created = await api.post(this.endpoint, {
      name:         this.name,
      content:      this.content,
      status:       this.status,
      type:         this.type,
      urgency:      this.urgency,
      priority:     this.priority,
      itilcategory: this.itilcategory ? { id: this.itilcategory.id } : null,
    })
    return Ticket.fromData(created)
  }

  async getById(id) {
    const data = await api.get(`${this.endpoint}/${id}`)
    return Ticket.fromData(data)
  }

  async getAll(params = {}) {
    const data = await api.get(this.endpoint, params)
    return data.map(t => Ticket.fromData(t))
  }

  async update() {
    if (!this.id) throw new Error('Impossible de modifier un ticket sans ID')
    const updated = await api.patch(`${this.endpoint}/${this.id}`, {
      name:         this.name,
      content:      this.content,
      status:       this.status,
      urgency:      this.urgency,
      priority:     this.priority,
      itilcategory: this.itilcategory ? { id: this.itilcategory.id } : null,
    })
    return Ticket.fromData(updated)
  }

  async delete() {
    if (!this.id) throw new Error('Impossible de supprimer un ticket sans ID')
    await api.delete(`${this.endpoint}/${this.id}`)
  }

  // ─── Utilitaires ──────────────────────────────────────────────────────────

  async getBy(fieldName, value) {
    if (value === undefined || value === null || value === '') return []
    const all        = await this.getAll()
    const values     = Array.isArray(value) ? value : [value]
    const normalized = values.map(v => String(v))
    return all.filter(item => {
      const v = item[fieldName]
      if (v === undefined || v === null) return false
      if (Array.isArray(v)) return v.map(String).some(iv => normalized.includes(iv))
      return normalized.includes(String(v))
    })
  }

  async getByNot(fieldName, value) {
    if (value === undefined || value === null || value === '') return await this.getAll()
    const all        = await this.getAll()
    const values     = Array.isArray(value) ? value : [value]
    const normalized = values.map(v => String(v))
    return all.filter(item => {
      const v = item[fieldName]
      if (v === undefined || v === null) return true
      if (Array.isArray(v)) return !v.map(String).some(iv => normalized.includes(iv))
      return !normalized.includes(String(v))
    })
  }

  async getIncl(includeIds = []) {
    const included = new Set(includeIds.map(id => Number(id)))
    const all      = await this.getAll()
    return all.filter(item => included.has(Number(item.id)))
  }

  async getExcl(excludeIds = []) {
    const excluded = new Set(excludeIds.map(id => Number(id)))
    const all      = await this.getAll()
    return all.filter(item => !excluded.has(Number(item.id)))
  }
}

export default Ticket
```

---

## Étape 8 — Utilisation dans un composant React

```javascript
import Ticket, { TICKET_STATUS, TICKET_TYPE } from './entities/Ticket.js'

// Créer un ticket
const ticket = new Ticket({
  name:    'Le wifi ne marche pas',
  content: 'Depuis ce matin impossible de se connecter au réseau.',
  type:    TICKET_TYPE.INCIDENT,
  urgency: 3,
})
const created = await ticket.save()
console.log('Créé avec ID :', created.id)

// Lire un ticket
const fetched = await new Ticket().getById(42)

// Modifier
fetched.status = TICKET_STATUS.EN_COURS
const updated = await fetched.update()

// Supprimer
await fetched.delete()

// Tous les tickets ouverts
const openTickets = await new Ticket().getAll({
  filter: `status==${TICKET_STATUS.NOUVEAU}`,
  sort:   'date_creation:desc',
  limit:  20,
})

// Filtrer côté client par type
const incidents = await new Ticket().getBy('type', TICKET_TYPE.INCIDENT)

// Exclure certains tickets
const filtered = await new Ticket().getExcl([1, 2, 3])
```

---

## Résumé des étapes

```
1. swagger.json → paths        → trouver l'endpoint
2. swagger.json → schemas      → lister les attributs
3. Identifier readOnly / writeOnly / relations
4. Créer le constructeur avec les attributs
5. Écrire toCreate() sans les readOnly
6. Écrire toUpdate() sans les readOnly et writeOnly
7. Implémenter les méthodes CRUD
8. Ajouter les utilitaires getBy, getByNot, getIncl, getExcl
9. Ajouter les constantes enum si besoin
```

---

## Ce que je recommande d'ajouter à toutes tes entités

| Méthode | Pourquoi |
|---------|----------|
| `static fromData(data)` | Obligatoire — reconstruire depuis l'API |
| `save()` | Obligatoire — créer |
| `getById(id)` | Obligatoire — lire un |
| `getAll(params)` | Obligatoire — lire tous |
| `update()` | Obligatoire — modifier |
| `delete()` | Obligatoire — supprimer |
| `getBy(field, value)` | Très utile — filtrer par champ |
| `getByNot(field, value)` | Utile — exclure par champ |
| `getIncl(ids)` | Utile — filtrer par liste d'IDs |
| `getExcl(ids)` | Utile — exclure par liste d'IDs |
| `getByApi(field, value)` | Recommandé si beaucoup de données |
| `findOne(params)` | Pratique — premier résultat |
| `exists(id)` | Pratique — vérifier existence |
