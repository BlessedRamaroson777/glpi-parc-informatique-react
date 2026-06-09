import { Link } from "react-router-dom";
import LogoutButton from "../../common/components/LogoutButton.jsx";
import RefreshTokenButton from "../../common/components/RefreshTokenButton.jsx";

export default function Menu() {
  return (
    <nav className="backoffice-menu">
      <div className="menu-links">
        <h1>
          <Link to="/">Frontoffice</Link>
        </h1>
        <Link to="/customer/assets">Assets</Link>
        <Link to="/customer/create-ticket">Créer un Ticket</Link>
        <Link to="/customer/statut-ticket">Statut des Tickets</Link>
      </div>

      <div className="menu-actions">
        <RefreshTokenButton />
        <LogoutButton />
      </div>
    </nav>
  );
}