import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import MainLayout from "./layouts/MainLayout.jsx";
import BackendTest from "./pages/BackendTest.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Tickets from "./pages/Tickets.jsx";
import Login from "./pages/Login.jsx";
import Reinitialisation from "./pages/Reinitialisation.jsx";
import Import from "./pages/Import.jsx";
import TicketDetail from "./pages/TicketDetail.jsx";
import Parametre from "./pages/Parametre.jsx"

export default function BackofficeApp() {
  return (
    <MainLayout>
      <Routes>
        <Route
          index
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="tickets"
          element={
            <ProtectedRoute>
              <Tickets />
            </ProtectedRoute>
          }
        />

        <Route
          path="tickets/:id"
          element={
            <ProtectedRoute>
              <TicketDetail />
            </ProtectedRoute>
          }
        />

        <Route path="login" element={<Login />} />

        <Route
          path="backend-test"
          element={
            <ProtectedRoute>
              <BackendTest />
            </ProtectedRoute>
          }
        />

        <Route
          path="parametre"
          element={
            <ProtectedRoute>
              <Parametre />
            </ProtectedRoute>
          }
        />        

        <Route
          path="reinitialisation"
          element={
            <ProtectedRoute>
              <Reinitialisation />
            </ProtectedRoute>
          }
        />

        <Route
          path="import"
          element={
            <ProtectedRoute>
              <Import />
            </ProtectedRoute>
          }
        />
      </Routes>
    </MainLayout>
  );
}