# GLPI 11.0.7 — Recherches multicritères
> Documentation complète API V1 et V2 — tickets, assets, asset types

---

## Table des matières

1. [Fondamentaux RSQL (V2)](#1-fondamentaux-rsql-v2)
2. [Tickets — V2](#2-tickets--v2)
3. [Assets par type — V2](#3-assets-par-type--v2)
4. [Assets tous types confondus — V2 `Global`](#4-assets-tous-types-confondus--v2-global)
5. [Tickets — V1](#5-tickets--v1)
6. [Assets — V1](#6-assets--v1)
7. [Relation Ticket ↔ Asset — V1 uniquement](#7-relation-ticket--asset--v1-uniquement)
8. [Pagination et tri](#8-pagination-et-tri)
9. [Headers communs](#9-headers-communs)
10. [Référence valeurs enum](#10-référence-valeurs-enum)
11. [Exemples JS prêts à l'emploi](#11-exemples-js-prêts-à-lemploi)

---

## 1. Fondamentaux RSQL (V2)

La V2 utilise **RSQL** (RestSQL) comme langage de filtre. Toutes les collections GET supportent le paramètre `?filter=`.

### Opérateurs de comparaison

| Opérateur | Signification | Exemple |
|-----------|--------------|---------|
| `==` | Égal | `status.id==2` |
| `!=` | Différent | `is_deleted!=true` |
| `=gt=` ou `>` | Supérieur strict | `priority=gt=3` |
| `=ge=` ou `>=` | Supérieur ou égal | `priority>=3` |
| `=lt=` ou `<` | Inférieur strict | `urgency<4` |
| `=le=` ou `<=` | Inférieur ou égal | `urgency<=3` |
| `=like=` | Contient (wildcard `*`) | `name=like=*réseau*` |
| `=in=` | Dans une liste | `status.id=in=(1,2,3)` |
| `=out=` | Pas dans une liste | `status.id=out=(5,6)` |

### Opérateurs logiques

| Opérateur | Signification | Exemple |
|-----------|--------------|---------|
| `;` | ET logique | `status.id==2;priority>=3` |
| `,` | OU logique | `status.id==1,status.id==2` |

### Groupement et imbrication

Les parenthèses permettent de grouper :

```
filter=(status.id==1,status.id==2);priority>=4
```
→ (status Nouveau OU En cours attribué) ET priorité >= Haute

### Accès aux champs de relations

Pour un champ objet `{ id, name }`, utiliser la notation pointée :

```
filter=category.id==5
filter=entity.id==0
filter=status.id==2
```

---

## 2. Tickets — V2

### Endpoint

```
GET /api.php/v2/Assistance/Ticket
```

### Paramètres query

| Paramètre | Type | Description | Défaut |
|-----------|------|-------------|--------|
| `filter` | string | Expression RSQL | — |
| `start` | integer | Premier résultat (pagination) | `0` |
| `limit` | integer | Nombre max de résultats | `100` |
| `sort` | string | Tri : `champ:asc` ou `champ:desc`, séparés par `,` | — |

### Tous les champs filtrables

| Champ RSQL | Type | Valeurs |
|-----------|------|---------|
| `status.id` | integer | 1=Nouveau, 2=En cours (Attribué), 3=En cours (Planifié), 4=En attente, 5=Résolu, 6=Clos, 10=Validation |
| `type` | integer | 1=Incident, 2=Demande |
| `priority` | integer | 1=Très basse … 5=Très haute |
| `urgency` | integer | 1=Très basse … 5=Très haute |
| `impact` | integer | 1=Très basse … 5=Très haute |
| `global_validation` | integer | 1=Aucune, 2=En attente, 3=Acceptée, 4=Refusée |
| `category.id` | integer | ID de la catégorie ITIL |
| `entity.id` | integer | ID de l'entité GLPI |
| `location.id` | integer | ID de la localisation |
| `user_recipient.id` | integer | ID de l'utilisateur demandeur |
| `user_editor.id` | integer | ID de l'utilisateur éditeur |
| `request_type.id` | integer | ID du type de requête |
| `sla_ttr.id` | integer | ID du SLA TTR |
| `sla_tto.id` | integer | ID du SLA TTO |
| `name` | string | Titre du ticket |
| `content` | string | Description |
| `external_id` | string | ID externe |
| `date` | string | Date d'ouverture (ISO 8601) |
| `date_solve` | string | Date de résolution |
| `date_close` | string | Date de clôture |
| `date_creation` | string | Date de création |
| `date_mod` | string | Date de modification |
| `resolution_date` | string | Date de résolution |
| `is_deleted` | boolean | Dans la corbeille |

### Exemples — Tickets V2

#### Tickets ouverts (non résolus, non clos)
```
GET /api.php/v2/Assistance/Ticket?filter=status.id=out=(5,6)
```

#### Tickets incidents haute priorité en cours
```
GET /api.php/v2/Assistance/Ticket?filter=type==1;priority>=4;status.id=in=(2,3)
```

#### Tickets d'une catégorie dans une entité, non supprimés
```
GET /api.php/v2/Assistance/Ticket?filter=category.id==12;entity.id==0;is_deleted==false
```

#### Tickets d'un utilisateur spécifique, non clos
```
GET /api.php/v2/Assistance/Ticket?filter=user_recipient.id==42;status.id!=6
```

#### Tickets créés après une date, avec titre contenant "réseau"
```
GET /api.php/v2/Assistance/Ticket?filter=date_creation=ge=2024-01-01T00:00:00Z;name=like=*réseau*
```

#### Tickets en attente de validation OU refusés
```
GET /api.php/v2/Assistance/Ticket?filter=global_validation==2,global_validation==4
```

#### Tickets urgents OU priorité haute, en cours
```
GET /api.php/v2/Assistance/Ticket?filter=(urgency>=4,priority>=4);status.id=in=(2,3)
```

#### 20 derniers tickets résolus, triés par date de résolution
```
GET /api.php/v2/Assistance/Ticket?filter=status.id==5&sort=date_solve:desc&limit=20
```

---

## 3. Assets par type — V2

Chaque type d'asset a son propre endpoint avec le même mécanisme RSQL.

### Endpoints disponibles

```
GET /api.php/v2/Assets/Computer
GET /api.php/v2/Assets/Monitor
GET /api.php/v2/Assets/NetworkEquipment
GET /api.php/v2/Assets/Phone
GET /api.php/v2/Assets/Printer
GET /api.php/v2/Assets/Peripheral
GET /api.php/v2/Assets/Software
GET /api.php/v2/Assets/SoftwareLicense
GET /api.php/v2/Assets/Appliance
GET /api.php/v2/Assets/Cable
GET /api.php/v2/Assets/Cartridge
GET /api.php/v2/Assets/Certificate
GET /api.php/v2/Assets/Consumable
GET /api.php/v2/Assets/Enclosure
GET /api.php/v2/Assets/PDU
GET /api.php/v2/Assets/PassiveDCEquipment
GET /api.php/v2/Assets/Rack
GET /api.php/v2/Assets/Socket
GET /api.php/v2/Assets/Unmanaged
```

### Champs filtrables communs à tous les assets (CommonAsset)

| Champ RSQL | Type | Description |
|-----------|------|-------------|
| `name` | string | Nom de l'asset |
| `serial` | string | Numéro de série |
| `otherserial` | string | Numéro d'inventaire |
| `comment` | string | Commentaire |
| `contact` | string | Nom du contact |
| `contact_num` | string | Numéro du contact |
| `status.id` | integer | ID de l'état (State) |
| `entity.id` | integer | ID de l'entité |
| `manufacturer.id` | integer | ID du fabricant |
| `user.id` | integer | ID de l'utilisateur propriétaire |
| `user_tech.id` | integer | ID du technicien responsable |
| `group` | array | Groupes associés |
| `group_tech` | array | Groupes techniques |
| `is_deleted` | boolean | Dans la corbeille |
| `is_recursive` | boolean | Récursif dans les entités |
| `date_creation` | string | Date de création |
| `date_mod` | string | Date de modification |

### Champs spécifiques à Computer

| Champ RSQL | Type | Description |
|-----------|------|-------------|
| `location.id` | integer | ID de la localisation |
| `type.id` | integer | ID du type (ComputerType) |
| `model.id` | integer | ID du modèle (ComputerModel) |
| `uuid` | string | UUID hardware (readOnly) |
| `is_dynamic` | boolean | Géré par agent d'inventaire |
| `last_inventory_update` | string | Dernière mise à jour inventaire |
| `last_boot` | string | Dernier démarrage |

### Exemples — Assets V2

#### Ordinateurs actifs (état "En production") dans une entité
```
GET /api.php/v2/Assets/Computer?filter=status.id==1;entity.id==0;is_deleted==false
```

#### Ordinateurs d'un fabricant, d'un modèle spécifique
```
GET /api.php/v2/Assets/Computer?filter=manufacturer.id==3;model.id==12
```

#### Ordinateurs d'un technicien, non supprimés, triés par nom
```
GET /api.php/v2/Assets/Computer?filter=user_tech.id==15;is_deleted==false&sort=name:asc
```

#### Assets dont le nom contient "SRV"
```
GET /api.php/v2/Assets/Computer?filter=name=like=*SRV*
```

#### Assets modifiés depuis une date
```
GET /api.php/v2/Assets/Computer?filter=date_mod=ge=2024-06-01T00:00:00Z
```

#### Moniteurs d'un utilisateur spécifique
```
GET /api.php/v2/Assets/Monitor?filter=user.id==42;is_deleted==false
```

#### Numéro de série ou d'inventaire précis
```
GET /api.php/v2/Assets/Computer?filter=serial==SN123456
GET /api.php/v2/Assets/Computer?filter=otherserial==INV-2024-001
```

---

## 4. Assets tous types confondus — V2 `Global`

### Endpoint

```
GET /api.php/v2/Assets/Global
```

Retourne des items de **tous les types d'assets** en une seule requête, avec les champs `CommonAsset` uniquement.

### Liste des types disponibles (GET /api.php/v2/Assets/)

```
GET /api.php/v2/Assets/
```

Retourne la liste de tous les asset types avec leur `itemtype`, `name` et `href`.

### Champs filtrables

Identiques à la section CommonAsset ci-dessus (pas les champs spécifiques au type).

### Exemples — Assets Global V2

#### Tous les assets d'une entité, non supprimés
```
GET /api.php/v2/Assets/Global?filter=entity.id==0;is_deleted==false
```

#### Tous les assets d'un utilisateur (tous types)
```
GET /api.php/v2/Assets/Global?filter=user.id==42
```

#### Tous les assets en état "Hors service"
```
GET /api.php/v2/Assets/Global?filter=status.id==3
```

#### Tous les assets d'un fabricant, triés par nom
```
GET /api.php/v2/Assets/Global?filter=manufacturer.id==5&sort=name:asc
```

#### Tous les assets modifiés dans le mois, non supprimés
```
GET /api.php/v2/Assets/Global?filter=date_mod=ge=2024-05-01T00:00:00Z;is_deleted==false
```

> ⚠️ **Limitation** : la réponse ne contient que les champs `CommonAsset`. Les champs spécifiques (ex: `uuid`, `location` pour Computer) ne sont pas retournés sur cet endpoint.

---

## 5. Tickets — V1

### Endpoint

```
GET http://localhost:8081/apirest.php/Ticket
```

### Paramètres query V1

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| `searchText[champ]` | Filtre sur un champ exact | `?searchText[status]=2` |
| `range` | Pagination `start-end` | `?range=0-49` |
| `sort` | ID de l'option de recherche (searchOption) | `?sort=1` |
| `order` | Sens du tri | `?order=ASC` ou `?order=DESC` |
| `expand_dropdowns` | Affiche les labels au lieu des IDs | `?expand_dropdowns=true` |
| `only_id` | Retourne uniquement les IDs | `?only_id=true` |
| `is_deleted` | Inclure la corbeille | `?is_deleted=true` |
| `get_hateoas` | Liens HATEOAS | `?get_hateoas=false` |

> ⚠️ **Limitation V1** : `searchText` ne supporte qu'**un seul filtre par champ**. Pour combiner plusieurs champs, enchaîner les paramètres (ET implicite) mais sans OU ni opérateurs de comparaison avancés.

### Noms des champs V1 pour les tickets

Les champs V1 utilisent les **noms de colonnes BDD**, différents des noms V2 :

| Champ V1 | Champ V2 équivalent | Valeurs |
|----------|--------------------|-|
| `status` | `status.id` | 1, 2, 3, 4, 5, 6, 10 |
| `type` | `type` | 1, 2 |
| `priority` | `priority` | 1–5 |
| `urgency` | `urgency` | 1–5 |
| `impact` | `impact` | 1–5 |
| `itilcategories_id` | `category.id` | ID |
| `entities_id` | `entity.id` | ID |
| `locations_id` | `location.id` | ID |
| `users_id_recipient` | `user_recipient.id` | ID |
| `requesttypes_id` | `request_type.id` | ID |
| `name` | `name` | texte |
| `content` | `content` | texte |
| `date` | `date` | datetime |
| `solvedate` | `date_solve` | datetime |
| `closedate` | `date_close` | datetime |
| `is_deleted` | `is_deleted` | 0/1 |

### Exemples — Tickets V1

#### Tickets par statut
```
GET /apirest.php/Ticket?searchText[status]=2
```

#### Tickets par type ET statut (ET implicite)
```
GET /apirest.php/Ticket?searchText[type]=1&searchText[status]=2
```

#### Tickets par catégorie dans une entité
```
GET /apirest.php/Ticket?searchText[itilcategories_id]=5&searchText[entities_id]=0
```

#### Tickets avec labels lisibles, paginés
```
GET /apirest.php/Ticket?searchText[status]=1&expand_dropdowns=true&range=0-19
```

#### Recherche avancée multi-champs (endpoint `/search`)
```
GET /apirest.php/search/Ticket
  ?criteria[0][field]=12
  &criteria[0][searchtype]=equals
  &criteria[0][value]=2
  &criteria[1][link]=AND
  &criteria[1][field]=3
  &criteria[1][searchtype]=equals
  &criteria[1][value]=1
  &criteria[2][link]=AND
  &criteria[2][field]=9
  &criteria[2][searchtype]=morethan
  &criteria[2][value]=3
  &range=0-49
  &forcedisplay[0]=1
  &forcedisplay[1]=12
  &forcedisplay[2]=3
```
→ Tickets statut=2 ET type=1 ET priorité>3

#### Options de recherche disponibles pour Ticket
```
GET /apirest.php/listSearchOptions/Ticket
```
Retourne tous les `field` IDs disponibles pour `search/Ticket`.

---

## 6. Assets — V1

### Endpoints

```
GET /apirest.php/Computer
GET /apirest.php/Monitor
GET /apirest.php/NetworkEquipment
GET /apirest.php/Phone
GET /apirest.php/Printer
GET /apirest.php/Peripheral
GET /apirest.php/Software
GET /apirest.php/SoftwareLicense
```

### Noms des champs V1 pour les assets

| Champ V1 | Description |
|----------|-------------|
| `name` | Nom |
| `serial` | Numéro de série |
| `otherserial` | Numéro d'inventaire |
| `states_id` | ID de l'état |
| `entities_id` | ID de l'entité |
| `manufacturers_id` | ID du fabricant |
| `users_id` | ID de l'utilisateur |
| `users_id_tech` | ID du technicien |
| `locations_id` | ID de la localisation |
| `computermodels_id` | ID du modèle (Computer) |
| `computertypes_id` | ID du type (Computer) |
| `is_deleted` | 0/1 |
| `is_dynamic` | 0/1 (géré par agent) |

### Exemples — Assets V1

#### Ordinateurs par état
```
GET /apirest.php/Computer?searchText[states_id]=1
```

#### Ordinateurs d'un fabricant dans une entité
```
GET /apirest.php/Computer?searchText[manufacturers_id]=3&searchText[entities_id]=0
```

#### Ordinateurs d'un technicien, non supprimés
```
GET /apirest.php/Computer?searchText[users_id_tech]=15&searchText[is_deleted]=0
```

#### Avec expand_dropdowns pour voir les labels
```
GET /apirest.php/Computer?searchText[states_id]=1&expand_dropdowns=true
```

#### Paramètres étendus pour un Computer (GET par ID)
```
GET /apirest.php/Computer/42
  ?with_tickets=true
  &with_softwares=true
  &with_networkports=true
  &with_infocoms=true
  &expand_dropdowns=true
```

#### Recherche avancée assets (endpoint `/search`)
```
GET /apirest.php/search/Computer
  ?criteria[0][field]=31
  &criteria[0][searchtype]=equals
  &criteria[0][value]=1
  &criteria[1][link]=AND
  &criteria[1][field]=23
  &criteria[1][searchtype]=equals
  &criteria[1][value]=3
  &range=0-49
```

#### Options de recherche pour Computer
```
GET /apirest.php/listSearchOptions/Computer
```

---

## 7. Relation Ticket ↔ Asset — V1 uniquement

> ⚠️ **Cette fonctionnalité n'est PAS disponible en V2.** L'endpoint `Item_Ticket` n'est exposé qu'en V1.

### Endpoints

```
GET    /apirest.php/Item_Ticket              → Toutes les relations
POST   /apirest.php/Item_Ticket              → Créer une relation
DELETE /apirest.php/Item_Ticket/:id          → Supprimer une relation
```

### Filtrer les assets liés à un ticket

```
GET /apirest.php/Item_Ticket?searchText[tickets_id]=1
GET /apirest.php/Item_Ticket?searchText[tickets_id]=1&expand_dropdowns=true
```

### Filtrer les tickets liés à un asset

```
GET /apirest.php/Item_Ticket?searchText[items_id]=42&searchText[itemtype]=Computer
GET /apirest.php/Item_Ticket?searchText[items_id]=42&searchText[itemtype]=Monitor
```

### Depuis un asset directement (sous-ressource)

```
GET /apirest.php/Computer/42/Item_Ticket
GET /apirest.php/Monitor/15/Item_Ticket
GET /apirest.php/NetworkEquipment/7/Item_Ticket
GET /apirest.php/Printer/3/Item_Ticket
GET /apirest.php/Phone/8/Item_Ticket
```

### Valeurs `itemtype` disponibles

| itemtype | Description |
|----------|-------------|
| `Computer` | Ordinateur |
| `Monitor` | Moniteur |
| `Printer` | Imprimante |
| `Phone` | Téléphone |
| `NetworkEquipment` | Équipement réseau |
| `Peripheral` | Périphérique |
| `Software` | Logiciel |

### Créer une relation ticket ↔ asset

```
POST /apirest.php/Item_Ticket
Content-Type: application/json

{
  "input": {
    "tickets_id": 1,
    "itemtype": "Computer",
    "items_id": 42
  }
}
```

### Supprimer une relation

```
DELETE /apirest.php/Item_Ticket/5
```

---

## 8. Pagination et tri

### V2 — Pagination

```
GET /api.php/v2/Assistance/Ticket?filter=...&start=0&limit=50
GET /api.php/v2/Assistance/Ticket?filter=...&start=50&limit=50   ← page 2
```

Défaut : `start=0`, `limit=100`.

### V2 — Tri multi-colonnes

```
sort=priority:desc,date_creation:asc
sort=status.id:asc,name:asc
sort=date_mod:desc
```

### V1 — Pagination

```
range=0-49    ← 50 premiers
range=50-99   ← 50 suivants
```

### V1 — Tri (via ID searchOption)

```
sort=1&order=ASC    ← tri par ID
sort=2&order=DESC   ← tri par titre
```
Utiliser `GET /apirest.php/listSearchOptions/Ticket` pour trouver les IDs.

---

## 9. Headers communs

### V2 — Headers

```
Authorization: Bearer <token>
Content-Type: application/json
GLPI-Entity: 0                      ← optionnel : forcer une entité
GLPI-Entity-Recursive: true         ← optionnel : inclure les sous-entités
GLPI-Profile: 1                     ← optionnel : forcer un profil
Accept-Language: fr-FR              ← optionnel : langue de la réponse
```

### V1 — Headers

```
Session-Token: <session_token>
App-Token: <app_token>
Content-Type: application/json
```

Obtenir le session_token :
```
GET /apirest.php/initSession
Authorization: Basic <base64("login:password")>
App-Token: <app_token>
```

---

## 10. Référence valeurs enum

### Ticket — status.id

| Valeur | Label |
|--------|-------|
| `1` | Nouveau |
| `2` | En cours (Attribué) |
| `3` | En cours (Planifié) |
| `4` | En attente |
| `5` | Résolu |
| `6` | Clos |
| `10` | Validation |

### Ticket — type

| Valeur | Label |
|--------|-------|
| `1` | Incident |
| `2` | Demande |

### Ticket — priority / urgency / impact

| Valeur | Label |
|--------|-------|
| `1` | Très basse |
| `2` | Basse |
| `3` | Moyenne |
| `4` | Haute |
| `5` | Très haute |

### Ticket — global_validation

| Valeur | Label |
|--------|-------|
| `1` | Aucune |
| `2` | En attente |
| `3` | Acceptée |
| `4` | Refusée |

---

## 11. Exemples JS prêts à l'emploi

### V2 — Recherche tickets multicritères

```javascript
import apiV2 from '../utils/apiV2.js'

// Tickets incidents haute priorité en cours
async function getTicketsUrgents() {
  return await apiV2.get('Assistance/Ticket', {
    filter: 'type==1;priority>=4;status.id=in=(2,3)',
    sort: 'priority:desc,date_creation:asc',
    limit: 50
  })
}

// Tickets d'un utilisateur, ouverts
async function getTicketsByUser(userId) {
  return await apiV2.get('Assistance/Ticket', {
    filter: `user_recipient.id==${userId};status.id=out=(5,6)`,
    sort: 'date_creation:desc'
  })
}

// Tickets par catégorie et entité, paginés
async function getTicketsByCategory(categoryId, entityId, page = 0, pageSize = 20) {
  return await apiV2.get('Assistance/Ticket', {
    filter: `category.id==${categoryId};entity.id==${entityId};is_deleted==false`,
    start: page * pageSize,
    limit: pageSize
  })
}
```

### V2 — Recherche assets multicritères

```javascript
// Computers actifs d'un technicien
async function getComputersByTech(techId) {
  return await apiV2.get('Assets/Computer', {
    filter: `user_tech.id==${techId};is_deleted==false;status.id=out=(5,6)`,
    sort: 'name:asc'
  })
}

// Tous les assets d'une entité (tous types)
async function getAllAssetsByEntity(entityId) {
  return await apiV2.get('Assets/Global', {
    filter: `entity.id==${entityId};is_deleted==false`,
    sort: 'name:asc',
    limit: 500
  })
}

// Assets par fabricant et état
async function getAssetsByManufacturerAndState(manufacturerId, stateId) {
  return await apiV2.get('Assets/Computer', {
    filter: `manufacturer.id==${manufacturerId};status.id==${stateId}`,
    sort: 'date_mod:desc'
  })
}
```

### V1 — Relation Ticket ↔ Asset

```javascript
import apiV1 from '../utils/apiV1.js'

// Assets liés à un ticket
async function getAssetsByTicket(ticketId) {
  return await apiV1.get('Item_Ticket', {
    'searchText[tickets_id]': ticketId,
    expand_dropdowns: true
  })
}

// Tickets liés à un ordinateur
async function getTicketsByComputer(computerId) {
  return await apiV1.get('Item_Ticket', {
    'searchText[items_id]': computerId,
    'searchText[itemtype]': 'Computer',
    expand_dropdowns: true
  })
}

// Lier un asset à un ticket
async function linkAssetToTicket(ticketId, itemtype, itemId) {
  return await apiV1.post('Item_Ticket', {
    input: {
      tickets_id: ticketId,
      itemtype: itemtype,
      items_id: itemId
    }
  })
}
```

### V2 — Filtre RSQL dynamique (builder utilitaire)

```javascript
// Construit une expression RSQL à partir d'un objet de critères
function buildFilter(criteria) {
  return criteria
    .filter(c => c.value !== null && c.value !== undefined && c.value !== '')
    .map(c => {
      if (Array.isArray(c.value)) {
        return `${c.field}=in=(${c.value.join(',')})`
      }
      return `${c.field}${c.op ?? '=='}${c.value}`
    })
    .join(';')
}

// Utilisation
const filter = buildFilter([
  { field: 'status.id', op: '=in=', value: [1, 2, 3] },
  { field: 'priority', op: '>=', value: 3 },
  { field: 'entity.id', value: 0 },
  { field: 'is_deleted', value: false },
])
// → status.id=in=(1,2,3);priority>=3;entity.id==0;is_deleted==false

const tickets = await apiV2.get('Assistance/Ticket', { filter, sort: 'priority:desc' })
```

---

*Documentation générée depuis swagger.json GLPI 11.0.7 — API V2 `api.php/v2` et API V1 `apirest.php`*
