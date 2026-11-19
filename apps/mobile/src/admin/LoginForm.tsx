import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { checkAdminToken } from "@/api/adminClient";
import { ApiError } from "@/api/client";
import { colors, fonts, spacing } from "@/theme";

// Asks for the admin token and checks it with the server before accepting it.
export function LoginForm({ onLoggedIn }: { onLoggedIn: (token: string) => void }) {
  const [token, setToken] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setChecking(true);
    setError(null);
    try {
      await checkAdminToken(token.trim());
      onLoggedIn(token.trim());
    } catch (e) {
      setError(e instanceof ApiError && e.status === 401 ? "Wrong token." : String((e as Error).message));
    } finally {
      setChecking(false);
    }
  }

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Admin login</Text>
      <Text style={styles.hint}>Enter ADMIN_TOKEN from server/.env.</Text>
      <TextInput
        value={token}
        onChangeText={setToken}
        onSubmitEditing={submit} // Enter key submits
        secureTextEntry // shows dots instead of the token
        autoCapitalize="none"
        placeholder="Admin token"
        style={styles.input}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        onPress={submit}
        disabled={checking || token.trim() === ""}
        style={[styles.button, (checking || token.trim() === "") && styles.buttonDisabled]}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{checking ? "Checking…" : "Log in"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: "100%",
    maxWidth: 380,
    alignSelf: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
    marginTop: spacing.xl * 2,
  },
  title: { fontFamily: fonts.bold, fontSize: 22, color: colors.plum },
  hint: { fontFamily: fonts.regular, fontSize: 14, color: colors.mutedText },
  input: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.plum,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    backgroundColor: colors.cream,
  },
  error: { fontFamily: fonts.regular, fontSize: 14, color: colors.ripe },
  button: {
    backgroundColor: colors.plum,
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.cream },
});
