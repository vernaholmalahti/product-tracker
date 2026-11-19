import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { Category, StatusEvent } from "@/api/types";
import { formatEventDate } from "@/content/dates";
import { sourceTypeLabel, stageColor, stageExplanation, stageLabel } from "@/content/stages";
import { colors, fonts, spacing } from "@/theme";

type Props = {
  event: StatusEvent;
  category: Category;
  marketCode: string;
  isLast: boolean; // the last event has no connecting line below its dot
};

// One step in a vertical timeline: dot + line on the left, details on the right.
export function TimelineEvent({ event, category, marketCode, isLast }: Props) {
  const explanation = stageExplanation(event.stage, marketCode);
  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={[styles.dot, { backgroundColor: stageColor(event.stage) }]} />
        {!isLast && <View style={styles.line} />}
      </View>

      <View style={styles.body}>
        <Text style={styles.date}>{formatEventDate(event.eventDate, event.eventDatePrecision)}</Text>
        <Text style={styles.stage}>{stageLabel(event.stage, { category, marketCode })}</Text>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.summary}>{event.summary}</Text>
        {explanation && <Text style={styles.explanation}>{explanation}</Text>}

        {/* Ground rule 3: the source link is always shown. */}
        <Pressable onPress={() => Linking.openURL(event.sourceUrl)} accessibilityRole="link">
          <Text style={styles.source}>
            {sourceTypeLabel(event.sourceType)} ↗
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const DOT_SIZE = 14;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  rail: {
    width: DOT_SIZE + spacing.md,
    alignItems: "center",
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    marginTop: 3,
  },
  line: {
    flex: 1, // stretches down to the next event, however tall this one is
    width: 2,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  body: {
    flex: 1,
    paddingBottom: spacing.xl,
  },
  date: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.mutedText,
  },
  stage: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.plum,
    marginTop: 2,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.plum,
    marginTop: spacing.xs,
  },
  summary: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.plum,
    marginTop: spacing.xs,
  },
  explanation: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.plum,
    backgroundColor: colors.cream,
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  source: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.plum,
    textDecorationLine: "underline",
    marginTop: spacing.sm,
  },
});
