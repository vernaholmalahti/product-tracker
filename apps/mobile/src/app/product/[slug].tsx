import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { MarketTimeline } from "@/components/MarketTimeline";
import { ErrorView, LoadingView } from "@/components/StatusViews";
import { SupplementDisclaimer } from "@/components/SupplementDisclaimer";
import { categoryLabel } from "@/content/stages";
import { useProduct } from "@/hooks/useProduct";
import { colors, fonts, spacing } from "@/theme";

// Product detail screen. The file name [slug].tsx makes this a dynamic route:
// /product/solein → slug = "solein".
export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { product, loading, error, reload } = useProduct(slug);

  if (loading && !product) return <LoadingView />;
  if (error || !product) return <ErrorView message={error ?? "Product not found."} onRetry={reload} />;

  const isSupplement = product.category === "SUPPLEMENT_INGREDIENT";
  const meta = [categoryLabel(product.category), product.company].filter(Boolean).join(" · ");

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {/* Sets the header title from inside the screen, once we know the name. */}
      <Stack.Screen options={{ title: product.name }} />

      <Text style={styles.meta}>{meta}</Text>
      <Text style={styles.description}>{product.shortDescription}</Text>

      {isSupplement && <SupplementDisclaimer />}

      <View style={styles.markets}>
        {product.markets.map((market) => (
          <MarketTimeline key={market.marketCode} market={market} category={product.category} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  meta: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.mutedText,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 23,
    color: colors.plum,
  },
  markets: {
    gap: spacing.lg,
  },
});
