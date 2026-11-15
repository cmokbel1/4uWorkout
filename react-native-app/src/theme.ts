// Shared design tokens for the redesigned screens. Colors were sampled from the
// light and dark mockups. Screens that predate the redesign still use their own
// stylesheets until they get designs of their own.

export interface Palette {
  bg: string
  surface: string
  // Inputs and inset areas inside a surface card.
  surfaceSunken: string
  // Icon circles and similar small raised elements.
  surfaceRaised: string
  border: string
  borderStrong: string
  // The tab bar's top edge.
  tabBarBorder: string
  // Training's bottom bar (Find / Save workout): its own surface with a lit
  // top edge, so it reads as separate from the content scrolling under it.
  dock: string
  dockEdge: string
  text: string
  textMuted: string
  textDisabled: string
  accent: string
  onAccent: string
  onAccentMuted: string
  // A soft accent fill and the accent text to use with it: ThemedButton's
  // "tonal" variant and the Saved tab switch's chosen side. The fill is the
  // accent mixed into the page background, opaque so a shadow under it doesn't
  // show through. onAccentTint reaches 4.5:1 on the fill (and more on the plain
  // background, where the day view's Today link uses it).
  accentTint: string
  onAccentTint: string
  sliderHandle: string
  scrim: string
  beginner: string
  intermediate: string
  advanced: string
  // Destructive actions (e.g. delete).
  danger: string
}

const dark: Palette = {
  bg: "#07121F",
  surface: "#0E1D30",
  surfaceSunken: "#07121F",
  surfaceRaised: "#152840",
  border: "#162941",
  // Brighter than the mockup's #34536F so field outlines and the inactive
  // slider track reach 3:1 against the card (#0E1D30) and field fill.
  borderStrong: "#4F7299",
  tabBarBorder: "#1C3352",
  dock: "#162B45",
  dockEdge: "#2E4B6E",
  text: "#EAF2FB",
  textMuted: "#8FA6BF",
  textDisabled: "#5F7A96",
  accent: "#4CC9F0",
  onAccent: "#04121F",
  onAccentMuted: "#123749",
  // 16% accent over bg; the accent label is 7.3:1 on it.
  accentTint: "#122F40",
  onAccentTint: "#4CC9F0",
  sliderHandle: "#EAF2FB",
  scrim: "rgba(2, 8, 15, 0.72)",
  beginner: "#4ADE80",
  intermediate: "#FBBF24",
  advanced: "#F87171",
  danger: "#F87171",
}

const light: Palette = {
  bg: "#F3F4F7",
  surface: "#FFFFFF",
  surfaceSunken: "#F3F4F7",
  surfaceRaised: "#ECEEF2",
  border: "#E6E8EC",
  borderStrong: "#DBDEE3",
  tabBarBorder: "#E6E8EC",
  dock: "#FFFFFF",
  dockEdge: "#DBDEE3",
  text: "#0F1115",
  textMuted: "#5B616E",
  textDisabled: "#8A909C",
  accent: "#2F5BFF",
  onAccent: "#FFFFFF",
  // 4.6:1 on the accent; the mockup's #D5DEFF was 3.9:1.
  onAccentMuted: "#EEF2FF",
  // 10% accent over bg. The accent itself is only 4.1:1 on it, so the label
  // is a darker accent (5.3:1).
  accentTint: "#DFE5F8",
  onAccentTint: "#284DD9",
  sliderHandle: "#FFFFFF",
  scrim: "rgba(15, 17, 21, 0.4)",
  beginner: "#16A34A",
  intermediate: "#D97706",
  advanced: "#DC2626",
  danger: "#DC2626",
}

export function getPalette(isDark: boolean): Palette {
  return isDark ? dark : light
}

// Manrope, loaded in App.tsx. Custom fonts pick their weight by family name,
// so set fontFamily (not fontWeight) on text.
export const fonts = {
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  extrabold: "Manrope_800ExtraBold",
} as const

// The screens' side padding.
export const GUTTER = 20

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  pill: 999,
} as const
