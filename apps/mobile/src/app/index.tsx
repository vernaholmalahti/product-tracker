import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { MarketFilterBar } from "@/components/MarketFilterBar";
import { ProductCard } from "@/components/ProductCard";
import { ErrorView, LoadingView } from "@/components/StatusViews";
import { ALL_MARKETS, describeFilter, filterProducts, type MarketFilter } from "@/content/marketFilter";
import { useProducts } from "@/hooks/useProducts";
import { colors, fonts, spacing } from "@/theme";

// Home screen (route "/"): list of all tracked products, with a market filter.
export default function HomeScreen() {
  const { products, markets, loading, error, reload } = useProducts();
  const [filter, setFilter] = useState<MarketFilter>(ALL_MARKETS);
  const visibleProducts = filterProducts(products, filter);

  // First load: nothing to show yet.
  if (loading && products.length === 0) return <LoadingView />;

  // Server unreachable or error, and no older data to show.
  if (error && products.length === 0) return <ErrorView message={error} onRetry={reload} />;

  // FlatList only draws the rows that are on screen – it stays fast with many products.
  return (
    <FlatList
      data={visibleProducts}
      keyExtractor={(product) => product.slug}
      renderItem={({ item }) => <ProductCard product={item} />}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      ListHeaderComponent={
        <>
          <Text style={styles.intro}>
            Follow new foods and supplement ingredients from lab to shop shelf.
          </Text>
          <MarketFilterBar markets={markets} value={filter} onChange={setFilter} />
        </>
      }
      ListEmptyComponent={
        <Text style={styles.intro}>No products tracked in {describeFilter(filter, markets)} yet.</Text>
      }
      // Pull down to refresh
      refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.plum} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
  },
  intro: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.mutedText,
    marginBottom: spacing.lg,
  },
});
