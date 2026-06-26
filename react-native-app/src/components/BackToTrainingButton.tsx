import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

import { ActionButton } from "./ActionButton"
import type { RootStackParamList } from "../../App"

// Reusable button that returns to the Training screen. Pulls navigation from
// context (useNavigation) so it can be dropped into any screen in the stack
// without prop threading.
export function BackToTrainingButton() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  return (
    <ActionButton
      label="Training"
      variant="secondary"
      size="small"
      onPress={() => navigation.navigate("Training")}
    />
  )
}
