import { StatusBar } from "expo-status-bar"
import { useCallback, useMemo, useState } from "react"
import { Image, Text, View } from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useFocusEffect } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { ThemedButton } from "../components/ThemedButton"
import { readDarkMode } from "../storage/theme"
import { getPalette } from "../theme"
import type { RootStackParamList } from "../../App"
import { ORBIT_CENTER, RING_RADII, makeStyles } from "./stylesheets/StartScreen.styles"

type Props = NativeStackScreenProps<RootStackParamList, "Start">

// Dots on the rings around the logo, placed as in the mockup: angle in
// degrees (0 = right, clockwise), which ring, and diameter.
const DOTS = [
  { ring: "middle", angle: -34, size: 10, tone: "accent" },
  { ring: "inner", angle: 150, size: 7, tone: "accent" },
  { ring: "outer", angle: 199, size: 6, tone: "muted" },
] as const

export function StartScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  // Unknown until the saved preference is read. The app opens on this screen,
  // so it waits rather than flashing the light theme for dark-mode users.
  const [isDark, setIsDark] = useState<boolean | null>(null)

  // Re-read on every focus: dark mode can be changed from the other screens.
  useFocusEffect(
    useCallback(() => {
      readDarkMode()
        .then(setIsDark)
        .catch(() => setIsDark((current) => current ?? false))
    }, []),
  )

  const palette = getPalette(isDark ?? false)
  const styles = useMemo(() => makeStyles(palette, isDark ?? false), [palette, isDark])

  if (isDark === null) return null

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.hero}>
        <View style={styles.orbit} accessible={false}>
          <View style={[styles.ring, styles.ringOuter]} />
          <View style={[styles.ring, styles.ringMiddle]} />
          <View style={[styles.ring, styles.ringInner]} />
          {DOTS.map((dot, index) => {
            const radius = RING_RADII[dot.ring]
            const radians = (dot.angle * Math.PI) / 180
            return (
              <View
                key={index}
                style={{
                  position: "absolute",
                  left: ORBIT_CENTER + radius * Math.cos(radians) - dot.size / 2,
                  top: ORBIT_CENTER + radius * Math.sin(radians) - dot.size / 2,
                  width: dot.size,
                  height: dot.size,
                  borderRadius: dot.size / 2,
                  backgroundColor: dot.tone === "accent" ? palette.accent : palette.textMuted,
                }}
              />
            )
          })}
          <Image
            source={require("../../assets/4uicon.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="4UWorkout logo"
          />
        </View>

        <Text style={styles.title} accessibilityRole="header">
          4UWorkout{"\n"}
          <Text style={styles.titleAccent}>Trainer</Text>
        </Text>
        <Text style={styles.subtitle}>Find a workout to add to your training routine</Text>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <ThemedButton
          palette={palette}
          label="Start Training"
          icon="arrow-right"
          iconAfter
          onPress={() => navigation.navigate("Training")}
        />
      </View>
    </SafeAreaView>
  )
}
