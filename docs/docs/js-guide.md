# Guide JS/JSX — Async, Boucles, Fonctions utilitaires

---

## 1. Promise — les bases

Une `Promise` représente une valeur qui sera disponible plus tard (ou qui peut échouer).

```js
// Créer une Promise manuellement
const maPromesse = new Promise((resolve, reject) => {
  const ok = true;
  if (ok) {
    resolve('succès');   // valeur de retour si ça marche
  } else {
    reject(new Error('quelque chose a raté'));
  }
});

// Consommer avec .then / .catch / .finally
maPromesse
  .then((result) => console.log('résultat:', result))
  .catch((err) => console.error('erreur:', err))
  .finally(() => console.log('terminé dans tous les cas'));
```

### Les 3 états d'une Promise

```
pending   → en attente (pas encore résolue ni rejetée)
fulfilled → résolue avec une valeur (resolve appelé)
rejected  → rejetée avec une erreur (reject appelé)
```

### async / await — la façon moderne de consommer les Promises

```js
// async/await = sucre syntaxique sur les Promises
// await ne peut s'utiliser QUE dans une fonction async

const chargerUser = async (id) => {
  const user = await apiV2.get(`users/${id}`);
  return user;
};

// Équivalent avec .then
const chargerUser = (id) => {
  return apiV2.get(`users/${id}`).then((user) => user);
};
```

### Gestion des erreurs avec try/catch

```js
const chargerData = async () => {
  try {
    const data = await apiV2.get('users');
    console.log('ok:', data);
    return data;
  } catch (err) {
    console.error('erreur:', err.message);
    throw err;  // re-lancer si on veut que l'appelant gère aussi
  } finally {
    console.log('toujours exécuté');
  }
};
```

---

## 2. Promise.all — parallèle, tout ou rien

Lance plusieurs Promises en même temps et attend qu'elles soient **toutes** résolues.
Si **une seule** échoue, tout échoue.

```js
// Syntaxe de base
const [users, tickets, assets] = await Promise.all([
  apiV2.get('users'),
  apiV2.get('tickets'),
  apiV2.get('assets'),
]);

// Les 3 requêtes partent EN PARALLÈLE — plus rapide que séquentiel
```

### Comparaison séquentiel vs parallèle

```js
// ❌ Séquentiel — attend chaque requête avant de lancer la suivante
const users   = await apiV2.get('users');    // attend 200ms
const tickets = await apiV2.get('tickets');  // attend encore 200ms → total 400ms
const assets  = await apiV2.get('assets');   // encore 200ms → total 600ms

// ✅ Parallèle avec Promise.all — tout part en même temps
const [users, tickets, assets] = await Promise.all([
  apiV2.get('users'),
  apiV2.get('tickets'),
  apiV2.get('assets'),
]);
// → total ~200ms (le plus lent des 3)
```

### Promise.all dans un map — enrichir une liste

```js
// Enrichir chaque item d'un tableau avec des données supplémentaires
const tickets = await apiV2.get('tickets');

const enrichis = await Promise.all(
  tickets.map(async (ticket) => {
    const costs = await apiV2.get(`tickets/${ticket.id}/costs`);
    const items = await apiV2.get(`tickets/${ticket.id}/items`);
    return { ...ticket, costs, items };
  })
);
```

### Promise.all avec des valeurs non-async

```js
// Promise.all accepte aussi des valeurs normales (pas seulement des Promises)
const results = await Promise.all([
  apiV2.get('users'),   // Promise
  42,                    // valeur normale — passée telle quelle
  'hello',               // string — passée telle quelle
]);
// results = [usersData, 42, 'hello']
```

### Gestion d'erreur avec Promise.all

```js
// Si une Promise échoue, Promise.all rejette immédiatement
try {
  const [users, tickets] = await Promise.all([
    apiV2.get('users'),
    apiV2.get('tickets'),
  ]);
} catch (err) {
  // On ne sait pas laquelle a échoué
  console.error('au moins une requête a échoué:', err);
}
```

