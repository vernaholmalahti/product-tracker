import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, spacing } from "@/theme";

// Shown on every supplement page (ground rule 4, text from docs/CONTENT_GUIDELINES.md).
export function SupplementDisclaimer() {
  return (
    <View style={styles.box} accessibilityRole="summary">
      <Text style={styles.text}>
        Ripe shows regulatory status only. It is not medical advice. Talk to a doctor or pharmacist
        before starting any supplement.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.plum,
    borderRadius: 12,
    padding: spacing.md,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.cream,
  },
});
