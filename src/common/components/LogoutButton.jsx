import { useNavigate } from "react-router-dom";
import { clearTokens } from "../services/authService.jsx";
import "../styles/login.css";

export default function LogoutButton() {
  const navigate = useNavigate();

  function handleLogout() {
    clearTokens();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="logout-container">
        <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
        >
            Déconnexion
        </button>
    </div>
  );
}