# Ajouter une nouvelle page (Common)

## 0) Installer React Router (une seule fois)

```bash
npm install react-router-dom
```

## 1) Créer la page

* Créer un fichier dans `src/common/pages/`.
* Exemple : `src/common/pages/Import.jsx`.

Exemple :

```jsx
export default function Import() {
  return (
    <section className="import-page">
      <h1>Import</h1>
    </section>
  );
}
```

Autre exemple (backend test) :

```jsx
import "../styles/backend-test.css";

export default function BackendTest() {
  return (
    <section className="backend-test-page">
      <h1>Backend Test</h1>
    </section>
  );
}
```

## 2) Déclarer la route

Modifier `src/common/App.jsx`.

Importer la page :

```jsx
import Import from "./pages/Import.jsx";
```

Ajouter la route :

```jsx
<Route path="/import" element={<Import />} />
```

Exemple complet :

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout.jsx";
import Home from "./pages/Home.jsx";
import Import from "./pages/Import.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/import" element={<Import />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}
```

## 3) Ajouter le lien dans le menu

Modifier `src/common/layouts/Menu.jsx`.

Importer `Link` :

```jsx
import { Link } from "react-router-dom";
```

Ajouter le lien :

```jsx
<Link to="/import">Import</Link>
```

Exemple :

```jsx
<nav className="common-menu">
  <Link to="/">Home</Link>
  <Link to="/import">Import</Link>
</nav>
```

## 4) Ajouter le style

Créer un fichier CSS dans `src/common/styles/`.

Exemple :

```text
src/common/styles/import.css
```

Dans la page :

```jsx
import "../styles/import.css";
```

Utiliser une classe racine :

```jsx
<section className="import-page">
```

## 5) Tester

Démarrer l'application :

```bash
npm run dev
```

Vérifier :

* `/` affiche Home
* `/import` affiche Import
* Le menu change de page sans recharger l'application
