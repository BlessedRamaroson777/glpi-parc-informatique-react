import { useState } from "react";
import { login, saveTokens } from "../services/authService.jsx";
import RefreshTokenButton from "./RefreshTokenButton.jsx";

export default function GlpiLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("Connexion...");

    try {
      const data = await login({ username, password });
      saveTokens({
        accessToken: data.access_token || data.accessToken || data.session_token,
        refreshToken: data.refresh_token || data.refreshToken,
        expiresInSeconds: data.expires_in || data.expiresIn || 3600,
      });
      setStatus("OK");
      setPassword("");
    } catch (error) {
      setStatus(`Erreur: ${error.message}`);
    }
  }

  return (
    <div>
      <RefreshTokenButton />
      <form onSubmit={handleSubmit}>
        <label htmlFor="glpi-username">Utilisateur</label>
        <input
        id="glpi-username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        placeholder="User"
        />

        <label htmlFor="glpi-password">Mot de passe</label>
        <input
        id="glpi-password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        />

        <button type="submit">Login GLPI</button>
        {status && <p>{status}</p>}
      </form>
    </div>
  );
}