---

## 3. Promise.allSettled — parallèle, sans abandon

Lance tout en parallèle et attend **toutes** les Promises, **même si certaines échouent**.
Chaque résultat indique son état.

```js
const results = await Promise.allSettled([
  apiV2.get('users'),
  apiV2.get('tickets'),
  apiV2.get('inexistant'),  // va échouer
]);

// results = [
//   { status: 'fulfilled', value: [...] },
//   { status: 'fulfilled', value: [...] },
//   { status: 'rejected',  reason: Error('404') },
// ]

for (const result of results) {
  if (result.status === 'fulfilled') {
    console.log('ok:', result.value);
  } else {
    console.warn('raté:', result.reason.message);
  }
}
```

### Promise.all vs Promise.allSettled

```
                  Promise.all           Promise.allSettled
──────────────    ──────────────────    ──────────────────────────
Si tout ok        retourne les valeurs  retourne les valeurs
Si un échoue      rejette tout          retourne tous les résultats
Quand utiliser    toutes nécessaires    certaines peuvent rater
```

```js
// ✅ Promise.all — si les données sont toutes nécessaires
const [user, ticket] = await Promise.all([
  TicketService.getById(id),
  UserService.getById(userId),
]);

// ✅ Promise.allSettled — si certaines sont optionnelles
const results = await Promise.allSettled([
  apiV2.get('users'),
  apiV2.get('optional-stats'),
  apiV2.get('config'),
]);
const [usersResult, statsResult, configResult] = results;
const users  = usersResult.status  === 'fulfilled' ? usersResult.value  : [];
const stats  = statsResult.status  === 'fulfilled' ? statsResult.value  : null;
const config = configResult.status === 'fulfilled' ? configResult.value : {};
```

---

## 4. Promise.race — le plus rapide gagne

Retourne la valeur de la **première** Promise qui se termine (résolue OU rejetée).

```js
const result = await Promise.race([
  apiV2.get('data'),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), 5000)
  ),
]);
// → si l'API répond en moins de 5s : result = les données
// → si l'API ne répond pas en 5s : throw Error('timeout')
```

### Timeout sur une requête avec Promise.race

```js
const withTimeout = (promise, ms) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout après ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
};

const data = await withTimeout(apiV2.get('users'), 3000);
```

---

## 5. Promise.any — le premier succès

Retourne la valeur du **premier succès**. Échoue seulement si **toutes** échouent.

```js
// Essayer plusieurs sources, prendre la première qui répond
const data = await Promise.any([
  apiV2.get('source-primaire'),
  apiV2.get('source-secondaire'),
  apiV2.get('source-backup'),
]);
// → retourne la valeur de la première qui réussit

// Si TOUTES échouent
try {
  await Promise.any([
    Promise.reject(new Error('A')),
    Promise.reject(new Error('B')),
  ]);
} catch (err) {
  console.log(err); // AggregateError: All promises were rejected
}
```

### Résumé des méthodes Promise

```
Méthode               Attend           Comportement si échec
──────────────────    ─────────────    ──────────────────────────────
Promise.all           tout             échoue dès le premier échec
Promise.allSettled    tout             retourne tout (succès + échec)
Promise.race          le plus rapide   échoue si le plus rapide échoue
Promise.any           le plus rapide   échoue seulement si TOUS échouent
```

---

## 6. async / await — cas avancés

### Async dans useEffect (JSX)

```jsx
// ✅ Pattern correct — useEffect ne peut pas être async directement
useEffect(() => {
  const load = async () => {
    const data = await apiV2.get('users');
    setUsers(data);
  };
  load();
}, []);

// ❌ useEffect async — interdit (retourne une Promise au lieu d'une fonction de cleanup)
useEffect(async () => {
  const data = await apiV2.get('users');
  setUsers(data);
}, []);
```

### Async dans un handler (JSX)

