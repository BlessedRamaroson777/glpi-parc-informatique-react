import { useMemo, useState } from "react";

const items = [
  { id: 1, label: "Imprimante", type: "asset" },
  { id: 2, label: "Ordinateur", type: "asset" },
  { id: 3, label: "Ticket", type: "support" },
];

export default function FilterWithButton() {
  const [mode, setMode] = useState("all");

  const filtered = useMemo(() => {
    if (mode === "all") {
      return items;
    }

    return items.filter((item) => item.type === mode);
  }, [mode]);

  return (
    <section>
      <div>
        <button type="button" onClick={() => setMode("all")}>
          Tout
        </button>
        <button type="button" onClick={() => setMode("asset")}>
          Parc
        </button>
        <button type="button" onClick={() => setMode("support")}>
          Support
        </button>
      </div>

      <ul>
        {filtered.map((item) => (
          <li key={item.id}>{item.label}</li>
        ))}
      </ul>
    </section>
  );
}
