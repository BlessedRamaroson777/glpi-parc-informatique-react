import { Link } from "react-router-dom";
import LogoutButton from "../../common/components/LogoutButton.jsx";
import RefreshTokenButton from "../../common/components/RefreshTokenButton.jsx";

export default function Menu() {
  return (
    <nav className="backoffice-menu">
      <div className="menu-links">
        <h1>
          <Link to="/">Backoffice</Link>
        </h1>
        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/tickets">Tickets</Link>
        <Link to="/admin/backend-test">Backend Test</Link>
        <Link to="/admin/reinitialisation">Reinitialisation</Link>
        <Link to="/admin/import">Import</Link>
        <Link to="/admin/parametre">Parametre</Link>
        
      </div>

      <div className="menu-actions">
        <RefreshTokenButton />
        <LogoutButton />
      </div>
    </nav>
  );
}