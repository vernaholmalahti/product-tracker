import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { getUpdateRuns } from "@/api/adminClient";
import type { UpdateRun } from "@/api/types";
import { colors, fonts, spacing } from "@/theme";

type Props = {
  token: string;
  onError: (error: unknown) => void; // the admin page handles 401 (back to login) etc.
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function durationText(run: UpdateRun): string {
  if (!run.finishedAt) return "still running or crashed";
  const seconds = Math.round((Date.parse(run.finishedAt) - Date.parse(run.startedAt)) / 1000);
  return `${seconds} s`;
}

// "Worker runs" section of the admin page: the latest runs of the update worker,
// with links to official pages whose content changed.
export function WorkerRuns({ token, onError }: Props) {
  const [runs, setRuns] = useState<UpdateRun[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRuns(await getUpdateRuns(token));
    } catch (error) {
      onError(error);
    } finally {
      setLoading(false);
    }
  }, [token, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.heading}>Worker runs</Text>
        <Pressable onPress={() => void load()} accessibilityRole="button">
          <Text style={styles.link}>Refresh</Text>
        </Pressable>
      </View>

      {!loading && runs.length === 0 && (
        <Text style={styles.muted}>No runs yet. Start one with `npm run worker` in the server folder.</Text>
      )}

      {runs.map((run) => (
        <View key={run.id} style={styles.run}>
          <Text style={styles.runTitle}>
            {formatTime(run.startedAt)} · {durationText(run)}
          </Text>
          <Text style={styles.muted}>
            {run.itemsChecked} checked · {run.changesFound} changed · {run.errors.length} errors
            {run.aiCallsUsed > 0 && ` · ${run.aiCallsUsed} AI calls`}
          </Text>

          {run.sourceChanges.map((change) => (
            <Pressable key={change.sourceWatchId} onPress={() => Linking.openURL(change.url)} accessibilityRole="link">
              <Text style={styles.change}>Changed: {change.label} ↗</Text>
            </Pressable>
          ))}

          {run.errors.map((error, index) => (
            <Text key={`${error.where}-${index}`} style={styles.error}>
              Error – {error.where}: {error.message}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md, marginTop: spacing.xl },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heading: { fontFamily: fonts.bold, fontSize: 22, color: colors.plum },
  link: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.plum, textDecorationLine: "underline" },
  muted: { fontFamily: fonts.regular, fontSize: 14, color: colors.mutedText },
  run: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  runTitle: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.plum },
  change: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.plum,
    textDecorationLine: "underline",
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
    paddingLeft: spacing.sm,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ripe,
    borderLeftWidth: 3,
    borderLeftColor: colors.ripe,
    paddingLeft: spacing.sm,
  },
});
