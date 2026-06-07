import { BrowserRouter, Routes, Route } from "react-router-dom";

import FrontofficeApp from "./frontoffice/App.jsx";
import BackofficeApp from "./backoffice/App.jsx";
import SelectApp from "./common/pages/selectedApp.jsx";
import apiV1 from "./common/utils/apiV1.jsx"

apiV1.loadConfig?.()

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/admin/*" element={<BackofficeApp />} />
        <Route path="/customer/*" element={<FrontofficeApp />} />
        <Route path="/" element={<SelectApp />} />
      </Routes>
    </BrowserRouter>
  );
}