```jsx
// ✅ Le handler lui-même est async
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    await apiV2.post('tickets', form);
    navigate('/tickets');
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### Chaîner des async

```js
const creerEtEnrichir = async (data) => {
  const ticket = await TicketService.createTicket(data, data.items);
  const enriched = new EnrichedTicket(ticket);
  await enriched.enrichAll();
  return enriched;
};
```

### Await conditionnel

```js
const charger = async (id, avecDetails) => {
  const ticket = await TicketService.getById(id);

  if (avecDetails) {
    const [costs, items] = await Promise.all([
      apiV2.get(`tickets/${id}/costs`),
      apiV2.get(`tickets/${id}/items`),
    ]);
    return { ...ticket, costs, items };
  }

  return ticket;
};
```

---

## 7. Les boucles — toutes les formes

### `for` classique

```js
const users = ['John', 'Jane', 'Bob'];

for (let i = 0; i < users.length; i++) {
  console.log(i, users[i]);  // 0 John, 1 Jane, 2 Bob
}

// Avec step
for (let i = 0; i < 10; i += 2) {
  console.log(i);  // 0, 2, 4, 6, 8
}

// À l'envers
for (let i = users.length - 1; i >= 0; i--) {
  console.log(users[i]);  // Bob, Jane, John
}
```

### `for...of` — parcourir les valeurs

```js
const users = ['John', 'Jane', 'Bob'];

// Valeurs uniquement
for (const user of users) {
  console.log(user);  // John, Jane, Bob
}

// Avec index — entries()
for (const [index, user] of users.entries()) {
  console.log(index, user);  // 0 John, 1 Jane, 2 Bob
}

// Sur une string
for (const lettre of 'hello') {
  console.log(lettre);  // h, e, l, l, o
}

// Sur un Set
const ids = new Set([1, 2, 3]);
for (const id of ids) {
  console.log(id);
}

// Sur un Map
const map = new Map([['a', 1], ['b', 2]]);
for (const [cle, valeur] of map) {
  console.log(cle, valeur);
}
```

### `for...of` avec await — async dans une boucle

```js
// ✅ for...of supporte await — les itérations sont SÉQUENTIELLES
const tickets = [{ id: 1 }, { id: 2 }, { id: 3 }];

for (const ticket of tickets) {
  const detail = await apiV2.get(`tickets/${ticket.id}`);
  console.log(detail);  // attend chaque requête avant la suivante
}

// ⚠️ forEach ne supporte PAS await correctement
tickets.forEach(async (ticket) => {
  const detail = await apiV2.get(`tickets/${ticket.id}`);
  // ❌ les await ne bloquent pas forEach — tout part en même temps
  // et forEach ne retourne pas de Promise
});

// ✅ Si on veut du parallèle avec await → Promise.all + map
const details = await Promise.all(
  tickets.map(async (ticket) => apiV2.get(`tickets/${ticket.id}`))
);
```

### `for...in` — parcourir les clés d'un objet

```js
const user = { nom: 'John', age: 25, role: 'admin' };

for (const cle in user) {
  console.log(cle, user[cle]);  // nom John, age 25, role admin
}

// ⚠️ for...in parcourt aussi les propriétés héritées
// → préférer Object.keys() pour les objets simples

// ✅ for...in sur un objet
for (const cle in user) {
  if (Object.prototype.hasOwnProperty.call(user, cle)) {
    console.log(cle, user[cle]);
  }
}
```

### `for...in` vs `for...of`

```
              for...in                    for...of
────────────  ──────────────────────      ──────────────────────────
Parcourt      les clés (string)           les valeurs
Fonctionne    objets, arrays              arrays, strings, Set, Map
Avec await    oui                         oui
Héritées      oui (à éviter sur arrays)   non
```

```js
const arr = ['a', 'b', 'c'];

for (const i in arr)  console.log(i);     // "0", "1", "2" (clés string)
for (const v of arr)  console.log(v);     // "a", "b", "c" (valeurs)
```

### `while` et `do...while`

```js
// while — condition vérifiée AVANT
let i = 0;
while (i < 5) {
  console.log(i);
  i++;
}

