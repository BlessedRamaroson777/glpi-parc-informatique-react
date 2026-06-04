# React examples (JSX)

## Routing (real app)
- App router: src/backoffice/App.jsx
- Menu: src/backoffice/layouts/Menu.jsx
- Layout: src/backoffice/layouts/MainLayout.jsx

## GLPI API examples

### Login (username + password)
File: docs/examples/08-glpi-login.jsx

### Refresh token
File: docs/examples/09-refresh-token.jsx

### Authenticated fetch (auto refresh + retry)
File: docs/examples/10-api-request.jsx

### Notes tokens GLPI (OAuth)
- Access token: utilise pour appeler l'API (Authorization: Bearer ...).
- Refresh token: utilise pour obtenir un nouvel access token quand il expire.
- `expires_in`: duree de vie de l'access token (ex: 3600s = 1h).
- Le refresh token a sa propre duree de vie (ex: 1 mois).
- Quand l'access token expire, on fait un refresh et on re-tente la requete.
- Quand le refresh token expire, l'utilisateur doit se reconnecter.

## UI examples

### Change page (simple state)
File: docs/examples/01-simple-nav.jsx

### Change page (React Router v6)
File: docs/examples/02-router.jsx

### Checkbox
File: docs/examples/03-checkbox.jsx

### Select + action
File: docs/examples/04-select-action.jsx

### Input + submit
File: docs/examples/05-login-form.jsx

### Fetch list from JSON
File: docs/examples/06-fetch-list.jsx

### Form -> POST
File: docs/examples/07-form-post.jsx

### Filter list (button or search)
File: docs/examples/11-filter-list.jsx
