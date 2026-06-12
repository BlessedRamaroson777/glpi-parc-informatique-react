import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, saveTokens, loginBackoffice } from "../../common/services/authService.jsx";
import { USER_ADMIN } from "../../common/constants/apiConfig.jsx";

export default function GlpiLoginForm() {
  const [username, setUsername] = useState(USER_ADMIN);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

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
      // setPassword("");
      navigate("/admin", { replace: true });

    } catch (error) {
      setStatus(`Erreur: ${error.message}`);
    }
  }
  
  async function handleLogin(event) {
    event.preventDefault();
    setStatus("Connexion...");

    try {
      // 1. Login GLPI (récupère token OAuth + init session V1)
      const data = await login({ username, password });
      saveTokens({
        accessToken: data.access_token || data.accessToken || data.session_token,
        refreshToken: data.refresh_token || data.refreshToken,
        expiresInSeconds: data.expires_in || data.expiresIn || 3600,
      });

      // 2. Login backoffice local
      loginBackoffice({ username, password });

      setStatus("OK");
      navigate("/admin", { replace: true });

    } catch (error) {
      setStatus(`Erreur: ${error.message}`);
    }
  }
  // async function handleLogin(event) {
  //   event.preventDefault();
  //   setStatus("Connexion...");

  //   try {
  //     const data = await loginBackoffice({ username, password });
  //     navigate("/admin", { replace: true });

  //   } catch (error) {
  //     setStatus(`Erreur: ${error.message}`);
  //   }
  // }

  return (
    <div>
      <form onSubmit={handleLogin}>
        {/* <label htmlFor="glpi-username">Utilisateur</label>
        <input
        id="glpi-username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        placeholder="User"
        /> */}

        <label htmlFor="glpi-password">Code</label>
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
