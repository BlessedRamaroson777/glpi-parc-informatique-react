import Menu from "./Menu.jsx";

export default function MainLayout({ children }) {
  return (
    <div className="common">
      <Menu />
      <main className="common-content">{children}</main>
    </div>
  );
}
