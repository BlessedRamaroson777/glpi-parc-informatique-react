import { useNavigate } from "react-router-dom";
import { clearTokens, logoutBackoffice } from "../services/authService.jsx";
import "../styles/login.css";

export default function LogoutButton() {
  const navigate = useNavigate();

  function handleLogout() {
    logoutBackoffice();
    navigate("/admin/login", { replace: true });
  }

  function handleClearToken() {
    clearTokens();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="logout-container">
      <div>
          <button
              type="button"
              className="logout-button"
              onClick={handleClearToken}
          >
              Supprimer token
          </button>
        </div>
        <div>
          <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
          >
              Déconnexion
          </button>
        </div>

    </div>
  );
}