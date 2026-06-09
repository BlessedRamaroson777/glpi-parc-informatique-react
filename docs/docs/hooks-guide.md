# Hooks React — Guide complet

## 1. `useState` — stocker une valeur

```jsx
import { useState } from 'react';

const [count, setCount] = useState(0);        // number
const [nom, setNom] = useState('');           // string
const [isOpen, setIsOpen] = useState(false);  // boolean
const [users, setUsers] = useState([]);       // array
const [user, setUser] = useState(null);       // object ou null
```

### Modifier un state

```jsx
// Valeur simple
setCount(5);
setCount(count + 1);
setNom('John');
setIsOpen(!isOpen);  // toggle

// Array — toujours créer un nouveau tableau
setUsers([...users, nouveauUser]);                          // ajouter
setUsers(users.filter((u) => u.id !== id));                // supprimer
setUsers(users.map((u) => u.id === id ? {...u, nom} : u)); // modifier un élément

// Object — toujours spread pour ne pas écraser les autres champs
setUser({ ...user, nom: 'John' });
setForm({ ...form, [e.target.name]: e.target.value });
```

### Forme fonctionnelle `prev =>`

Utiliser quand la nouvelle valeur dépend de l'ancienne — évite des bugs en mode concurrent.

```jsx
// ❌ Peut lire une valeur périmée si plusieurs updates s'enchaînent
setCount(count + 1)

// ✅ Toujours à jour
setCount(prev => prev + 1)
setTickets(prev => [...prev, ticket])
setTickets(prev => prev.filter(t => t.id !== id))
setForm(prev => ({ ...prev, [key]: value }))
```

---

## 2. `useEffect` — exécuter du code au bon moment

```jsx
import { useEffect } from 'react';

// Au montage (une seule fois)
useEffect(() => {
  fetchData();
}, []);

// Quand une variable change
useEffect(() => {
  fetchUserById(userId);
}, [userId]);

// Exemple complet — charger des données
useEffect(() => {
  const fetchData = async () => {
    try {
      const data = await apiV2.get('users');
      setUsers(data);
    } catch (error) {
      setError(error);
    }
  };
  fetchData();
}, []);
```

### Cleanup — nettoyage au démontage

```jsx
useEffect(() => {
  const timer = setInterval(() => setCount(c => c + 1), 1000)
  return () => clearInterval(timer)  // ← exécuté au démontage
}, [])

useEffect(() => {
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

### Règle des dépendances

```
[]              → exécuté une seule fois au montage
[a, b]          → exécuté au montage, puis à chaque fois que a ou b change
(rien)          → exécuté à chaque render — rarement voulu
```

---

## 3. `useCallback` — guide complet

### 3.1 Principe

À chaque render, React recrée toutes les fonctions déclarées dans le composant. `useCallback` mémorise une fonction — elle garde la même référence en mémoire tant que ses dépendances ne changent pas.

```jsx
import { useCallback } from 'react';

// Sans useCallback — nouvelle référence à chaque render
const handleClick = () => {
  console.log('clic');
};

