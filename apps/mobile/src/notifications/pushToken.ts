import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// How to show a notification that arrives while the app is open: as a banner and in the list.
// (shouldShowAlert is deprecated in SDK 58 – banner + list replace it.)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Android 13+ needs a notification channel before a push token can be created.
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Status updates",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function hasPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync(); // shows the system dialog
  return asked.granted;
}

// The EAS project ID that `eas init` writes into app.json. Expo needs it to create a token.
function getProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

// Asks for permission (only shows the dialog the first time) and returns this phone's
// Expo push token, e.g. "ExponentPushToken[abc...]". Returns null when push isn't possible:
// web preview, permission denied, no project ID yet, or Expo Go on Android.
export async function getPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  try {
    await ensureAndroidChannel();
    if (!(await hasPermission())) return null;

    const projectId = getProjectId();
    if (!projectId) {
      console.warn("No EAS project ID in app.json yet – run `npx eas-cli@latest init` in apps/mobile.");
      return null;
    }
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (error) {
    console.warn("Could not get a push token:", error);
    return null;
  }
}
