const fallbackBaseUrl = "http://glpi.local:8080";
const rawBaseUrl = import.meta.env.VITE_GLPI_API_BASE_URL || fallbackBaseUrl;

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");
