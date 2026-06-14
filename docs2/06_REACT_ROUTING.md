# ⚛️ React — Routing (Navigation)

## 1. Structure des routes dans le projet

Le projet utilise **React Router v6** pour la navigation.

### Routes principales (src/App.jsx)

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

<BrowserRouter>
  <Routes>
    <Route path="/admin/*"    element={<BackofficeApp />} />
    <Route path="/customer/*" element={<FrontofficeApp />} />
    <Route path="/"           element={<SelectApp />} />
  </Routes>
</BrowserRouter>
```

Le `/*` à la fin signifie "toutes les sous-routes". Ainsi `/admin/tickets`, `/admin/tickets/42`, etc. sont toutes gérées par `<BackofficeApp />`.

## 2. Les 3 hooks de routing essentiels

### useParams — Récupérer les paramètres de l'URL

```jsx
// Si la route est définie comme : /admin/tickets/:id
// Et que l'URL est : /admin/tickets/42

import { useParams } from "react-router-dom";

export default function TicketDetail() {
    const { id } = useParams();  // id = "42" (string !)
    
    // ⚠️ useParams renvoie des STRINGS, pas des nombres
    // Si besoin d'un nombre :
    const idNum = Number(id);
    
    // Utilisation typique : charger les données
    useEffect(() => {
        getTicketById(id).then(data => setTicket(new Ticket(data)));
    }, [id]);
}
```

### useNavigate — Naviguer programmatiquement

```jsx
import { useNavigate } from "react-router-dom";

export default function MaPage() {
    const navigate = useNavigate();

    // Naviguer vers une autre page
    navigate("/admin/tickets");         // Aller à la liste des tickets
    navigate("/admin/tickets/42");      // Aller au ticket #42
    navigate(-1);                       // Revenir en arrière (comme le bouton retour du navigateur)

    // Naviguer avec des données (state)
    navigate(`/admin/tickets/${ticket.id}`, { 
        state: { ticket }  // On passe l'objet ticket à la page suivante
    });
}
```

**Exemple réel** (TicketDetail.jsx) :
```jsx
// Bouton retour
<a onClick={() => navigate(-1)} className="btn-back" style={{ cursor: "pointer" }}>
    ← Retour
</a>
```

### useLocation — Récupérer les données passées via navigate

```jsx
import { useLocation } from "react-router-dom";

export default function TicketDetail() {
    const { state } = useLocation();
    
    // Si la page précédente a fait navigate('/tickets/42', { state: { ticket } })
    // alors state.ticket contient le ticket
    const [ticket, setTicket] = useState(state?.ticket ?? null);
    
    // Si pas de state (ex: accès direct via l'URL), on charge depuis l'API
    useEffect(() => {
        if (!ticket) {
            getTicketById(id).then(data => setTicket(new Ticket(data)));
        }
    }, [id]);
}
```

**Pourquoi c'est utile ?** Quand l'utilisateur clique sur un ticket dans la liste, on a déjà les données. On les passe via `state` pour éviter un appel API supplémentaire. Si l'utilisateur arrive directement sur l'URL (ou recharge la page), le state est null et on charge depuis l'API.

## 3. Liens de navigation

### Link — Créer un lien cliquable

```jsx
import { Link } from "react-router-dom";

<Link to="/admin/tickets">Voir les tickets</Link>
<Link to={`/admin/tickets/${ticket.id}`}>Ticket #{ticket.id}</Link>
```

### NavLink — Lien avec style actif

```jsx
import { NavLink } from "react-router-dom";

<NavLink 
    to="/admin/dashboard" 
    className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
>
    Dashboard
</NavLink>
```

## 4. Navigation via un clic sur un élément de liste

Pattern courant : cliquer sur une ligne de tableau pour aller au détail.

```jsx
// Dans une liste de tickets
{tickets.map(ticket => (
    <tr 
        key={ticket.id} 
        onClick={() => navigate(`/admin/tickets/${ticket.id}`, { 
            state: { ticket } 
        })}
        style={{ cursor: "pointer" }}
    >
        <td>{ticket.id}</td>
        <td>{ticket.name}</td>
    </tr>
))}
```
