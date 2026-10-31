import { Feather } from "@expo/vector-icons"
import { useMemo, type ComponentProps } from "react"
import { Pressable, StyleSheet, Switch, Text, View } from "react-native"

import { fonts, radius, type Palette } from "../theme"
import { BottomSheet } from "./BottomSheet"

export interface MenuLink {
  title: string
  subtitle: string
  icon: ComponentProps<typeof Feather>["name"]
  onPress: () => void
}

interface AppMenuProps {
  palette: Palette
  visible: boolean
  onClose: () => void
  // Navigation rows; each screen lists the other places you can go.
  links: MenuLink[]
  isDark: boolean
  onToggleDark: (value: boolean) => void
}

// The menu opened from the header's cog: navigation rows, then the dark mode
// switch. Picking a row closes the menu before running it.
export function AppMenu({
  palette,
  visible,
  onClose,
  links,
  isDark,
  onToggleDark,
}: AppMenuProps) {
  const styles = useMemo(() => makeStyles(palette), [palette])

  return (
    <BottomSheet palette={palette} visible={visible} onClose={onClose} title="Menu">
      <View style={styles.list}>
        {links.map((link) => (
          <Pressable
            key={link.title}
            onPress={() => {
              onClose()
              link.onPress()
            }}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`${link.title}, ${link.subtitle}`}
          >
            <View style={styles.icon}>
              <Feather name={link.icon} size={17} color={palette.accent} />
            </View>
            <View style={styles.text}>
              <Text style={styles.label}>{link.title}</Text>
              <Text style={styles.sub}>{link.subtitle}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={palette.textMuted} />
          </Pressable>
        ))}
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={styles.icon}>
            <Feather name="moon" size={17} color={palette.accent} />
          </View>
          <View style={styles.text}>
            <Text style={styles.label}>Dark mode</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={onToggleDark}
            trackColor={{ false: palette.borderStrong, true: palette.accent }}
            thumbColor="#FFFFFF"
            accessibilityLabel="Dark mode"
          />
        </View>
      </View>
    </BottomSheet>
  )
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    list: {
      gap: 4,
      paddingBottom: 4,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      minHeight: 56,
      paddingHorizontal: 12,
      borderRadius: radius.sm,
    },
    pressed: {
      opacity: 0.75,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.surfaceRaised,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      flex: 1,
    },
    label: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 16,
    },
    sub: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 13,
    },
    divider: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: 4,
    },
  })
}
