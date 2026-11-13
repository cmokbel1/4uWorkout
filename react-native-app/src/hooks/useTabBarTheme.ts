import { useNavigation } from "@react-navigation/native"
import { useLayoutEffect } from "react"

import { fonts, type Palette } from "../theme"

// Colours the tab bar for the screen's theme. Dark mode lives in each screen's
// state (no global store), and the tab bar takes its style from the focused
// tab's options, so every tab screen calls this with its palette. Screens
// re-read dark mode on focus, so the bar follows a change made elsewhere.
export function useTabBarTheme(palette: Palette): void {
  const navigation = useNavigation()

  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: {
        backgroundColor: palette.surface,
        borderTopColor: palette.navCardBorder,
      },
      tabBarActiveTintColor: palette.accent,
      tabBarInactiveTintColor: palette.textMuted,
      tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 12 },
    })
  }, [navigation, palette])
}
