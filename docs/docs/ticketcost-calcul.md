# TicketCost GLPI — Logique de calcul

## Structure d'un TicketCost

Un ticket peut avoir **plusieurs TicketCost**. Chaque enregistrement contient :

| Champ | Type | Description |
|---|---|---|
| `ticket` | relation | ticket parent |
| `name` | string | libellé |
| `duration` | integer | durée en **secondes** |
| `cost_time` | number | taux horaire (€/h) |
| `cost_fixed` | number | forfait fixe (€) |
| `cost_material` | number | coût matériel (€) |
| `budget` | relation | budget imputé |
| `date_begin` | string | début de période |
| `date_end` | string | fin de période |

---

## Quand utiliser chaque champ

| Champ | Cas d'usage |
|---|---|
| `cost_time` | Coût basé sur du temps passé — technicien, prestation horaire |
| `cost_fixed` | Forfait indépendant du temps — déplacement, licence, intervention |
| `cost_material` | Pièces ou matériaux utilisés — disque dur, câble, toner |

---

## Formule de calcul

### Coût total d'une ligne

```
montant_temps = cost_time × (duration / 3600)
coût_total    = montant_temps + cost_fixed + cost_material
```

> `cost_time` est un **taux horaire**, pas un montant. Il faut le multiplier par la durée convertie en heures.

### Totaux affichés par GLPI

```
total coût horaire   = Σ (cost_time_i × duration_i / 3600)   -- somme des montants temps
total coût fixe      = Σ cost_fixed_i
total coût matériel  = Σ cost_material_i
coût total ticket    = total coût horaire + total coût fixe + total coût matériel
```

---

## Exemple complet — 4 TicketCost

### Données insérées

| # | duration | cost_time (taux/h) | cost_fixed | cost_material |
|---|---|---|---|---|
| 1 | 0s | 0.00 | 109.00 | 0.00 |
| 2 | 600s (10min) | 8.70 | 50.00 | 0.00 |
| 3 | 1800s (30min) | 60.00 | 0.00 | 25.00 |
| 4 | 3600s (1h) | 40.00 | 20.00 | 10.00 |

### Calcul ligne par ligne

**Ligne 1**
```
montant_temps = 0 × (0 / 3600)       = 0.00
coût_total    = 0.00 + 109.00 + 0.00 = 109.00 €
```

**Ligne 2**
```
montant_temps = 8.70 × (600 / 3600)  = 1.45
coût_total    = 1.45 + 50.00 + 0.00  = 51.45 €
```

**Ligne 3**
```
montant_temps = 60 × (1800 / 3600)   = 30.00
coût_total    = 30.00 + 0.00 + 25.00 = 55.00 €
```

**Ligne 4**
```
montant_temps = 40 × (3600 / 3600)   = 40.00
coût_total    = 40.00 + 20.00 + 10.00 = 70.00 €
```

### Affichage GLPI

| | Durée | Coût horaire | Coût fixe | Coût matériel | Coût total |
|---|---|---|---|---|---|
| (1) | 0s | 0.00 | 109.00 | 0.00 | 109.00 |
| (2) | 10min | 8.70 | 50.00 | 0.00 | 51.45 |
| (3) | 30min | 60.00 | 0.00 | 25.00 | 55.00 |
| (4) | 1h | 40.00 | 20.00 | 10.00 | 70.00 |
| **Total** | **1h40min** | **71.45** | **179.00** | **35.00** | **285.45** |

### Calcul du total

```
durée totale         = 0 + 600 + 1800 + 3600  = 6000s  (1h40min)
total coût horaire   = 0 + 1.45 + 30 + 40     = 71.45 €
total coût fixe      = 109 + 50 + 0 + 20       = 179.00 €
total coût matériel  = 0 + 0 + 25 + 10         = 35.00 €
coût total ticket    = 71.45 + 179.00 + 35.00  = 285.45 €
```

---

## Points importants

- La **ligne de total** affichée par GLPI n'est pas un TicketCost stocké — c'est un calcul à la volée.
- La colonne **"Coût horaire"** dans le total n'est pas un taux mais la **somme des montants temps** de toutes les lignes — ce libellé est trompeur.
- `cost_time = 0` avec `duration = 0` → contribution nulle au coût total, seul `cost_fixed` compte.
- Un même ticket peut avoir autant de TicketCost que nécessaire, chacun pouvant être imputé sur un **budget différent**.

---

## Endpoint API V2

```
GET    /Assistance/Ticket/{id}/Cost              -- liste tous les coûts du ticket
POST   /Assistance/Ticket/{id}/Cost              -- ajouter un coût
GET    /Assistance/Ticket/{id}/Cost/{cost_id}    -- un coût précis
PATCH  /Assistance/Ticket/{id}/Cost/{cost_id}    -- modifier
DELETE /Assistance/Ticket/{id}/Cost/{cost_id}    -- supprimer
```
