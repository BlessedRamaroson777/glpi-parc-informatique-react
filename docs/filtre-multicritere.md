# Filtre multi-critères — Comment ça fonctionne

## Vue d'ensemble

Le filtre multi-critères fonctionne entièrement **côté client** (dans le navigateur).  
On charge les données une seule fois depuis l'API, puis on filtre localement sans refaire de requête.

```
API → données brutes → stockées en mémoire → filtrées à l'affichage
```

---

## Étape 1 — Chargement initial

Au démarrage du composant, on charge **tous** les assets :

```js
React.useEffect(() => {
    getAllAssets().then(setAssets)
}, [])
```

`assets` contient par exemple :
```js
[
    { id: 1, name: "PC-ADM-001", type: "Computer", status: "Nouveau", location: "Administration", user: "glpi", serial: "SN123" },
    { id: 2, name: "MN-FORM-002", type: "Monitor",  status: "Nouveau", location: "Formation",      user: "glpi", serial: "SN456" },
]
```

---

## Étape 2 — L'état des filtres

Chaque champ de filtre est une clé dans l'objet `filters` :

```js
const [filters, setFilters] = React.useState({
    name:         "",   // vide = pas de filtre actif
    type:         "all",
    status:       "",
    location:     "",
    user:         "",
    user_tech:    "",
    manufacturer: "",
    model:        "",
    serial:       "",
    entity:       "",
})
```

**Règle simple :**
- Valeur vide `""` → ce critère est ignoré, tous les assets passent
- Valeur remplie `"PC"` → seuls les assets dont le champ contient "PC" passent

---

## Étape 3 — Mise à jour d'un filtre

Quand tu tapes dans un champ, la fonction `set(key)` met à jour le filtre correspondant :

```js
function set(key) {
    return e => setFilters(f => ({ ...f, [key]: e.target.value }))
}
```

Exemple : tu tapes "PC" dans le champ Nom
```js
// filters devient :
{
    name: "PC",    // ← mis à jour
    type: "all",   // ← inchangé
    status: "",    // ← inchangé
    ...
}
```

---

## Étape 4 — Le calcul de `filtered`

À chaque changement de `filters`, React recalcule automatiquement `filtered` :

```js
const filtered = assets.filter(a => matches(a, filters))
```

`Array.filter()` passe chaque asset dans la fonction `matches()`.  
Si `matches()` retourne `true` → l'asset est affiché.  
Si `matches()` retourne `false` → l'asset est caché.

---

## Étape 5 — La fonction `matches()`

C'est le cœur du filtre. Elle vérifie **tous les critères en même temps** :

```js
function matches(asset, filters) {
    const contains = (field, val) =>
        !val || (field ?? "").toLowerCase().includes(val.toLowerCase())

    return (
        (filters.type === "all" || asset.type === filters.type) &&
        contains(asset.name,         filters.name)         &&
        contains(asset.status,       filters.status)       &&
        contains(asset.location,     filters.location)     &&
        contains(asset.user,         filters.user)         &&
        contains(asset.user_tech,    filters.user_tech)    &&
        contains(asset.manufacturer, filters.manufacturer) &&
        contains(asset.model,        filters.model)        &&
        contains(asset.serial,       filters.serial)       &&
        contains(asset.entity,       filters.entity)
    )
}
```

### La fonction `contains`

```js
const contains = (field, val) =>
    !val || (field ?? "").toLowerCase().includes(val.toLowerCase())
```

Ligne par ligne :
- `!val` → si le filtre est vide, retourne `true` (pas de filtre = tout passe)
- `(field ?? "")` → si le champ de l'asset est `null`, on utilise `""` pour éviter une erreur
- `.toLowerCase()` → rend la recherche insensible à la casse ("pc" trouve "PC-ADM-001")
- `.includes(val)` → vérifie si le champ **contient** la valeur (pas forcément égal)

### Le `&&` entre chaque critère

Tous les critères sont combinés avec `&&` (ET logique).  
Un asset n'est affiché que si **tous** les critères actifs correspondent.

---

## Exemple concret

Assets disponibles :
```
#1 PC-ADM-001  | Computer | Administration | glpi
#2 MN-FORM-002 | Monitor  | Formation      | glpi
#3 PC-FORM-003 | Computer | Formation      | normal
```

### Scénario 1 — Filtre sur le nom "PC"
```
filters.name = "PC"

#1 PC-ADM-001  → "PC-ADM-001".includes("pc") → true  ✓
#2 MN-FORM-002 → "MN-FORM-002".includes("pc") → false ✗
#3 PC-FORM-003 → "PC-FORM-003".includes("pc") → true  ✓

Résultat : #1 et #3
```

### Scénario 2 — Filtre type "Computer" + localisation "Form"
```
filters.type     = "Computer"
filters.location = "Form"

#1 PC-ADM-001  | Computer | Administration → type ✓ mais location ✗
#2 MN-FORM-002 | Monitor  | Formation      → type ✗
#3 PC-FORM-003 | Computer | Formation      → type ✓ et location ✓

Résultat : #3 seulement
```

### Scénario 3 — Aucun filtre
```
Tous les champs vides → contains() retourne true pour tout

Résultat : #1, #2, #3
```

---

## Pourquoi côté client et pas côté serveur ?

| Côté client (notre approche) | Côté serveur (alternative) |
|---|---|
| 1 seul appel API au démarrage | 1 appel API à chaque frappe |
| Résultats instantanés | Délai réseau à chaque filtre |
| Simple à implémenter | Plus complexe (debounce, annulation…) |
| OK pour quelques centaines d'assets | Nécessaire pour des milliers d'assets |

Pour un parc de moins de 500 assets, le filtrage côté client est largement suffisant et plus fluide.

---

## Réinitialisation

```js
const EMPTY_FILTERS = { name: "", type: "all", status: "", ... }

function reset() {
    setFilters(EMPTY_FILTERS)
}
```

Le bouton "Réinitialiser" apparaît seulement si au moins un filtre est actif :

```js
const hasFilters = Object.entries(filters).some(
    ([k, v]) => k === "type" ? v !== "all" : v !== ""
)
```
