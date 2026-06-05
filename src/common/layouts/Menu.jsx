import { Link } from "react-router-dom";
import LogoutButton from "../components/LogoutButton.jsx";
export default function Menu() {
  return (
    <nav className="common-menu">
      <Link to="/">Home</Link>
      <Link to="/backend-test">Backend Test</Link>
      <Link to="/reinitialisation">Reinitialisation</Link>
      <LogoutButton />
    </nav>
  );
}
