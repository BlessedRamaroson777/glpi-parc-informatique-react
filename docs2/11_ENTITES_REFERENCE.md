# 🧱 Entités — Référence Rapide

Fiche récapitulative de **toutes les entités** du projet avec leurs champs, méthodes et relations.

---

## Ticket

**Fichier** : `src/common/entities/Ticket.jsx`
**Style** : Pas de CRUD intégré (utilise `ticketService.jsx` à la place)

### Champs
| Champ | Type | Défaut | Description |
|-------|------|--------|-------------|
| id | number | null | ID du ticket |
| name | string | '' | Titre du ticket |
| content | string | '' | Description HTML |
| external_id | string | null | Référence externe |
| status | number | 1 | 1=Nouveau, 2=Attribué, 6=Clos |
| priority | number | null | 1=Très basse → 6=Majeure |
| urgency | number | null | 1=Très basse → 5=Très haute |
| impact | number | null | 1=Très bas → 5=Très haut |
| type | number | null | 1=Incident, 2=Demande |
| team | array | [] | Membres de l'équipe |

### Relations
| Champ | Type | Via |
|-------|------|-----|
| users_id_recipient | number | _normalizeId(data.user_recipient) |
| itilcategories_id | number | _normalizeId(data.category) |
| locations_id | number | _normalizeId(data.location) |
| entities_id | number | _normalizeId(data.entity) |

### Méthodes
- `toPayload()` → Transforme en objet pour l'API
- `validate()` → Retourne un tableau d'erreurs

### ⚠️ Attention
Le constructeur normalise les noms de champs. L'API v2 envoie `user_recipient`, le constructeur le stocke en `users_id_recipient`. Idem pour `date_solve` → `solvedate`.

---

## TicketCost

**Fichier** : `src/common/entities/TicketCost.jsx`
**Endpoint** : `/apirest.php/TicketCost`
**Style** : Méthodes d'instance

### Champs
| Champ | Type | Défaut |
|-------|------|--------|
| id | number | null |
| name | string | '' |
| comment | string | '' |
| date_begin | string | null |
| date_end | string | null |
| actiontime | number | 0 |
| cost_time | number | 0 |
| cost_fixed | number | 0 |
| cost_material | number | 0 |

### Relations
| Champ | Format |
|-------|--------|
| ticket | `{ id: Number }` |
| budget | `{ id: Number }` |
| entity | `{ id: Number }` |

### Méthodes
```javascript
const tc = new TicketCost();

await tc.save()                    // POST → Créer
await tc.update()                  // PUT  → Modifier
await tc.delete()                  // DELETE → Supprimer
await tc.getById(id)               // GET  → Par ID
await tc.getAll(params)            // GET  → Tous
await tc.getByTicket(ticketId)     // GET  → Par ticket
tc.getTotalCost()                  // Calcul local du coût total
tc.validate()                      // Validation locale
```

### ⚠️ Format d'envoi
```javascript
await apiV2.post(endpoint, { input: payload })  // ← Enveloppé dans { input }
await apiV2.put(endpoint, { input: payload })    // ← PUT, pas PATCH
```

---

## Computer

**Fichier** : `src/common/entities/Computer.jsx`
**Endpoint** : `Assets/Computer`
**Style** : Méthodes statiques + instance

### Champs
| Champ | Type | Défaut |
|-------|------|--------|
| id, name, comment | standard | '' |
| serial, otherserial, uuid | string | '' |
| is_deleted, is_template, is_dynamic | boolean | false |
| date_creation, date_mod, last_inventory_update, last_boot | date | null |

### Relations
| Champ | Format |
|-------|--------|
| entity, location, manufacturer | `{ id: Number }` |
| user, user_tech | `{ id: Number }` |
| type, model, status | `{ id: Number }` |
| group, group_tech | `[{ id: Number }]` |

### Méthodes
```javascript
// Statiques
await Computer.getById(5)
await Computer.getAll({ limit: 10 })
await Computer.exists(5)
await Computer.findOne({ filter: "name==PC-01" })
await Computer.getByUser(userId)
await Computer.getByManufacturer(mfgId)
await Computer.getByLocation(locId)
await Computer.getByModel(modelId)
await Computer.getByStatus(statusId)

// Instance
const pc = new Computer({ name: "PC-NEW", serial: "XYZ" });
pc.entity = { id: 1 };
await pc.save()
await pc.update()
await pc.delete(purge = false)
await pc.getInfocom()     // → ComputerInfocom
```

