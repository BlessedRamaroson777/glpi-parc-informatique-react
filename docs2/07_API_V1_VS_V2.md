# 📡 API — apiV1 vs apiV2

Le projet possède **deux wrappers API** pour communiquer avec GLPI. C'est crucial de comprendre lequel utiliser et quand.

## Vue d'ensemble

| Aspect | apiV1 (`apiV1.jsx`) | apiV2 (`apiV2.jsx`) |
|--------|---------------------|---------------------|
| **Authentification** | Session-Token + App-Token | Bearer Token (OAuth2) |
| **Base URL** | `/apirest.php/...` | `/api.php/v2.3/...` |
| **Fichier** | `src/common/utils/apiV1.jsx` | `src/common/utils/apiV2.jsx` |
| **Utilisé pour** | Recherche avancée, endpoints legacy | CRUD standard, la majorité des opérations |
| **Quand l'utiliser** | Quand v2 ne supporte pas la fonctionnalité | Par défaut, pour tout le reste |

## apiV2 — Le wrapper principal

C'est celui que vous devez utiliser **en premier**. Il gère automatiquement le token OAuth2.

### Fichier : `src/common/utils/apiV2.jsx`

### Méthodes disponibles

```javascript
import apiV2 from '../utils/apiV2.jsx';

// GET — Récupérer des données
apiV2.get(endpoint, params)
// endpoint : string    → ex: "/api.php/v2.3/Assistance/Ticket"
// params   : object    → ex: { limit: 10, filter: "status==1" }

// POST — Créer quelque chose
apiV2.post(endpoint, body)
// body : object → les données à envoyer

// PATCH — Modifier partiellement
apiV2.patch(endpoint, body)

// PUT — Remplacer complètement
apiV2.put(endpoint, body)

// DELETE — Supprimer
apiV2.delete(endpoint)

// COUNT — Compter le nombre d'éléments
apiV2.count(endpoint, filter)
```

### Exemples concrets

```javascript
// Récupérer tous les tickets
const tickets = await apiV2.get("/api.php/v2.3/Assistance/Ticket?start=0&limit=999");

// Récupérer un ticket par ID
const ticket = await apiV2.get("/api.php/v2.3/Assistance/Ticket/42");

// Créer un ticket
const newTicket = await apiV2.post("/api.php/v2.3/Assistance/Ticket", {
    name: "Mon ticket",
    content: "Description du problème",
    status: 1,
    type: 1,
});

// Modifier un ticket
await apiV2.patch("/api.php/v2.3/Assistance/Ticket/42", {
    status: 6,  // → Clos
});

// Supprimer un ticket
await apiV2.delete("/api.php/v2.3/Assistance/Ticket/42");

// Supprimer définitivement (purge)
await apiV2.delete("/api.php/v2.3/Assistance/Ticket/42?purge=true");

// Compter les tickets ouverts
const count = await apiV2.count("/api.php/v2.3/Assistance/Ticket", "status==1");
```

### Comment ça marche en interne

```
1. Vous appelez apiV2.get("/api.php/v2.3/Assistance/Ticket")
2. Le wrapper récupère le Bearer Token depuis localStorage
3. Il construit l'URL complète et ajoute les headers :
   {
     Accept: "application/json",
     Authorization: "Bearer eyJhbGci..."
   }
4. Il fait un fetch() avec un timeout de 30 secondes
5. Il parse la réponse JSON et la retourne
6. En cas d'erreur HTTP, il lance une Error avec le message
```

---

## apiV1 — Le wrapper legacy

Utilisez-le **uniquement** quand apiV2 ne supporte pas la fonctionnalité.

### Fichier : `src/common/utils/apiV1.jsx`

### Méthodes disponibles

```javascript
import apiV1 from '../utils/apiV1.jsx';

// Méthodes bas niveau (comme apiV2)
apiV1.get(endpoint, params)
apiV1.post(endpoint, body)
apiV1.put(endpoint, body)
apiV1.delete(endpoint)

// Méthodes GLPI spécifiques
apiV1.initSession(userToken)       // Démarrer une session GLPI
apiV1.killSession()                // Terminer la session
apiV1.search(itemtype, params)     // Recherche avancée GLPI
apiV1.getItem(itemtype, id)        // Récupérer un item par type+ID
apiV1.createItem(itemtype, data)   // Créer un item
apiV1.updateItem(itemtype, id, data) // Modifier un item
apiV1.deleteItem(itemtype, id)     // Supprimer un item
apiV1.getList(itemtype, range, params) // Liste paginée avec Range header
```

### Quand utiliser apiV1 ?

**1. Recherche avancée (search)**
L'API v2 de GLPI ne supporte pas toujours la recherche textuelle comme v1.

```javascript
// Rechercher un ticket par nom (impossble avec v2)
const res = await apiV1.search("Ticket", {
    "searchText[1]": "panne écran",
    "rawdata": 1,
});
```

**2. Récupérer les détails d'un item lié (par itemtype)**

```javascript
// Quand on a un item lié avec itemtype="Computer" et items_id=15
const details = await apiV1.getItem("Computer", 15);
// → { id: 15, name: "PC-BUREAU-042", serial: "XYZ123" }
```

**3. Créer des liaisons avec le format `{ input: {...} }`**

```javascript
// Lier un utilisateur à un ticket (Ticket_User)
await apiV1.createItem("Ticket_User", {
    input: {
        tickets_id: 42,
        users_id: 5,
        type: 1,  // 1=Requester, 2=Assignee, 3=Observer
    }
});
```

### Différences d'authentification

```javascript
// apiV1 utilise Session-Token + App-Token
headers = {
    "Session-Token": "abc123...",
    "App-Token": "def456...",
}

// apiV2 utilise Bearer Token (OAuth2)
headers = {
    "Authorization": "Bearer eyJhbGci...",
}
```

La session v1 est initialisée automatiquement lors du login via `authService.login()`.

---

## Résumé : Quel wrapper utiliser ?

| Opération | Wrapper | Pourquoi |
|-----------|---------|----------|
| CRUD sur les tickets | apiV2 | Standard, OAuth2 |
| CRUD sur les assets (Computer, Monitor...) | apiV2 | Via les entités |
| Recherche textuelle | apiV1 | v2 ne le supporte pas bien |
| Récupérer les détails d'un item par type | apiV1 | `getItem(itemtype, id)` |
| Lier un utilisateur à un ticket | apiV1 | `createItem("Ticket_User", ...)` |
| Coûts d'un ticket | apiV2 | Endpoint v2.3 natif |
| Followups d'un ticket | apiV2 | Endpoint v2.3 natif |

## Gérer les différentes formes de réponse

L'API GLPI peut renvoyer les données dans différents formats. Voici comment les gérer :

```javascript
// L'API peut renvoyer :
// 1. Un tableau direct : [{ id: 1, ... }, { id: 2, ... }]
// 2. Un objet avec data : { data: [{ id: 1, ... }] }
// 3. null ou undefined

// Pattern de normalisation utilisé partout dans le projet :
const data = await apiV2.get(endpoint);
const items = Array.isArray(data) ? data : (data?.data ?? []);
//             ↑ Si tableau,         ↑ Sinon chercher .data
//               prendre tel quel      ou tableau vide par défaut
```
