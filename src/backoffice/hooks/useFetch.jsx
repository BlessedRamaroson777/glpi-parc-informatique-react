import { useEffect, useState } from "react";

export default function useFetch(url, options) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, options);
        const json = await response.json();

        if (isMounted) {
          setData(json);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (url) {
      run();
    }

    return () => {
      isMounted = false;
    };
  }, [url, options]);

  return { data, loading, error };
}
