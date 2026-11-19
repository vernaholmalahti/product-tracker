// Ripe brand values (docs/BRANDING.md). Components import these instead of
// typing hex codes, so a colour change happens in one place.

export const colors = {
  sprout: "#1FA463", // stage: application / in the lab
  zest: "#A6D93B", // stage: under assessment
  amber: "#FFB020", // stage: positive safety opinion / authorised
  ripe: "#FF5A1F", // stage: on the market; main accent
  plum: "#2B1B3D", // text, dark surfaces, primary buttons
  cream: "#FFF7EC", // app background
  mutedText: "#5E5266", // secondary text on cream
  card: "#FFFFFF",
  border: "#EADFD0",
  neutral: "#B8AFBF", // stages without a brand colour (not submitted, rejected, withdrawn)
} as const;

// Font family names as registered by useFonts() in src/app/_layout.tsx.
export const fonts = {
  regular: "Outfit_400Regular",
  semiBold: "Outfit_600SemiBold",
  bold: "Outfit_700Bold",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;