// Avec useCallback — même référence tant que les dépendances ne changent pas
const handleClick = useCallback(() => {
  console.log('clic');
}, []); // ← tableau de dépendances, comme useEffect
```

### 3.2 Syntaxe

```jsx
const maFonction = useCallback(
  () => {
    // corps de la fonction
  },
  [dep1, dep2]  // dépendances — variables externes utilisées dans la fonction
);
```

**Règle des dépendances :** toute variable de l'extérieur de la fonction qui est lue à l'intérieur doit être dans le tableau.

---

### 3.3 Cas 1 — Handler simple sans dépendance

Aucune variable externe → tableau vide `[]`. La fonction est créée une seule fois au montage.

```jsx
function Corbeille() {
  const navigate = useNavigate()

  // ✅ navigate est stable (React Router garantit sa référence) → dans les deps quand même
  const handleVoirFiche = useCallback((id) => {
    navigate(`/fiche/${id}`)
  }, [navigate])

  return <button onClick={() => handleVoirFiche(42)}>Voir</button>
}
```

---

### 3.4 Cas 2 — Handler async

`useCallback` fonctionne exactement pareil avec `async`.

```jsx
function Corbeille() {
  const [tickets, setTickets] = useState([])

  const handleRestaurer = useCallback(async (id) => {
    try {
      await TicketService.restaurer(id)
      setTickets(prev => prev.filter(t => t.id !== id))  // ← setTickets stable, pas en dep
    } catch (err) {
      console.error(err)
    }
  }, [])
  //  ^^ [] car setTickets et TicketService sont stables (React garantit setXxx)

  return <button onClick={() => handleRestaurer(1)}>Restaurer</button>
}
```

> `setXxx` (les setters de useState) sont toujours stables — inutile de les mettre en dépendances.

---

### 3.5 Cas 3 — Dépendances qui changent

Si la fonction utilise des variables d'état ou des props, les mettre en dépendances.

```jsx
function Recherche({ categorieId }) {
  const [query, setQuery] = useState('')
  const [resultats, setResultats] = useState([])

  // query et categorieId changent → ils sont des dépendances
  const handleSearch = useCallback(async () => {
    const data = await apiV2.get(`search?q=${query}&cat=${categorieId}`)
    setResultats(data)
  }, [query, categorieId])
  //  ^^^^^^^^^^^^^^^^^ recréée seulement quand query ou categorieId change

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <button onClick={handleSearch}>Chercher</button>
    </>
  )
}
```

---

### 3.6 Cas 4 — `loadData` dans `useEffect` (pattern classique)

C'est le pattern le plus courant. On extrait le chargement en `useCallback` pour pouvoir l'appeler depuis `useEffect` ET depuis un bouton "Rafraîchir".

```jsx
function Tickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  // Extrait en useCallback → réutilisable depuis useEffect et depuis un bouton
  const loadTickets = useCallback(async () => {
    try {
      setLoading(true)
      const data = await TicketService.getAll()
      setTickets(data)
    } finally {
      setLoading(false)
    }
  }, [])
  //  ^^ pas de dépendances — les setters sont stables

  useEffect(() => {
    loadTickets()
  }, [loadTickets])
  //  ^^^^^^^^^^ loadTickets en dep de useEffect — ESLint l'exige, et c'est safe
  //             car loadTickets ne changera jamais ([] en deps de useCallback)

  return (
    <>
      {loading && <p>Chargement...</p>}
      <button onClick={loadTickets}>Rafraîchir</button>
      <ul>{tickets.map(t => <li key={t.id}>{t.name}</li>)}</ul>
    </>
  )
}
```

---

### 3.7 Cas 5 — Fonction passée en prop à un enfant

Sans `useCallback`, chaque render du parent crée une nouvelle référence → l'enfant re-render inutilement.

```jsx
// Enfant mémoisé avec React.memo
const BoutonSupprimer = React.memo(({ onDelete, id }) => {
  console.log('rendu BoutonSupprimer', id)
  return <button onClick={() => onDelete(id)}>Supprimer</button>
})

// Parent
function ListeTickets({ tickets }) {
  const [selected, setSelected] = useState(null)

  // Sans useCallback : BoutonSupprimer re-rend à chaque fois que selected change
  // Avec useCallback : BoutonSupprimer ne re-rend pas si sa logique n'a pas changé
  const handleDelete = useCallback(async (id) => {
    await TicketService.delete(id)
    setSelected(null)
  }, [])

  return (
    <ul>
      {tickets.map(t => (
        <li key={t.id}>
          {t.name}
          <BoutonSupprimer id={t.id} onDelete={handleDelete} />
        </li>
      ))}
    </ul>
  )
}
```

---

### 3.8 Cas 6 — Handler avec paramètre dans un `map`

Deux façons correctes de passer un paramètre dans un map avec useCallback.

```jsx
// Option A — factory : une fonction qui retourne une fonction
// ⚠️ Crée quand même N fonctions à chaque render (une par item)
const handleDelete = useCallback((id) => async () => {
  await TicketService.delete(id)
  setTickets(prev => prev.filter(t => t.id !== id))
}, [])

// Utilisation
{tickets.map(t => (
  <button key={t.id} onClick={handleDelete(t.id)}>Supprimer</button>
))}


