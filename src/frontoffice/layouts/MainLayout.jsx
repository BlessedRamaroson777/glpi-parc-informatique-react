import Menu from "./Menu.jsx";
import "../../common/styles/base.css";
import "../styles/layout.css";

export default function MainLayout({ children }) {
  return (
    <div className="frontoffice">
      <Menu />
      <main className="frontoffice-content">{children}</main>
    </div>
  );
}
