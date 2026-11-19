import Constants from "expo-constants";

const API_PORT = 4000;

// In development the phone can't use "localhost" – that would be the phone itself.
// Expo knows the address of the computer running the dev server (e.g. "192.168.1.23:8081"),
// and our API runs on the same computer, so we reuse that host with port 4000.
function guessDevApiUrl(): string {
  const hostUri = Constants.expoConfig?.hostUri; // undefined in the web preview
  const host = hostUri?.split(":")[0] ?? "localhost";
  return `http://${host}:${API_PORT}`;
}

// EXPO_PUBLIC_API_URL (apps/mobile/.env) wins if set, e.g. for the deployed server in Phase 7.
// EXPO_PUBLIC_ variables are built into the app, so never put secrets in them.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? guessDevApiUrl();
