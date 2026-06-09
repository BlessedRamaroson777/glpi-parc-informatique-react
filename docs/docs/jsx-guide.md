# Guide JSX — React

## 1. Structure d'un composant

```jsx
// Le minimum vital
function MonComposant() {
  return (
    <div>Bonjour</div>
  );
}

export default MonComposant;
```

---

## 2. Le `return` — règles fondamentales

### La parenthèse doit être sur la même ligne que `return`
```jsx
// ✅ Correct
return (
  <div>Contenu</div>
);

// ❌ Incorrect — JavaScript insère un ; après return et retourne undefined
return
  (
    <div>Contenu</div>
  );
```

### Un seul élément racine
```jsx
// ✅ Un seul élément racine
return (
  <div>
    <h1>Titre</h1>
    <p>Texte</p>
  </div>
);

// ✅ Fragment <> — si on ne veut pas de div inutile
return (
  <>
    <h1>Titre</h1>
    <p>Texte</p>
  </>
);

// ❌ Deux éléments racines — interdit
return (
  <h1>Titre</h1>
  <p>Texte</p>
);
```

### Return court — sans parenthèses si une seule ligne
```jsx
// ✅ Une seule ligne, pas besoin de parenthèses
return <div>Bonjour</div>;

// ✅ Avec parenthèses aussi, les deux marchent
return (<div>Bonjour</div>);
```

---

## 3. Les structures de fonctions

### Fonction classique
```jsx
function MonComposant() {
  return <div>Bonjour</div>;
}
```

### Fonction fléchée
```jsx
const MonComposant = () => {
  return <div>Bonjour</div>;
};

// Raccourci si une seule ligne de return
const MonComposant = () => <div>Bonjour</div>;
```

### Fonction avec props
```jsx
// Fonction classique
function MonComposant(props) {
  return <div>{props.nom}</div>;
}

// Destructuration — plus lisible (recommandé)
function MonComposant({ nom, age }) {
  return <div>{nom} — {age} ans</div>;
}

// Avec valeurs par défaut
function MonComposant({ nom = 'Inconnu', age = 0 }) {
  return <div>{nom} — {age} ans</div>;
}
```

### Fonction async — pour les appels API
```jsx
// ❌ Un composant ne peut pas être async directement
async function MonComposant() { ... }

// ✅ On met async sur les fonctions internes (handlers)
function MonComposant() {
  const handleClick = async () => {
    const data = await apiV2.get('users');
    console.log(data);
  };

  return <button onClick={handleClick}>Charger</button>;
}
```

### Résumé des types de fonctions

```
Type                      Syntaxe                         Quand l'utiliser
──────────────────        ──────────────────────────────  ──────────────────────────
Classique                 function Nom() {}               Composants React
Fléchée                   const Nom = () => {}            Handlers, callbacks
Fléchée raccourcie        const fn = () => valeur         Retour simple sans {}
Async                     const fn = async () => {}       Appels API, await
Inline dans JSX           onClick={() => faire()}         Logique simple, un usage
```

---

## 4. Les variables

### `const`, `let`, `var` — les différences

```jsx
// const — valeur qui ne change pas (recommandé par défaut)
const nom = 'John';
const user = { nom: 'John', age: 25 };  // l'objet peut changer en interne
const users = [1, 2, 3];               // le tableau peut changer en interne

// let — valeur qui peut être réassignée
let count = 0;
count = 1;     // ✅ autorisé
count++;       // ✅ autorisé

// var — ancienne façon, ne plus utiliser
var nom = 'John';  // ❌ éviter
```

### Variable normale vs `useState`

```jsx
// ❌ Variable normale — React ne sait pas qu'elle a changé, pas de re-render
function Compteur() {
  let count = 0;
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => count++}>+</button>  // count change mais l'écran ne bouge pas
    </div>
  );
}

// ✅ useState — React détecte le changement et met à jour l'écran
function Compteur() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>  // l'écran se met à jour
    </div>
  );
}
```

### Quand utiliser variable normale vs useState

```
Variable normale const/let          useState
──────────────────────────          ──────────────────────────────
Valeur calculée depuis props        Valeur qui change avec le temps
Valeur qui ne change jamais         Valeur qui doit mettre à jour l'écran
Résultat d'un calcul                Input, formulaire, toggle, compteur
Config, constantes                  Données chargées depuis une API
```

```jsx
function MonComposant({ prix, quantite }) {
  // ✅ variable normale — calculé depuis props, ne change pas
  const total = prix * quantite;
  const TVA = total * 0.2;
  const label = quantite > 1 ? 'articles' : 'article';

  // ✅ useState — change avec le temps
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  return (
    <div>
      <p>{quantite} {label} — Total : {total}€ (TVA : {TVA}€)</p>
    </div>
  );
}
```

### Les types de valeurs dans le JSX

