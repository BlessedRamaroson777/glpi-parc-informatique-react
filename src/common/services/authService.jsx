import { API_BASE_URL } from "../constants/apiConfig.jsx";
import apiV1 from "../utils/apiV1.jsx"

const TOKEN_KEY = "glpi_access_token";
const REFRESH_KEY = "glpi_refresh_token";
const EXPIRES_AT_KEY = "glpi_access_expires_at";
const TOKEN_UPDATE_EVENT = "glpi-auth-updated";
const REFRESH_BUFFER_MS = 30000;

const CLIENT_ID = import.meta.env.VITE_GLPI_CLIENT_ID || "";
const CLIENT_SECRET = import.meta.env.VITE_GLPI_CLIENT_SECRET || "";
const OAUTH_TOKEN_PATH = "/api.php/token";

const BACKOFFICE_AUTH_KEY = "backoffice_auth";

const USERNAME = "glpi";
const PASSWORD = "glpi";

let refreshInFlight = null;



export function loginBackoffice({ username, password }) {
  if (username === USERNAME && password === PASSWORD) {
    localStorage.setItem(BACKOFFICE_AUTH_KEY, "true");
    return true;
  }
  return false;
}

export function logoutBackoffice() {
    localStorage.removeItem(BACKOFFICE_AUTH_KEY);
}

export function isBackofficeAuthenticated() {
    return localStorage.getItem(BACKOFFICE_AUTH_KEY) === "true";
}


function emitAuthUpdate() {
  window.dispatchEvent(new CustomEvent(TOKEN_UPDATE_EVENT));
}

function normalizeTokenPayload(data = {}) {
  return {
    accessToken: data.access_token || data.accessToken || data.session_token,
    refreshToken: data.refresh_token || data.refreshToken,
    expiresInSeconds: data.expires_in || data.expiresIn || 3600,
  };
}


export function saveTokens({ accessToken, refreshToken, expiresInSeconds }) {
  if (accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }

  if (expiresInSeconds) {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
  }

  emitAuthUpdate();
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  emitAuthUpdate();
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function getExpiresAt() {
  return localStorage.getItem(EXPIRES_AT_KEY);
}

export function getExpiresAtMs() {
  return Number(getExpiresAt()) || 0;
}

export function getTokenRemainingMs() {
  const expiresAt = getExpiresAtMs();
  if (!expiresAt) return 0;
  return Math.max(0, expiresAt - Date.now());
}

export function isTokenExpired() {
  const expiresAt = getExpiresAtMs();
  if (!expiresAt) {
    return true;
  }

  return Date.now() >= expiresAt - REFRESH_BUFFER_MS;
}

export function getAuthUpdateEventName() {
  return TOKEN_UPDATE_EVENT;
}

function buildUrl(path) {
  if (path.startsWith("http")) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  // Lire le texte brut une seule fois
  const text = await response.text();

  // 206 Partial Content = liste GLPI paginée → traiter comme succès
  // 404 sur un endpoint de liste vide → retourner tableau vide
  if (response.status === 206) {
    if (!text) return [];
    try { return JSON.parse(text); } catch { return text; }
  }

  if (response.status === 404) {
    // Peut être une liste vide ou une vraie 404
    // Si le corps contient un tableau vide ou GLPI error, on retourne []
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length === 0) return [];
    } catch { /* pas du JSON, c'est une vraie 404 */ }
  }

  if (!response.ok) {
    // Construire un message d'erreur lisible
    let errorMsg = text || `HTTP ${response.status}`;
    if (contentType.includes("application/json") && text) {
      try { errorMsg = JSON.stringify(JSON.parse(text)); } catch { /* garder texte brut */ }
    }
    throw new Error(errorMsg);
  }

  // Corps vide (ex: 201 No Content) → retourner null sans planter
  if (!text) return null;

  if (contentType.includes("application/json")) {
    try { return JSON.parse(text); } catch { return text; }
  }

  return text;
}
export async function login({ username, password }) {
  const body = {
    grant_type: "password",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    username,
    password,
    scope: "api",
  };

  const response = await fetch(buildUrl(OAUTH_TOKEN_PATH), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await parseResponse(response);

  saveTokens(normalizeTokenPayload(result));

  // après avoir récupéré le token V2, ajouter :
  apiV1.setConfig({
      baseUrl: "/apirest.php",
      appToken: import.meta.env.VITE_GLPI_APP_TOKEN,
  })

  await apiV1.initSession(import.meta.env.VITE_GLPI_USER_TOKEN)

  return result;
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("Missing refresh token");
  }

  const body = {
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshToken,
  };

  const response = await fetch(buildUrl(OAUTH_TOKEN_PATH), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return parseResponse(response);
}

export async function refreshAuthSession({ ensureV1 = true } = {}) {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshed = await refreshAccessToken();
    saveTokens(normalizeTokenPayload(refreshed));

    if (ensureV1) {
      await ensureV1Session();
    }

    return refreshed;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function apiRequest(path, options = {}) {
  let accessToken = getAccessToken();

  if (!accessToken || isTokenExpired()) {
    await refreshAuthSession();
    accessToken = getAccessToken();
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    await refreshAuthSession();

    const retry = await fetch(buildUrl(path), {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });

    return parseResponse(retry);
  }

  return parseResponse(response);
}

export async function ensureV1Session() {
    apiV1.setConfig({
        baseUrl:  "/apirest.php",
        appToken: import.meta.env.VITE_GLPI_APP_TOKEN,
    })
    await apiV1.initSession(import.meta.env.VITE_GLPI_USER_TOKEN)
}