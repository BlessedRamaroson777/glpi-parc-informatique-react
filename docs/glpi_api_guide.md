# GLPI 11 — Guide API V1 / V2

> Version GLPI : 11.0.7  
> Base URL V1 : `http://<host>/apirest.php`  
> Base URL V2 : `http://<host>/api.php/v2`

---

## 1. Différences fondamentales V1 / V2

| Aspect | V1 (legacy) | V2 (high-level) |
|---|---|---|
| Authentification | `Session-Token` via `GET /initSession` | OAuth2 `Bearer` via `POST /token` |
| Style | REST générique `/:itemtype/:id` | REST structuré par domaine `/Assets/`, `/Assistance/` |
| Body création | `{ "input": { ... } }` | `{ ... }` directement |
| Body update | `{ "input": { "id": x, ... } }` | `{ ... }` directement |
| Suppression définitive | `?force_purge=true` | `?force=true` |
| Pagination | `range=0-49` | `start=0&limit=50` |
| Filtrage | `searchText[field]=value` | RSQL : `filter=field=="value"` |
| Nombre d'endpoints | ~50 patterns | ~2 454 endpoints |

Les deux APIs coexistent sur le même serveur et sont **totalement indépendantes**. On peut utiliser l'une sans l'autre — sauf pour les cas décrits ci-dessous.

---

## 2. Dépendances entre V1 et V2

### V1 seule peut faire

| Fonctionnalité | Endpoint V1 | Pourquoi V2 ne suffit pas |
|---|---|---|
| **Lier un asset à un ticket** | `POST /Item_Ticket` | V2 n'expose pas cet endpoint |
| Accès données plugins (ex: Fields) | `GET /PluginFields{Datatable}/` | Non implémenté en V2 |
| Recherche avancée multi-critères | `GET /search/:itemtype` | RSQL V2 moins puissant sur combinaisons complexes |
| Session bas niveau | `GET /getFullSession`, `GET /getGlpiConfig` | Pas d'équivalent V2 |
| Changer profil/entité active | `POST /changeActiveProfile` | Pas d'équivalent V2 |

### V2 seule peut faire

| Fonctionnalité | Endpoint V2 |
|---|---|
| Statistiques helpdesk | `GET /Assistance/Stat/Ticket/Global` |
| Composants matériels (RAM, CPU, GPU…) | `GET /Components/Memory`, `/Processor`, etc. |
| Projets complets avec tâches/coûts | `GET /Project/{id}/Task`, `/Cost` |
| Agents d'inventaire SNMP | `GET /Inventory/Agent` |
| SLA / OLA | `GET /Setup/SLA`, `/Setup/OLA` |
| Webhooks, OAuth clients | `GET /Setup/Webhook`, `/Setup/OAuthClient` |
| Règles (tickets, assets…) | `GET /Rule/Collection/{type}/Rule` |
| Notifications et templates | `GET /Notifications/Notification` |
| GraphQL (lecture seule) | `POST /GraphQL/` |
| Assets custom | `GET /Assets/Custom/{itemtype}` |

### Disponibles sur les deux

CRUD de base sur : Tickets, Changes, Problems, Assets (Computer, Monitor, Printer, Phone, NetworkEquipment, Software), Utilisateurs, Groupes, Entités, Profils, Documents, Dropdowns (Location, State, Manufacturer, ITILCategory…)

---

## 3. Authentification

### V2 — OAuth2 (recommandé pour tout le reste)

```http
POST /api.php/token
Content-Type: application/json

{
  "grant_type": "password",
  "client_id": "<client_id>",
  "client_secret": "<client_secret>",
  "username": "glpi",
  "password": "glpi",
  "scope": "api"
}
```

**Réponse :**
```json
{
  "token_type": "Bearer",
  "expires_in": 3600,
  "access_token": "eyJ..."
}
```

Utiliser ensuite : `Authorization: Bearer eyJ...`

---

### V1 — Session-Token (uniquement pour Item_Ticket et plugins)