```jsx
const nom = 'John';
const age = 25;
const isAdmin = true;
const users = ['John', 'Jane'];
const user = { nom: 'John', age: 25 };
const message = `Bonjour ${nom}`;   // template literal

return (
  <div>
    <p>{nom}</p>                       // ✅ string
    <p>{age}</p>                       // ✅ number
    <p>{isAdmin ? 'Admin' : ''}</p>    // ✅ boolean → toujours via ternaire ou &&
    <p>{users.join(', ')}</p>          // ✅ array → convertir en string
    <p>{user.nom}</p>                  // ✅ propriété d'objet
    <p>{message}</p>                   // ✅ template literal
  </div>
);

// ⚠️ Ces valeurs n'affichent RIEN dans le JSX
{null}       // rien
{undefined}  // rien
{false}      // rien
{true}       // rien — utiliser {isAdmin ? 'oui' : 'non'} à la place
```

---

## 5. Le JSX — syntaxe et règles

### Les expressions `{}` — tout ce qui est JS dans le HTML
```jsx
return (
  <div>
    <p>{nom}</p>                // variable
    <p>{age * 2}</p>            // calcul
    <p>{nom.toUpperCase()}</p>  // méthode
    <p>{2 + 2}</p>              // opération
    <p>{`Bonjour ${nom}`}</p>   // template literal
  </div>
);
```

### Les attributs — différences avec HTML
```jsx
// class → className
<div className="container">

// for → htmlFor
<label htmlFor="email">Email</label>

// style → objet JS avec camelCase (double accolades)
<div style={{ color: 'red', fontSize: '16px', backgroundColor: '#fff' }}>

// Événements en camelCase
onClick  onChange  onSubmit  onFocus  onBlur  onKeyDown

// Les booléens
<input disabled />              // disabled={true}
<input disabled={false} />      // pas disabled
<input disabled={isDisabled} /> // variable booléenne
```

### Commentaires dans le JSX
```jsx
return (
  <div>
    {/* ✅ Commentaire dans le JSX */}
    <p>Texte</p>
    // ❌ Ceci ne marche pas dans le JSX
  </div>
);
```

---

## 6. Les conditions dans le return

### Opérateur ternaire `? :` — if/else
```jsx
return (
  <div>
    {isLoggedIn ? (
      <h1>Bienvenue !</h1>
    ) : (
      <h1>Connectez-vous</h1>
    )}
  </div>
);

// Ternaire imbriqué — pour plusieurs cas (lisibilité réduite, préférer if avant return)
{status === 'loading' ? (
  <p>Chargement...</p>
) : status === 'error' ? (
  <p>Erreur</p>
) : (
  <p>Succès</p>
)}
```

### `&&` — afficher seulement si vrai
```jsx
return (
  <div>
    {error && <p style={{ color: 'red' }}>{error.message}</p>}
    {isLoading && <p>Chargement...</p>}
    {users.length > 0 && <p>{users.length} utilisateurs</p>}
  </div>
);
```

### `||` — valeur par défaut
```jsx
return (
  <div>
    <p>{nom || 'Inconnu'}</p>        // affiche nom, ou 'Inconnu' si vide/null/undefined
    <p>{age || 'Non renseigné'}</p>
  </div>
);
```

### `??` — valeur par défaut uniquement si null ou undefined
```jsx
// || retourne la droite si la valeur est falsy (0, '', false, null, undefined)
// ?? retourne la droite seulement si null ou undefined

<p>{count || 'vide'}</p>   // si count = 0 → affiche 'vide' ❌
<p>{count ?? 'vide'}</p>   // si count = 0 → affiche 0    ✅
```

### `if` avant le return — pour les cas complexes
```jsx
function MonComposant({ isLoading, error, data }) {

  if (isLoading) return <p>Chargement...</p>;
  if (error)     return <p>Erreur : {error.message}</p>;
  if (!data)     return <p>Aucune donnée</p>;

  // Si on arrive ici, tout est bon
  return (
    <div>
      <h1>{data.titre}</h1>
    </div>
  );
}
```

### ⚠️ Pièges avec `&&`
```jsx
// ❌ Problème — si count = 0, affiche "0" à l'écran
{count && <p>Il y a {count} éléments</p>}

// ✅ Fix — forcer un booléen
{count > 0 && <p>Il y a {count} éléments</p>}
{!!count && <p>Il y a {count} éléments</p>}
```

---

## 7. Le `map` — guide complet

### 7.1 Syntaxe de base

```jsx
const users = [
  { id: 1, nom: 'John' },
  { id: 2, nom: 'Jane' },
];

return (
  <ul>
    {users.map((user) => (
      <li key={user.id}>{user.nom}</li>
    ))}
  </ul>
);
```

### 7.2 Les différentes façons d'écrire un map

```jsx
// Forme longue avec return explicite — pour plusieurs lignes
{users.map((user) => {
  return <li key={user.id}>{user.nom}</li>;
})}

// Forme courte avec return implicite — pour une seule ligne
{users.map((user) => <li key={user.id}>{user.nom}</li>)}

// Forme courte avec parenthèses — pour plusieurs lignes sans return
{users.map((user) => (
  <li key={user.id}>
    <span>{user.nom}</span>
    <span>{user.age} ans</span>
  </li>
))}

// Avec index
{users.map((user, index) => (
  <li key={user.id}>{index + 1}. {user.nom}</li>
))}

// Avec index et tableau complet
{users.map((user, index, array) => (
  <li key={user.id}>
    {user.nom} — {index + 1}/{array.length}
  </li>
))}
```

