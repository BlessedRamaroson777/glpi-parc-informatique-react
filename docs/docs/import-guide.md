# infos
'/Assistance/Ticket', (v2)
'/Item_Ticket', (v1)
 '/Assets/Computer', (v2)
 '/Assets/Monitor', (v2)
'/Administration/User', (v2)
'/Document', (v1)
'/Document_Item' ,(v1)
  '/Dropdowns/Location', (v2)
  '/Dropdowns/State',(v2)
  '/Dropdowns/Manufacturer',(v2)
  '/Dropdowns/ComputerModel',(v2)
  '/Dropdowns/MonitorModel',(v2) 

# Plan d'import GLPI — par fichier source

> **Règle générale :** toujours importer les **référentiels** en premier (Location, State, Manufacturer, Model), puis les **entités principales** (User, Computer, Monitor…), puis les **relations** (Item_Ticket, coûts…).
> Un import lancé dans le mauvais ordre produira des FK introuvables.

---

## Fichier 1 — `assets.csv` _(page 1 du PDF)_

Données : 9 Computer + 1 Monitor avec Location, State, Manufacturer, Model et User associés.

### Étape 1 — `POST /Dropdowns/Location` (v2)

**Pourquoi :** Computer et Monitor référencent une Location. Doit exister avant la création des assets.

```json
{ "name": "Administration" }
{ "name": "Comptabilité" }
{ "name": "Laboratoire IA" }
{ "name": "Bibliothèque" }
{ "name": "Salle 301" }
{ "name": "Magasin Informatique" }
```

### Étape 2 — `POST /Dropdowns/State` (v2)

**Pourquoi :** champ `status` de chaque asset.

```json
{ "name": "En production" }
{ "name": "Maintenance" }
{ "name": "En stock" }
{ "name": "En panne" }
```

### Étape 3 — `POST /Dropdowns/Manufacturer` (v2)

**Pourquoi :** champ `manufacturer` des Computer et Monitor.

```json
{ "name": "Dell" }
{ "name": "HP" }
{ "name": "Lenovo" }
```

### Étape 4 — `POST /Dropdowns/ComputerModel` (v2)

**Pourquoi :** champ `model` des Computer.

```json
{ "name": "OptiPlex 7010" }
{ "name": "ProDesk 400 G9" }
{ "name": "ThinkCentre M70" }
{ "name": "OptiPlex 7020" }
{ "name": "EliteDesk 800 G8" }
{ "name": "ThinkCentre M75" }
{ "name": "OptiPlex 7090" }
{ "name": "ProDesk 600 G6" }
{ "name": "ThinkCentre Neo 50" }
```

### Étape 5 — `POST /Dropdowns/MonitorModel` (v2)

**Pourquoi :** champ `model` du Monitor.

```json
{ "name": "AC1000" }
```

### Étape 6 — `POST /Administration/User` (v2)

**Pourquoi :** chaque asset a un utilisateur assigné. Doit exister avant les assets.

```json
{ "name": "rakoto.jean",             "realname": "Jean",    "firstname": "Rakoto" }
{ "name": "rasoanaivo.marie",        "realname": "Marie",   "firstname": "Rasoanaivo" }
{ "name": "rakotondranaivo.paul",    "realname": "Paul",    "firstname": "Rakotondranaivo" }
{ "name": "rabe.hanitra",            "realname": "Hanitra", "firstname": "Rabe" }
{ "name": "rakoto.michel",           "realname": "Michel",  "firstname": "Rakoto" }
```

> **Note :** `ITU Labs` et `Bibliothèque` sont probablement des **groupes**, pas des users — à vérifier dans GLPI (`Group` vs `User`).

### Étape 7 — `POST /Assets/Computer` (v2)

**Pourquoi :** entité principale du fichier 1. Dépend des étapes 1–6.

```json
{
  "name": "PC-ADM-001",
  "states_id": "<id State 'En production'>",
  "locations_id": "<id Location 'Administration'>",
  "manufacturers_id": "<id Manufacturer 'Dell'>",
  "computermodels_id": "<id ComputerModel 'OptiPlex 7010'>",
  "otherserial": "ITU-2026-0001",
  "users_id": "<id User 'Rakoto Jean'>"
}
```

→ 9 lignes à importer (`PC-ADM-001` → `PC-FORM-001`)

### Étape 8 — `POST /Assets/Monitor` (v2)

**Pourquoi :** 1 monitor dans le PDF. Dépend des étapes 1–6.

```json
{
  "name": "MN-FORM-002",
  "states_id": "<id State 'En panne'>",
  "locations_id": "<id Location 'Salle 301'>",
  "manufacturers_id": "<id Manufacturer 'Dell'>",
  "monitormodels_id": "<id MonitorModel 'AC1000'>",
  "otherserial": "ITU-2026-0010",
  "users_id": "<id User 'Rakoto Michel'>"
}
```

