import { Feather } from "@expo/vector-icons"
import type { ComponentProps } from "react"
import { StyleSheet, View } from "react-native"

interface TabBarIconProps {
  name: ComponentProps<typeof Feather>["name"]
  focused: boolean
  // The tab bar's tint: the accent when focused, muted otherwise.
  color: string
}

// A tab's icon. The focused tab's sits on a pill of its accent tint, so the
// current tab reads at a glance without relying on colour alone.
export function TabBarIcon({ name, focused, color }: TabBarIconProps) {
  return (
    <View style={[styles.pill, focused && { backgroundColor: `${color}26` }]}>
      <Feather name={name} size={20} color={color} />
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    width: 56,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
})
