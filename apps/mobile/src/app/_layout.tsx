import {
  Outfit_400Regular,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts,
} from "@expo-google-fonts/outfit";
import { Stack } from "expo-router";
import { colors, fonts } from "@/theme";

// Root layout: wraps every screen in src/app/.
// A Stack navigator shows one screen at a time with a header and a back button,
// e.g. product list → product detail (Phase 2).
export default function RootLayout() {
  // Load the brand font before drawing anything, so text doesn't jump
  // from the system font to Outfit after a moment.
  const [fontsLoaded] = useFonts({ Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold });
  if (!fontsLoaded) {
    return null; // the splash screen stays visible meanwhile
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerTintColor: colors.plum, // back button + title colour
        headerTitleStyle: { fontFamily: fonts.bold },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.cream },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Ripe" }} />
    </Stack>
  );
}