### 7.3 La `key` — obligatoire et unique

```jsx
// ✅ key sur l'id — idéal
{users.map((user) => <li key={user.id}>{user.nom}</li>)}

// ✅ key sur un champ unique
{users.map((user) => <li key={user.email}>{user.nom}</li>)}

// ✅ key sur l'index — si pas d'id et que la liste ne change pas
{users.map((user, index) => <li key={index}>{user.nom}</li>)}

// ✅ key composite — quand aucun champ seul n'est unique
{users.map((user) => <li key={`${user.type}-${user.id}`}>{user.nom}</li>)}

// ❌ Pas de key — warning React + bugs de rendu
{users.map((user) => <li>{user.nom}</li>)}

// ❌ key dupliquée — même problème
{users.map((user) => <li key="same">{user.nom}</li>)}
```

### 7.4 Map avec condition à l'intérieur

```jsx
// Ternaire dans le rendu
{users.map((user) => (
  <li key={user.id}>
    {user.nom}
    {user.isAdmin ? <span> (Admin)</span> : null}
  </li>
))}

// && conditionnel dans le rendu
{users.map((user) => (
  <li key={user.id}>
    {user.nom}
    {user.isAdmin && <span> (Admin)</span>}
    {user.age >= 18 && <span> (Majeur)</span>}
  </li>
))}

// className conditionnelle
{users.map((user) => (
  <li
    key={user.id}
    className={user.isAdmin ? 'admin' : 'user'}
    style={{ color: user.isActive ? 'green' : 'gray' }}
  >
    {user.nom}
  </li>
))}

// Return null pour sauter un élément
{users.map((user) => {
  if (!user.isActive) return null;
  return <li key={user.id}>{user.nom}</li>;
})}

// Rendu différent selon un état
{users.map((user) => {
  if (user.role === 'admin') {
    return <AdminCard key={user.id} user={user} />;
  }
  if (user.role === 'moderateur') {
    return <ModCard key={user.id} user={user} />;
  }
  return <UserCard key={user.id} user={user} />;
})}
```

### 7.5 Map avec manipulation interne des données

```jsx
// Transformer les données avant d'afficher
{users.map((user) => {
  const nomComplet = `${user.prenom} ${user.nom}`;
  const ageFormate = `${user.age} ans`;
  const initiales = `${user.prenom[0]}${user.nom[0]}`.toUpperCase();

  return (
    <li key={user.id}>
      <span>{initiales}</span>
      <strong>{nomComplet}</strong>
      <small>{ageFormate}</small>
    </li>
  );
})}

// Calcul dans le map
{commandes.map((commande) => {
  const total = commande.quantite * commande.prixUnitaire;
  const tva = total * 0.2;
  const ttc = total + tva;

  return (
    <tr key={commande.id}>
      <td>{commande.nom}</td>
      <td>{commande.quantite}</td>
      <td>{total.toFixed(2)} €</td>
      <td>{tva.toFixed(2)} €</td>
      <td><strong>{ttc.toFixed(2)} €</strong></td>
    </tr>
  );
})}

// Formatter une date
{evenements.map((evt) => {
  const date = new Date(evt.date);
  const dateFormatee = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div key={evt.id}>
      <p>{evt.titre}</p>
      <small>{dateFormatee}</small>
    </div>
  );
})}

// Trouver une valeur liée dans un autre tableau
{tickets.map((ticket) => {
  const assignee = users.find((u) => u.id === ticket.userId);
  const nomAssignee = assignee ? assignee.nom : 'Non assigné';

  return (
    <li key={ticket.id}>
      #{ticket.id} — {ticket.titre} — {nomAssignee}
    </li>
  );
})}
```

### 7.6 Map avec des attributs / props dynamiques

```jsx
// Passer tous les attributs d'un objet en props (spread)
{users.map((user) => (
  <UserCard key={user.id} {...user} />
))}

// Attributs calculés dynamiquement
{boutons.map((btn) => (
  <button
    key={btn.id}
    type={btn.type || 'button'}
    disabled={btn.disabled || false}
    className={`btn btn-${btn.variant}`}
    onClick={() => handleAction(btn.action)}
    aria-label={btn.label}
    data-id={btn.id}
    data-type={btn.type}
  >
    {btn.label}
  </button>
))}

// Style dynamique par item
{barres.map((barre) => (
  <div
    key={barre.id}
    style={{
      width: `${barre.valeur}%`,
      backgroundColor: barre.couleur,
      height: '20px',
    }}
    title={`${barre.label} : ${barre.valeur}%`}
  />
))}

// Attributs HTML conditionnels
{inputs.map((champ) => (
  <input
    key={champ.name}
    type={champ.type}
    name={champ.name}
    placeholder={champ.placeholder}
    required={champ.required}
    disabled={champ.disabled}
    maxLength={champ.maxLength}
    min={champ.type === 'number' ? champ.min : undefined}
    max={champ.type === 'number' ? champ.max : undefined}
    onChange={(e) => handleChange(e, champ.name)}
  />
))}
```

