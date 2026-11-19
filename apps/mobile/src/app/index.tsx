import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BROWSE_CATEGORIES, productsInCategory } from "@/content/categories";
import { useProducts } from "@/hooks/useProducts";
import { colors, fonts, spacing } from "@/theme";

// Landing screen (route "/"): choose what to browse.
export default function HomeScreen() {
  // Only used for the product counts. The cards work even if the server is down.
  const { products, loading } = useProducts();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Follow new foods and supplement ingredients from lab to shop shelf.
      </Text>

      {BROWSE_CATEGORIES.map(({ category, slug, title, description }) => {
        const count = productsInCategory(products, category).length;
        return (
          <Link key={slug} href={{ pathname: "/browse/[category]", params: { category: slug } }} asChild>
            <Pressable style={styles.card} accessibilityRole="link">
              <View style={styles.cardText}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
                {!loading && products.length > 0 && (
                  <Text style={styles.count}>
                    {count} {count === 1 ? "product" : "products"}
                  </Text>
                )}
              </View>
              <Text style={styles.arrow}>→</Text>
            </Pressable>
          </Link>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  intro: {
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 24,
    color: colors.mutedText,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardText: {
    flex: 1, // take all space except the arrow
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.plum,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.plum,
  },
  count: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.mutedText,
    marginTop: spacing.xs,
  },
  arrow: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.ripe, // main accent colour
    marginLeft: spacing.md,
  },
});
