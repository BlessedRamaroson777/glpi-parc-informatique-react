import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";
import Home from "./pages/Home.jsx";
import Assets from "./pages/Assets.jsx";
import CreateTicket from "./pages/CreateTicket.jsx";

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
      </Routes>
    </MainLayout>
  );
}