// do...while — condition vérifiée APRÈS (s'exécute au moins une fois)
let j = 0;
do {
  console.log(j);
  j++;
} while (j < 5);

// Cas d'usage concret : attendre qu'une condition soit vraie
let tentatives = 0;
let data = null;
while (!data && tentatives < 3) {
  data = await apiV2.get('data').catch(() => null);
  tentatives++;
}
```

### `break` et `continue`

```js
const users = [
  { id: 1, nom: 'John', isActive: true },
  { id: 2, nom: 'Jane', isActive: false },
  { id: 3, nom: 'Bob',  isActive: true },
];

// break — arrête la boucle
for (const user of users) {
  if (user.id === 2) break;
  console.log(user.nom);  // John seulement
}

// continue — passe à l'itération suivante
for (const user of users) {
  if (!user.isActive) continue;
  console.log(user.nom);  // John, Bob
}
```

### Résumé — quelle boucle choisir

```
Besoin                                    Boucle
──────────────────────────────────────    ──────────────────────────
Tableau simple, valeurs                   for...of
Tableau avec index                        for...of + .entries() ou for classique
Clés d'un objet                           for...in ou Object.keys().forEach
Avec await, séquentiel                    for...of (ou for classique)
Avec await, parallèle                     Promise.all + .map()
Nombre d'itérations connu                 for classique
Condition de sortie inconnue              while
Doit s'exécuter au moins une fois         do...while
Arrêter la boucle avant la fin            for / for...of avec break
```

---

## 8. Fonctions utilitaires sur les tableaux

### `.map()` — transformer

```js
const users = [{ id: 1, nom: 'John' }, { id: 2, nom: 'Jane' }];

// Transformer chaque élément
const noms = users.map((u) => u.nom);          // ['John', 'Jane']
const ids  = users.map((u) => u.id);            // [1, 2]
const html = users.map((u) => `<li>${u.nom}</li>`);

// Ajouter un champ calculé
const enrichis = users.map((u) => ({
  ...u,
  nomUppercase: u.nom.toUpperCase(),
  label: `${u.id} - ${u.nom}`,
}));
```

### `.filter()` — filtrer

```js
const users = [
  { id: 1, nom: 'John', age: 25, isActive: true },
  { id: 2, nom: 'Jane', age: 17, isActive: false },
  { id: 3, nom: 'Bob',  age: 30, isActive: true },
];

const actifs   = users.filter((u) => u.isActive);            // John, Bob
const majeurs  = users.filter((u) => u.age >= 18);           // John, Bob
const admins   = users.filter((u) => u.role === 'admin');    // []
const sansBob  = users.filter((u) => u.id !== 3);            // John, Jane

// Enchaîné avec map
const nomsActifs = users
  .filter((u) => u.isActive)
  .map((u) => u.nom);  // ['John', 'Bob']
```

### `.find()` — trouver un élément

```js
// Retourne le PREMIER élément qui correspond, ou undefined
const john = users.find((u) => u.id === 1);          // { id:1, nom:'John', ... }
const admin = users.find((u) => u.role === 'admin');  // undefined

// Avec valeur par défaut
const user = users.find((u) => u.id === 99) ?? null;

// Usage fréquent — trouver un item lié
const assignee = users.find((u) => u.id === ticket.userId);
const nom = assignee ? assignee.nom : 'Non assigné';
```

### `.findIndex()` — trouver la position

```js
const index = users.findIndex((u) => u.id === 2);  // 1
const absent = users.findIndex((u) => u.id === 99); // -1

// Modifier un élément à sa position
if (index !== -1) {
  const updated = [...users];
  updated[index] = { ...users[index], nom: 'Jane Updated' };
}
```

### `.includes()` — tester la présence

```js
// Sur un tableau de valeurs primitives
const roles = ['admin', 'user', 'moderateur'];
roles.includes('admin');      // true
roles.includes('superadmin'); // false

