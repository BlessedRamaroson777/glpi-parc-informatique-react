# 📡 GLPI — Endpoints et Filtres RSQL

## 1. Tous les endpoints utilisés dans le projet

### API v2 (apiV2) — Endpoints modernes

| Catégorie | Endpoint | Opérations | Utilisé dans |
|-----------|----------|------------|-------------|
| **Tickets** | `/api.php/v2.3/Assistance/Ticket` | GET, POST, PATCH, DELETE | ticketService.jsx |
| **Coûts** | `/api.php/v2.3/Assistance/Ticket/:id/Cost` | GET | TicketDetail.jsx |
| **Followups** | `Assistance/ITILFollowup` | GET, POST, PATCH, DELETE | TicketFollowup.jsx |
| **Computers** | `Assets/Computer` | GET, POST, PATCH, DELETE | Computer.jsx |
| **Monitors** | `Assets/Monitor` | GET, POST, PATCH, DELETE | Monitor.jsx |
| **Users** | `Administration/User` | GET, POST, PATCH, DELETE | User.jsx |
| **TicketCost** | `/apirest.php/TicketCost` | GET, POST, PUT, DELETE | TicketCost.jsx |
| **Item_Ticket** | `Support/Ticket_Item` | GET, POST, PATCH, DELETE | TicketItem.jsx (v2) |

### API v1 (apiV1) — Endpoints legacy

| Catégorie | Endpoint | Opérations | Utilisé dans |
|-----------|----------|------------|-------------|
| **Recherche** | `search/Ticket` | GET | ticketService.jsx |
| **Items liés** | `Item_Ticket` | GET | ticketService.jsx |
| **Détails d'un item** | `Computer/:id`, `Monitor/:id`, etc. | GET | TicketDetail.jsx |
| **Session** | `initSession`, `killSession` | POST, GET | authService.jsx |
| **Acteurs ticket** | `Ticket_User` | POST | CreateTicket.jsx |
| **Item_Ticket** | `Ticket_Item` | GET, POST, PUT, DELETE | TicketItem.jsx (v1) |

## 2. Format des requêtes et réponses

### GET — Récupérer une liste

```
GET /api.php/v2.3/Assistance/Ticket?start=0&limit=999
Authorization: Bearer <token>
Accept: application/json
```

**Réponse :** Un tableau JSON
```json
[
    { "id": 1, "name": "Ticket 1", "status": 1, ... },
    { "id": 2, "name": "Ticket 2", "status": 2, ... }
]
```

**Ou un objet avec data :**
```json
{ "data": [{ "id": 1, ... }] }
```

### GET — Récupérer un élément

```
GET /api.php/v2.3/Assistance/Ticket/42
```

**Réponse :** Un seul objet JSON
```json
{ "id": 42, "name": "Panne écran", "status": 2, "team": [...] }
```

### POST — Créer

```
POST /api.php/v2.3/Assistance/Ticket
Content-Type: application/json

{
    "name": "Nouveau ticket",
    "content": "Description...",
    "status": 1,
    "type": 1
}
```

**Réponse :** L'objet créé avec son ID
```json
{ "id": 43, "name": "Nouveau ticket", ... }
```

### PATCH — Modifier partiellement

```
PATCH /api.php/v2.3/Assistance/Ticket/42
Content-Type: application/json

{
    "status": 6
}
```

### DELETE — Supprimer

```
DELETE /api.php/v2.3/Assistance/Ticket/42           ← Met à la corbeille
DELETE /api.php/v2.3/Assistance/Ticket/42?purge=true ← Suppression définitive
```

## 3. Filtres RSQL — Filtrer les résultats côté serveur

GLPI v2 supporte les filtres RSQL via le paramètre `filter`.

### Syntaxe de base

```
filter=champ==valeur          →  Égal à
filter=champ!=valeur          →  Différent de
filter=champ=gt=valeur        →  Supérieur à (greater than)
filter=champ=lt=valeur        →  Inférieur à (less than)
filter=champ=ge=valeur        →  Supérieur ou égal (greater or equal)
filter=champ=le=valeur        →  Inférieur ou égal (less or equal)
filter=champ=in=(v1,v2,v3)   →  Dans la liste
filter=champ=out=(v1,v2,v3)  →  Pas dans la liste
filter=champ=*texte*          →  Contient (wildcard)
```

### Combinaisons

```
;  →  ET (AND)
,  →  OU (OR)

// Exemples :
filter=status==1;type==2          →  status=1 ET type=2
filter=status==1,status==2        →  status=1 OU status=2
```

### Exemples concrets utilisés dans le projet

```javascript
// Filtrer par statut
await apiV2.get(endpoint, { filter: "status.id==1" });

// Filtrer par utilisateur
await Computer.getAll({ filter: `user.id==${userId}` });

// Filtrer par manufacturer
await Computer.getAll({ filter: `manufacturer.id==${manufacturerId}` });

// Filtrer par location  
await Monitor.getAll({ filter: `location.id==${locationId}` });

// Rechercher par nom (wildcard)
await monitor.getAll({ filter: `name=*écran*` });

// Filtrer les actifs seulement
await user.getAll({ filter: "is_active==true" });

// Filtrer les supprimés
await user.getAll({ filter: "is_deleted==true" });

// Filtrer les users par type d'auth
await user.getAll({ filter: `authtype==${USER_AUTHTYPE.LDAP}` });

// Combinaison AND : Followups du ticket 42
await apiV2.get(endpoint, { filter: `items_id==42;itemtype==Ticket` });

// Filtrer par liste d'IDs (IN)
await user.getAll({ filter: `id=in=(1,5,12,20)` });

// Filtrer en excluant des IDs (NOT IN)
await user.getAll({ filter: `id=out=(3,7)` });

// Rechercher par nom (OU multiple)
await user.getAll({ 
    filter: `username==*jean*;realname==*jean*,firstname==*jean*` 
});
```

### Filtre via searchText (apiV1 / endpoints legacy)

Certains endpoints (surtout via apiV1) utilisent `searchText` au lieu de `filter` :

```javascript
// Récupérer les items d'un ticket spécifique
await apiV1.get("Item_Ticket", {
    "searchText[tickets_id]": ticketId,
});

// Récupérer les coûts d'un ticket (via TicketCost)
await apiV2.get("/apirest.php/TicketCost", {
    "searchText[tickets_id]": ticketId,
});
```

## 4. Pagination

### Avec apiV2 (query params)

```javascript
// Récupérer les 50 premiers éléments
await apiV2.get(endpoint, { start: 0, limit: 50 });

// Récupérer les éléments 51 à 100
await apiV2.get(endpoint, { start: 50, limit: 50 });
```

### Avec apiV1 (Range header)

```javascript
// Récupérer les éléments 0 à 49
await apiV1.getList("Computer", "0-49");

// Récupérer les éléments 50 à 99
await apiV1.getList("Computer", [50, 99]);
```

### Compter le total d'éléments

```javascript
const total = await apiV2.count("/api.php/v2.3/Assistance/Ticket");
// Utilise le header Content-Range de la réponse : "items 0-0/142"
// → retourne 142
```

## 5. Sous-ressources (éléments liés à un ticket)

Pour récupérer les éléments liés à un ticket, GLPI utilise des sous-routes :

```javascript
// Les coûts du ticket #42
GET /api.php/v2.3/Assistance/Ticket/42/Cost

// Les documents du ticket #42
GET /api.php/v2.3/Assistance/Ticket/42/Document

// Les followups (via endpoint dédié + filtre)
GET /api.php/v2.3/Assistance/ITILFollowup?filter=items_id==42;itemtype==Ticket
```
