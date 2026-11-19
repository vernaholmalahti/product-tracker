import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import type { PendingUpdate } from "@/api/types";
import { formatEventDate } from "@/content/dates";
import { sourceTypeLabel, stageColor, stageLabel } from "@/content/stages";
import { colors, fonts, spacing } from "@/theme";

type Props = {
  update: PendingUpdate;
  onApprove: (eventDate?: string) => Promise<void>;
  onReject: (reviewNote: string) => Promise<void>;
};

const WIDE_SCREEN = 760; // px: above this, details and actions sit side by side

// One pending update for review: what would change, the evidence, and the decision buttons.
export function PendingUpdateCard({ update, onApprove, onReject }: Props) {
  const { width } = useWindowDimensions(); // re-renders when the browser window is resized
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [eventDate, setEventDate] = useState(""); // only used when the update has no date
  const context = { category: update.product.category, marketCode: update.marketCode };

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  function approve() {
    // Approving publishes publicly and notifies followers, so ask once more.
    const ok = globalThis.confirm?.(`Publish "${update.title}" and notify followers?`) ?? true;
    if (ok) void run(() => onApprove(update.eventDate ? undefined : eventDate));
  }

  const canApprove = !busy && (update.eventDate !== null || /^\d{4}-\d{2}-\d{2}$/.test(eventDate));

  return (
    <View style={[styles.card, width > WIDE_SCREEN && styles.cardWide]}>
      {/* Left: what would change and why */}
      <View style={styles.details}>
        <Text style={styles.product}>
          {update.product.name} · {update.marketName}
        </Text>

        <View style={styles.stageRow}>
          <StageTag label={stageLabel(update.currentStage, context)} color={stageColor(update.currentStage)} />
          <Text style={styles.arrow}>→</Text>
          <StageTag label={stageLabel(update.proposedStage, context)} color={stageColor(update.proposedStage)} />
        </View>

        <Text style={styles.title}>{update.title}</Text>
        <Text style={styles.summary}>{update.summary}</Text>

        <Text style={styles.quote}>“{update.evidenceQuote}”</Text>

        <Pressable onPress={() => Linking.openURL(update.sourceUrl)} accessibilityRole="link">
          <Text style={styles.source}>
            {sourceTypeLabel(update.sourceType)}: {update.sourceUrl} ↗
          </Text>
        </Pressable>

        <Text style={styles.meta}>
          {update.eventDate ? `Event date ${formatEventDate(update.eventDate, update.eventDatePrecision)}` : "No event date"}
          {" · "}
          {update.origin === "AI_SEARCH" ? "AI search" : "Source check"}
          {update.confidence !== null && ` · confidence ${Math.round(update.confidence * 100)}%`}
        </Text>
      </View>

      {/* Right: decision */}
      <View style={[styles.actions, width > WIDE_SCREEN && styles.actionsWide]}>
        {update.eventDate === null && (
          <TextInput
            value={eventDate}
            onChangeText={setEventDate}
            placeholder="Event date YYYY-MM-DD"
            style={styles.input}
          />
        )}
        <Pressable
          onPress={approve}
          disabled={!canApprove}
          style={[styles.button, styles.approve, !canApprove && styles.disabled]}
          accessibilityRole="button"
        >
          <Text style={styles.approveText}>{busy ? "Working…" : "Approve & publish"}</Text>
        </Pressable>

        {rejecting ? (
          <>
            <TextInput
              value={reviewNote}
              onChangeText={setReviewNote}
              placeholder="Reason for rejecting"
              multiline
              style={[styles.input, styles.noteInput]}
            />
            <Pressable
              onPress={() => void run(() => onReject(reviewNote.trim()))}
              disabled={busy || reviewNote.trim().length < 3}
              style={[styles.button, styles.reject, (busy || reviewNote.trim().length < 3) && styles.disabled]}
              accessibilityRole="button"
            >
              <Text style={styles.rejectText}>Confirm reject</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={() => setRejecting(true)}
            disabled={busy}
            style={[styles.button, styles.reject]}
            accessibilityRole="button"
          >
            <Text style={styles.rejectText}>Reject…</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// Coloured dot + label (never colour alone).
function StageTag({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.tag}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  cardWide: { flexDirection: "row" },
  details: { flex: 1, gap: spacing.sm },
  product: { fontFamily: fonts.bold, fontSize: 18, color: colors.plum },
  stageRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm },
  arrow: { fontFamily: fonts.bold, fontSize: 18, color: colors.mutedText },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    backgroundColor: colors.cream,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  tagText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.plum },
  title: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.plum, marginTop: spacing.xs },
  summary: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.plum },
  quote: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    fontStyle: "italic",
    color: colors.plum,
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
    paddingLeft: spacing.md,
  },
  source: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.plum, textDecorationLine: "underline" },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: colors.mutedText },
  actions: { gap: spacing.sm },
  actionsWide: { width: 220 },
  button: { borderRadius: 999, paddingVertical: spacing.md, alignItems: "center", borderWidth: 2 },
  approve: { backgroundColor: colors.plum, borderColor: colors.plum },
  approveText: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.cream },
  reject: { backgroundColor: colors.card, borderColor: colors.plum },
  rejectText: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.plum },
  disabled: { opacity: 0.5 },
  input: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.plum,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.sm + 2,
    backgroundColor: colors.cream,
  },
  noteInput: { minHeight: 70, textAlignVertical: "top" },
});
