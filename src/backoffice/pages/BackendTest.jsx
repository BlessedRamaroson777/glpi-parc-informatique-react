import { useEffect, useState } from "react";
import "../styles/backend-test.css";
import TicketCostsPage from "./TicketCostsPage.jsx"
import StatutTraduit from "../../common/components/StatutTraduit.jsx";

const API_BASE_URL = "http://localhost:5050";

export default function BackendTest() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");

  async function loadItems() {
    setStatus("Chargement...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/items`);
      const data = await response.json();
      setItems(data.items || []);
      setStatus("OK");
    } catch (error) {
      setStatus(`Erreur: ${error.message}`);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    setStatus("Envoi...");

    try {
      await fetch(`${API_BASE_URL}/api/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setName("");
      await loadItems();
    } catch (error) {
      setStatus(`Erreur: ${error.message}`);
    }
  }

  async function handleDelete(id) {
    setStatus("Suppression...");

    try {
      await fetch(`${API_BASE_URL}/api/items/${id}`, {
        method: "DELETE",
      });
      await loadItems();
    } catch (error) {
      setStatus(`Erreur: ${error.message}`);
    }
  }

  return (
    <section className="backend-test-page">
      {/* <TicketCostsPage /> */}
      {/* <StatutTraduit /> */}
      <h1>Backend Test</h1>
      <p>Test rapide du backend Node + SQLite.</p>

      <form className="backend-form" onSubmit={handleCreate}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nom"
        />
        <button type="submit">Ajouter</button>
      </form>

      <div className="backend-status">{status}</div>

      <ul className="backend-list">
        {items.map((item) => (
          <li key={item.id}>
            <span>{item.name}</span>
            <button type="button" onClick={() => handleDelete(item.id)}>
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
