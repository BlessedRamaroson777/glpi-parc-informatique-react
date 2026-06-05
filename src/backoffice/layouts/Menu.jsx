import { Link } from "react-router-dom";
import LogoutButton from "../components/LogoutButton.jsx";
import RefreshTokenButton from "../components/RefreshTokenButton.jsx";

export default function Menu() {
  return (
    <nav className="backoffice-menu">
      <div className="menu-links">
        <h1>Backoffice</h1>
        <Link to="/">Dashboard</Link>
        <Link to="/tickets">Tickets</Link>
        <Link to="/backend-test">Backend Test</Link>
        <Link to="/reinitialisation">Reinitialisation</Link>
        <Link to="/import">Import</Link>
      </div>

      <div className="menu-actions">
        <RefreshTokenButton />
        <LogoutButton />
      </div>
    </nav>
  );
}