---

## Fichier 2 — `tickets.csv` _(page 2 du PDF)_

Données : 2 tickets + leurs liaisons aux assets (Item_Ticket).

### Étape 9 — `POST /Assistance/Ticket` (v2)

**Pourquoi :** entité principale. Dépend de User (étape 6).

```json
// Ticket 1
{
  "name": "Tsy mandeha",
  "content": "hafahafa be",
  "status": 1,
  "priority": 3,
  "type": 1,
  "date": "2026-06-03 13:45:00"
}

// Ticket 2
{
  "name": "Michauffe",
  "content": "mamay be",
  "status": 1,
  "priority": 3,
  "type": 1,
  "date": "2026-06-04 13:45:00"
}
```

> `status 1` = New · `priority 3` = Medium · `type 1` = Incident

### Étape 10 — `POST /Item_Ticket` (v1)

**Pourquoi :** liaison Ticket ↔ Asset. Dépend de Ticket (étape 9) ET de Computer/Monitor (étapes 7–8).
Pas d'équivalent direct stable en v2 → rester en v1.

```json
// Ticket 1 → PC-ADM-001
{ "tickets_id": "<id T1>", "items_id": "<id PC-ADM-001>", "itemtype": "Computer" }

// Ticket 2 → PC-ADM-001
{ "tickets_id": "<id T2>", "items_id": "<id PC-ADM-001>", "itemtype": "Computer" }

// Ticket 2 → MN-FORM-002
{ "tickets_id": "<id T2>", "items_id": "<id MN-FORM-002>", "itemtype": "Monitor" }
```

---

## Fichier 3 — `ticket_costs.csv` _(page 3 du PDF)_

Données : coûts (`duration`, `time_cost`, `fixed_cost`) liés au Ticket 1.

### Étape 11 — `POST /TicketCost` (v1)

**Pourquoi :** sous-entité du Ticket. Dépend de Ticket (étape 9).
En v1 : `/TicketCost`. En v2 : `/Assistance/TicketCost` (si dispo sur l'instance).

```json
// Ligne 1
{ "tickets_id": "<id T1>", "actiontime": 0,   "cost_time": 0,   "cost_fixed": 109 }

// Ligne 2
{ "tickets_id": "<id T1>", "actiontime": 600, "cost_time": 8.7, "cost_fixed": 50 }
```

> `actiontime` est en **secondes** · `cost_time` en **€/h** (unité monétaire configurée dans GLPI)

---

## Fichier 4 — `images.zip` _(photos des assets)_

Données : fichiers image à attacher aux entités Computer/Monitor.

### Étape 12 — `POST /Document` (v1 — upload multipart)

**Pourquoi :** GLPI stocke les fichiers dans l'entité Document, puis les lie à n'importe quelle entité via `Document_Item`. L'API v2 ne supporte pas encore l'upload binaire → v1 obligatoire.

```
POST /apirest.php/Document
Headers : Content-Type: multipart/form-data
Body    :
  uploadManifest = { "input": { "name": "Photo PC-ADM-001", "_filename": ["PC-ADM-001.jpg"] } }
  filename[0]    = <binary file>
```

Retourne `{ "id": <doc_id> }`

### Étape 13 — `POST /Document_Item` (v1)

**Pourquoi :** lie le Document (étape 12) à l'asset concerné. Dépend de Document (étape 12) ET de Computer/Monitor (étapes 7–8).

```json
{
  "documents_id": "<doc_id>",
  "items_id": "<id PC-ADM-001>",
  "itemtype": "Computer"
}
```

---

## Récapitulatif — ordre global d'import

| # | Endpoint | Version | Fichier |
|---|----------|---------|---------|
| 1 | `POST /Dropdowns/Location` | v2 | fichier 1 |
| 2 | `POST /Dropdowns/State` | v2 | fichier 1 |
| 3 | `POST /Dropdowns/Manufacturer` | v2 | fichier 1 |
| 4 | `POST /Dropdowns/ComputerModel` | v2 | fichier 1 |
| 5 | `POST /Dropdowns/MonitorModel` | v2 | fichier 1 |
| 6 | `POST /Administration/User` | v2 | fichier 1 |
| 7 | `POST /Assets/Computer` | v2 | fichier 1 |
| 8 | `POST /Assets/Monitor` | v2 | fichier 1 |
| 9 | `POST /Assistance/Ticket` | v2 | fichier 2 |
| 10 | `POST /Item_Ticket` | v1 | fichier 2 |
| 11 | `POST /TicketCost` | v1 | fichier 3 |
| 12 | `POST /Document` | v1 | fichier 4 |
| 13 | `POST /Document_Item` | v1 | fichier 4 |
