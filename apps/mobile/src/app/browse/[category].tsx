import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { MarketFilterBar } from "@/components/MarketFilterBar";
import { ProductCard } from "@/components/ProductCard";
import { ErrorView, LoadingView } from "@/components/StatusViews";
import { findBrowseCategory, productsInCategory } from "@/content/categories";
import { ALL_MARKETS, describeFilter, filterProducts, type MarketFilter } from "@/content/marketFilter";
import { useProducts } from "@/hooks/useProducts";
import { colors, fonts, spacing } from "@/theme";

// Product list for one category (route /browse/novel-foods or /browse/supplements),
// with a market filter.
export default function BrowseScreen() {
  const { category: slug } = useLocalSearchParams<{ category: string }>();
  const browseCategory = findBrowseCategory(slug);
  const { products, markets, loading, error, reload } = useProducts();
  const [filter, setFilter] = useState<MarketFilter>(ALL_MARKETS);

  // Unknown URL like /browse/xyz
  if (!browseCategory) return <ErrorView message={`Unknown category "${slug}".`} onRetry={reload} />;

  const visibleProducts = filterProducts(productsInCategory(products, browseCategory.category), filter);

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
          <Stack.Screen options={{ title: browseCategory.title }} />
          <Text style={styles.intro}>{browseCategory.description}</Text>
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