---

## Monitor

**Fichier** : `src/common/entities/Monitor.jsx`
**Endpoint** : `Assets/Monitor`
**Style** : Méthodes d'instance

### Champs spécifiques
| Champ | Type | Description |
|-------|------|-------------|
| size | number | Taille de l'écran (pouces) |
| ticket_tco | number | Coût total de possession |
| has_hdmi, has_dvi, has_displayport, has_subd, has_bnc | boolean | Connectiques |
| has_microphone, has_speaker, has_pivot | boolean | Caractéristiques |

### Méthodes spécifiques
```javascript
const m = new Monitor();
await m.getByStatus(statusId)
await m.getByUser(userId)
await m.getByTech(userId)
await m.getByModel(modelId)
await m.searchByName("Dell")
await m.getHDMIMonitors()
await m.getDVIMonitors()
m.getAvailableConnections()   // → ["HDMI", "DisplayPort", ...]
m.isInTrash()
m.isTemplate()
```

---

## User

**Fichier** : `src/common/entities/User.jsx`
**Endpoint** : `Administration/User`
**Style** : Méthodes d'instance

### Champs spécifiques
| Champ | Type | Description |
|-------|------|-------------|
| username, realname, firstname | string | Identité |
| phone, phone2, mobile | string | Contacts |
| password, password2 | string | writeOnly |
| is_active | boolean | Compte actif ? |
| authtype | number | Type d'auth (1=GLPI, 2=LDAP, 3=Mail...) |
| emails | array | Liste des emails |

### Méthodes spécifiques
```javascript
const u = new User();
await u.getByUsername("jean")
await u.getByEmail("jean@mail.com")
await u.getActive()
await u.getInactive()
await u.getDeleted()
await u.getLDAPUsers()
await u.searchByName("jean")
await u.activate()
await u.deactivate()
await u.changePassword("newpass", "newpass")
u.getFullName()           // → "Jean Dupont"
u.getDisplayName()        // → "Jean Dupont" ou username
u.getPrimaryEmail()       // → "jean@mail.com"
u.isActive()              // → true/false (vérifie aussi les dates)
u.getAuthTypeLabel()      // → "GLPI interne", "LDAP", etc.
```

---

## TicketFollowup

**Fichier** : `src/common/entities/TicketFollowup.jsx`
**Endpoint** : `Assistance/ITILFollowup`
**Style** : Méthodes d'instance

### Champs
| Champ | Type | Description |
|-------|------|-------------|
| content | string | Contenu du followup |
| is_private | boolean | Visible uniquement par les techniciens |
| timeline_position | number | Position dans la timeline |
| itemtype | string | Toujours "Ticket" |
| items_id | number | ID du ticket |

### ⚠️ Relation polymorphique
Le lien vers le ticket utilise `itemtype` + `items_id` :
```javascript
// Créer
payload.itemtype = 'Ticket';
payload.items_id = Number(this.ticket.id);

// Filtrer
filter: `items_id==${ticketId};itemtype==Ticket`
```

---

## TicketItem

**Fichier** : `src/common/entities/TicketItem.jsx`
**Endpoint** : `Support/Ticket_Item` (v2) ou `Ticket_Item` (v1)
**Style** : Méthodes statiques avec choix de version API

### Particularité : Choix de l'API
```javascript
// Avec v2 (par défaut)
await TicketItem.getByTicket(42)          // v2
await TicketItem.getByTicket(42, 'v1')    // v1

// Le format du payload change :
// v1 : { input: { tickets_id, itemtype, items_id } }
// v2 : { tickets_id, itemtype, items_id }
```

---

## Résumé des Endpoints par Entité

| Entité | Endpoint | Verbe modif | Format envoi |
|--------|----------|-------------|--------------|
| Ticket | (via ticketService) | PATCH | Direct |
| TicketCost | `/apirest.php/TicketCost` | PUT | `{ input: ... }` |
| Computer | `Assets/Computer` | PATCH | Direct |
| Monitor | `Assets/Monitor` | PATCH | Direct |
| User | `Administration/User` | PATCH | Direct |
| TicketFollowup | `Assistance/ITILFollowup` | PATCH | Direct |
| TicketItem | `Support/Ticket_Item` | PATCH | Direct (v2) / `{ input }` (v1) |
