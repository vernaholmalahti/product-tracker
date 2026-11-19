import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useFollow } from "@/hooks/useFollow";
import { colors, fonts, spacing } from "@/theme";

// Follow / Following toggle for a product, with a short explanation underneath.
export function FollowButton({ productSlug }: { productSlug: string }) {
  const { following, busy, error, toggle } = useFollow(productSlug);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={toggle}
        disabled={busy}
        accessibilityRole="button"
        accessibilityState={{ selected: following, busy }}
        style={[styles.button, following ? styles.buttonFollowing : styles.buttonFollow]}
      >
        {busy ? (
          <ActivityIndicator color={following ? colors.plum : colors.cream} />
        ) : (
          <Text style={[styles.text, following ? styles.textFollowing : styles.textFollow]}>
            {following ? "Following ✓" : "Follow"}
          </Text>
        )}
      </Pressable>
      <Text style={styles.hint}>
        {following
          ? "You'll get a notification when the status changes."
          : "Get a notification when the status changes in any market."}
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  button: {
    alignSelf: "flex-start", // as wide as its text, not the full screen
    minWidth: 140,
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 999,
    borderWidth: 2,
  },
  buttonFollow: {
    backgroundColor: colors.plum, // BRANDING.md: Plum for primary buttons
    borderColor: colors.plum,
  },
  buttonFollowing: {
    backgroundColor: colors.card,
    borderColor: colors.plum,
  },
  text: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  textFollow: {
    color: colors.cream,
  },
  textFollowing: {
    color: colors.plum,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.mutedText,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.ripe,
  },
});
