# GLPI 11 — Implémenter un dashboard Assets & Tickets

> Objectif : afficher le nombre total d'assets (par type) et de tickets (par type/statut)  
> API utilisée : V2 exclusivement  
> Auth : OAuth2 Bearer

---

## Architecture générale

```
Dashboard
├── Bloc Assets
│   ├── Total global
│   └── Détail par type (Computer, Monitor, Printer…)
└── Bloc Tickets
    ├── Total global
    ├── Détail par type (Incident / Demande)
    └── Détail par statut (Nouveau, En cours, Résolu…)
```

Deux stratégies possibles selon le besoin :

| Stratégie | Appels | Avantage | Inconvénient |
|---|---|---|---|
| **A — `?limit=0`** | N appels (1 par type) | Filtres RSQL libres | Plusieurs requêtes |
| **B — `Stat/Ticket/Global`** | 1 appel | Tout en un seul JSON | Pas de filtre custom |

Recommandation : **Stratégie A pour les assets** (pas d'endpoint stat dédié), **Stratégie B pour les tickets** (plus simple et complet).

---

## Partie 1 — Assets

### Comment lire le total

L'API V2 retourne le nombre total dans le **header HTTP** `Content-Range`, pas dans le body.

```
Content-Range: 0-0/9
                   ^
                   total
```

Avec `?limit=0` le body est vide — seul le header compte.

---

### Endpoints à appeler

#### Total global

```http
GET /api.php/v2/Assets/Global?limit=0
Authorization: Bearer <token>
```

```
→ Content-Range: 0-0/10
```

---

#### Par type — un appel par itemtype

```http
GET /api.php/v2/Assets/Computer?limit=0
→ Content-Range: 0-0/9

GET /api.php/v2/Assets/Monitor?limit=0
→ Content-Range: 0-0/1

GET /api.php/v2/Assets/Printer?limit=0
→ Content-Range: 0-0/0

GET /api.php/v2/Assets/Phone?limit=0
→ Content-Range: 0-0/0

GET /api.php/v2/Assets/NetworkEquipment?limit=0
→ Content-Range: 0-0/0

GET /api.php/v2/Assets/Software?limit=0
→ Content-Range: 0-0/0

GET /api.php/v2/Assets/Peripheral?limit=0
→ Content-Range: 0-0/0
```

---

#### Par statut (filtre RSQL combiné au type)

```http
GET /api.php/v2/Assets/Computer?filter=states_id==1&limit=0
→ Content-Range: 0-0/8    (En production)

GET /api.php/v2/Assets/Computer?filter=states_id==2&limit=0
→ Content-Range: 0-0/1    (Maintenance)

GET /api.php/v2/Assets/Computer?filter=states_id==3&limit=0
→ Content-Range: 0-0/0    (En stock)
```

Valeurs `states_id` courantes (dépendent de ta config GLPI) :

| states_id | Libellé typique |
|---|---|
| 1 | En production |
| 2 | Maintenance |
| 3 | En stock / Magasin |
| 4 | En panne |
| 5 | Hors service |

> Pour connaître les IDs exacts de tes états : `GET /api.php/v2/Dropdowns/State`

---

### Code — récupérer le total depuis Content-Range

```javascript
async function countAssets(type, token, filter = '') {
  const url = `/api.php/v2/Assets/${type}?limit=0${filter ? `&filter=${filter}` : ''}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const range = res.headers.get('Content-Range'); // "0-0/9"
  return parseInt(range.split('/')[1]);
}

// Exemples d'utilisation
const totalComputers    = await countAssets('Computer', token);
const totalMonitors     = await countAssets('Monitor', token);
const computersEnProd   = await countAssets('Computer', token, 'states_id==1');
const computersEnPanne  = await countAssets('Computer', token, 'states_id==4');
```

---

### Appel groupé — tous les types en parallèle

```javascript
const ASSET_TYPES = [
  'Computer', 'Monitor', 'Printer',
  'Phone', 'NetworkEquipment', 'Software', 'Peripheral'
];

