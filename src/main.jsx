import { createRoot } from "react-dom/client";
import BackofficeApp from "./backoffice/App.jsx";
import "./index.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<BackofficeApp />);
}
