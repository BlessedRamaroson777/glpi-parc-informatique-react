# GLPI API V1 — Ressources complètes
> Base URL : `http://localhost:8081/apirest.php`
> Auth : `Session-Token` obtenu via `initSession`
> Style : **REST générique** — un seul pattern `/:itemtype/:id` pour tous les objets

---

## Headers communs

| Header | Description | Exemple |
|--------|-------------|---------|
| `Session-Token` | Token de session obtenu via initSession | `83af7e620c83a50a18d3eac2f6ed05a3ca0bea62` |
| `App-Token` | Token applicatif configuré dans GLPI | `f7g3csp8mgatg5ebc5elnazakw20i9fyev1qopya7` |
| `Content-Type` | Format du body | `application/json` |
| `Authorization` | Utilisé uniquement pour initSession | `Basic Z2xwaTpnbHBp` ou `user_token xxx` |

---

## Paramètres de filtrage (query string — GET all items)

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| `searchText[field]` | Filtre sur un champ | `?searchText[tickets_id]=1` |
| `range` | Pagination start-end | `?range=0-49` |
| `sort` | Champ de tri (id searchOption) | `?sort=1` |
| `order` | Sens du tri | `?order=ASC` ou `?order=DESC` |
| `expand_dropdowns` | Afficher les noms au lieu des ids | `?expand_dropdowns=true` |
| `only_id` | Retourner uniquement les ids | `?only_id=true` |
| `is_deleted` | Inclure les éléments supprimés | `?is_deleted=true` |
| `get_hateoas` | Inclure les liens HATEOAS | `?get_hateoas=true` |

---

## Différences clés V1 vs V2

| Aspect | V1 | V2 |
|--------|----|----|
| Auth | `Session-Token` (initSession) | `Bearer` OAuth2 |
| Body création | `{"input": {...}}` | `{...}` directement |
| Body update | `{"input": {"id": x, ...}}` | `{...}` directement |
| Suppression | `?force_purge=true` | `?force=true` |
| Pagination | `range=0-49` | `start=0&limit=50` |
| Filtrage | `searchText[field]=value` | `filter=field=="value"` (RSQL) |
| Sous-ressources | `/:itemtype/:id/:sub_itemtype` | endpoints dédiés |
| Relations ticket↔asset | `Item_Ticket` (table de jointure) | ❌ non exposé |

---

## 1. Session

```
GET    /initSession                  → Ouvrir une session → retourne session_token
GET    /killSession                  → Fermer la session
GET    /getMyProfiles                → Profils de l'utilisateur connecté
GET    /getActiveProfile             → Profil actif
POST   /changeActiveProfile          → Changer de profil actif
GET    /getMyEntities                → Entités accessibles
GET    /getActiveEntities            → Entités actives
POST   /changeActiveEntities         → Changer d'entité active
GET    /getFullSession               → Session PHP complète ($_SESSION)
GET    /getGlpiConfig                → Configuration GLPI ($CFG_GLPI)
PUT    /lostPassword                 → Demander réinitialisation mot de passe
```

### Exemple initSession
```
GET /initSession
Authorization: Basic Z2xwaTpnbHBp     ← base64("glpi:glpi")
App-Token: xxx
```
```json
{ "session_token": "83af7e620c83a50a18d3eac2f6ed05a3ca0bea62" }
```

---

## 2. Pattern générique CRUD

> Toutes les ressources GLPI suivent ce pattern uniforme.

```
GET    /:itemtype                    → Liste tous les éléments
POST   /:itemtype                    → Créer un ou plusieurs éléments
GET    /:itemtype/:id                → Détail d'un élément
PUT    /:itemtype/:id                → Modifier un élément
DELETE /:itemtype/:id                → Supprimer un élément

GET    /:itemtype/:id/:sub_itemtype  → Sous-ressources d'un élément
```

### Body création (POST)
```json
{ "input": { "name": "valeur", "champ": "valeur" } }
```

### Body update (PUT)
```json
{ "input": { "id": 5, "name": "nouvelle valeur" } }
```

### Suppression définitive (bypass corbeille)
```
DELETE /:itemtype/:id?force_purge=true
```

---

## 3. Assets

