import { Stack } from "expo-router";

// Root layout: wraps every screen in src/app/.
// A Stack navigator shows one screen at a time with a header and a back button,
// e.g. product list → product detail (Phase 2).
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "NovelTrack" }} />
    </Stack>
  );
}
