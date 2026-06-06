import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";
import Home from "./pages/Home.jsx";

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
      </Routes>
    </MainLayout>
  );
}
