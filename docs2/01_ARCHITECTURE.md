# 🏗️ Architecture du Projet NewApp

## Vue d'ensemble

NewApp est une application React (Vite) connectée à une instance GLPI (outil de gestion IT).
Elle a **deux interfaces** : un backoffice (admin) et un frontoffice (utilisateur/client).

```
src/
├── App.jsx                  ← Point d'entrée : définit les routes principales
├── main.jsx                 ← Bootstrap React (ReactDOM.createRoot)
├── App.css                  ← Styles globaux de l'application
│
├── common/                  ← 🟢 CODE PARTAGÉ entre backoffice et frontoffice
│   ├── entities/            ← Classes métier (Ticket, Computer, User, Monitor...)
│   ├── utils/               ← Wrappers API (apiV1.jsx, apiV2.jsx)
│   ├── services/            ← Fonctions business (ticketService, authService, documentService)
│   ├── constants/           ← Constantes (statuts de ticket, types d'assets, config API)
│   ├── components/          ← Composants UI réutilisables
│   ├── hooks/               ← Hooks React personnalisés (vide pour l'instant)
│   ├── layouts/             ← Layouts partagés
│   ├── pages/               ← Pages partagées (ex: selectedApp.jsx)
│   └── styles/              ← CSS partagé
│
├── backoffice/              ← 🔵 INTERFACE ADMIN (/admin/*)
│   └── pages/
│       ├── Dashboard.jsx        ← Tableau de bord global
│       ├── Tickets.jsx          ← Liste des tickets
│       ├── TicketDetail.jsx     ← Détail d'un ticket (coûts, items liés, équipe)
│       ├── TicketCostsPage.jsx  ← Page dédiée aux coûts
│       ├── Import.jsx           ← Import de données
│       ├── Parametre.jsx        ← Paramètres / Réinitialisation
│       ├── BackendTest.jsx      ← Page de test backend
│       └── Login.jsx            ← Login admin
│
├── frontoffice/             ← 🟠 INTERFACE CLIENT (/customer/*)
│   ├── pages/
│   │   ├── CreateTicket.jsx     ← Formulaire de création de ticket complet
│   │   ├── StatutTicket.jsx     ← Suivi du statut d'un ticket
│   │   ├── TicketDetail.jsx     ← Détail d'un ticket (vue client)
│   │   ├── Assets.jsx           ← Liste des assets du client
│   │   └── Home.jsx             ← Page d'accueil client
│   ├── services/            ← Services spécifiques au frontoffice
│   ├── components/          ← Composants spécifiques au frontoffice
│   ├── styles/              ← CSS spécifique au frontoffice
│   └── App.jsx              ← Routes du frontoffice
│
└── routes/                  ← Configuration des routes
```

## Le routage principal

Dans `src/App.jsx`, trois routes principales sont définies :

```jsx
<Routes>
  <Route path="/admin/*"    element={<BackofficeApp />} />
  <Route path="/customer/*" element={<FrontofficeApp />} />
  <Route path="/"           element={<SelectApp />} />
</Routes>
```

- `/admin/...` → Tout ce qui est dans `backoffice/`
- `/customer/...` → Tout ce qui est dans `frontoffice/`
- `/` → Page de sélection (choisir entre admin et client)

## Flux de données typique

```
[Utilisateur clique] 
    → [Composant React (page)] 
        → [Service (ticketService.jsx)] 
            → [Wrapper API (apiV2.jsx)] 
                → [fetch() vers GLPI] 
                    → [Réponse JSON]
        ← [Entité (new Ticket(data))] 
    ← [setState → re-render]
```

**Exemple concret : Afficher le détail d'un ticket**
1. L'utilisateur navigue vers `/admin/tickets/42`
2. `TicketDetail.jsx` lit `useParams()` → obtient `id = 42`
3. Il appelle `getTicketById(42)` du `ticketService.jsx`
4. Le service appelle `apiV2.get("/api.php/v2.3/Assistance/Ticket/42")`
5. `apiV2` ajoute le header `Authorization: Bearer <token>` et fait le `fetch()`
6. La réponse JSON est transformée en `new Ticket(data)`
7. `setTicket(ticket)` met à jour l'état → le composant re-render avec les données
