import type { Category, ProductSummary } from "@/api/types";

// The two ways to browse, shown on the landing screen.
// `slug` is the readable part of the URL: /browse/novel-foods, /browse/supplements.
export const BROWSE_CATEGORIES: {
  category: Category;
  slug: string;
  title: string;
  description: string;
}[] = [
  {
    category: "NOVEL_FOOD",
    slug: "novel-foods",
    title: "Novel foods",
    description: "New food ingredients on their way through approval to the shops.",
  },
  {
    category: "SUPPLEMENT_INGREDIENT",
    slug: "supplements",
    title: "Supplements",
    // Neutral wording only – no health claims (ground rule 4).
    description: "Supplement ingredients and their legal status in each market.",
  },
];

export function findBrowseCategory(slug: string) {
  return BROWSE_CATEGORIES.find((entry) => entry.slug === slug);
}

export function productsInCategory(products: ProductSummary[], category: Category): ProductSummary[] {
  return products.filter((product) => product.category === category);
}
