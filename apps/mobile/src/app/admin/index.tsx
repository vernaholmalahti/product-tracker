import { Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { approveUpdate, getPendingUpdates, rejectUpdate } from "@/api/adminClient";
import { ApiError } from "@/api/client";
import type { PendingUpdate } from "@/api/types";
import { clearAdminToken, loadAdminToken, saveAdminToken } from "@/admin/adminToken";
import { LoginForm } from "@/admin/LoginForm";
import { PendingUpdateCard } from "@/admin/PendingUpdateCard";
import { WorkerRuns } from "@/admin/WorkerRuns";
import { colors, fonts, spacing } from "@/theme";

// Admin review page (/admin): pending updates waiting for approval.
export default function AdminScreen() {
  const [token, setToken] = useState<string | null>(() => loadAdminToken());
  const [updates, setUpdates] = useState<PendingUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const logOut = useCallback(() => {
    clearAdminToken();
    setToken(null);
  }, []);

  // Shared error handling: a 401 means the token is wrong or changed → back to login.
  const handleError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        logOut();
        return;
      }
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    },
    [logOut],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setUpdates(await getPendingUpdates(token));
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [token, handleError]);

  useEffect(() => {
    void load();
  }, [load]);

  function removeFromList(id: string) {
    setUpdates((current) => current.filter((u) => u.id !== id));
  }

  async function approve(update: PendingUpdate, eventDate?: string) {
    if (!token) return;
    try {
      await approveUpdate(token, update.id, eventDate);
      removeFromList(update.id);
      setMessage(`Published: ${update.title}. Followers were notified.`);
    } catch (error) {
      handleError(error);
    }
  }

  async function reject(update: PendingUpdate, reviewNote: string) {
    if (!token) return;
    try {
      await rejectUpdate(token, update.id, reviewNote);
      removeFromList(update.id);
      setMessage(`Rejected: ${update.title}.`);
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Stack.Screen options={{ title: "Ripe admin" }} />
      <View style={styles.column}>
        {!token ? (
          <LoginForm
            onLoggedIn={(newToken) => {
              saveAdminToken(newToken);
              setToken(newToken);
            }}
          />
        ) : (
          <>
            <View style={styles.toolbar}>
              <Text style={styles.heading}>
                Pending updates {loading ? "" : `(${updates.length})`}
              </Text>
              <View style={styles.toolbarButtons}>
                <Pressable onPress={() => void load()} accessibilityRole="button">
                  <Text style={styles.link}>Refresh</Text>
                </Pressable>
                <Pressable onPress={logOut} accessibilityRole="button">
                  <Text style={styles.link}>Log out</Text>
                </Pressable>
              </View>
            </View>

            {message && <Text style={styles.message}>{message}</Text>}

            {!loading && updates.length === 0 && (
              <Text style={styles.empty}>Nothing to review. 🎉</Text>
            )}

            {updates.map((update) => (
              <PendingUpdateCard
                key={update.id}
                update={update}
                onApprove={(eventDate) => approve(update, eventDate)}
                onReject={(note) => reject(update, note)}
              />
            ))}

            <WorkerRuns token={token} onError={handleError} />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: spacing.lg },
  column: {
    width: "100%",
    maxWidth: 960, // readable line length on wide desktop screens
    alignSelf: "center",
    gap: spacing.lg,
  },
  toolbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" },
  toolbarButtons: { flexDirection: "row", gap: spacing.lg },
  heading: { fontFamily: fonts.bold, fontSize: 24, color: colors.plum },
  link: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.plum, textDecorationLine: "underline" },
  message: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.plum,
    backgroundColor: colors.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.sprout,
    padding: spacing.md,
  },
  empty: { fontFamily: fonts.regular, fontSize: 16, color: colors.mutedText },
});
