# ⚛️ React — State (useState) et Effets (useEffect)

## 1. useState — Garder des données en mémoire

`useState` permet de créer une variable qui, **quand elle change, re-render le composant** automatiquement.

### Syntaxe

```jsx
const [valeur, setValeur] = useState(valeurInitiale);
//      ↑           ↑                   ↑
//  la variable  la fonction       la valeur
//  actuelle     pour la           de départ
//               modifier
```

### Exemples du projet

```jsx
// TicketDetail.jsx — Les 4 states de la page
const [ticket, setTicket]             = useState(state?.ticket ?? null);   // Le ticket à afficher
const [items, setItems]               = useState([]);    // Les éléments liés (tableau vide au départ)
const [costs, setCosts]               = useState([]);    // Les coûts (tableau vide)
const [costsLoading, setCostsLoading] = useState(false); // Indicateur de chargement
```

### Les règles d'or de useState

**1. Ne JAMAIS modifier la valeur directement**
```jsx
// ❌ FAUX — React ne détecte pas le changement, pas de re-render
ticket.name = "Nouveau nom";

// ✅ VRAI — On crée un nouvel objet
setTicket({ ...ticket, name: "Nouveau nom" });
```

**2. Pour les tableaux, ne pas utiliser .push()**
```jsx
// ❌ FAUX — .push() modifie le tableau existant, React ne re-render pas
items.push(nouvelItem);

// ✅ VRAI — On crée un nouveau tableau avec le spread operator
setItems([...items, nouvelItem]);

// ✅ VRAI — Pour supprimer un élément
setItems(items.filter(item => item.id !== idASupprimer));
```

**3. Quand le nouveau state dépend de l'ancien, utiliser la forme fonctionnelle**
```jsx
// ❌ Risque de bug si plusieurs setCount sont appelés vite
setCount(count + 1);

// ✅ Toujours la dernière valeur
setCount(prev => prev + 1);

// ✅ Exemple réel du projet (CreateTicket.jsx)
setSelectedAssets(prev => [...prev, asset]);
```

### Valeurs initiales courantes

```jsx
useState(null)    // → Un objet qu'on ne connaît pas encore (ticket, user...)
useState([])      // → Un tableau vide (liste de tickets, d'items...)
useState(false)   // → Un booléen (chargement, erreur, modal ouverte...)
useState("")      // → Une string vide (champ de recherche, input...)
useState(0)       // → Un nombre (compteur, page actuelle...)
useState({        // → Un objet formulaire (CreateTicket.jsx)
    name: "",
    content: "",
    type: 1,
})
```

---

## 2. useEffect — Exécuter du code au bon moment

`useEffect` permet d'exécuter du code **après le rendu** du composant. C'est là qu'on fait les appels API, les abonnements, etc.

### Syntaxe

```jsx
useEffect(() => {
    // Code à exécuter
}, [dépendances]);
//       ↑
// Quand est-ce qu'on ré-exécute le code ?
```

### Les 3 cas de useEffect

#### Cas 1 : Tableau vide `[]` → Une seule fois au chargement

```jsx
// S'exécute 1 seule fois quand le composant apparaît à l'écran
useEffect(() => {
    getAllAssets().then(setAllAssets);
    getITILCategories().then(setCategories);
    getRequestTypes().then(setRequestTypes);
}, []); // ← tableau vide = une seule fois
```

**Exemple réel** (CreateTicket.jsx) : Charger toutes les listes de référence au montage du formulaire.

#### Cas 2 : Avec dépendances `[variable]` → À chaque changement de la variable

```jsx
// Se ré-exécute CHAQUE FOIS que ticket.id change
useEffect(() => {
    if (!ticket?.id) return;       // ← garde : ne rien faire si pas d'ID

    // Charger les items liés au ticket
    getTicketItems(ticket.id)
        .then(async (data) => {
            // ... résoudre les détails de chaque item
            setItems(resolvedItems);
        })
        .catch(() => setItems([]));

    // Charger les coûts
    setCostsLoading(true);
    apiV2.get(`/api.php/v2.3/Assistance/Ticket/${ticket.id}/Cost`)
        .then(data => setCosts(Array.isArray(data) ? data : (data?.data ?? [])))
        .catch(() => setCosts([]))
        .finally(() => setCostsLoading(false));

}, [ticket?.id]); // ← se relance quand ticket.id change
```