```
GET    /Computer                     → Liste ordinateurs
POST   /Computer                     → Créer ordinateur
GET    /Computer/:id                 → Détail ordinateur
PUT    /Computer/:id                 → Modifier ordinateur
DELETE /Computer/:id                 → Supprimer ordinateur
GET    /Computer/:id/Log             → Historique ordinateur
GET    /Computer/:id/Document_Item   → Documents liés
GET    /Computer/:id/Item_Ticket     → Tickets liés ⭐
GET    /Computer/:id/Infocom         → Fiche financière

GET    /Monitor                      → Liste moniteurs
POST   /Monitor                      → Créer moniteur
GET    /Monitor/:id                  → Détail moniteur
PUT    /Monitor/:id                  → Modifier moniteur
DELETE /Monitor/:id                  → Supprimer moniteur
GET    /Monitor/:id/Item_Ticket      → Tickets liés ⭐
GET    /Monitor/:id/Infocom          → Fiche financière

GET    /Printer                      → Liste imprimantes
GET    /Printer/:id                  → Détail imprimante
GET    /Printer/:id/Item_Ticket      → Tickets liés ⭐

GET    /Phone                        → Liste téléphones
GET    /Phone/:id                    → Détail téléphone
GET    /Phone/:id/Item_Ticket        → Tickets liés ⭐

GET    /NetworkEquipment             → Liste équipements réseau
GET    /NetworkEquipment/:id         → Détail équipement
GET    /NetworkEquipment/:id/Item_Ticket → Tickets liés ⭐

GET    /Peripheral                   → Liste périphériques
GET    /Peripheral/:id               → Détail périphérique

GET    /Software                     → Liste logiciels
GET    /Software/:id                 → Détail logiciel

GET    /SoftwareLicense              → Liste licences
GET    /SoftwareLicense/:id          → Détail licence
```

### Paramètres spéciaux GET /:id pour Computer
| Paramètre | Description |
|-----------|-------------|
| `with_tickets=true` | Inclure les tickets associés |
| `with_infocoms=true` | Inclure la fiche financière |
| `with_softwares=true` | Inclure les logiciels installés |
| `with_devices=true` | Inclure les composants |
| `with_disks=true` | Inclure les systèmes de fichiers |
| `with_connections=true` | Inclure les connexions directes |
| `with_networkports=true` | Inclure les ports réseau |
| `with_documents=true` | Inclure les documents |
| `with_contracts=true` | Inclure les contrats |
| `expand_dropdowns=true` | Afficher les noms des dropdowns |

---

## 4. Assistance / Tickets ⭐ IMPORTANT

```
GET    /Ticket                       → Liste tickets
POST   /Ticket                       → Créer ticket
GET    /Ticket/:id                   → Détail ticket
PUT    /Ticket/:id                   → Modifier ticket
DELETE /Ticket/:id                   → Supprimer ticket
GET    /Ticket/:id/Log               → Historique du ticket
GET    /Ticket/:id/Document_Item     → Documents liés
GET    /Ticket/:id/ITILFollowup      → Suivis
POST   /Ticket/:id/ITILFollowup      → Ajouter un suivi
GET    /Ticket/:id/TicketTask        → Tâches
POST   /Ticket/:id/TicketTask        → Ajouter une tâche
GET    /Ticket/:id/ITILSolution      → Solutions
POST   /Ticket/:id/ITILSolution      → Ajouter une solution
GET    /Ticket/:id/TicketCost        → Coûts
POST   /Ticket/:id/TicketCost        → Ajouter un coût
GET    /Ticket/:id/TicketValidation  → Validations
```

### Relation ticket ↔ asset : Item_Ticket ⭐
```
GET    /Item_Ticket                              → Toutes les relations
GET    /Item_Ticket/:id                          → Une relation spécifique
POST   /Item_Ticket                              → Lier un asset à un ticket
DELETE /Item_Ticket/:id                          → Délier

# Filtrer par ticket
GET    /Item_Ticket?searchText[tickets_id]=1     → Assets du ticket 1

# Filtrer par asset
GET    /Item_Ticket?searchText[items_id]=3&searchText[itemtype]=Computer
```

### Body création Item_Ticket (POST)
```json
{
  "input": {
    "tickets_id": 1,
    "itemtype": "Computer",
    "items_id": 3
  }
}
```

