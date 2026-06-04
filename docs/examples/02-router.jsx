import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

function Home() {
  return <h1>Home</h1>;
}

function Settings() {
  return <h1>Settings</h1>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/settings">Settings</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}
