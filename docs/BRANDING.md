# Branding: Ripe

Tagline: *Watch what's next in food.*

## Files (in `assets/brand/`)

| File | Use |
|---|---|
| `ripe-mark.svg` | Logo mark for light backgrounds (plum seed) |
| `ripe-mark-on-dark.svg` | Logo mark for dark backgrounds (cream seed) |
| `ripe-mark-512.png` | PNG version of the mark (README, slides) |
| `icon.png` / `ripe-icon.svg` | App icon, 1024×1024, full-bleed plum. The OS rounds the corners, so don't round them yourself |
| `adaptive-icon.png` / `ripe-adaptive-foreground.svg` | Android adaptive icon foreground (transparent), use with background `#2B1B3D` |
| `splash-icon.png` / `ripe-splash-icon.svg` | Splash screen image (transparent), use with background `#FFF7EC` |
| `favicon.png` / `ripe-favicon.svg` | Web favicon. A simplified mark without the leaf, for tiny sizes |

## Expo setup (Claude Code: do this in Phase 7, step by step, and explain it)

1. Copy `icon.png`, `adaptive-icon.png`, `splash-icon.png` and `favicon.png` into `apps/mobile/assets/images/`.
2. In `app.json` / `app.config.ts`:
   - `name: "Ripe"`, `slug: "ripe"`
   - `icon: "./assets/images/icon.png"`
   - `android.adaptiveIcon`: `foregroundImage: "./assets/images/adaptive-icon.png"`, `backgroundColor: "#2B1B3D"`
   - splash (the `expo-splash-screen` config plugin): `image: "./assets/images/splash-icon.png"`, `backgroundColor: "#FFF7EC"`, `imageWidth: 200`
   - `web.favicon: "./assets/images/favicon.png"`
3. To show the logo inside the app, use `react-native-svg` and build a small `RipeMark` component from the paths in `ripe-mark.svg` (props: `size`, `variant: "light" | "dark"`). Don't use a PNG for this.

## Wordmark

The wordmark is the word **ripe** in lowercase, in the **Outfit** font, weight 700, letter spacing -0.05em, colour Plum (Cream on dark backgrounds). Load the font with `@expo-google-fonts/outfit`.
Put the mark on the left of the word, with a gap of about 15% of the mark's height. The word's height is roughly 75% of the mark's height.

## Colours

| Name | Hex | Use |
|---|---|---|
| Sprout | `#1FA463` | Stage: application / in the lab |
| Zest | `#A6D93B` | Stage: under assessment |
| Amber | `#FFB020` | Stage: positive safety opinion / authorised |
| Ripe | `#FF5A1F` | Stage: on the market; main accent |
| Plum | `#2B1B3D` | Text, dark surfaces, primary buttons |
| Cream | `#FFF7EC` | App background |
| Muted text | `#5E5266` | Secondary text on cream |

Rules:
- Always show a text label with a stage colour. Never use colour alone (some users are colour-blind).
- Never put text directly on Zest or Amber unless it's in Plum. White text on them is hard to read.
- Create a `theme.ts` with these values instead of typing the hex codes in each component.
