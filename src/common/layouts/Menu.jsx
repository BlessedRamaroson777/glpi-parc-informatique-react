import { Link } from "react-router-dom";

export default function Menu() {
  return (
    <nav className="backoffice-menu">
      <div className="menu-links">
        <Link to="/">Home</Link>
        <Link to="/backend-test">Backend Test</Link>
        <Link to="/reinitialisation">Reinitialisation</Link>
        <Link to="/import">Import</Link>
      </div>

    </nav>
  );
}