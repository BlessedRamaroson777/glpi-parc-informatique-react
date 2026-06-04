import { useState } from "react";

export default function PostForm() {
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("Envoi...");

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setStatus("OK");
      setLabel("");
    } catch (error) {
      setStatus(`Erreur: ${error.message}`);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        placeholder="Label"
      />
      <button type="submit">Envoyer</button>
      {status && <p>{status}</p>}
    </form>
  );
}
