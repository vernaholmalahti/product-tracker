import { useCallback, useEffect, useState } from "react";
import { getMarkets, getProducts } from "@/api/client";
import type { Market, ProductSummary } from "@/api/types";

// A custom hook: a function starting with "use" that bundles state + effects,
// so screens don't repeat the same loading/error code.
export function useProducts() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]); // for the market filter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useCallback keeps the same function between renders, so it can safely be
  // listed as a dependency of useEffect below.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Promise.all runs both requests at the same time instead of one after the other.
      const [loadedProducts, loadedMarkets] = await Promise.all([getProducts(), getMarkets()]);
      setProducts(loadedProducts);
      setMarkets(loadedMarkets);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(); // "void" = we start the promise on purpose without awaiting it
  }, [load]);

  return { products, markets, loading, error, reload: load };
}
