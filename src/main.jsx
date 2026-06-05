import { createRoot } from "react-dom/client";
import BackofficeApp from "./backoffice/App.jsx";
import "./backoffice/styles/base.css";
import "./backoffice/styles/layout.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<BackofficeApp />);
}
