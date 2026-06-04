# Ajouter une nouvelle page (Common)

## 1) Creer la page
- Cree un fichier dans `src/common/pages/`.
- Exemple: `src/common/pages/Import.jsx`.

## 2) Ajouter un lien au menu
- Modifier `src/common/layouts/Menu.jsx`.
- Ajouter un lien vers l'ancre: `<a href="#import">Import</a>`.

## 3) Afficher la page
- Modifier `src/common/App.jsx`.
- Importer la page et la rendre dans le layout.
- Exemple:
  - `import Import from "./pages/Import.jsx";`
  - `<Import />`

## 4) Ajouter le style de la page
- Cree un CSS dans `src/common/styles/`.
- Exemple: `src/common/styles/import.css`.
- Dans la page, importer le CSS:
  - `import "../styles/import.css";`
- Utilise une classe racine pour la page:
  - `<section id="import" className="import-page">...</section>`

## 5) Tester
- Demarre l'app: `npm run dev`.
- Clique dans le menu pour verifier la navigation par ancre.
