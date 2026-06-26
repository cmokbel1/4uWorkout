import { Pressable, StyleSheet, Text } from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

import type { RootStackParamList } from "../../App"

interface BackToTrainingButtonProps {
  isDark?: boolean
}

// Reusable header control that returns to the Training screen. Pulls navigation
// from context (useNavigation) so it can be dropped into any screen in the
// stack without prop threading.
export function BackToTrainingButton({ isDark = false }: BackToTrainingButtonProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const color = isDark ? "#58A6FF" : "#3B6FD4"

  return (
    <Pressable
      onPress={() => navigation.navigate("Training")}
      style={styles.button}
      accessibilityLabel="Back to training"
      accessibilityRole="button"
      hitSlop={8}
    >
      <Text style={[styles.text, { color }]}>‹ Training</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingRight: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: "700",
  },
})
