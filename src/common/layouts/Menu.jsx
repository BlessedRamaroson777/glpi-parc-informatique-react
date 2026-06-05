import { Link } from "react-router-dom";
import LogoutButton from "../components/LogoutButton.jsx";
import RefreshTokenButton from "../components/RefreshTokenButton.jsx";

export default function Menu() {
  return (
    <nav className="common-menu">
      <div className="menu-links">
        <Link to="/">Home</Link>
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