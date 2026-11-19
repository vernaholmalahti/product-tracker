import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, spacing } from "@/theme";

// Full-screen loading spinner, used while a screen loads its first data.
export function LoadingView() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator color={colors.plum} />
    </View>
  );
}

// Full-screen error message with a retry button.
export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.centered}>
      <Text style={styles.errorText}>{message}</Text>
      <Pressable style={styles.button} onPress={onRetry} accessibilityRole="button">
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.lg,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.plum,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.plum,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 999,
  },
  buttonText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.cream,
  },
});
