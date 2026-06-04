import { createRoot } from "react-dom/client";
import CommonApp from "./common/App.jsx";
import "./common/styles/base.css";
import "./common/styles/layout.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<CommonApp />);
}