// Option B — inline dans le map, useCallback sur la fonction générique (recommandé)
const handleDelete = useCallback(async (id) => {
  await TicketService.delete(id)
  setTickets(prev => prev.filter(t => t.id !== id))
}, [])

// La fonction inline dans le map est petite — acceptable ici
{tickets.map(t => (
  <button key={t.id} onClick={() => handleDelete(t.id)}>Supprimer</button>
))}
```

---

### 3.9 Cas 7 — Plusieurs callbacks interdépendants

Si un callback en appelle un autre, le mettre en dépendance.

```jsx
function Formulaire() {
  const [form, setForm] = useState({ nom: '', email: '' })
  const [errors, setErrors] = useState({})

  // 1. Validation — pas de dépendances (form vient en paramètre)
  const validate = useCallback((data) => {
    const errs = {}
    if (!data.nom)   errs.nom   = 'Nom requis'
    if (!data.email) errs.email = 'Email requis'
    return errs
  }, [])

  // 2. Submit — dépend de validate (et de form)
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    await apiV2.post('users', form)
  }, [form, validate])
  //  ^^^^^^^^^^^^^ form change → handleSubmit recréé → c'est voulu

  return (
    <form onSubmit={handleSubmit}>
      <input name="nom"   onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
      <input name="email" onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
      <button type="submit">Envoyer</button>
    </form>
  )
}
```

---

### 3.10 Cas 8 — Mise à jour de state basée sur la valeur précédente

Quand le callback modifie un state basé sur sa valeur actuelle, utiliser la forme fonctionnelle `prev =>` pour éviter de mettre le state en dépendance.

```jsx
// ❌ state en dépendance — useCallback recréé à chaque changement de count
const increment = useCallback(() => {
  setCount(count + 1)
}, [count])  // recréé à chaque fois que count change

// ✅ forme fonctionnelle — count pas en dépendance, callback stable
const increment = useCallback(() => {
  setCount(prev => prev + 1)
}, [])  // jamais recréé

// Même chose pour un tableau
const addTicket = useCallback((ticket) => {
  setTickets(prev => [...prev, ticket])
}, [])

// Et pour un objet
const updateField = useCallback((key, value) => {
  setForm(prev => ({ ...prev, [key]: value }))
}, [])
```

---

### 3.11 Quand NE PAS utiliser useCallback

`useCallback` a un coût : mémorisation en mémoire + comparaison des dépendances. Inutile si :

```jsx
// ❌ Inutile — composant simple sans enfants mémoisés ni useEffect dépendant
function BoutonSimple() {
  const handleClick = useCallback(() => {   // ❌ surcharge inutile
    console.log('clic')
  }, [])
  return <button onClick={handleClick}>OK</button>
}

// ✅ Correct — juste une fonction normale
function BoutonSimple() {
  const handleClick = () => {
    console.log('clic')
  }
  return <button onClick={handleClick}>OK</button>
}
```

```
Situation                                          useCallback utile ?
────────────────────────────────────────────────   ───────────────────
Passé en prop à un composant React.memo            ✅ oui
Dépendance d'un useEffect                          ✅ oui (évite boucle infinie)
Fonction loadData appelée aussi via un bouton      ✅ oui
Handler simple dans un composant sans enfants      ❌ non
Calcul qui ne va nul part                          ❌ non (utiliser useMemo)
```

---

### 3.12 Piège — dépendance manquante (boucle infinie)

```jsx
// ❌ BOUCLE INFINIE
// loadTickets est recréé à chaque render
// → useEffect se relance
// → render → loadTickets recréé → useEffect se relance...
function Tickets() {
  const [tickets, setTickets] = useState([])

  const loadTickets = async () => {        // ← pas de useCallback
    const data = await TicketService.getAll()
    setTickets(data)
  }

  useEffect(() => {
    loadTickets()
  }, [loadTickets])  // ← loadTickets change à chaque render → boucle
}

