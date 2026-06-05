import { useNavigate } from "react-router-dom";
import { clearTokens } from "../services/authService.jsx";

export default function LogoutButton() {
  const navigate = useNavigate();

  function handleLogout() {
    clearTokens();
    navigate("/", { replace: true });
  }

  return (
    <button type="button" onClick={handleLogout}>
      Déconnexion
    </button>
  );
}