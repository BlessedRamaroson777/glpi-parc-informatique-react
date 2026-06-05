import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import MainLayout from "./layouts/MainLayout.jsx";
import BackendTest from "./pages/BackendTest.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Reinitialisation from "./pages/Reinitialisation.jsx";
import Import from "./pages/Import.jsx";

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <MainLayout>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route
            path="/backend-test"
            element={
              <ProtectedRoute>
                <BackendTest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reinitialisation"
            element={
              <ProtectedRoute>
                <Reinitialisation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/import"
            element={
              <ProtectedRoute>
                <Import />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}