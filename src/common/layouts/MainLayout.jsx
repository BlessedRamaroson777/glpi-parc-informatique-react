import Menu from "./Menu.jsx";

export default function MainLayout({ children }) {
  return (
    <div className="backoffice">
      <Menu />
      <main className="backoffice-content">{children}</main>
    </div>
  );
}
