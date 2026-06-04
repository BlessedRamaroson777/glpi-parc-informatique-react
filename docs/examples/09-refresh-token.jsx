import { useState } from "react";
import { refreshAccessToken, saveTokens } from "../../src/common/services/authService.jsx";

export default function RefreshTokenExample() {
  const [status, setStatus] = useState("");

  async function handleRefresh() {
    setStatus("Refresh...");

    try {
      const data = await refreshAccessToken();
      saveTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresInSeconds: data.expiresIn || 3600,
      });
      setStatus("OK");
    } catch (error) {
      setStatus(`Erreur: ${error.message}`);
    }
  }

  return (
    <div>
      <button type="button" onClick={handleRefresh}>
        Refresh token
      </button>
      {status && <p>{status}</p>}
    </div>
  );
}
