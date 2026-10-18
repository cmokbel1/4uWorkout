import { Ionicons } from "@expo/vector-icons"
import type { ReactNode } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

interface AppHeaderProps {
  isDark: boolean
  // Optional element pinned to the right of the title (e.g. a settings button).
  right?: ReactNode
  // When set, shows a "< Back" button pinned to the left of the title.
  onBack?: () => void
}

// App-wide branded header. Owns its own bordered, elevated card so the app name
// reads as a distinct layer above each screen's content blocks — callers just
// drop <AppHeader /> at the top of a screen, no wrapper needed.
export function AppHeader({ isDark, right, onBack }: AppHeaderProps) {
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
      {onBack ? (
        <Pressable
          onPress={onBack}
          style={styles.back}
          hitSlop={12}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={22} color={c.textPrimary} />
          <Text style={[styles.backText, { color: c.textPrimary }]}>Back</Text>
        </Pressable>
      ) : null}
      {/* With a back button, reserve room on both sides (keeps the title
          centered) and let it shrink on narrow phones instead of overlapping. */}
      <Text
        style={[
          styles.title,
          { color: c.textPrimary },
          onBack ? styles.titleWithBack : null,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
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
  titleWithBack: {
    flex: 1,
    paddingHorizontal: 72,
  },
  back: {
    position: "absolute",
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
  },
  right: {
    position: "absolute",
    right: 14,
  },
})
