import { useState } from "react";
import { refreshAccessToken, saveTokens } from "../services/authService.jsx";

export default function RefreshTokenButton() {
  const [status, setStatus] = useState("");

  async function handleRefresh() {
    setStatus("Refresh...");

    try {
      const data = await refreshAccessToken();
      saveTokens({
        accessToken: data.access_token || data.accessToken,
        refreshToken: data.refresh_token || data.refreshToken,
        expiresInSeconds: data.expires_in || data.expiresIn || 3600,
      });
      setStatus("OK");
    } catch (error) {
      setStatus(`Erreur: ${error.message}`);
    }
    console.log("Refresh token status:", status);
  }

  return (
    <div>
      <button type="button" className="refresh-token-button" onClick={handleRefresh}>
        Refresh token 
      </button>
    </div>
  );
}
