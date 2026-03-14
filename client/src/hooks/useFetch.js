import { useState, useEffect, useCallback } from "react";

const useFetch = (apiFn) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoFn = useCallback(apiFn, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    memoFn()
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [memoFn]);

  return { data, loading, error, setData };
};

export default useFetch;