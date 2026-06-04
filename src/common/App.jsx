import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout.jsx";
import BackendTest from "./pages/BackendTest.jsx";
import Home from "./pages/Home.jsx";
import Reinitialisation from "./pages/Reinitialisation.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/backend-test" element={<BackendTest />} />
          <Route
            path="/reinitialisation"
            element={<Reinitialisation />}
          />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}