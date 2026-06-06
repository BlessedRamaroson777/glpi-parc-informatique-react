import { useState } from "react";
import { refreshAccessToken, saveTokens } from "../../common/services/authService.jsx";
import { useNavigate } from "react-router-dom";


export default function RefreshTokenButton() {
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

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
      navigate("/admin", { replace: true });
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
