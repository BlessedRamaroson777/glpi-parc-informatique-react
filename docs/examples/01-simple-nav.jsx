import { useState } from "react";

export default function SimpleNav() {
  const [page, setPage] = useState("home");

  return (
    <div>
      <nav>
        <button type="button" onClick={() => setPage("home")}>
          Home
        </button>
        <button type="button" onClick={() => setPage("settings")}>
          Settings
        </button>
      </nav>

      {page === "home" && <h1>Home</h1>}
      {page === "settings" && <h1>Settings</h1>}
    </div>
  );
}
