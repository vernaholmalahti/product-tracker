import { useCallback, useEffect, useState } from "react";
import { getProduct } from "@/api/client";
import type { ProductDetail } from "@/api/types";

// Loads one product with its timelines. Same pattern as useProducts.
export function useProduct(slug: string) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // [slug] = recreate this function when the slug changes, which re-runs the effect.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProduct(await getProduct(slug));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  return { product, loading, error, reload: load };
}
