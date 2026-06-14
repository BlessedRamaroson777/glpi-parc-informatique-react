# 🧱 Entités — Guide Complet

Les "entités" sont des **classes JavaScript** dans `src/common/entities/` qui représentent les objets métier de GLPI (Ticket, Computer, User, Monitor, TicketCost...). Elles encapsulent les données et les opérations CRUD.

## 1. Anatomie d'une entité

Chaque entité suit le même pattern. Voici la structure complète :

```javascript
import apiV2 from '../utils/apiV2.jsx';

class MonEntite {
    // L'endpoint API pour cette entité
    endpoint = 'MonNamespace/MonEntite'    // ou static ENDPOINT = '...'

    // ──── CONSTRUCTEUR ────────────────────────────────────
    constructor(data = {}) {
        this.id = data.id ?? null;

        // Champs simples
        this.name    = data.name    ?? '';
        this.comment = data.comment ?? '';

        // Booleans
        this.is_deleted  = data.is_deleted  ?? false;
        this.is_template = data.is_template ?? false;

        // Dates (toujours null par défaut)
        this.date_creation = data.date_creation ?? null;
        this.date_mod      = data.date_mod      ?? null;

        // Valeurs numériques
        this.cost = Number(data.cost ?? 0);

        // ⭐ RELATIONS (objets ou null)
        this.entity   = data.entity   ?? null;   // { id: 5, name: "Mon entité" }
        this.location = data.location ?? null;   // { id: 12 }
        this.user     = data.user     ?? null;   // { id: 3, username: "jean" }

        // ⭐ RELATIONS (tableaux)
        this.group = data.group ?? [];           // [{ id: 1 }, { id: 2 }]
    }

    // ──── FACTORY ─────────────────────────────────────────
    static fromData(data) {
        const obj = Object.create(MonEntite.prototype);
        Object.assign(obj, data);
        obj.endpoint = 'MonNamespace/MonEntite';
        return obj;
    }

    // ──── PAYLOAD (ce qu'on envoie à l'API) ───────────────
    _toPayload() {
        const payload = {
            name: this.name,
            comment: this.comment,
            cost: Number(this.cost),
        };

        // ⭐ RELATIONS : toujours vérifier puis envoyer { id: Number }
        if (this.entity?.id)   payload.entity   = { id: Number(this.entity.id) };
        if (this.location?.id) payload.location  = { id: Number(this.location.id) };
        if (this.user?.id)     payload.user      = { id: Number(this.user.id) };

        // ⭐ RELATIONS TABLEAUX
        if (this.group?.length) {
            payload.group = this.group.map(g => ({ id: Number(g.id) }));
        }

        return payload;
    }

    // ──── CRUD ────────────────────────────────────────────
    async save()   { /* POST   → créer  */ }
    async update() { /* PATCH  → modifier */ }
    async delete() { /* DELETE → supprimer */ }

    // ──── STATIC CRUD ─────────────────────────────────────
    static async getById(id)       { /* GET /endpoint/id     */ }
    static async getAll(params)    { /* GET /endpoint        */ }

    // ──── VALIDATION ──────────────────────────────────────
    validate() {
        const errors = [];
        if (!this.name?.trim()) errors.push('Le nom est requis');
        return errors;  // Tableau vide = pas d'erreur
    }
}

export default MonEntite;
```

## 2. Les relations (associations) — LE point crucial

### Qu'est-ce qu'une relation ?

Un `TicketCost` est lié à un `Ticket`. Un `Computer` est lié à un `User`, une `Location`, un `Manufacturer`, etc.

### Comment ça marche dans le code

Dans le **constructeur**, les relations sont stockées comme des **objets** (pas comme des ID simples) :

```javascript
// Dans le constructeur
this.ticket = data.ticket ?? null;      // → { id: 42, name: "..." }
this.user   = data.user   ?? null;      // → { id: 5, username: "jean" }
this.group  = data.group  ?? [];        // → [{ id: 1 }, { id: 2 }]
```

### Le piège n°1 : Créer une association