```http
GET /apirest.php/initSession
Authorization: Basic Z2xwaTpnbHBp
App-Token: <app_token>
```

**Réponse :**
```json
{ "session_token": "83af7e620c83a50a18d3eac2f6ed05a3ca0bea62" }
```

Utiliser ensuite : `Session-Token: 83af7e620c83a50a18d3eac2f6ed05a3ca0bea62`

---

## 4. Endpoints — Assets

### Créer un asset (V2)

```http
POST /api.php/v2/Assets/Computer
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "name": "PC-ADM-001",
  "serial": "SN123456",
  "entities_id": 0,
  "states_id": 1,
  "locations_id": 2,
  "manufacturers_id": 1,
  "computermodels_id": 1,
  "users_id": 4
}
```

**Réponse :** `201 Created` + `{ "id": 42, ... }`

### Compter les assets par type (V2)

```http
GET /api.php/v2/Assets/Computer?limit=0
→ Header réponse : Content-Range: 0-0/9

GET /api.php/v2/Assets/Monitor?limit=0
→ Header réponse : Content-Range: 0-0/1
```

> Le total est dans le **header HTTP** `Content-Range`, pas dans le body.

### Filtrer par statut (V2 RSQL)

```http
GET /api.php/v2/Assets/Computer?filter=states_id==1&limit=0
→ Content-Range: 0-0/8   (en production)

GET /api.php/v2/Assets/Computer?filter=states_id==2&limit=0
→ Content-Range: 0-0/1   (maintenance)
```

---

## 5. Endpoints — Tickets

### Créer un ticket (V2)

```http
POST /api.php/v2/Assistance/Ticket
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "name": "PC ne démarre plus",
  "content": "Description du problème",
  "type": 1,
  "urgency": 3,
  "priority": 3,
  "status": 1,
  "entities_id": 0
}
```

**Réponse :** `201 Created` + `{ "id": 1, ... }`

### Valeurs de référence

| Champ | Valeur | Signification |
|---|---|---|
| `type` | 1 | Incident |
| `type` | 2 | Demande |
| `status` | 1 | Nouveau |
| `status` | 2 | En cours (attribué) |
| `status` | 4 | En attente |
| `status` | 5 | Résolu |
| `status` | 6 | Clos |
| `urgency/priority` | 1–5 | Très basse → Très haute |

### Ajouter un suivi (V2)

```http
POST /api.php/v2/Assistance/Ticket/1/Timeline/Followup

{
  "content": "Intervention en cours",
  "is_private": 0
}
```

### Ajouter un coût (V2)

```http
POST /api.php/v2/Assistance/Ticket/1/Cost

{
  "name": "Coût intervention",
  "actiontime": 600,
  "cost_time": 8.7,
  "cost_fixed": 109
}
```

---

## 6. Lier un asset à un ticket — V1 obligatoire

```http
POST /apirest.php/Item_Ticket
Session-Token: 83af7e620c83a50a18d3eac2f6ed05a3ca0bea62
App-Token: <app_token>
Content-Type: application/json

{
  "input": {
    "tickets_id": 1,
    "itemtype": "Computer",
    "items_id": 42
  }
}
```

**Réponse :** `201 Created` + `{ "id": 7 }`

### Lire les assets liés à un ticket (V1)

```http
GET /apirest.php/Item_Ticket?searchText[tickets_id]=1&expand_dropdowns=true
```

### Valeurs itemtype disponibles

| itemtype | Description |
|---|---|
| `Computer` | Ordinateur |
| `Monitor` | Moniteur |
| `Printer` | Imprimante |
| `Phone` | Téléphone |
| `NetworkEquipment` | Équipement réseau |
| `Peripheral` | Périphérique |
| `Software` | Logiciel |

---

## 7. Dashboard — compter assets et tickets

### Nombre d'assets par type

Faire un appel `?limit=0` par type et lire `Content-Range` dans les headers :

