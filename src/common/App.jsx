import MainLayout from "./layouts/MainLayout.jsx";
import Home from "./pages/Home.jsx";
import Reinitialisation from "./pages/Reinitialisation.jsx";

export default function App() {
  return (
    <MainLayout>
      <Home />
      <Reinitialisation />
    </MainLayout>
  );
}
