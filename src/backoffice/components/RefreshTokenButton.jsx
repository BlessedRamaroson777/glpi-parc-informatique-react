import { useEffect, useRef, useState } from "react";
import {
  getAuthUpdateEventName,
  getExpiresAtMs,
  getRefreshToken,
  refreshAuthSession,
} from "../../common/services/authService.jsx";
import { useNavigate } from "react-router-dom";

function formatClock(ms) {
  if (!ms) return "--:--:--";
  return new Date(ms).toLocaleTimeString("fr-FR", { hour12: false });
}

function formatRemaining(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function RefreshTokenButton() {
  const [status, setStatus] = useState("");
  const [showCounter, setShowCounter] = useState(false);
  const [expiresAt, setExpiresAt] = useState(getExpiresAtMs());
  const [now, setNow] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const autoRefreshDoneRef = useRef(false);

  useEffect(() => {
    const onAuthUpdate = () => {
      setExpiresAt(getExpiresAtMs());
      autoRefreshDoneRef.current = false;
    };

    window.addEventListener(getAuthUpdateEventName(), onAuthUpdate);
    window.addEventListener("storage", onAuthUpdate);

    return () => {
      window.removeEventListener(getAuthUpdateEventName(), onAuthUpdate);
      window.removeEventListener("storage", onAuthUpdate);
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
      setExpiresAt(getExpiresAtMs());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  async function handleRefresh(isAuto = false) {
    if (isRefreshing) return;

    setIsRefreshing(true);
    setStatus("Refresh...");

    try {
      await refreshAuthSession();
      setExpiresAt(getExpiresAtMs());
      setStatus(isAuto ? "Auto-refresh OK" : "Refresh OK");
      if (!isAuto) {
        navigate("/admin", { replace: true });
      }
    } catch (error) {
      setStatus(`Erreur: ${error.message}`);
      if (isAuto) {
        autoRefreshDoneRef.current = true;
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleShowCounter() {
    setShowCounter(!showCounter);
  }

  const remainingMs = expiresAt ? Math.max(0, expiresAt - now) : 0;

  useEffect(() => {
    if (!expiresAt || !getRefreshToken() || isRefreshing) return;

    if (remainingMs <= 30000 && remainingMs > 0 && !autoRefreshDoneRef.current) {
      autoRefreshDoneRef.current = true;
      handleRefresh(true);
    }

    if (remainingMs > 30000) {
      autoRefreshDoneRef.current = false;
    }
  }, [remainingMs, expiresAt, isRefreshing]);

  const expiresLabel = expiresAt
    ? `Expire a ${formatClock(expiresAt)} (dans ${formatRemaining(remainingMs)})`
    : "Expiration inconnue";
  // console.log(expiresLabel);

  const refreshLabel = isRefreshing ? "Refresh..." : "Refresh token";

  const statusText = status || expiresLabel;

  const statusColor = status.startsWith("Erreur") ? "#b42318" : "var(--text)";

  const hasWarning = expiresAt && remainingMs <= 60000;

  const metaColor = hasWarning ? "#b54708" : statusColor;

  if (!getRefreshToken()) {
    return null;
  }

  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div>
        <button type="button" className="refresh-token-button" onClick={() => handleRefresh(false)} disabled={isRefreshing}>
          {refreshLabel}
        </button>
        <a onClick={handleShowCounter}>
          x
        </a>
      </div>
      {showCounter && (
        <small style={{ color: metaColor, fontWeight: 600 }}>{statusText}</small>
      )}
    </div>
  );
}
