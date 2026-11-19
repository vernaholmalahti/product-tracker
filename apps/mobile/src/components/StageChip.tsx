import { StyleSheet, Text, View } from "react-native";
import type { Category, Stage } from "@/api/types";
import { stageColor, stageLabel } from "@/content/stages";
import { colors, fonts, spacing } from "@/theme";

type Props = {
  marketCode: string; // used for label rules, e.g. "Allowed in supplements" in the US
  marketName?: string; // shown in the chip; leave out when a heading already names the market
  stage: Stage;
  category: Category;
};

// One market's status, e.g. "Singapore ● Authorised".
// Text is always Plum on a light background (BRANDING.md: no white text on Zest/Amber).
export function StageChip({ marketCode, marketName, stage, category }: Props) {
  const label = stageLabel(stage, { category, marketCode });
  return (
    <View
      style={styles.chip}
      accessibilityLabel={marketName ? `${marketName}: ${label}` : label}
    >
      {marketName && <Text style={styles.market}>{marketName}</Text>}
      <View style={[styles.dot, { backgroundColor: stageColor(stage) }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row", // children side by side instead of stacked
    alignItems: "center",
    gap: spacing.xs + 2,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: 999, // pill shape
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  market: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.plum,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.plum,
  },
});
