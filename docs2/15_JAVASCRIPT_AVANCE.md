# 🧠 JavaScript Avancé (L'Essentiel pour React)

React n'utilise pas de "magie". Ce qui bloque souvent les débutants en React, c'est simplement du JavaScript moderne (ES6+). Voici les concepts indispensables.

## 1. Déstructuration (Extraire des valeurs)

Au lieu de répéter `.`, on "déballe" les objets.

### Avec les Objets
```javascript
const user = { id: 1, nom: "Jean", role: "Admin" };

// ❌ À l'ancienne :
const nom = user.nom;
const role = user.role;

// ✅ Moderne (Déstructuration) :
const { nom, role } = user;
```

**Très utilisé dans le Backend (`req.body`) :**
```javascript
// On extrait directement les variables envoyées par le front
const { ticketId, valeur, typeCout } = req.body;
```

**Très utilisé dans React (Les Props) :**
```javascript
// Au lieu de (props) => props.titre
function MonComposant({ titre, sousTitre }) {
    return <h1>{titre}</h1>;
}
```

### Avec les Tableaux
C'est comme ça que fonctionne `useState` !
```javascript
const fruits = ["Pomme", "Banane"];
const [premier, second] = fruits; 
// premier = "Pomme", second = "Banane"

// useState retourne un tableau de 2 éléments [valeur, fonction]
const [ticket, setTicket] = useState(null);
```

## 2. Le Spread Operator (`...`)

Les trois petits points servent à copier ou fusionner.

### Copier et modifier un objet
```javascript
const form = { nom: "Test", statut: 1 };

// On crée un NOUVEL objet, on copie tout ce qui était dans "form", 
// ET on remplace/ajoute la propriété "statut"
const newForm = { ...form, statut: 2 };
// Résultat : { nom: "Test", statut: 2 }
```

### Copier et ajouter dans un tableau
```javascript
const items = ["A", "B"];

// On crée un nouveau tableau avec le contenu de "items" + "C"
const newItems = [...items, "C"]; 
// Résultat : ["A", "B", "C"]
```
*(C'est pour ça qu'on fait `setItems(prev => [...prev, newItem])` en React !)*

## 3. Les méthodes de Tableaux (au-delà du .map)

Vous connaissez `.map()` (pour transformer) et `.filter()` (pour garder certains éléments). En voici d'autres très utiles :

### `.find()` — Trouver le premier élément
```javascript
const users = [{ id: 1, nom: "Jean" }, { id: 2, nom: "Paul" }];

// Retourne L'OBJET (ou undefined s'il ne trouve pas)
const jean = users.find(u => u.id === 1); 
```

### `.some()` — Vérifier si au moins UN élément correspond (Retourne un Booléen)
```javascript
const assets = [{ type: "Computer", id: 1 }, { type: "Monitor", id: 5 }];

// Est-ce qu'on a déjà sélectionné ce PC ? -> Retourne true ou false
const isAlreadySelected = assets.some(a => a.type === "Computer" && a.id === 1);
```

### `.reduce()` — Calculer un total
Voir le fichier `05_REACT_LISTES_ET_MAP.md` pour des exemples détaillés sur le calcul des coûts de tickets.

## 4. Promesses (Promises) et Async/Await

Quand on fait une requête API ou base de données, ça prend du temps. Le code ne peut pas s'arrêter, sinon la page figerait. 

### À l'ancienne : Les callbacks (utilisé dans votre backend SQLite)
```javascript
db.all("SELECT...", [], (err, rows) => {
    // Cette fonction sera appelée PLUS TARD, quand la BDD aura répondu
    console.log(rows);
});
console.log("Ceci s'affichera EN PREMIER !");
```

### Modèrne : `.then()` et `.catch()` (utilisé dans les useEffect)
```javascript
apiV2.get("/endpoint")
    .then(data => {
        // En cas de succès
        setTicket(data);
    })
    .catch(error => {
        // En cas d'erreur (serveur éteint, 404, etc.)
        console.error(error);
    })
    .finally(() => {
        // S'exécute TOUJOURS à la fin (pratique pour arrêter un chargement)
        setLoading(false);
    });
```

### Ultra Moderne : `async` / `await`
C'est la même chose que `.then()`, mais ça s'écrit de manière "plate", comme du code normal.

```javascript
// La fonction DOIT avoir le mot clé "async"
const chargerTicket = async () => {
    try {
        setLoading(true);
        // Le code "s'arrête" virtuellement ici en attendant la réponse
        const data = await apiV2.get("/endpoint"); 
        setTicket(data);
    } catch (error) {
        console.error("Erreur !");
    } finally {
        setLoading(false);
    }
};
```
**⚠️ Piège React :** Vous ne pouvez pas mettre `async` directement sur le `useEffect`.
```javascript
// ❌ FAUX
useEffect(async () => { await ... }, []);

// ✅ VRAI
useEffect(() => {
    const fetch = async () => { await ... };
    fetch();
}, []);
```

## 5. Valeurs conditionnelles par défaut (`??` et `?.`)

### Optionnal Chaining (`?.`)
Évite les crashs si l'objet est null ou undefined.

```javascript
// ❌ Si "ticket" est null, ça CRASHE : "Cannot read property 'name' of null"
const nom = ticket.name; 

// ✅ Si "ticket" est null, "nom" devient juste "undefined" (pas de crash)
const nom = ticket?.name; 

// Très utile pour les tableaux imbriqués :
const prenomAdmin = ticket?.team?.[0]?.firstname;
```

### Nullish Coalescing (`??`)
Fournir une valeur par défaut SI (et seulement si) la valeur est `null` ou `undefined`.

```javascript
const data = null;

// Si data est null, items devient un tableau vide []
const items = data ?? [];

// Différence avec le OU logique (||) :
// || remplace la valeur si c'est "faux" (0, "", false, null)
// ?? remplace SEULEMENT si c'est null ou undefined.

const count = 0;
console.log(count || 10); // Affiche 10 ! (0 est considéré "faux")
console.log(count ?? 10); // Affiche 0 ! (Ce n'est pas null)
```