// ✅ FIX — useCallback stabilise loadTickets
function Tickets() {
  const [tickets, setTickets] = useState([])

  const loadTickets = useCallback(async () => {
    const data = await TicketService.getAll()
    setTickets(data)
  }, [])  // ← stable, ne change jamais

  useEffect(() => {
    loadTickets()
  }, [loadTickets])  // ← safe maintenant
}
```

---

### 3.13 Résumé

```
Situation                                 Pattern
───────────────────────────────────────   ──────────────────────────────────────────
Handler sans variable externe             useCallback(() => {}, [])
Handler avec state/props                  useCallback(() => {}, [state, prop])
Modifier state sur valeur précédente      useCallback(() => setX(prev => ...), [])
loadData pour useEffect + bouton          useCallback + useEffect([loadData])
Passé en prop à React.memo               useCallback obligatoire pour l'optimisation
Plusieurs callbacks liés                  dépendance entre callbacks dans les deps
Handler avec paramètre dans un map        useCallback sur la fn générique + inline () =>
Calcul (pas une fonction)                 useMemo à la place
Composant simple sans enfants mémoisés   pas besoin de useCallback
```

---

## 4. `useMemo` — guide complet

### 4.1 Principe

`useMemo` mémorise le **résultat d'un calcul**. React ne recalcule que si les dépendances changent. Entre les deux, il retourne la valeur mise en cache.

```jsx
import { useMemo } from 'react';

// Sans useMemo — recalculé à chaque render
const ticketsFiltres = tickets.filter(t => t.status === filtre);

// Avec useMemo — recalculé seulement si tickets ou filtre change
const ticketsFiltres = useMemo(
  () => tickets.filter(t => t.status === filtre),
  [tickets, filtre]
);
```

**Différence avec useCallback :**

```
useCallback(fn, deps)    →  mémorise une FONCTION
useMemo(() => val, deps) →  mémorise une VALEUR (résultat d'un calcul)
```

### 4.2 Syntaxe

```jsx
const valeurMémorisée = useMemo(
  () => calcul(dep1, dep2),  // fonction qui retourne la valeur
  [dep1, dep2]               // dépendances
);
```

---

### 4.3 Cas 1 — Filtrage d'une liste

Sans useMemo, le filtre tourne à chaque render même si `tickets` et `filtre` n'ont pas changé.

```jsx
function ListeTickets() {
  const [tickets, setTickets] = useState([])
  const [filtre, setFiltre] = useState('tous')
  const [search, setSearch] = useState('')

  // ✅ recalculé seulement si tickets ou filtre change
  // search ne fait pas partie des deps → changer la recherche ne retrigger pas ce filtre
  const ticketsFiltres = useMemo(() => {
    if (filtre === 'tous') return tickets
    return tickets.filter(t => t.status === filtre)
  }, [tickets, filtre])

  return (
    <>
      <select onChange={e => setFiltre(e.target.value)}>
        <option value="tous">Tous</option>
        <option value="open">Ouverts</option>
        <option value="closed">Fermés</option>
      </select>
      <input value={search} onChange={e => setSearch(e.target.value)} />
      <ul>
        {ticketsFiltres
          .filter(t => t.name.includes(search))  // ← filtre léger, pas besoin de useMemo
          .map(t => <li key={t.id}>{t.name}</li>)
        }
      </ul>
    </>
  )
}
```

---

### 4.4 Cas 2 — Tri d'une liste

`sort` mute le tableau — toujours faire une copie avec `[...arr]` avant de trier.

```jsx
function ListeTickets() {
  const [tickets, setTickets] = useState([])
  const [tri, setTri] = useState('date')   // 'date' | 'nom' | 'priorite'

  const ticketsTries = useMemo(() => {
    const copie = [...tickets]   // ← copie obligatoire, sort mute
    if (tri === 'nom')       return copie.sort((a, b) => a.name.localeCompare(b.name))
    if (tri === 'priorite')  return copie.sort((a, b) => b.priority - a.priority)
    return copie.sort((a, b) => new Date(b.date) - new Date(a.date))  // date desc
  }, [tickets, tri])

  return (
    <>
      <select onChange={e => setTri(e.target.value)}>
        <option value="date">Date</option>
        <option value="nom">Nom</option>
        <option value="priorite">Priorité</option>
      </select>
      <ul>{ticketsTries.map(t => <li key={t.id}>{t.name}</li>)}</ul>
    </>
  )
}
```

---

### 4.5 Cas 3 — Calcul coûteux (agrégat, stats)

Idéal pour les calculs sur de grandes listes (totaux, moyennes, groupements).

```jsx
function Dashboard() {
  const [tickets, setTickets] = useState([])
  const [costs, setCosts] = useState([])

  const stats = useMemo(() => {
    const total = costs.reduce((sum, c) => sum + (parseFloat(c.cost_fixed) || 0), 0)
    const ouverts = tickets.filter(t => t.status === 1).length
    const fermes  = tickets.filter(t => t.status === 6).length
    const parType = tickets.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1
      return acc
    }, {})
    return { total, ouverts, fermes, parType }
  }, [tickets, costs])

  return (
    <div>
      <p>Total coût : {stats.total.toFixed(2)} €</p>
      <p>Ouverts : {stats.ouverts} / Fermés : {stats.fermes}</p>
    </div>
  )
}
```

---

### 4.6 Cas 4 — Dériver des données depuis des props

```jsx
function FicheTicket({ ticket, users }) {

  const assigneNom = useMemo(() => {
    const user = users.find(u => u.id === ticket.userId)
    return user ? `${user.firstname} ${user.realname}` : 'Non assigné'
  }, [ticket.userId, users])

  const dateFormatee = useMemo(() => {
    return new Date(ticket.date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    })
  }, [ticket.date])

  return (
    <div>
      <p>Assigné à : {assigneNom}</p>
      <p>Créé le : {dateFormatee}</p>
    </div>
  )
}
```

---

### 4.7 Cas 5 — Grouper une liste par catégorie

```jsx
function AssetsParType({ assets }) {

  const assetsByType = useMemo(() => {
    return assets.reduce((acc, asset) => {
      const type = asset.itemtype
      if (!acc[type]) acc[type] = []
      acc[type].push(asset)
      return acc
    }, {})
  }, [assets])

  return (
    <div>
      {Object.entries(assetsByType).map(([type, liste]) => (
        <section key={type}>
          <h2>{type} ({liste.length})</h2>
          <ul>{liste.map(a => <li key={a.id}>{a.name}</li>)}</ul>
        </section>
      ))}
    </div>
  )
}
```

---

### 4.8 Cas 6 — Objet ou tableau passé en prop (stabilité de référence)

Un objet littéral `{}` ou un tableau `[]` créé dans le render est une nouvelle référence à chaque fois. Si un enfant `React.memo` reçoit cet objet en prop, il re-render inutilement.

```jsx
// ❌ Nouvelle référence à chaque render → enfant React.memo re-rend toujours
function Parent({ userId }) {
  const options = { userId, limit: 20, sort: 'date' }  // nouvel objet à chaque render
  return <EnfantMemo options={options} />
}

