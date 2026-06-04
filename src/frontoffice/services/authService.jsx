import { API_BASE_URL } from "../constants/apiConfig.jsx";

export async function login(payload) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return response.json();
}
