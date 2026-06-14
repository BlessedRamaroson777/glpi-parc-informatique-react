# ⚛️ React — Les Bases

## 1. Qu'est-ce qu'un composant ?

Un composant React est **une fonction JavaScript qui retourne du JSX** (du HTML-like).
Chaque fichier `.jsx` dans le projet est soit une page, soit un composant réutilisable.

```jsx
// Un composant simple
function MonBouton({ texte, onClick }) {
    return (
        <button onClick={onClick}>
            {texte}
        </button>
    );
}

// Utilisation
<MonBouton texte="Cliquez ici" onClick={() => alert('Salut!')} />
```

### Règles de base
- Le nom d'un composant commence **TOUJOURS** par une majuscule : `TicketDetail`, pas `ticketDetail`
- Un composant retourne **un seul élément racine** (ou utiliser `<>...</>` pour en grouper plusieurs)
- Les composants sont exportés avec `export default function NomDuComposant()`

## 2. JSX : le HTML de React

JSX ressemble à du HTML mais c'est du JavaScript. Les différences :

| HTML               | JSX                    | Pourquoi ?                              |
|-------------------|------------------------|-----------------------------------------|
| `class="btn"`     | `className="btn"`      | `class` est un mot réservé en JS        |
| `for="email"`     | `htmlFor="email"`      | `for` est un mot réservé en JS          |
| `onclick="..."`   | `onClick={...}`        | camelCase + expression JS entre `{}`    |
| `style="color:red"` | `style={{color:'red'}}` | Objet JS, pas une string              |
| `<!-- comment -->` | `{/* comment */}`      | Les commentaires HTML ne marchent pas   |

### Injecter des variables dans le JSX

Tout ce qui est entre `{}` est du JavaScript :

```jsx
const nom = "Jean";
const estAdmin = true;

return (
    <div>
        <h1>Bonjour {nom}</h1>             {/* → Bonjour Jean */}
        <p>Rôle : {estAdmin ? "Admin" : "User"}</p>  {/* → Rôle : Admin */}
        <p>2 + 2 = {2 + 2}</p>             {/* → 2 + 2 = 4 */}
    </div>
);
```

## 3. Les Props (propriétés)

Les props sont les "paramètres" d'un composant. On les passe comme des attributs HTML.

```jsx
// Définition du composant
function Badge({ status }) {       // ← on reçoit 'status' via les props
    return <span className={`badge badge-status-${status}`}>
        Statut {status}
    </span>;
}

// Utilisation
<Badge status={1} />    // → <span class="badge badge-status-1">Statut 1</span>
<Badge status={6} />    // → <span class="badge badge-status-6">Statut 6</span>
```

**Exemple réel du projet** (dans `TicketDetail.jsx`) :

```jsx
// Le composant Row prend 2 props : label et value
function Row({ label, value }) {
    if (!value && value !== 0) return null;  // Si pas de value, on n'affiche rien
    return (
        <div className="row-info">
            <span className="row-label">{label}</span>
            <span className="row-value">{value}</span>
        </div>
    );
}

// Utilisation
<Row label="Type"     value="Incident" />
<Row label="Priorité" value="Haute" />
<Row label="Entité"   value={null} />     // ← Celui-ci ne s'affiche pas (return null)
```

## 4. Rendu conditionnel

Afficher quelque chose **seulement si** une condition est vraie.

### Méthode 1 : `&&` (la plus courante dans le projet)

```jsx
// S'affiche SEULEMENT si items.length > 0
{items.length > 0 && (
    <div>
        <p>Il y a {items.length} éléments</p>
    </div>
)}
```

**Exemple réel** (équipe dans TicketDetail.jsx) :
```jsx
{ticket.team?.length > 0 && (
    <div className="info-section">
        <p className="section-title">Équipe</p>
        <ul>
            {ticket.team.map((m, i) => (
                <li key={i}>{m.display_name || m.name}</li>
            ))}
        </ul>
    </div>
)}
```

### Méthode 2 : Ternaire `? :`

```jsx
{costsLoading ? (
    <p>Chargement des coûts...</p>
) : costs.length === 0 ? (
    <p>Aucun coût enregistré.</p>
) : (
    <div className="costs-list">
        {/* Afficher les coûts */}
    </div>
)}
```

### Méthode 3 : `return null` dans un composant

```jsx
function Row({ label, value }) {
    if (!value && value !== 0) return null;  // ← On n'affiche rien du tout
    return <div>{label}: {value}</div>;
}
```

## 5. Les enfants (children)

Quand vous mettez du contenu entre les balises d'un composant, c'est accessible via `children` :

```jsx
function Carte({ children, titre }) {
    return (
        <div className="card">
            <h2>{titre}</h2>
            <div className="card-body">
                {children}
            </div>
        </div>
    );
}

// Utilisation
<Carte titre="Mon ticket">
    <p>Ceci est le contenu de la carte</p>
    <button>Action</button>
</Carte>
```

## 6. Imports / Exports

### Export par défaut (1 seul par fichier)
```jsx
// Dans MonComposant.jsx
export default function MonComposant() { ... }

// Pour l'importer
import MonComposant from './MonComposant.jsx';
```

### Export nommé (plusieurs par fichier)
```jsx
// Dans TicketConstants.jsx
export const TICKET_STATUS = [...];
export const TICKET_TYPES = [...];

// Pour les importer (avec accolades)
import { TICKET_STATUS, TICKET_TYPES } from '../constants/TicketConstants.jsx';
```

**Attention au piège :** si vous oubliez les `{}` pour un export nommé, vous importerez `undefined`.