### 7.7 Map avec filtre et tri (chained)

```jsx
// filter → map
{users
  .filter((user) => user.age >= 18)
  .map((user) => (
    <li key={user.id}>{user.nom}</li>
  ))
}

// sort → map
{users
  .sort((a, b) => a.nom.localeCompare(b.nom))
  .map((user) => (
    <li key={user.id}>{user.nom}</li>
  ))
}

// filter → sort → map
{users
  .filter((user) => user.isActive)
  .sort((a, b) => b.createdAt - a.createdAt)
  .map((user) => (
    <li key={user.id}>{user.nom}</li>
  ))
}

// slice → map (pagination simple)
{users
  .slice(page * pageSize, (page + 1) * pageSize)
  .map((user) => (
    <li key={user.id}>{user.nom}</li>
  ))
}

// ⚠️ Ne jamais muter le state directement — spread avant sort
{[...users]
  .sort((a, b) => a.nom.localeCompare(b.nom))
  .map((user) => <li key={user.id}>{user.nom}</li>)
}
```

### 7.8 Map sur un objet

```jsx
const stats = { ventes: 10, clients: 25, commandes: 8 };

// Object.entries — clé + valeur
{Object.entries(stats).map(([cle, valeur]) => (
  <li key={cle}>{cle} : {valeur}</li>
))}

// Object.keys — clé uniquement
{Object.keys(stats).map((cle) => (
  <li key={cle}>{cle} : {stats[cle]}</li>
))}

// Object.values — valeur uniquement
{Object.values(stats).map((valeur, index) => (
  <li key={index}>{valeur}</li>
))}

// Objet d'objets — groupé
const allAssets = {
  ordinateurs: [...],
  ecrans: [...],
  imprimantes: [...],
};

{Object.entries(allAssets).map(([type, liste]) => (
  <section key={type}>
    <h2>{type}</h2>
    <ul>
      {liste.map((item) => (
        <li key={item.id}>{item.nom}</li>
      ))}
    </ul>
  </section>
))}
```

### 7.9 Map imbriqué (map dans un map)

```jsx
// Tableau de tableaux
const categories = [
  { id: 1, nom: 'Fruits', items: ['Pomme', 'Banane', 'Orange'] },
  { id: 2, nom: 'Légumes', items: ['Carotte', 'Tomate'] },
];

{categories.map((categorie) => (
  <div key={categorie.id}>
    <h3>{categorie.nom}</h3>
    <ul>
      {categorie.items.map((item, index) => (
        <li key={`${categorie.id}-${index}`}>{item}</li>
      ))}
    </ul>
  </div>
))}

// Tableau avec rows et colonnes (table dynamique)
{lignes.map((ligne) => (
  <tr key={ligne.id}>
    {colonnes.map((col) => (
      <td key={col.key}>{ligne[col.key]}</td>
    ))}
  </tr>
))}
```

### 7.10 Map avec Fragment

```jsx
// Fragment court — si on ne veut pas de balise wrapper
{users.map((user) => (
  <>
    <dt key={`nom-${user.id}`}>{user.nom}</dt>
    <dd key={`age-${user.id}`}>{user.age} ans</dd>
  </>
))}

// Fragment explicite — obligatoire si key sur le fragment lui-même
import { Fragment } from 'react';

{users.map((user) => (
  <Fragment key={user.id}>
    <dt>{user.nom}</dt>
    <dd>{user.age} ans</dd>
  </Fragment>
))}
```

### 7.11 Map async — gestion des données asynchrones

```jsx
// ❌ Impossible — map ne peut pas être async directement
{users.map(async (user) => {  // ❌ retourne des Promises, pas du JSX
  const detail = await fetchDetail(user.id);
  return <li key={user.id}>{detail.nom}</li>;
})}

// ✅ Pattern correct — charger d'abord, puis map
function MaListe() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await apiV2.get('users');
      setUsers(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <p>Chargement...</p>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.nom}</li>
      ))}
    </ul>
  );
}

// ✅ Charger les données enrichies avant le rendu
useEffect(() => {
  const loadAll = async () => {
    const liste = await apiV2.get('users');
    const enrichis = await Promise.all(
      liste.map(async (user) => {
        const detail = await apiV2.get(`users/${user.id}/detail`);
        return { ...user, ...detail };
      })
    );
    setUsers(enrichis);
  };
  loadAll();
}, []);

// ✅ Pattern avec état de chargement par item
const [loadingIds, setLoadingIds] = useState([]);

const handleAction = async (id) => {
  setLoadingIds((prev) => [...prev, id]);
  await apiV2.post(`users/${id}/action`);
  setLoadingIds((prev) => prev.filter((x) => x !== id));
};

{users.map((user) => (
  <li key={user.id}>
    {user.nom}
    <button
      disabled={loadingIds.includes(user.id)}
      onClick={() => handleAction(user.id)}
    >
      {loadingIds.includes(user.id) ? '...' : 'Action'}
    </button>
  </li>
))}
```