// Sur des ids
const selectedIds = [1, 3, 5];
selectedIds.includes(3);  // true
selectedIds.includes(2);  // false

// Usage en JSX — style conditionnel
<li className={selectedIds.includes(user.id) ? 'selected' : ''}>
  {user.nom}
</li>

// ⚠️ Ne fonctionne PAS pour les objets (comparaison par référence)
const users = [{ id: 1 }, { id: 2 }];
users.includes({ id: 1 });  // false — objets différents en mémoire
// ✅ Utiliser .some() à la place
users.some((u) => u.id === 1);  // true
```

### `.some()` — au moins un correspond

```js
// Retourne true si AU MOINS UN élément passe le test
const users = [{ id: 1, isAdmin: false }, { id: 2, isAdmin: true }];

users.some((u) => u.isAdmin);           // true
users.some((u) => u.age > 100);         // false

// Usage courant
const aDesAdmins   = users.some((u) => u.role === 'admin');
const aDesErreurs  = errors.some((e) => e.level === 'critical');
const estSelectionne = selectedIds.some((id) => id === user.id);
```

### `.every()` — tous correspondent

```js
// Retourne true si TOUS les éléments passent le test
const users = [
  { id: 1, isActive: true },
  { id: 2, isActive: true },
];

users.every((u) => u.isActive);          // true
users.every((u) => u.role === 'admin');  // false

// Usage courant
const tousValides  = champs.every((c) => c.value.trim() !== '');
const formulaireOk = Object.values(errors).every((e) => e === null);
```

### `.reduce()` — agréger en une valeur

```js
const commandes = [
  { id: 1, montant: 100 },
  { id: 2, montant: 250 },
  { id: 3, montant: 75 },
];

// Somme
const total = commandes.reduce((acc, c) => acc + c.montant, 0);  // 425

// Valeur max
const max = commandes.reduce((acc, c) => c.montant > acc ? c.montant : acc, 0);

// Construire un objet indexé par id
const byId = commandes.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {});
// { '1': { id:1, montant:100 }, '2': { id:2, montant:250 }, ... }

// Grouper par propriété
const users = [
  { id: 1, role: 'admin' },
  { id: 2, role: 'user' },
  { id: 3, role: 'admin' },
];

const parRole = users.reduce((acc, user) => {
  const role = user.role;
  if (!acc[role]) acc[role] = [];
  acc[role].push(user);
  return acc;
}, {});
// { admin: [{id:1}, {id:3}], user: [{id:2}] }

// Compter les occurrences
const comptage = users.reduce((acc, u) => {
  acc[u.role] = (acc[u.role] || 0) + 1;
  return acc;
}, {});
// { admin: 2, user: 1 }
```

### `.forEach()` — itérer sans retour

```js
// forEach ne retourne rien — pour les effets de bord uniquement
users.forEach((user) => {
  console.log(user.nom);
});

// ⚠️ forEach ne supporte pas break, ni await correctement
// ✅ Préférer for...of si besoin de break ou await
```

### `.sort()` — trier

```js
// ⚠️ sort mute le tableau — toujours spread avant
const sorted = [...users].sort((a, b) => a.nom.localeCompare(b.nom));  // alphabétique
const byAge  = [...users].sort((a, b) => a.age - b.age);               // croissant
const byDate = [...users].sort((a, b) => new Date(b.date) - new Date(a.date)); // récent en premier

// Règle : si (a, b) => négatif → a avant b | positif → b avant a | 0 → égaux
```

### `.flat()` et `.flatMap()` — aplatir

```js
const nested = [[1, 2], [3, 4], [5]];
nested.flat();        // [1, 2, 3, 4, 5]

const deep = [[1, [2, 3]], [4]];
deep.flat(2);         // [1, 2, 3, 4]
deep.flat(Infinity);  // [1, 2, 3, 4] — toute profondeur

