# ⚛️ React Avancé (Hooks et Optimisations)

Une fois que vous maîtrisez `useState` et `useEffect` (voir le fichier 03), vous pouvez avoir besoin de ces concepts pour des cas plus complexes.

## 1. `useRef` — Garder une valeur sans re-render

`useRef` crée une "boîte" qui peut stocker n'importe quelle valeur. La différence avec `useState` ? **Modifier la valeur ne provoque PAS le re-chargement du composant**.

### Cas d'usage 1 : Garder une référence vers un élément HTML
Pour faire des actions directes comme faire un focus ou récupérer une hauteur.

```jsx
import { useRef } from 'react';

function MonFormulaire() {
    // 1. On crée la ref (initialement null)
    const inputRef = useRef(null);

    const focusInput = () => {
        // 3. On utilise .current pour accéder à l'élément HTML
        inputRef.current.focus();
    };

    return (
        <div>
            {/* 2. On lie la ref à l'élément HTML */}
            <input type="text" ref={inputRef} />
            <button onClick={focusInput}>Mettre le curseur dans l'input</button>
        </div>
    );
}
```

### Cas d'usage 2 : Stocker une variable "silencieuse"
```jsx
const renderCount = useRef(0);

useEffect(() => {
    // À chaque rendu, on augmente. Le composant ne se re-rendra pas pour ça.
    renderCount.current += 1;
    console.log(`Le composant a été rendu ${renderCount.current} fois`);
});
```

## 2. `useMemo` — Éviter de refaire des calculs lourds

À chaque fois qu'un composant re-render (car un state a changé), **tout le code du composant est ré-exécuté**. Si vous avez un calcul lourd (comme filtrer 10 000 tickets), vous voulez éviter de le refaire à chaque frappe sur le clavier.

```jsx
import { useMemo, useState } from 'react';

function ListeTickets({ tickets }) {
    const [search, setSearch] = useState("");
    const [theme, setTheme] = useState("light"); // Changer ça re-render le composant

    // SANS useMemo : ce filtre s'exécutera même si on change juste le "theme" !
    // const ticketsFiltres = tickets.filter(t => t.name.includes(search));

    // AVEC useMemo : React mémorise le résultat.
    // Il ne refera le calcul QUE SI "tickets" ou "search" change.
    const ticketsFiltres = useMemo(() => {
        console.log("Calcul très lourd...");
        return tickets.filter(t => t.name.includes(search));
    }, [tickets, search]); // ← Tableau de dépendances (comme useEffect)

    return (/* ... */);
}
```

## 3. `useCallback` — Mémoriser une fonction

Même concept que `useMemo`, mais pour les fonctions. C'est surtout utile quand on passe une fonction en "prop" à un composant enfant optimisé, pour éviter que l'enfant ne se re-charge inutilement.

```jsx
import { useCallback } from 'react';

const handleClick = useCallback(() => {
    console.log("Ticket sélectionné :", ticketId);
}, [ticketId]); // La fonction ne changera que si ticketId change
```

## 4. `useContext` — Partager des données sans "Prop Drilling"

Le "Prop Drilling", c'est quand on passe une propriété à travers 10 composants de père en fils jusqu'à celui qui en a besoin. Le Context permet de créer une variable "Globale" accessible par n'importe quel enfant.

**1. Créer le Context (dans un fichier séparé)**
```jsx
// UserContext.jsx
import { createContext } from 'react';
export const UserContext = createContext(null);
```

**2. Fournir la donnée (Tout en haut de l'app, ex: App.jsx)**
```jsx
import { UserContext } from './UserContext';

function App() {
    const [user, setUser] = useState({ nom: "Jean" });

    return (
        // Tous les composants à l'intérieur auront accès à "user"
        <UserContext.Provider value={user}>
            <MonApplication />
        </UserContext.Provider>
    );
}
```

**3. Consommer la donnée (N'importe où, même très profond)**
```jsx
import { useContext } from 'react';
import { UserContext } from './UserContext';

function MonHeaderProfond() {
    // On récupère directement la valeur !
    const user = useContext(UserContext);

    return <div>Bonjour {user.nom}</div>;
}
```
*(Dans votre projet, vous utilisez déjà potentiellement des Contexts cachés via `react-router-dom` (pour l'URL) !)*

## 5. Custom Hooks (Créer ses propres Hooks)

C'est la magie de React : vous pouvez créer vos propres fonctions `useQuelqueChose` pour recycler de la logique.

**Exemple : Vous avez besoin de la largeur de l'écran à plusieurs endroits.**

```jsx
// src/common/hooks/useWindowSize.jsx
import { useState, useEffect } from 'react';

export function useWindowSize() {
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        
        // "Cleanup" function : on nettoie l'événement quand le composant est détruit
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return width; // On retourne juste la valeur
}
```

**Utilisation dans N'IMPORTE QUEL composant :**
```jsx
import { useWindowSize } from '../hooks/useWindowSize';

function MonMenu() {
    const width = useWindowSize(); // MAGIE ! Le composant se re-rendra tout seul quand la fenêtre change.

    return (
        <div>
            {width < 768 ? <MenuMobile /> : <MenuDesktop />}
        </div>
    );
}
```
