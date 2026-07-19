import type { ReactNode } from "react"
import { StyleSheet, Text, View } from "react-native"

interface AppHeaderProps {
  isDark: boolean
  // Optional element pinned to the right of the title (e.g. a settings button).
  right?: ReactNode
}

// App-wide branded header. Owns its own bordered, elevated card so the app name
// reads as a distinct layer above each screen's content blocks — callers just
// drop <AppHeader /> at the top of a screen, no wrapper needed.
export function AppHeader({ isDark, right }: AppHeaderProps) {
  const c = isDark
    ? { cardBg: "#161B22", cardBorder: "#30363D", textPrimary: "#E6EDF3" }
    : { cardBg: "#FFFFFF", cardBorder: "#D8DFE9", textPrimary: "#1A2333" }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: c.cardBg, borderColor: c.cardBorder },
        { shadowOpacity: isDark ? 0.5 : 0.15 },
      ]}
    >
      <Text style={[styles.title, { color: c.textPrimary }]}>
        4UWorkout Trainer
      </Text>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    // Lifted above the content blocks below it for added depth.
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  right: {
    position: "absolute",
    right: 14,
  },
})
