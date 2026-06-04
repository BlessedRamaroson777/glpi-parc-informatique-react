import { useMemo, useState } from "react";

const items = [
  { id: 1, label: "Imprimante" },
  { id: 2, label: "Ordinateur" },
  { id: 3, label: "Ecran" },
];

export default function FilterList() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) {
      return items;
    }

    return items.filter((item) => item.label.toLowerCase().includes(text));
  }, [query]);

  return (
    <section>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filtrer..."
      />

      <ul>
        {filtered.map((item) => (
          <li key={item.id}>{item.label}</li>
        ))}
      </ul>
    </section>
  );
}
