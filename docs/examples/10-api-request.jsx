import { useEffect, useState } from "react";
import { apiRequest } from "../../src/common/services/authService.jsx";

export default function ApiRequestExample() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setStatus("Chargement...");
      try {
        const result = await apiRequest("/me", { method: "GET" });
        if (isMounted) {
          setData(result);
          setStatus("OK");
        }
      } catch (error) {
        if (isMounted) {
          setStatus(`Erreur: ${error.message}`);
        }
      }
    }

    run();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <p>{status}</p>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