### 7.12 Map dans une condition (rendu conditionnel de liste)

```jsx
// Map protégé par && — n'affiche la liste que si elle existe et est non vide
return (
  <div>
    {users.length > 0 && (
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.nom}</li>
        ))}
      </ul>
    )}
  </div>
);

// Ternaire — message si liste vide
return (
  <div>
    {users.length === 0 ? (
      <p>Aucun utilisateur trouvé.</p>
    ) : (
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.nom}</li>
        ))}
      </ul>
    )}
  </div>
);

// Pattern loading / error / vide / data
function MaListe({ isLoading, error, users }) {
  if (isLoading) return <p>Chargement...</p>;
  if (error)     return <p className="erreur">{error.message}</p>;
  if (!users || users.length === 0) return <p>Aucune donnée.</p>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.nom}</li>
      ))}
    </ul>
  );
}

// Map conditionnel selon un filtre actif
const [filtre, setFiltre] = useState('tous');

const usersFiltres = filtre === 'tous'
  ? users
  : users.filter((u) => u.role === filtre);

return (
  <div>
    <select onChange={(e) => setFiltre(e.target.value)}>
      <option value="tous">Tous</option>
      <option value="admin">Admin</option>
      <option value="user">User</option>
    </select>

    {usersFiltres.length === 0 ? (
      <p>Aucun résultat pour ce filtre.</p>
    ) : (
      <ul>
        {usersFiltres.map((user) => (
          <li key={user.id}>{user.nom}</li>
        ))}
      </ul>
    )}
  </div>
);
```

### 7.13 Map avec composant — variantes

```jsx
// Passer chaque prop séparément
{users.map((user) => (
  <UserCard
    key={user.id}
    nom={user.nom}
    age={user.age}
    isAdmin={user.isAdmin}
  />
))}

// Passer l'objet entier
{users.map((user) => (
  <UserCard key={user.id} user={user} />
))}

// Spread de l'objet
{users.map((user) => (
  <UserCard key={user.id} {...user} />
))}

// Avec handler
{users.map((user) => (
  <UserCard
    key={user.id}
    user={user}
    onDelete={() => handleDelete(user.id)}
    onEdit={() => handleEdit(user)}
  />
))}
```

### 7.14 Résumé — quel pattern choisir

```
Besoin                                    Pattern
──────────────────────────────────────    ──────────────────────────────────
Liste simple                              .map((x) => <li key={x.id}>...)
Liste avec filtre                         .filter(...).map(...)
Liste triée                               [...arr].sort(...).map(...)
Skip un item                              return null dans le map
Rendu différent par type                  if/return dans le map
Données enrichies                         calcul de variables dans le map
Liste protégée si vide                    array.length > 0 && <ul>...</ul>
Liste avec fallback vide                  ternaire ? <p>vide</p> : <ul>...
Liste depuis un objet                     Object.entries().map()
Liste imbriquée                           map imbriqué avec key composite
Liste avec état async par item            loadingIds.includes(id)
```

---

---

## 8. Le `console.log` — guide complet du debugging

### 8.1 Les formes de base

```js
// Valeur simple
console.log('bonjour');
console.log(42);
console.log(true);

// Variable
const nom = 'John';
console.log(nom);              // John

// Avec label — toujours labelliser pour s'y retrouver
console.log('nom:', nom);      // nom: John
console.log('users:', users);  // users: [...]

// Plusieurs valeurs à la fois
console.log('nom:', nom, 'age:', age);
console.log({ nom, age, isAdmin });   // objet — plus lisible dans la console
```

### 8.2 Console.log dans les handlers et fonctions

```jsx
// Dans un handler de clic
const handleClick = () => {
  console.log('clic déclenché');
  console.log('user sélectionné:', user);
};

// Dans un handler avec paramètre
const handleDelete = (id) => {
  console.log('suppression demandée pour id:', id);
  apiV2.delete(`users/${id}`);
};

// Dans un onChange
<input onChange={(e) => {
  console.log('valeur saisie:', e.target.value);
  setNom(e.target.value);
}} />

// Dans un onSubmit
const handleSubmit = async (e) => {
  e.preventDefault();
  console.log('formulaire soumis avec:', form);
  try {
    const result = await apiV2.post('users', form);
    console.log('réponse serveur:', result);
  } catch (err) {
    console.log('erreur:', err);
  }
};
```

### 8.3 Console.log dans useEffect