async function getAllAssetCounts(token) {
  const results = await Promise.all(
    ASSET_TYPES.map(async (type) => {
      const count = await countAssets(type, token);
      return { type, count };
    })
  );

  const total = results.reduce((sum, r) => sum + r.count, 0);

  return { total, byType: results };
}
```

**Résultat :**
```json
{
  "total": 10,
  "byType": [
    { "type": "Computer", "count": 9 },
    { "type": "Monitor",  "count": 1 },
    { "type": "Printer",  "count": 0 },
    { "type": "Phone",    "count": 0 }
  ]
}
```

---

## Partie 2 — Tickets

### Stratégie B recommandée — un seul appel

```http
GET /api.php/v2/Assistance/Stat/Ticket/Global
Authorization: Bearer <token>
```

**Réponse complète :**
```json
{
  "total": 2,
  "by_status": {
    "new":      2,
    "assigned": 0,
    "planned":  0,
    "waiting":  0,
    "solved":   0,
    "closed":   0
  },
  "by_type": {
    "incident": 2,
    "request":  0
  },
  "by_priority": {
    "very_low":  0,
    "low":       0,
    "medium":    2,
    "high":      0,
    "very_high": 0
  }
}
```

Tout est dans ce seul objet — aucun calcul supplémentaire nécessaire.

---

### Stratégie A — filtres RSQL (si besoin de filtres avancés)

Utile si tu veux filtrer par entité, par groupe, par date, par technicien, etc.

#### Par type

```http
GET /api.php/v2/Assistance/Ticket?filter=type==1&limit=0
→ Content-Range: 0-0/2    (Incidents)

GET /api.php/v2/Assistance/Ticket?filter=type==2&limit=0
→ Content-Range: 0-0/0    (Demandes)
```

#### Par statut

```http
GET /api.php/v2/Assistance/Ticket?filter=status==1&limit=0
→ Content-Range: 0-0/2    (Nouveau)

GET /api.php/v2/Assistance/Ticket?filter=status==2&limit=0
→ Content-Range: 0-0/0    (En cours attribué)

GET /api.php/v2/Assistance/Ticket?filter=status==3&limit=0
→ Content-Range: 0-0/0    (En cours planifié)

GET /api.php/v2/Assistance/Ticket?filter=status==4&limit=0
→ Content-Range: 0-0/0    (En attente)

GET /api.php/v2/Assistance/Ticket?filter=status==5&limit=0
→ Content-Range: 0-0/0    (Résolu)

GET /api.php/v2/Assistance/Ticket?filter=status==6&limit=0
→ Content-Range: 0-0/0    (Clos)
```

#### Filtres combinés (RSQL)

```http
# Incidents nouveaux seulement
GET /api.php/v2/Assistance/Ticket?filter=type==1;status==1&limit=0

# Tickets haute priorité non résolus
GET /api.php/v2/Assistance/Ticket?filter=priority==4;status=out=(5,6)&limit=0

