import { useState } from "react";
import { login, saveTokens } from "../../src/common/services/authService.jsx";

export default function GlpiLoginExample() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("Connexion...");

    try {
      const data = await login({ username, password });
      saveTokens({
        accessToken: data.session_token || data.accessToken,
        refreshToken: data.refresh_token || data.refreshToken,
        expiresInSeconds: data.expires_in || data.expiresIn || 3600,
      });
      setStatus("OK");
    } catch (error) {
      setStatus(`Erreur: ${error.message}`);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        placeholder="User"
      />
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login GLPI</button>
      {status && <p>{status}</p>}
    </form>
  );
}