```jsx
// Vérifier ce qui est chargé
useEffect(() => {
  const load = async () => {
    console.log('chargement démarré');
    const data = await apiV2.get('users');
    console.log('données reçues:', data);
    setUsers(data);
    console.log('state mis à jour');
  };
  load();
}, []);

// Vérifier les dépendances qui déclenchent le re-run
useEffect(() => {
  console.log('userId a changé:', userId);
  fetchUserById(userId);
}, [userId]);

// Vérifier le montage / démontage
useEffect(() => {
  console.log('composant monté');
  return () => {
    console.log('composant démonté');
  };
}, []);
```

### 8.4 Console.log pour déboguer le state

```jsx
// Afficher le state à chaque render
function MonComposant() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  console.log('--- render ---');
  console.log('users:', users);
  console.log('search:', search);

  // ...
}

// Vérifier juste après un setState (attention : useState est asynchrone)
const handleAdd = (user) => {
  const newUsers = [...users, user];
  console.log('nouveau tableau:', newUsers);   // ✅ voir la nouvelle valeur
  setUsers(newUsers);
  console.log('users après setUsers:', users); // ⚠️ encore l'ancienne valeur ici
};

// Pour voir la valeur après le state update — utiliser useEffect
useEffect(() => {
  console.log('users mis à jour:', users);
}, [users]);
```

### 8.5 Console.log dans le JSX — patterns valides

```jsx
// ❌ Impossible directement dans le JSX
return (
  <div>
    {console.log(users)}  // ❌ affiche "undefined" à l'écran (console.log retourne undefined)
  </div>
);

// ✅ Avant le return
function MonComposant({ users }) {
  console.log('users reçus en props:', users);  // ✅ dans le corps du composant

  return <ul>...</ul>;
}

// ✅ Dans une expression — via une fonction auto-appelée (IIFE) — pour cas exceptionnel
return (
  <div>
    {(() => { console.log('ici dans le rendu'); return null; })()}
    <p>Contenu</p>
  </div>
);

// ✅ Technique propre — variable intermédiaire
function MonComposant({ users }) {
  const usersFiltres = users.filter((u) => u.isActive);
  console.log('filtrés:', usersFiltres);  // ✅ juste avant le return

  return (
    <ul>
      {usersFiltres.map((u) => <li key={u.id}>{u.nom}</li>)}
    </ul>
  );
}
```

### 8.6 Les variantes de console

```js
// console.log — usage général
console.log('données:', data);

// console.warn — avertissement (fond jaune dans la console)
console.warn('valeur manquante pour le champ:', champ);

// console.error — erreur (fond rouge dans la console)
console.error('échec de la requête:', error);

// console.table — tableau lisible pour les arrays d'objets
const users = [
  { id: 1, nom: 'John', age: 25 },
  { id: 2, nom: 'Jane', age: 30 },
];
console.table(users);
// → affiche un vrai tableau formaté dans la console du navigateur

// console.group — regrouper des logs liés
console.group('Chargement users');
console.log('requête envoyée');
console.log('réponse reçue:', data);
console.log('state mis à jour');
console.groupEnd();

// console.groupCollapsed — même chose mais réduit par défaut
console.groupCollapsed('Détail du render');
console.log('props:', props);
console.log('state:', state);
console.groupEnd();

// console.time / timeEnd — mesurer le temps
console.time('fetch users');
const data = await apiV2.get('users');
console.timeEnd('fetch users');  // fetch users: 234ms

// console.count — compter combien de fois quelque chose s'exécute
console.count('render');   // render: 1, render: 2, render: 3...

// console.dir — inspecter un objet en détail (surtout utile pour les éléments DOM)
console.dir(document.getElementById('mon-div'));
```

### 8.7 Console.log avec formatage

```js
// Nommer l'objet avec la syntaxe raccourcie ES6
const nom = 'John';
const age = 25;
const users = [...];

console.log({ nom });              // { nom: 'John' }
console.log({ nom, age });         // { nom: 'John', age: 25 }
console.log({ users });            // { users: [...] }

// Copie de valeur pour éviter la référence (les objets s'affichent en live)
console.log(JSON.parse(JSON.stringify(users)));  // snapshot figé de l'état actuel

// Couleur dans la console (navigateur)
console.log('%cERREUR', 'color: red; font-weight: bold;', 'message ici');
console.log('%cOK', 'color: green;', 'données chargées');

// Séparateur visuel
console.log('──────────────────');
console.log('=== NOM DU BLOC ===');
```

### 8.8 Patterns de debugging courants