# Tickets créés depuis le 01/06/2026
GET /api.php/v2/Assistance/Ticket?filter=date_creation=gt=2026-06-01&limit=0
```

Opérateurs RSQL disponibles :

| Opérateur | Signification | Exemple |
|---|---|---|
| `==` | Égal | `type==1` |
| `!=` | Différent | `status!=6` |
| `=in=` | Dans la liste | `status=in=(1,2)` |
| `=out=` | Hors liste | `status=out=(5,6)` |
| `=gt=` | Supérieur à | `date_creation=gt=2026-01-01` |
| `=lt=` | Inférieur à | `priority=lt=4` |
| `;` | ET logique | `type==1;status==1` |
| `,` | OU logique | `status==5,status==6` |

---

### Code — récupérer les stats tickets

```javascript
// Stratégie B : un seul appel, tout dedans
async function getTicketStats(token) {
  const res = await fetch('/api.php/v2/Assistance/Stat/Ticket/Global', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

// Stratégie A : filtres personnalisés
async function countTickets(token, filter = '') {
  const url = `/api.php/v2/Assistance/Ticket?limit=0${filter ? `&filter=${filter}` : ''}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const range = res.headers.get('Content-Range');
  return parseInt(range.split('/')[1]);
}

// Exemple stratégie A — tous les statuts en parallèle
async function getTicketCountsByStatus(token) {
  const STATUS = { new: 1, assigned: 2, planned: 3, waiting: 4, solved: 5, closed: 6 };
  const results = await Promise.all(
    Object.entries(STATUS).map(async ([label, id]) => ({
      status: label,
      count: await countTickets(token, `status==${id}`)
    }))
  );
  return results;
}
```

---

## Partie 3 — Initialisation complète du dashboard

```javascript
async function initDashboard(token) {
  const [assets, tickets] = await Promise.all([
    getAllAssetCounts(token),
    getTicketStats(token)
  ]);

  return {
    assets: {
      total: assets.total,
      byType: assets.byType
    },
    tickets: {
      total: tickets.total,
      byStatus: tickets.by_status,
      byType: tickets.by_type,
      byPriority: tickets.by_priority
    }
  };
}
```

**Résultat final (avec les données du fichier import juin 2026) :**
```json
{
  "assets": {
    "total": 10,
    "byType": [
      { "type": "Computer", "count": 9 },
      { "type": "Monitor",  "count": 1 }
    ]
  },
  "tickets": {
    "total": 2,
    "byStatus": { "new": 2, "assigned": 0, "solved": 0, "closed": 0 },
    "byType":   { "incident": 2, "request": 0 },
    "byPriority": { "medium": 2 }
  }
}
```

---

## Partie 4 — Gestion des erreurs et bonnes pratiques

### Erreurs fréquentes

| Code HTTP | Cause | Solution |
|---|---|---|
| `401` | Token expiré (durée par défaut : 1h) | Refaire `POST /token` |
| `403` | Scope OAuth insuffisant | Ajouter `api` au scope |
| `404` | Endpoint mal orthographié | Vérifier la casse (Assets/Computer, pas assets/computer) |
| `206` | Réponse paginée normale | C'est attendu — lire Content-Range |

### Wrapper avec refresh automatique du token

```javascript
class GlpiClient {
  constructor(baseUrl, clientId, clientSecret, username, password) {
    this.baseUrl = baseUrl;
    this.creds = { clientId, clientSecret, username, password };
    this.token = null;
    this.tokenExpiry = null;
  }

  async getToken() {
    if (this.token && Date.now() < this.tokenExpiry) return this.token;

    const res = await fetch(`${this.baseUrl}/api.php/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type:    'password',
        client_id:     this.creds.clientId,
        client_secret: this.creds.clientSecret,
        username:      this.creds.username,
        password:      this.creds.password,
        scope:         'api'
      })
    });

    const data = await res.json();
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // 60s de marge
    return this.token;
  }

  async get(path) {
    const token = await this.getToken();
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res;
  }

  async count(path) {
    const res = await this.get(`${path}?limit=0`);
    const range = res.headers.get('Content-Range');
    return parseInt(range.split('/')[1]);
  }
}

// Usage
const glpi = new GlpiClient(
  'http://localhost:8081',
  'client_id', 'client_secret',
  'glpi', 'glpi'
);

const totalComputers = await glpi.count('/api.php/v2/Assets/Computer');
const ticketStats    = await (await glpi.get('/api.php/v2/Assistance/Stat/Ticket/Global')).json();
```

---

## Résumé — quoi utiliser pour quoi

| Besoin dashboard | Endpoint | Méthode | Où lire le résultat |
|---|---|---|---|
| Total tous assets | `GET /Assets/Global?limit=0` | V2 | Header `Content-Range` |
| Total par type asset | `GET /Assets/{Type}?limit=0` | V2 | Header `Content-Range` |
| Assets par statut | `GET /Assets/{Type}?filter=states_id==X&limit=0` | V2 RSQL | Header `Content-Range` |
| Tickets — tout en un | `GET /Assistance/Stat/Ticket/Global` | V2 | Body JSON |
| Tickets par statut/type | `GET /Assistance/Ticket?filter=...&limit=0` | V2 RSQL | Header `Content-Range` |
| Tickets filtres avancés | `GET /Assistance/Ticket?filter=A;B&limit=0` | V2 RSQL | Header `Content-Range` |
