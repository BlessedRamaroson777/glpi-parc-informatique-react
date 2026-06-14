# ⚛️ React — Listes, .map() et Pièges

## 1. Afficher une liste avec .map()

`.map()` transforme un tableau en un nouveau tableau. En React, on l'utilise pour transformer des données en éléments JSX.

```jsx
const fruits = ["Pomme", "Banane", "Orange"];

return (
    <ul>
        {fruits.map((fruit, index) => (
            <li key={index}>{fruit}</li>
        ))}
    </ul>
);
// Résultat :
// • Pomme
// • Banane
// • Orange
```

### Exemple réel du projet (TicketDetail.jsx — afficher l'équipe)

```jsx
{ticket.team.map((m, i) => (
    <li key={i} className="team-item">
        <div className="team-avatar">
            {(m.display_name || m.name || "?").slice(0, 2).toUpperCase()}
        </div>
        <span className="team-name">{m.display_name || m.name}</span>
        <span className="team-role">{m.role}</span>
    </li>
))}
```

## 2. La prop `key` — OBLIGATOIRE

React a besoin d'une `key` unique pour chaque élément d'une liste pour savoir quoi re-render.

```jsx
// ✅ BIEN — Utiliser un ID unique
{costs.map(cost => (
    <div key={cost.id}>...</div>
))}

// ⚠️ ACCEPTABLE — Utiliser l'index si pas d'ID (mais déconseillé)
{costs.map((cost, i) => (
    <div key={i}>...</div>
))}

// ❌ FAUX — Pas de key du tout → Warning React
{costs.map(cost => (
    <div>...</div>
))}

// ❌ FAUX — Même key pour tous → Bug silencieux
{costs.map(cost => (
    <div key="item">...</div>
))}
```

**Quand utiliser l'index vs un ID ?**
- Si les éléments ne sont **jamais réordonnés/supprimés** → `index` est OK
- Si les éléments peuvent être **supprimés, ajoutés, réordonnés** → Utiliser un ID

## 3. Quand est-ce que .map() ne marche PAS ?

### Erreur 1 : La variable n'est pas un tableau

```
TypeError: data.map is not a function
```

**Causes courantes :**
```jsx
// L'API renvoie un objet au lieu d'un tableau
const data = { results: [...] };    // data.map() → CRASH
const data = null;                  // data.map() → CRASH
const data = undefined;             // data.map() → CRASH

// ✅ Solutions
// Solution A : Valeur par défaut avec ??
const items = data ?? [];

// Solution B : Vérifier avec Array.isArray()
const items = Array.isArray(data) ? data : (data?.data ?? []);

// Solution C : Vérifier avant le .map() dans le JSX
{Array.isArray(costs) && costs.map(cost => (
    <div key={cost.id}>...</div>
))}
```

**Exemple réel du projet** (TicketDetail.jsx) :
```jsx
// L'API peut renvoyer un tableau OU un objet { data: [...] }
// Le code gère les deux cas :
apiV2.get(`/api.php/v2.3/Assistance/Ticket/${ticket.id}/Cost`)
    .then(data => setCosts(
        Array.isArray(data) ? data : (data?.data ?? [])
    //  Si c'est un tableau,     Sinon, chercher data.data,
    //  on l'utilise tel quel    sinon tableau vide
    ))
```

### Erreur 2 : Oublier le `return`

```jsx
// ❌ FAUX — Avec des accolades {}, il faut un return explicite
{items.map(item => {
    <div>{item.name}</div>    // ← Pas de return ! Retourne undefined
})}

// ✅ VRAI — Avec return
{items.map(item => {
    return <div>{item.name}</div>;
})}

// ✅ VRAI — Avec des parenthèses () → return implicite
{items.map(item => (
    <div>{item.name}</div>
))}

// ✅ VRAI — Sur une seule ligne → return implicite
{items.map(item => <div>{item.name}</div>)}
```

**Règle simple :**
- `=>  (` = parenthèses → return automatique ✅
- `=>  {` = accolades → il faut `return` manuellement

### Erreur 3 : Faire .map() sur le résultat de .get() (un seul objet)

```jsx
// ❌ FAUX — getById retourne UN objet, pas un tableau
const ticket = await getTicketById(42);
ticket.map(...);  // CRASH : ticket est un objet, pas un tableau

// ✅ VRAI — Pas besoin de .map() pour un seul objet
const ticket = await getTicketById(42);
setTicket(ticket);  // On le stocke directement
```

## 4. Filtrer une liste

```jsx
// Filtrer les assets par recherche
const filteredAssets = searchQuery.trim() === "" 
    ? []     // Si pas de recherche, liste vide
    : allAssets.filter(asset => 
        asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        asset.serial?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10);  // Maximum 10 résultats
```

## 5. Calculer un total avec .reduce()

`.reduce()` parcourt un tableau et accumule une valeur.

```jsx
// Exemple réel du projet — calculer le coût total
const totalCosts = costs.reduce((sum, c) => {
    const hours = (c.duration || 0) / 3600;       // Secondes → Heures
    return sum + (c.cost_fixed || 0) 
              + (c.cost_material || 0) 
              + (c.cost_time || 0) * hours;
}, 0);  // ← 0 est la valeur initiale de 'sum'

// Décomposé :
// Itération 1 : sum=0,   résultat → 0 + 100 + 50 + 200 = 350
// Itération 2 : sum=350, résultat → 350 + 0 + 30 + 100 = 480
// ...
```

## 6. Combiner .map() et des fonctions pour du code propre

```jsx
// Au lieu de tout mettre dans le JSX, extraire les calculs :
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return "—";
    return Number(amount).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function formatDuration(seconds) {
    if (!seconds) return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Puis dans le JSX, c'est propre :
{costs.map(cost => (
    <div key={cost.id}>
        <span>{cost.name}</span>
        <span>{formatCurrency(cost.cost_fixed)}</span>
        <span>{formatDuration(cost.duration)}</span>
    </div>
))}
```