// ✅ Même référence tant que userId ne change pas
function Parent({ userId }) {
  const options = useMemo(
    () => ({ userId, limit: 20, sort: 'date' }),
    [userId]
  )
  return <EnfantMemo options={options} />
}

// Tableau de colonnes fixe
function TableauTickets({ tickets }) {
  const colonnes = useMemo(() => [
    { key: 'id',     label: 'Id' },
    { key: 'name',   label: 'Nom' },
    { key: 'status', label: 'Statut' },
  ], [])   // [] : ne change jamais

  return (
    <table>
      <thead>
        <tr>{colonnes.map(c => <th key={c.key}>{c.label}</th>)}</tr>
      </thead>
      <tbody>
        {tickets.map(t => (
          <tr key={t.id}>
            {colonnes.map(c => <td key={c.key}>{t[c.key]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

---

### 4.9 Cas 7 — Pipeline filtre + tri + search

Chaque calcul isolé dans son propre `useMemo`, chacun dépendant du résultat du précédent.

```jsx
function ListeTickets() {
  const [tickets, setTickets]   = useState([])
  const [filtre, setFiltre]     = useState('tous')
  const [tri, setTri]           = useState('date')
  const [search, setSearch]     = useState('')

  // Étape 1 — filtre par status
  const ticketsFiltres = useMemo(() => {
    if (filtre === 'tous') return tickets
    return tickets.filter(t => t.status === Number(filtre))
  }, [tickets, filtre])

  // Étape 2 — tri (dépend de ticketsFiltres)
  const ticketsTries = useMemo(() => {
    const copie = [...ticketsFiltres]
    if (tri === 'nom') return copie.sort((a, b) => a.name.localeCompare(b.name))
    return copie.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [ticketsFiltres, tri])

  // Étape 3 — search (dépend de ticketsTries)
  const ticketsAffiches = useMemo(() => {
    if (!search) return ticketsTries
    const q = search.toLowerCase()
    return ticketsTries.filter(t => t.name.toLowerCase().includes(q))
  }, [ticketsTries, search])

  return (
    <>
      <select onChange={e => setFiltre(e.target.value)}>
        <option value="tous">Tous</option>
        <option value="1">Nouveau</option>
        <option value="6">Fermé</option>
      </select>
      <select onChange={e => setTri(e.target.value)}>
        <option value="date">Date</option>
        <option value="nom">Nom</option>
      </select>
      <input placeholder="Rechercher..." onChange={e => setSearch(e.target.value)} />
      <p>{ticketsAffiches.length} résultat(s)</p>
      <ul>
        {ticketsAffiches.map(t => <li key={t.id}>{t.name}</li>)}
      </ul>
    </>
  )
}
```

---

### 4.10 Quand NE PAS utiliser useMemo

```jsx
// ❌ Inutile — calcul trivial
const label = useMemo(() => isAdmin ? 'Admin' : 'User', [isAdmin])
// ✅
const label = isAdmin ? 'Admin' : 'User'

// ❌ Inutile — petite liste, pas de calcul complexe
const noms = useMemo(() => users.map(u => u.nom), [users])
// ✅
const noms = users.map(u => u.nom)
```

```
Situation                                          useMemo utile ?
────────────────────────────────────────────────   ────────────────
filter / sort sur grande liste (> 100 items)       ✅ oui
Agrégat / stats / reduce complexe                  ✅ oui
Objet/tableau passé en prop à React.memo           ✅ oui (stabilité de référence)
Dériver des données depuis des props coûteuses     ✅ oui
Calcul simple (ternaire, concaténation)            ❌ non
Petite liste (< 50 items)                          ❌ non (sauf React.memo)
Valeur qui ne sert nulle part comme dep            ❌ non
```

---

### 4.11 Piège — ne pas muter la valeur mémorisée

```jsx
// ❌ Mutation directe — useMemo retourne la même référence, la mutation persiste
const liste = useMemo(() => tickets.filter(t => t.status === 1), [tickets])
liste.push({ id: 99, name: 'fake' })  // ❌ mute la valeur cachée

// ✅ Toujours copier avant de modifier
const listeCopie = [...liste]
listeCopie.push({ id: 99, name: 'fake' })
```

---

### 4.12 Résumé

```
Situation                                   Pattern
─────────────────────────────────────────   ───────────────────────────────────────────
Filtrer une liste                           useMemo(() => arr.filter(...), [arr, filtre])
Trier une liste                             useMemo(() => [...arr].sort(...), [arr, tri])
Calcul stats / totaux / reduce              useMemo(() => arr.reduce(...), [arr])
Dériver données depuis props                useMemo(() => calcul(props), [props.x])
Grouper par catégorie                       useMemo(() => arr.reduce({}, ...), [arr])
Objet littéral stable pour React.memo       useMemo(() => ({ ... }), [deps])
Tableau stable pour React.memo              useMemo(() => [...], [deps])
Tableau de colonnes fixe                    useMemo(() => [...colonnes], [])
Pipeline filtre → tri → search              3 useMemo chaînés
Calcul trivial / petite liste               variable normale const
```

---

## 5. Comparaison rapide des hooks de mémorisation

```
Hook           Mémorise        Quand recalcule     Usage
─────────────  ──────────────  ──────────────────  ──────────────────────────────────
useCallback    une fonction    quand deps changent  handler passé à React.memo / useEffect
useMemo        une valeur      quand deps changent  calcul coûteux, objet stable
useState       une valeur      jamais (explicite)   state du composant
useRef         une référence   jamais               accès DOM, valeur sans re-render
```
