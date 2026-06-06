import { API_BASE_URL } from "../../backoffice/constants/apiConfig.jsx";
import apiV1 from "../utils/apiV1.jsx"

const TOKEN_KEY = "glpi_access_token";
const REFRESH_KEY = "glpi_refresh_token";
const EXPIRES_AT_KEY = "glpi_access_expires_at";

const CLIENT_ID = import.meta.env.VITE_GLPI_CLIENT_ID || "";
const CLIENT_SECRET = import.meta.env.VITE_GLPI_CLIENT_SECRET || "";
const OAUTH_TOKEN_PATH = "/api.php/token";


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
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
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

export function isTokenExpired() {
  const expiresAt = Number(getExpiresAt());
  if (!expiresAt) {
    return true;
  }

  return Date.now() >= expiresAt - 30000;
}

function buildUrl(path) {
  if (path.startsWith("http")) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    const errorText = contentType.includes("application/json")
      ? JSON.stringify(await response.json())
      : await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function login({ username, password }) {
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    username,
    password,
    scope: "api",
  });

  const response = await fetch(buildUrl(OAUTH_TOKEN_PATH), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  return parseResponse(response);
}

// après avoir récupéré le token V2, ajouter :
apiV1.setConfig({
    baseUrl: "/apirest.php",
    appToken: import.meta.env.VITE_GLPI_APP_TOKEN,
})

await apiV1.initSession(import.meta.env.VITE_GLPI_USER_TOKEN)

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("Missing refresh token");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  const response = await fetch(buildUrl(OAUTH_TOKEN_PATH), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  return parseResponse(response);
}

export async function apiRequest(path, options = {}) {
  let accessToken = getAccessToken();

  if (!accessToken || isTokenExpired()) {
    const refreshed = await refreshAccessToken();
    saveTokens({
      accessToken: refreshed.access_token || refreshed.accessToken,
      refreshToken: refreshed.refresh_token || refreshed.refreshToken,
      expiresInSeconds: refreshed.expires_in || refreshed.expiresIn,
    });
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
    const refreshed = await refreshAccessToken();
    saveTokens({
      accessToken: refreshed.access_token || refreshed.accessToken,
      refreshToken: refreshed.refresh_token || refreshed.refreshToken,
      expiresInSeconds: refreshed.expires_in || refreshed.expiresIn,
    });

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