```javascript
// ❌ FAUX — L'API ne comprendra pas
monCout.ticket = 42;

// ❌ FAUX — _toPayload() essaiera de lire 42.id → undefined
// → L'association ne sera pas envoyée à l'API

// ✅ VRAI — Toujours un objet avec un id
monCout.ticket = { id: 42 };
```

### Le piège n°2 : Lire une association

Quand vous recevez des données de l'API, les relations peuvent être :
- Un objet complet : `{ id: 42, name: "Ticket X" }`
- Juste un ID : `42`
- null

L'entité `Ticket` gère ça avec `_normalizeId()` :

```javascript
_normalizeId(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') return value.id ?? null;  // { id: 42 } → 42
    return value;                                             // 42 → 42
}
```

### Comment _toPayload() gère les relations

```javascript
_toPayload() {
    const payload = { name: this.name };

    // On vérifie que la relation existe ET qu'elle a un id
    if (this.entity?.id) {
        payload.entity = { id: Number(this.entity.id) };
    }
    // Si this.entity est null → on n'envoie pas de clé entity
    // Si this.entity = { id: 5 } → on envoie entity: { id: 5 }

    return payload;
}
```

## 3. Les deux styles d'entités

### Style A : Méthodes d'instance (TicketCost, User, Monitor, TicketFollowup)

```javascript
// On crée une instance vide pour appeler les méthodes
const tc = new TicketCost();
const tous = await tc.getAll();
const unCout = await tc.getById(5);
const parTicket = await tc.getByTicket(42);
```

### Style B : Méthodes statiques (Computer)

```javascript
// On appelle directement sur la classe, pas besoin d'instance
const tous = await Computer.getAll();
const unPC = await Computer.getById(5);
const pcUser = await Computer.getByUser(3);
```

### Comment savoir lequel c'est ?

- Si les méthodes sont définies avec `static` → Style B
- Si les méthodes sont définies sans `static` → Style A
- Regardez le fichier de l'entité pour savoir

## 4. Différences de format d'envoi (POST/PUT)

### Certaines entités enveloppent dans `{ input: ... }`

```javascript
// TicketCost utilise { input: payload }
async save() {
    const created = await apiV2.post(this.endpoint, { input: this._toCreatePayload() });
    //                                                ↑ enveloppé
}

// Computer envoie le payload directement
async save() {
    const data = await apiV2.post(Computer.ENDPOINT, this._toPayload());
    //                                                ↑ pas enveloppé
}
```

Cela dépend de l'endpoint GLPI utilisé. Les endpoints `/apirest.php/...` (v1-style) demandent `{ input: ... }`. Les endpoints `/api.php/v2.3/...` (v2-style) prennent le payload directement.

## 5. Différences de verbe HTTP pour les modifications

```javascript
// Computer utilise PATCH pour modifier
await apiV2.patch(`${Computer.ENDPOINT}/${this.id}`, this._toPayload());

// TicketCost utilise PUT pour modifier  
await apiV2.put(`${this.endpoint}/${this.id}`, { input: this._toPayload() });
```

| Verbe | Signification | Utilisé par |
|-------|--------------|-------------|
| PATCH | Modification partielle | Computer, Monitor, User, TicketFollowup |
| PUT | Remplacement complet | TicketCost |

## 6. La relation polymorphique (TicketFollowup, TicketItem)

Certaines entités GLPI utilisent un système polymorphique avec `itemtype` + `items_id` au lieu d'une simple clé étrangère.

```javascript
// Un Followup est lié à un Ticket via :
// - itemtype = "Ticket"
// - items_id = 42
// au lieu de : tickets_id = 42

// Dans le constructeur de TicketFollowup :
this.ticket = data.ticket ?? (
    data.items_id && data.itemtype === 'Ticket' 
        ? { id: data.items_id } 
        : null
);
```

Pour créer un Followup, il faut envoyer les deux champs :
```javascript
_toCreatePayload() {
    const payload = this._toPayload();
    payload.itemtype = 'Ticket';
    payload.items_id = Number(this.ticket.id);
    return payload;
}
```

Pour filtrer par ticket, on utilise les deux champs dans le filtre RSQL :
```javascript
async getByTicket(ticketId) {
    const data = await apiV2.get(this.endpoint, { 
        filter: `items_id==${ticketId};itemtype==Ticket` 
    });
}
```
