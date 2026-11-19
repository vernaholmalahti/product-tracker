import { Redirect, Slot } from "expo-router";
import { Platform } from "react-native";

// Layout for everything under /admin. The admin side is a web page (PROJECT_PLAN.md Phase 4):
// in the phone app it redirects home; in any browser (computer or phone) it works.
// Note: this only hides the screens. What actually protects the data is the admin
// token check on the server (requireAdmin.ts).
export default function AdminLayout() {
  if (Platform.OS !== "web") return <Redirect href="/" />;
  return <Slot />; // renders the matching admin screen, without an extra header
}
