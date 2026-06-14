# 🎨 CSS — Guide Complet

## 1. Variables CSS (Custom Properties)

Le projet utilise des variables CSS pour uniformiser les couleurs et les styles. Elles sont définies dans `:root` et réutilisables partout.

```css
:root {
    --primary: #3b82f6;
    --primary-light: #dbeafe;
    --bg-light: #f8fafc;
    --border: #e2e8f0;
    --text-muted: #94a3b8;
}

/* Utilisation */
.mon-element {
    color: var(--primary);
    background: var(--bg-light);
    border: 1px solid var(--border);
}
```

### Mode sombre

```css
:root {
    --bg: #ffffff;
    --text: #1e293b;
}

/* On change les variables pour le mode sombre */
@media (prefers-color-scheme: dark) {
    :root {
        --bg: #0f172a;
        --text: #e2e8f0;
    }
}

/* Ou avec une classe */
.dark-mode {
    --bg: #0f172a;
    --text: #e2e8f0;
}
```

## 2. Flexbox — Aligner des éléments

Flexbox est utilisé **partout** dans le projet pour le layout.

### Centrer un élément

```css
.conteneur {
    display: flex;
    justify-content: center;  /* Centre horizontal */
    align-items: center;       /* Centre vertical */
}
```

### Aligner des éléments en ligne (header, barre d'outils)

```css
.header {
    display: flex;
    justify-content: space-between; /* Pousse les éléments aux extrémités */
    align-items: center;            /* Centre verticalement */
    gap: 10px;                      /* Espace entre les éléments */
}
```

### Résumé de justify-content

```
flex-start      → [A B C          ]
center          → [     A B C     ]
flex-end        → [          A B C]
space-between   → [A      B      C]
space-around    → [  A    B    C  ]
space-evenly    → [   A   B   C   ]
```

### Résumé de align-items

```
flex-start  → Tout en haut
center      → Au milieu verticalement
flex-end    → Tout en bas
stretch     → Étire pour remplir la hauteur (défaut)
```

### Flex wrap (retour à la ligne)

```css
.grille {
    display: flex;
    flex-wrap: wrap;    /* Les éléments passent à la ligne quand pas assez de place */
    gap: 16px;
}

.carte {
    flex: 1 1 300px;   /* Minimum 300px, s'étire si possible */
}
```

### Exemple réel du projet (TicketDetail.jsx — inline style)

```jsx
<div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
    <span>{typeLabel}</span>
    <strong>{item.name}</strong>
    <span style={{ marginLeft: "auto" }}>#{item.items_id}</span>
    {/* marginLeft: "auto" pousse cet élément tout à droite */}
</div>
```

## 3. Grid — Grilles et mises en page complexes

Grid est parfait pour les layouts en colonnes (formulaires, tableaux de bord).

### Formulaire en 3 colonnes (comme CreateTicket)

```css
.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;  /* 3 colonnes égales */
    gap: 1rem;
}

/* Responsive : 1 colonne sur mobile */
@media (max-width: 768px) {
    .form-row {
        grid-template-columns: 1fr;
    }
}
```

### Dashboard cards

```css
.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    /* Autant de colonnes que possible, minimum 250px chacune */
    gap: 1.5rem;
}
```

## 4. Les classes CSS du projet

### Badges de statut

```css
.badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 500;
}

.badge-status-1 { background: #dcfce7; color: #166534; } /* Nouveau - vert */
.badge-status-2 { background: #dbeafe; color: #1e40af; } /* Attribué - bleu */
.badge-status-6 { background: #f3e8ff; color: #6b21a8; } /* Clos - violet */
```

### Cartes de coûts

```css
.cost-card {
    background: var(--bg-light);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.75rem;
}

.cost-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.cost-card-details {
    margin-top: 0.5rem;
}

.cost-row {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 0;
}
```

## 5. Bonnes pratiques

### La règle d'or : box-sizing

```css
*, *::before, *::after {
    box-sizing: border-box;
}
```

Sans ça, si vous mettez `width: 100%` + `padding: 20px`, l'élément débordera de son conteneur. Avec `border-box`, le padding est inclus dans la largeur.

### Reset minimal

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    line-height: 1.6;
    color: var(--text);
    background: var(--bg);
}
```

### Unités

| Unité | Quand l'utiliser |
|-------|------------------|
| `px` | Bordures, petits espacements fixes |
| `rem` | Tailles de texte, padding, margin (relatif à la taille de base) |
| `%` | Largeurs relatives au parent |
| `vh`/`vw` | Hauteur/largeur relative à l'écran |
| `fr` | Fractions dans CSS Grid |

### Transitions et animations

```css
/* Transition douce au survol */
.btn {
    background: var(--primary);
    transition: background 0.2s ease, transform 0.1s ease;
}

.btn:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
}

.btn:active {
    transform: translateY(0);
}

/* Animation de chargement */
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.loading-spinner {
    animation: spin 1s linear infinite;
}

/* Animation d'apparition */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.carte {
    animation: fadeIn 0.3s ease;
}
```

### Responsive : les breakpoints courants

```css
/* Mobile d'abord (mobile-first) */
.conteneur {
    padding: 1rem;
}

/* Tablette */
@media (min-width: 768px) {
    .conteneur {
        padding: 2rem;
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .conteneur {
        padding: 3rem;
        max-width: 1200px;
        margin: 0 auto;
    }
}
```

### Overflow et texte tronqué

```css
/* Tronquer un texte trop long avec "..." */
.texte-tronque {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
}

/* Scrollbar dans un conteneur */
.liste-scrollable {
    max-height: 400px;
    overflow-y: auto;
}
```

### Inline styles vs fichiers CSS

Dans le projet, vous verrez les deux approches :

```jsx
// 1. Fichier CSS séparé (recommandé pour les styles réutilisables)
import "../styles/tickets.css";
<div className="ticket-detail-container">

// 2. Inline style (OK pour des cas uniques)
<div style={{ marginTop: "2rem", padding: "1.5rem", borderRadius: "8px" }}>

// ⚠️ En JSX, le style est un OBJET JavaScript :
// - Les propriétés sont en camelCase (marginTop, pas margin-top)
// - Les valeurs sont des strings ("2rem") ou des nombres (pour les pixels)
```
