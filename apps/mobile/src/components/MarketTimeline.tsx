import { StyleSheet, Text, View } from "react-native";
import type { Category, ProductDetail } from "@/api/types";
import { formatCheckedDate } from "@/content/dates";
import { colors, fonts, spacing } from "@/theme";
import { StageChip } from "./StageChip";
import { TimelineEvent } from "./TimelineEvent";

type Props = {
  market: ProductDetail["markets"][number]; // one element of the markets array
  category: Category;
};

// One market's card: current status, what's expected next, the timeline, last checked date.
export function MarketTimeline({ market, category }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.marketName}>{market.marketName}</Text>
      <View style={styles.chipRow}>
        <StageChip marketCode={market.marketCode} stage={market.currentStage} category={category} />
      </View>
      {market.expectedNext && <Text style={styles.expected}>Next: {market.expectedNext}</Text>}

      <View style={styles.timeline}>
        {market.events.map((event, index) => (
          <TimelineEvent
            key={`${event.stage}-${event.eventDate}`}
            event={event}
            category={category}
            marketCode={market.marketCode}
            isLast={index === market.events.length - 1}
          />
        ))}
      </View>

      <Text style={styles.checked}>Last checked {formatCheckedDate(market.lastCheckedAt)}</Text>
    </View>
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
  marketName: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.plum,
  },
  chipRow: {
    flexDirection: "row", // keeps the chip as wide as its text, not full width
    marginTop: spacing.sm,
  },
  expected: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.mutedText,
    marginTop: spacing.sm,
  },
  timeline: {
    marginTop: spacing.lg,
  },
  checked: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.mutedText,
  },
});
