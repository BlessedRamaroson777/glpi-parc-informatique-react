import { useEffect, useState } from "react";

export default function FetchList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      try {
        const response = await fetch("/api/items");
        const json = await response.json();

        if (isMounted) {
          setItems(json.items || []);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section>
      <h2>Liste</h2>
      {loading && <p>Chargement...</p>}
      {!loading && items.length === 0 && <p>Aucun element.</p>}
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </section>
  );
}