### Valeurs itemtype disponibles
| itemtype | Description |
|----------|-------------|
| `Computer` | Ordinateur |
| `Monitor` | Moniteur |
| `Printer` | Imprimante |
| `Phone` | Téléphone |
| `NetworkEquipment` | Équipement réseau |
| `Peripheral` | Périphérique |
| `Software` | Logiciel |

---

## 5. Administration

```
GET    /User                         → Liste utilisateurs
POST   /User                         → Créer utilisateur
GET    /User/:id                     → Détail utilisateur
PUT    /User/:id                     → Modifier utilisateur
DELETE /User/:id                     → Supprimer utilisateur
GET    /User/:id/Log                 → Historique utilisateur
GET    /User/:id/Picture             → Photo de profil

GET    /Group                        → Liste groupes
POST   /Group                        → Créer groupe
GET    /Group/:id                    → Détail groupe
PUT    /Group/:id                    → Modifier groupe
DELETE /Group/:id                    → Supprimer groupe

GET    /Entity                       → Liste entités
POST   /Entity                       → Créer entité
GET    /Entity/:id                   → Détail entité
PUT    /Entity/:id                   → Modifier entité
DELETE /Entity/:id                   → Supprimer entité

GET    /Profile                      → Liste profils
GET    /Profile/:id                  → Détail profil
```

---

## 6. Dropdowns / Référentiels

```
GET    /Location                     → Liste localisations
POST   /Location                     → Créer localisation
GET    /Location/:id                 → Détail localisation
PUT    /Location/:id                 → Modifier localisation
DELETE /Location/:id                 → Supprimer localisation

GET    /State                        → Liste états
POST   /State                        → Créer état
GET    /State/:id                    → Détail état
PUT    /State/:id                    → Modifier état
DELETE /State/:id                    → Supprimer état

GET    /Manufacturer                 → Liste fabricants
POST   /Manufacturer                 → Créer fabricant
GET    /Manufacturer/:id             → Détail fabricant
DELETE /Manufacturer/:id             → Supprimer fabricant

GET    /ComputerModel                → Liste modèles PC
POST   /ComputerModel                → Créer modèle PC
GET    /ComputerModel/:id            → Détail modèle PC
DELETE /ComputerModel/:id            → Supprimer modèle PC

GET    /MonitorModel                 → Liste modèles moniteurs
POST   /MonitorModel                 → Créer modèle moniteur
DELETE /MonitorModel/:id             → Supprimer modèle moniteur

GET    /ITILCategory                 → Liste catégories tickets
POST   /ITILCategory                 → Créer catégorie
DELETE /ITILCategory/:id             → Supprimer catégorie

GET    /ComputerType                 → Types d'ordinateurs
GET    /NetworkEquipmentType         → Types d'équipements réseau
GET    /RequestType                  → Types de demandes
GET    /TaskCategory                 → Catégories de tâches
GET    /SolutionType                 → Types de solutions
```

---

## 7. Documents

```
GET    /Document                     → Liste documents
POST   /Document                     → Upload document (multipart/form-data)
GET    /Document/:id                 → Détail document
DELETE /Document/:id                 → Supprimer document
GET    /Document/:id?alt=media       → Télécharger le fichier

POST   /Document_Item                → Lier un document à un item
GET    /Document_Item?searchText[items_id]=1&searchText[itemtype]=Ticket
DELETE /Document_Item/:id            → Délier
```

### Upload document (POST multipart)
```
Content-Type: multipart/form-data
uploadManifest: {"input": {"name": "Mon fichier", "_filename": ["file.pdf"]}}
filename[0]: @file.pdf
```

---

## 8. Recherche avancée

```
GET    /search/:itemtype             → Recherche avec critères
GET    /listSearchOptions/:itemtype  → Lister les options de recherche disponibles
GET    /getMultipleItems             → Récupérer plusieurs items de types différents
```

### Exemple search avec critères
```
GET /search/Ticket
  ?criteria[0][field]=1
  &criteria[0][searchtype]=contains
  &criteria[0][value]=réseau
  &criteria[1][link]=AND
  &criteria[1][field]=12
  &criteria[1][searchtype]=equals
  &criteria[1][value]=5
  &range=0-19
  &forcedisplay[0]=1
  &forcedisplay[1]=12
  &forcedisplay[2]=2
```

