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

### Notes tokens GLPI (v1 vs v2)
- A confirmer: GLPI v1 retourne souvent `session_token`.
- A confirmer: GLPI v2 expose plutot `accessToken` + `refreshToken`.
- Donne-moi les endpoints exacts pour corriger ces noms.

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
