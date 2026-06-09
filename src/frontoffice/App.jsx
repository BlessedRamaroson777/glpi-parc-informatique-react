import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";
import Home from "./pages/Home.jsx";
import Assets from "./pages/Assets.jsx";
import CreateTicket from "./pages/CreateTicket.jsx";
import StatutTicket from "./pages/StatutTicket.jsx";
import TicketDetail from "./pages/TicketDetail.jsx";

export default function App() {
  return (
    <MainLayout>
      <Routes>
        <Route
          index
          element={
            <Home />
          }
        />
        <Route
          path="assets"
          element={
            <Assets />
          }
        />
        <Route
          path="create-ticket"
          element={
            <CreateTicket />
          }
        />
        <Route
          path="statut-ticket"
          element={
            <StatutTicket />
          }
        />
        
        <Route
          path="tickets/:id"
          element={
            <TicketDetail />
          }
        />
      </Routes>
    </MainLayout>
  );
}