### Types de recherche (searchtype)
| Valeur | Description |
|--------|-------------|
| `contains` | Contient (wildcard automatique) |
| `equals` | Égal (pour dropdowns) |
| `notequals` | Différent |
| `lessthan` | Inférieur à |
| `morethan` | Supérieur à |
| `under` | Sous (arborescence) |
| `notunder` | Pas sous |

---

## 9. Suppression / Reset données

```
DELETE /Ticket/:id?force_purge=true          → Supprimer ticket définitivement
DELETE /Computer/:id?force_purge=true        → Supprimer PC définitivement
DELETE /Monitor/:id?force_purge=true         → Supprimer moniteur définitivement
DELETE /User/:id?force_purge=true            → Supprimer utilisateur définitivement
DELETE /Location/:id?force_purge=true        → Supprimer localisation définitivement
DELETE /Manufacturer/:id?force_purge=true    → Supprimer fabricant définitivement
DELETE /ComputerModel/:id?force_purge=true   → Supprimer modèle PC définitivement
DELETE /MonitorModel/:id?force_purge=true    → Supprimer modèle moniteur définitivement
DELETE /State/:id?force_purge=true           → Supprimer état définitivement
DELETE /Item_Ticket/:id                      → Délier asset d'un ticket
```

> ⚠️ Sans `force_purge=true`, l'item est mis à la corbeille (`is_deleted=1`) mais pas supprimé.

---

## Exemples pratiques

### Créer un ticket
```json
POST /Ticket
{
  "input": {
    "name": "PC ne démarre plus",
    "content": "Description du problème",
    "type": 1,
    "urgency": 3,
    "priority": 3,
    "status": 1,
    "entities_id": 0
  }
}
```

### Lier un ordinateur à un ticket
```json
POST /Item_Ticket
{
  "input": {
    "tickets_id": 1,
    "itemtype": "Computer",
    "items_id": 3
  }
}
```

### Récupérer tous les assets liés au ticket 1
```
GET /Item_Ticket?searchText[tickets_id]=1&expand_dropdowns=true
```

### Créer un ordinateur
```json
POST /Computer
{
  "input": {
    "name": "PC-ADM-001",
    "serial": "SN123456",
    "entities_id": 0,
    "states_id": 1,
    "locations_id": 2,
    "manufacturers_id": 1,
    "computermodels_id": 1,
    "users_id": 4
  }
}
```

### Ajouter un suivi à un ticket
```json
POST /Ticket/1/ITILFollowup
{
  "input": {
    "items_id": 1,
    "content": "Intervention en cours",
    "is_private": 0
  }
}
```

### Valeurs status ticket
| Valeur | Status |
|--------|--------|
| 1 | Nouveau |
| 2 | En cours (attribué) |
| 3 | En cours (planifié) |
| 4 | En attente |
| 5 | Résolu |
| 6 | Clos |

### Valeurs urgency / priority / impact
| Valeur | Signification |
|--------|--------------|
| 1 | Très basse |
| 2 | Basse |
| 3 | Moyenne |
| 4 | Haute |
| 5 | Très haute |

### Valeurs type ticket
| Valeur | Type |
|--------|------|
| 1 | Incident |
| 2 | Demande |

---

## Codes d'erreur courants

| Code | Description |
|------|-------------|
| `ERROR_SESSION_TOKEN_INVALID` | Session expirée → refaire initSession |
| `ERROR_SESSION_TOKEN_MISSING` | Header Session-Token absent |
| `ERROR_APP_TOKEN_PARAMETERS_MISSING` | App-Token requis mais absent |
| `ERROR_WRONG_APP_TOKEN_PARAMETER` | App-Token invalide |
| `ERROR_ITEM_NOT_FOUND` | L'item demandé n'existe pas |
| `ERROR_RIGHT_MISSING` | Droits insuffisants pour l'action |
| `ERROR_GLPI_ADD` | Erreur lors de la création (voir logs GLPI) |
| `ERROR_GLPI_UPDATE` | Erreur lors de la modification |
| `ERROR_GLPI_DELETE` | Erreur lors de la suppression |
| `ERROR_NOT_DELETED` | Item doit être mis à la corbeille avant suppression |
| `ERROR_NOT_ALLOWED_IP` | IP non autorisée dans la config API GLPI |