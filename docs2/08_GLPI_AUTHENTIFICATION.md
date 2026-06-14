# 🔐 Authentification GLPI

## Vue d'ensemble

L'application utilise **deux systèmes d'authentification** en parallèle :

1. **OAuth2 (apiV2)** — Le système principal. L'utilisateur se connecte avec username/password et reçoit un Bearer Token.
2. **Session Token (apiV1)** — Un système legacy initialisé automatiquement après le login OAuth2.

Il y a aussi un **3ème système très simple** pour le backoffice admin (login/password codé en dur).

## Flux de connexion complet

```
1. L'utilisateur entre son username/password
2. authService.login() est appelé
3. Il fait un POST vers /api.php/token avec les credentials
4. GLPI renvoie : { access_token, refresh_token, expires_in }
5. Les tokens sont stockés dans localStorage
6. En parallèle, une session apiV1 est initialisée avec initSession()
7. L'utilisateur est maintenant connecté pour les deux APIs
```

## 1. Le service d'authentification (authService.jsx)

Fichier : `src/common/services/authService.jsx`

### Login utilisateur (frontoffice)

```javascript
import { login } from '../services/authService.jsx';

// L'utilisateur remplit un formulaire, puis :
const result = await login({ username: "jean", password: "monpass" });
// → Stocke les tokens en localStorage
// → Initialise aussi la session apiV1 automatiquement
```

### Comment ça marche en détail

```javascript
export async function login({ username, password }) {
    const body = {
        grant_type: "password",
        client_id: CLIENT_ID,           // Variable d'environnement VITE_GLPI_CLIENT_ID
        client_secret: CLIENT_SECRET,   // Variable d'environnement VITE_GLPI_CLIENT_SECRET
        username,
        password,
        scope: "api",
    };

    // 1. Appel OAuth2 vers GLPI
    const response = await fetch("/api.php/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const result = await parseResponse(response);

    // 2. Sauvegarder les tokens
    saveTokens({
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        expiresInSeconds: result.expires_in,
    });

    // 3. Initialiser aussi la session v1
    apiV1.setConfig({
        baseUrl: "/apirest.php",
        appToken: import.meta.env.VITE_GLPI_APP_TOKEN,
    });
    await apiV1.initSession(import.meta.env.VITE_GLPI_USER_TOKEN);

    return result;
}
```

### Stockage des tokens

Les tokens sont stockés dans **localStorage** avec ces clés :

| Clé localStorage | Contenu |
|------------------|---------|
| `glpi_access_token` | Le Bearer Token (utilisé par apiV2) |
| `glpi_refresh_token` | Le token de rafraîchissement |
| `glpi_access_expires_at` | Timestamp d'expiration (millisecondes) |
| `glpi_session_token` | Le Session-Token (utilisé par apiV1) |
| `glpi_base_url` | L'URL de base de l'API v1 |
| `glpi_app_token` | L'App-Token GLPI (apiV1) |

### Vérifier / Rafraîchir le token

```javascript
import { getAccessToken, isTokenExpired, refreshAuthSession } from '../services/authService.jsx';

// Vérifier si connecté
const token = getAccessToken();
if (!token) {
    // → Rediriger vers la page de login
}

// Vérifier si le token va bientôt expirer
if (isTokenExpired()) {
    // Le token expire dans moins de 30 secondes
    await refreshAuthSession();  // → Obtient un nouveau token automatiquement
}
```

### Déconnexion

```javascript
import { clearTokens } from '../services/authService.jsx';

clearTokens();  // Supprime tous les tokens de localStorage
// → L'utilisateur est déconnecté
```

## 2. Login backoffice (admin)

Le backoffice a un système de login **très simple** séparé du système OAuth2.

```javascript
import { loginBackoffice, isBackofficeAuthenticated, logoutBackoffice } from '../services/authService.jsx';

// Login (username/password codés en dur : "glpi"/"glpi")
const success = loginBackoffice({ username: "glpi", password: "glpi" });
if (success) {
    // → localStorage.backoffice_auth = "true"
    // → Naviguer vers /admin/dashboard
}

// Vérifier si connecté
if (!isBackofficeAuthenticated()) {
    // → Rediriger vers login
}

// Déconnexion
logoutBackoffice();
```

## 3. Variables d'environnement nécessaires

Ces variables doivent être définies dans un fichier `.env` à la racine du projet :

```env
VITE_GLPI_CLIENT_ID=votre_client_id
VITE_GLPI_CLIENT_SECRET=votre_client_secret
VITE_GLPI_APP_TOKEN=votre_app_token
VITE_GLPI_USER_TOKEN=votre_user_token
```

**Où les trouver dans GLPI :**
- `CLIENT_ID` et `CLIENT_SECRET` → Administration > OAuth clients
- `APP_TOKEN` → Configuration > Général > API
- `USER_TOKEN` → Préférences de l'utilisateur > Clé API distante

## 4. Le mécanisme de rafraîchissement automatique

Le `authService` inclut un mécanisme intelligent pour rafraîchir le token :

```javascript
// apiRequest() vérifie automatiquement le token avant chaque requête
export async function apiRequest(path, options = {}) {
    let accessToken = getAccessToken();

    // Si pas de token ou token expiré → rafraîchir
    if (!accessToken || isTokenExpired()) {
        await refreshAuthSession();
        accessToken = getAccessToken();
    }

    const response = await fetch(path, {
        ...options,
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Si 401 Unauthorized → retenter avec un nouveau token
    if (response.status === 401) {
        await refreshAuthSession();
        // Réessayer la requête avec le nouveau token
        return fetch(path, {
            ...options,
            headers: { Authorization: `Bearer ${getAccessToken()}` },
        });
    }

    return response;
}
```