```http
GET /api.php/v2/Assets/Computer?limit=0          → total computers
GET /api.php/v2/Assets/Monitor?limit=0           → total monitors
GET /api.php/v2/Assets/Printer?limit=0           → total printers
GET /api.php/v2/Assets/Phone?limit=0             → total phones
GET /api.php/v2/Assets/NetworkEquipment?limit=0  → total network eq.
GET /api.php/v2/Assets/Software?limit=0          → total software
```

Exemple de lecture en JavaScript :
```javascript
const res = await fetch('/api.php/v2/Assets/Computer?limit=0', {
  headers: { Authorization: `Bearer ${token}` }
});
const range = res.headers.get('Content-Range'); // "0-0/9"
const total = parseInt(range.split('/')[1]);     // 9
```

### Nombre de tickets — endpoint stats dédié (V2)

```http
GET /api.php/v2/Assistance/Stat/Ticket/Global
```

**Réponse :**
```json
{
  "total": 2,
  "by_status": {
    "new": 2,
    "assigned": 0,
    "waiting": 0,
    "solved": 0,
    "closed": 0
  },
  "by_type": {
    "incident": 2,
    "request": 0
  },
  "by_priority": {
    "very_low": 0,
    "low": 0,
    "medium": 2,
    "high": 0,
    "very_high": 0
  }
}
```

### Nombre de tickets — filtrage RSQL (V2, pour filtres avancés)

```http
GET /api.php/v2/Assistance/Ticket?filter=type==1&limit=0   → incidents
GET /api.php/v2/Assistance/Ticket?filter=type==2&limit=0   → demandes
GET /api.php/v2/Assistance/Ticket?filter=status==1&limit=0 → nouveaux
GET /api.php/v2/Assistance/Ticket?filter=status==5&limit=0 → résolus
```

---

## 8. Séquence d'import complète (exemple fichier juin 2026)

```
1. Auth V2      POST /api.php/token
                → access_token

2. Assets       POST /api.php/v2/Assets/Computer  (×9)
                POST /api.php/v2/Assets/Monitor   (×1)
                → récupérer les IDs retournés

3. Tickets      POST /api.php/v2/Assistance/Ticket (×2)
                → récupérer les IDs ticket 1 et ticket 2

4. Auth V1      GET /apirest.php/initSession
                → session_token

5. Liaisons     POST /apirest.php/Item_Ticket      (×3)
                ticket 1 → Computer (PC-ADM-001)
                ticket 2 → Computer (PC-ADM-001)
                ticket 2 → Monitor  (MN-FORM-002)

6. Coûts        POST /api.php/v2/Assistance/Ticket/1/Cost  (×2)
                coût fixe : 109
                durée 600s + time_cost 8.7 + fixed_cost 50

7. Fermeture    GET /apirest.php/killSession
```

**Total : 17 appels — 14 en V2, 3 en V1**

---

## 9. Codes d'erreur fréquents

| Code | API | Description |
|---|---|---|
| `ERROR_SESSION_TOKEN_INVALID` | V1 | Session expirée → refaire initSession |
| `ERROR_SESSION_TOKEN_MISSING` | V1 | Header Session-Token absent |
| `ERROR_ITEM_NOT_FOUND` | V1/V2 | L'item demandé n'existe pas |
| `ERROR_RIGHT_MISSING` | V1/V2 | Droits insuffisants |
| `ERROR_GLPI_ADD` | V1 | Erreur création (voir logs GLPI) |
| `401 Unauthenticated` | V2 | Token Bearer manquant ou expiré |
| `403 Forbidden` | V2 | Scope OAuth insuffisant |

---

## 10. Règle de décision rapide

```
Lier asset ↔ ticket          → V1 obligatoire (Item_Ticket)
Accès données plugins        → V1 obligatoire
Statistiques / dashboard     → V2 (Stat/Ticket/Global ou ?limit=0)
CRUD tickets, assets, users  → V2
Composants, projets, règles  → V2
Tout le reste                → V2 par défaut
```
