import { Link } from "react-router-dom";
// import LogoutButton from "../components/LogoutButton.jsx";
// import RefreshTokenButton from "../components/RefreshTokenButton.jsx";

export default function Menu() {
  return (
    <nav className="backoffice-menu">
      <div className="menu-links">
        <h1>
          <Link to="/">Frontoffice</Link>
        </h1>
      </div>

      {/* <div className="menu-actions">
        <RefreshTokenButton />
        <LogoutButton />
      </div> */}
    </nav>
  );
}