```jsx
// Déboguer un map — voir ce qui entre dans chaque itération
{users.map((user) => {
  console.log('user en cours:', user);  // s'affiche pour chaque item
  return <li key={user.id}>{user.nom}</li>;
})}

// Vérifier pourquoi un composant re-render — comparer les props
function MonComposant(props) {
  console.log('render avec props:', props);
  return <div>...</div>;
}

// Vérifier la valeur d'un state entre deux actions
const handleChange = (e) => {
  console.log('avant:', form);
  const newForm = { ...form, [e.target.name]: e.target.value };
  console.log('après:', newForm);
  setForm(newForm);
};

// Déboguer une condition qui ne s'affiche pas
function MonComposant({ user }) {
  console.log('user:', user);
  console.log('user.isAdmin:', user?.isAdmin);
  console.log('typeof:', typeof user?.isAdmin);

  return (
    <div>
      {user?.isAdmin && <span>Admin</span>}
    </div>
  );
}

// Vérifier une API — ce qui est envoyé et reçu
const handleSubmit = async (e) => {
  e.preventDefault();
  console.log('payload envoyé:', form);
  try {
    const result = await apiV2.post('tickets', form);
    console.log('réponse reçue:', result);
    console.log('status:', result.status);
  } catch (err) {
    console.error('erreur complète:', err);
    console.error('message:', err.message);
    console.error('status http:', err.response?.status);
  }
};
```

### 8.9 Enlever les console.log en production

```js
// ✅ Mettre une condition sur l'environnement
if (process.env.NODE_ENV === 'development') {
  console.log('debug:', data);
}

// ✅ Créer un helper de debug
const debug = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

debug('users:', users);  // silencieux en prod

// ✅ Pour les projets sérieux — supprimer automatiquement au build
// Dans vite.config.js :
// build: { minify: 'terser', terserOptions: { compress: { drop_console: true } } }
```

### 8.10 Résumé — quel outil pour quel besoin

```
Besoin                                     Outil
──────────────────────────────────────     ──────────────────────────────
Voir une valeur simple                     console.log('label:', valeur)
Voir un array d'objets clairement          console.table(array)
Grouper des logs liés                      console.group / groupEnd
Mesurer une durée                          console.time / timeEnd
Avertissement non bloquant                 console.warn
Erreur visible                             console.error
Compter des appels                         console.count
Snapshot figé d'un objet                   JSON.parse(JSON.stringify(obj))
Debug dans un map                          console.log dans le corps du map
Debug state après update                   useEffect(() => {log}, [state])
Voir ce qui déclenche un re-render         console.log au début du composant
```

---

> **Hooks** (useState, useEffect, useCallback, useMemo) → voir [hooks-guide.md](hooks-guide.md)

---

## 10. Les événements — détail complet

### Fonction déclarée vs inline

```jsx
// Fonction déclarée — logique complexe ou réutilisée plusieurs fois
const handleClick = () => {
  setCount(count + 1);
  doSomethingElse();
};
<button onClick={handleClick}>Cliquer</button>  // sans ()

// Fonction inline — logique simple, un seul usage
<button onClick={() => setCount(count + 1)}>+</button>

// ❌ Erreur fréquente — avec () ça s'exécute au render, pas au clic
<button onClick={handleClick()}>Cliquer</button>   // ❌ exécuté immédiatement
<button onClick={handleClick}>Cliquer</button>     // ✅ exécuté au clic

// Avec paramètre — obligatoirement une fonction inline
<button onClick={() => handleDelete(user.id)}>Supprimer</button>
```

### `onClick` — les clics

```jsx
onClick={handleClick}                    // fonction déclarée, pas de paramètre
onClick={() => handleClick(id)}          // avec paramètre
onClick={(e) => handleClick(e, id)}      // avec l'événement et un paramètre
onClick={() => setIsOpen(!isOpen)}       // toggle inline
```

### `onChange` — les inputs

```jsx
// Input texte — e.target.value
<input onChange={(e) => setNom(e.target.value)} />

// Checkbox — e.target.checked
<input type="checkbox" onChange={(e) => setIsChecked(e.target.checked)} />

// Select
<select onChange={(e) => setChoix(e.target.value)}>
  <option value="a">Option A</option>
  <option value="b">Option B</option>
</select>

// Plusieurs inputs avec un seul handler — utiliser name
const handleChange = (e) => {
  setForm({ ...form, [e.target.name]: e.target.value });
};
<input name="nom"   onChange={handleChange} />
<input name="email" onChange={handleChange} />
<input name="age"   onChange={handleChange} />
```

### `onSubmit` — les formulaires

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();  // ← toujours — évite le rechargement de page
  try {
    await apiV2.post('users', form);
  } catch (error) {
    setError(error);
  }
};

<form onSubmit={handleSubmit}>
  <input name="nom" onChange={handleChange} />
  <button type="submit">Envoyer</button>
</form>
```

### Tous les événements courants

```jsx
// Souris
onClick        // clic
onDoubleClick  // double clic
onMouseEnter   // souris entre (ne remonte pas aux enfants)
onMouseLeave   // souris sort
onMouseOver    // souris passe dessus (inclut les enfants)
onMouseDown    // bouton souris enfoncé
onMouseUp      // bouton souris relâché

// Clavier
onKeyDown      // touche enfoncée — utiliser e.key pour savoir laquelle
onKeyUp        // touche relâchée

const handleKeyDown = (e) => {
  if (e.key === 'Enter')  handleSubmit();
  if (e.key === 'Escape') handleClose();
  if (e.key === 'ArrowUp') handleUp();
};

// Focus
onFocus   // quand on entre dans l'input
onBlur    // quand on sort de l'input

