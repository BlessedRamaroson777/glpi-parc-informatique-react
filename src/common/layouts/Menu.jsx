import { Link } from "react-router-dom";
export default function Menu() {
  return (
    <nav className="common-menu">
      <Link to="/">Home</Link>
      <Link to="/reinitialisation">Reinitialisation</Link>
    </nav>
  );
}
