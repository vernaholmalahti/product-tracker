import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ProductSummary } from "@/api/types";
import { categoryLabel } from "@/content/stages";
import { colors, fonts, spacing } from "@/theme";
import { StageChip } from "./StageChip";

type Props = { product: ProductSummary };

// One product in the list: name, category, description and a chip per market.
// Tapping it opens /product/<slug>. `asChild` makes Link pass its navigation to the Pressable.
export function ProductCard({ product }: Props) {
  const meta = [categoryLabel(product.category), product.company].filter(Boolean).join(" · ");
  return (
    <Link href={{ pathname: "/product/[slug]", params: { slug: product.slug } }} asChild>
    <Pressable style={styles.card} accessibilityRole="link">
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.meta}>{meta}</Text>
      <Text style={styles.description}>{product.shortDescription}</Text>
      <View style={styles.chips}>
        {product.markets.map((market) => (
          <StageChip
            key={market.marketCode}
            marketCode={market.marketCode}
            marketName={market.marketName}
            stage={market.currentStage}
            category={product.category}
          />
        ))}
      </View>
    </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.plum,
  },
  meta: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.mutedText,
    marginTop: 2,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.plum,
    marginTop: spacing.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap", // chips continue on the next line when there's no room
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