// flatMap = map + flat(1) en une passe
const phrases = ['hello world', 'foo bar'];
phrases.flatMap((p) => p.split(' '));  // ['hello', 'world', 'foo', 'bar']

// Usage concret — extraire tous les items de tous les tickets
const tousLesItems = tickets.flatMap((t) => t.items);
```

### `.slice()` — extraire une portion

```js
const users = ['A', 'B', 'C', 'D', 'E'];

users.slice(1, 3);   // ['B', 'C']      — de l'index 1 (inclus) à 3 (exclus)
users.slice(2);      // ['C', 'D', 'E'] — de l'index 2 jusqu'à la fin
users.slice(-2);     // ['D', 'E']      — les 2 derniers
users.slice(0, 10);  // tout le tableau si moins de 10 éléments

// Pagination
const page = 2;
const pageSize = 10;
const paginated = users.slice(page * pageSize, (page + 1) * pageSize);
```

### `.splice()` — modifier en place

```js
// ⚠️ splice mute le tableau original
const arr = ['A', 'B', 'C', 'D'];

arr.splice(1, 1);          // supprime 1 élément à l'index 1 → ['A', 'C', 'D']
arr.splice(1, 0, 'X');     // insère 'X' à l'index 1 → ['A', 'X', 'B', 'C', 'D']
arr.splice(1, 1, 'X');     // remplace à l'index 1 → ['A', 'X', 'C', 'D']

// Dans React — ne jamais muter le state directement
// ✅ Utiliser filter ou map à la place
const sans = users.filter((u) => u.id !== id);
```

### `.concat()` et spread — fusionner

```js
const a = [1, 2];
const b = [3, 4];

a.concat(b);       // [1, 2, 3, 4]
[...a, ...b];      // [1, 2, 3, 4] — préféré en React

// Ajouter un élément
[...users, newUser];
[newUser, ...users];  // au début
```

---

## 9. Fonctions utilitaires sur les objets

### `Object.keys()` — toutes les clés

```js
const user = { id: 1, nom: 'John', age: 25 };

Object.keys(user);    // ['id', 'nom', 'age']
Object.keys(user).length;  // 3

// Parcourir les clés
Object.keys(user).forEach((cle) => console.log(cle, user[cle]));

// Vérifier si un objet est vide
Object.keys(obj).length === 0;
```

### `Object.values()` — toutes les valeurs

```js
Object.values(user);  // [1, 'John', 25]

// Vérifier si des erreurs existent
const errors = { nom: null, email: 'champ requis', age: null };
const aDesErreurs = Object.values(errors).some((e) => e !== null);
```

### `Object.entries()` — clés + valeurs

```js
Object.entries(user);
// [['id', 1], ['nom', 'John'], ['age', 25]]

// Parcourir proprement
for (const [cle, valeur] of Object.entries(user)) {
  console.log(cle, valeur);
}

// Transformer un objet
const upperKeys = Object.fromEntries(
  Object.entries(user).map(([k, v]) => [k.toUpperCase(), v])
);
// { ID: 1, NOM: 'John', AGE: 25 }
```

### `Object.fromEntries()` — reconstruire un objet

```js
const entries = [['nom', 'John'], ['age', 25]];
Object.fromEntries(entries);  // { nom: 'John', age: 25 }

// Filtrer les clés d'un objet
const filtre = Object.fromEntries(
  Object.entries(user).filter(([k]) => k !== 'id')
);
// { nom: 'John', age: 25 }
```

### Spread et rest sur les objets

```js
const user = { id: 1, nom: 'John', age: 25 };

// Copie (superficielle)
const copie = { ...user };

// Merger deux objets — le dernier gagne
const merged = { ...user, age: 30, role: 'admin' };
// { id:1, nom:'John', age:30, role:'admin' }

// Extraire des champs avec rest
const { id, ...sansId } = user;
// id = 1
// sansId = { nom: 'John', age: 25 }