#### Cas 3 : Sans tableau → À CHAQUE re-render (⚠️ DANGEREUX)

```jsx
// ❌ DANGER : S'exécute à chaque re-render → boucle infinie si setState dedans !
useEffect(() => {
    fetchData().then(setData);
}); // ← PAS de tableau de dépendances
```

### Pattern complet : Charger des données au chargement

```jsx
export default function MaPage() {
    const [data, setData]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    useEffect(() => {
        setLoading(true);

        monService.getAll()
            .then(result => {
                setData(result);          // ✅ On stocke les données
            })
            .catch(err => {
                setError(err.message);    // ✅ On stocke l'erreur
            })
            .finally(() => {
                setLoading(false);        // ✅ On arrête le chargement dans tous les cas
            });
    }, []);

    if (loading) return <p>Chargement...</p>;
    if (error)   return <p>Erreur : {error}</p>;

    return (
        <div>
            {data.map(item => <p key={item.id}>{item.name}</p>)}
        </div>
    );
}
```

---

## 3. Les pièges les plus courants

### Piège 1 : Boucle infinie

```jsx
// ❌ BUG : Chaque appel à setData provoque un re-render, 
//         qui relance le useEffect, qui refait setData...
useEffect(() => {
    fetchData().then(setData);
}); // ← Il manque le tableau de dépendances []

// ✅ CORRIGÉ
useEffect(() => {
    fetchData().then(setData);
}, []); // ← Ajout de []
```

### Piège 2 : L'état ne se met pas à jour immédiatement

```jsx
const [count, setCount] = useState(0);

function handleClick() {
    setCount(count + 1);
    console.log(count); // ← Affiche TOUJOURS l'ancienne valeur (0, pas 1)
    // Le nouveau count sera disponible au PROCHAIN render
}
```

### Piège 3 : Objet/tableau dans les dépendances

```jsx
// ❌ BUG : {} !== {} en JavaScript, donc ça se relance à chaque render
const params = { limit: 10 };
useEffect(() => {
    apiV2.get('/endpoint', params);
}, [params]); // ← params est un NOUVEL objet à chaque render

// ✅ Solution 1 : Mettre les valeurs primitives en dépendance
const limit = 10;
useEffect(() => {
    apiV2.get('/endpoint', { limit });
}, [limit]); // ← un nombre ne change pas

// ✅ Solution 2 : useMemo (avancé)
const params = useMemo(() => ({ limit: 10 }), []);
```

### Piège 4 : Oublier le early return (garde)

```jsx
// ❌ BUG : Si ticket est null, ticket.id crashe avec "Cannot read property 'id' of null"
useEffect(() => {
    getTicketItems(ticket.id).then(setItems);
}, [ticket?.id]);

// ✅ CORRIGÉ : Toujours vérifier avant d'utiliser
useEffect(() => {
    if (!ticket?.id) return;  // ← GARDE : on sort si pas de ticket
    getTicketItems(ticket.id).then(setItems);
}, [ticket?.id]);
```

### Piège 5 : Appeler une fonction async dans useEffect

```jsx
// ❌ FAUX : useEffect ne peut pas être async directement
useEffect(async () => {
    const data = await fetchData();
    setData(data);
}, []);

// ✅ CORRIGÉ : Créer une fonction async à l'intérieur
useEffect(() => {
    async function charger() {
        const data = await fetchData();
        setData(data);
    }
    charger();
}, []);

// ✅ ALTERNATIVE avec .then() (utilisé dans le projet)
useEffect(() => {
    fetchData().then(setData).catch(console.error);
}, []);
```