const [showHelp, setShowHelp] = useState(false);
<input
  onFocus={() => setShowHelp(true)}
  onBlur={() => setShowHelp(false)}
/>
{showHelp && <p>Aide contextuelle</p>}

// Formulaire
onChange  // valeur change
onSubmit  // formulaire soumis
onReset   // formulaire réinitialisé
```

### L'objet `e` — l'événement

```jsx
const handleClick = (e) => {
  e.preventDefault();     // annule comportement par défaut (lien, formulaire)
  e.stopPropagation();    // empêche l'événement de remonter aux parents

  e.target                // élément qui a déclenché l'événement
  e.target.value          // valeur d'un input texte
  e.target.checked        // état d'une checkbox (boolean)
  e.target.name           // attribut name de l'input
  e.target.id             // attribut id

  e.key                   // touche clavier ('Enter', 'Escape', 'a', 'ArrowUp'...)
  e.ctrlKey               // Ctrl enfoncé ? (boolean)
  e.shiftKey              // Shift enfoncé ? (boolean)
  e.altKey                // Alt enfoncé ? (boolean)
};
```

---

## 11. Les props — passer des données

### Passer des props
```jsx
// string sans accolades, tout le reste avec {}
<UserCard nom="John" age={25} isAdmin={true} user={userObj} onClick={handleClick} />
```

### Recevoir des props
```jsx
// Destructuration — recommandé
function UserCard({ nom, age, isAdmin, onClick }) {
  return (
    <div onClick={onClick}>
      {nom} — {age} ans
      {isAdmin && <span>Admin</span>}
    </div>
  );
}

// Avec valeurs par défaut
function UserCard({ nom = 'Inconnu', age = 0, isAdmin = false }) { ... }
```

### Spread props
```jsx
const user = { nom: 'John', age: 25 };
<UserCard {...user} />  // équivalent à nom="John" age={25}
```

### `children` — contenu entre les balises
```jsx
function Card({ children, titre }) {
  return (
    <div className="card">
      <h2>{titre}</h2>
      {children}
    </div>
  );
}

<Card titre="Mon titre">
  <p>Contenu libre ici</p>
  <button>Action</button>
</Card>
```

### Remonter une action vers le parent (callback)
```jsx
// Parent — définit la fonction et la passe
function Parent() {
  const handleLogin = () => setIsAuthed(true);
  return <Login onLogin={handleLogin} />;
}

// Enfant — appelle la fonction au bon moment
function Login({ onLogin }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    await apiV2.login();
    onLogin();  // ← remonte l'info au parent
  };
}
```

---

## 12. Quand utiliser quoi — résumé complet

```
Situation                           Solution
──────────────────────────────      ──────────────────────────────────
Afficher une valeur JS              {maVariable}
Valeur qui change + màj écran       useState
Valeur calculée, fixe               const normale
Appel API au chargement             useEffect(() => {}, [])
Réagir à un changement              useEffect(() => {}, [variable])
Condition if/else                   ternaire ? :
Afficher seulement si vrai          &&
Valeur par défaut (falsy)           ||
Valeur par défaut (null/undefined)  ??
Plusieurs conditions complexes      if avant le return
Afficher une liste                  .map() avec key
Filtrer une liste                   .filter().map()
Clic simple                         onClick={handler}
Clic avec paramètre                 onClick={() => handler(id)}
Input texte                         onChange={(e) => set(e.target.value)}
Checkbox                            onChange={(e) => set(e.target.checked)}
Plusieurs inputs                    onChange avec e.target.name
Formulaire                          onSubmit + e.preventDefault()
Passer données vers enfant          props
Remonter action vers parent         fonction en prop (onLogin, onDelete)
Éviter une div inutile              Fragment <>
Boolean en JSX                      ternaire ou &&, jamais seul
```


---

> **useCallback, useMemo** → voir [hooks-guide.md](hooks-guide.md)

---

affichage complexe d une liste complet d assets regroupes par type en un tableau avec recuperation des attributs
dynamiques pour afficher tout les attributs en colonnes

<section>
    {Object.keys(allAssets).map((type) => {
        const listeAssets = allAssets[type];
        if (!listeAssets || listeAssets.length === 0) return null;
        const attributs = Object.keys(listeAssets[0]);
        return (
            <div key={type} style={{ marginBottom: '40px', overflowX: 'auto' }}>
                <h2>{type}</h2>
                <table border="1" cellPadding="5" cellSpacing="0">
                    <thead>
                        <tr>
                            {attributs.map((attr) => (
                                <th key={attr} style={{ background: '#eee' }}>{attr}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {listeAssets.map((asset) => (
                            <tr key={asset.id}>
                                {attributs.map((attr) => {
                                    const valeur = asset[attr];
                                    const texteAAfficher = typeof valeur === 'object' && valeur !== null
                                        ? JSON.stringify(valeur)
                                        : String(valeur ?? "");
                                    return <td key={`${asset.id}-${attr}`}>{texteAAfficher}</td>;
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    })}
</section>