// Usage React — mettre à jour un champ d'un state objet
setForm({ ...form, [e.target.name]: e.target.value });
setUser({ ...user, isAdmin: true });
```

---

## 10. Fonctions utilitaires sur les strings

### Les essentielles

```js
const str = '  Bonjour le Monde  ';

str.trim();           // 'Bonjour le Monde'     — supprime espaces début/fin
str.trimStart();      // 'Bonjour le Monde  '
str.trimEnd();        // '  Bonjour le Monde'
str.toLowerCase();    // '  bonjour le monde  '
str.toUpperCase();    // '  BONJOUR LE MONDE  '
str.includes('le');   // true
str.startsWith('  B');// true
str.endsWith('  ');   // true
str.replace('Monde', 'World');         // '  Bonjour le World  '
str.replaceAll(' ', '_');              // '__Bonjour_le_Monde__'
str.split(' ');       // ['', '', 'Bonjour', 'le', 'Monde', '', '']
str.slice(2, 9);      // 'Bonjour'
str.length;           // 20
```

### Template literals

```js
const nom = 'John';
const age = 25;

`Bonjour ${nom}, tu as ${age} ans`;
`${age > 18 ? 'majeur' : 'mineur'}`;

// Multi-ligne
const html = `
  <div>
    <h1>${nom}</h1>
    <p>${age} ans</p>
  </div>
`;
```

### Conversion string ↔ autres types

```js
// String → number
parseInt('42');        // 42
parseFloat('3.14');    // 3.14
Number('42');          // 42
Number('');            // 0
Number('abc');         // NaN

// Number → string
String(42);            // '42'
(42).toString();       // '42'
(3.14159).toFixed(2);  // '3.14'

// Vérifier NaN
isNaN(Number('abc'));   // true
Number.isNaN(NaN);      // true
```

---

## 11. Fonctions utilitaires sur les nombres

```js
Math.round(3.7);       // 4   — arrondi au plus proche
Math.floor(3.9);       // 3   — arrondi vers le bas
Math.ceil(3.1);        // 4   — arrondi vers le haut
Math.abs(-5);          // 5   — valeur absolue
Math.max(1, 5, 3);     // 5
Math.min(1, 5, 3);     // 1
Math.pow(2, 10);       // 1024
Math.sqrt(16);         // 4
Math.random();         // nombre aléatoire entre 0 et 1

// Nombre aléatoire entre min et max
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Formater un nombre
(1234567.89).toLocaleString('fr-FR');         // '1 234 567,89'
(1234567.89).toLocaleString('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});  // '1 234 567,89 €'
```

---

## 12. Résumé — quel outil pour quel besoin

```
Besoin                                         Outil
────────────────────────────────────────────   ──────────────────────────────
Plusieurs requêtes en parallèle                Promise.all
Parallèle, certaines peuvent rater             Promise.allSettled
Le plus rapide des deux                        Promise.race
La première qui réussit                        Promise.any
Attendre une réponse async dans une boucle     for...of + await
Transformer chaque élément d'un tableau        .map()
Garder certains éléments                       .filter()
Trouver un seul élément                        .find()
Trouver la position d'un élément               .findIndex()
Tester si une valeur est dans un tableau        .includes()
Tester si au moins un élément correspond        .some()
Tester si tous les éléments correspondent       .every()
Calculer une somme / agréger                   .reduce()
Trier                                          [...arr].sort()
Extraire une portion                           .slice()
Aplatir un tableau imbriqué                    .flat()
Toutes les clés d'un objet                     Object.keys()
Toutes les valeurs d'un objet                  Object.values()
Clés + valeurs d'un objet                      Object.entries()
Reconstruire un objet depuis des entrées        Object.fromEntries()
Copier / merger des objets                     spread { ...a, ...b }
Boucle sur objet                               for...in ou Object.keys()
Boucle sur tableau avec await séquentiel        for...of
Boucle sur tableau avec await parallèle         Promise.all + .map()
```
