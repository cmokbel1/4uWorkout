import { Feather } from "@expo/vector-icons"
import { StatusBar } from "expo-status-bar"
import { useMemo, useState } from "react"
import { Image, Pressable, ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { InstructionsModal } from "../components/InstructionsModal"
import { ScreenHeader } from "../components/ScreenHeader"
import { getPalette } from "../theme"
import { DIFFICULTIES, type Difficulty } from "../types/filters"
import type { RootStackParamList } from "../../App"
import { makeStyles } from "./stylesheets/WorkoutDetailScreen.styles"

type Props = NativeStackScreenProps<RootStackParamList, "WorkoutDetail">

// Read-only view of a single saved workout. The full Workout object is passed
// as a route param (it already carries a base64 gifUrl), so nothing is fetched
// here. Editing sets stays on the Saved Workouts card.
export function WorkoutDetailScreen({ route, navigation }: Props) {
  const { workout, isDark } = route.params
  const palette = getPalette(isDark)
  const styles = useMemo(() => makeStyles(palette), [palette])
  const [instructionsVisible, setInstructionsVisible] = useState(false)

  const sets = workout.setDetails ?? []
  // 0-based position of the level, for the bar icon (-1 if unknown).
  const level = DIFFICULTIES.indexOf(workout.difficulty as Difficulty)
  const details = [
    { label: "TARGET", value: workout.target },
    { label: "GROUP", value: workout.bodyPart },
    { label: "GEAR", value: workout.equipment },
  ]

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScreenHeader palette={palette} title="Trainer" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Saved Workouts"
        >
          <Feather name="list" size={16} color={palette.text} />
          <Text style={styles.backButtonText}>Saved Workouts</Text>
        </Pressable>

        <Image
          source={{ uri: workout.gifUrl }}
          style={styles.media}
          resizeMode="contain"
          accessibilityLabel={`Demonstration of ${workout.name}`}
        />

        <View>
          {level >= 0 ? (
            <View style={styles.levelRow}>
              <View style={styles.levelBars}>
                {DIFFICULTIES.map((difficulty, index) => (
                  <View
                    key={difficulty}
                    style={[
                      styles.levelBar,
                      { height: 6 + index * 4 },
                      index <= level ? styles.levelBarOn : null,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.levelText}>{workout.difficulty.toUpperCase()}</Text>
            </View>
          ) : null}
          <Text style={styles.name} accessibilityRole="header">
            {workout.name}
          </Text>
        </View>

        <View style={styles.tiles}>
          {details.map((detail) => (
            <View key={detail.label} style={styles.tile}>
              <Text style={styles.tileLabel}>{detail.label}</Text>
              <Text style={styles.tileValue} numberOfLines={2}>
                {detail.value}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.description}>{workout.description}</Text>

        <Pressable
          onPress={() => setInstructionsVisible(true)}
          style={({ pressed }) => [styles.instructionsRow, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="View instructions"
        >
          <View style={styles.playIcon}>
            <Feather name="play" size={14} color={palette.onAccent} />
          </View>
          <Text style={styles.instructionsText}>Instructions</Text>
          <Feather name="chevron-right" size={18} color={palette.textMuted} />
        </Pressable>

        {sets.length ? (
          <View style={styles.sets}>
            <View style={styles.setsHeader}>
              <Text style={styles.setsTitle}>Sets</Text>
              <Text style={styles.setsCount}>
                {sets.length} {sets.length === 1 ? "set" : "sets"}
              </Text>
            </View>
            {sets.map((set, index) => (
              <View key={index} style={styles.setRow}>
                <Text style={styles.setLabel}>Set {index + 1}</Text>
                <Text style={styles.setValue}>
                  {set.weight != null ? `${set.weight} lbs` : "—"}
                  {"  ×  "}
                  {set.reps != null ? `${set.reps} reps` : "—"}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <InstructionsModal
        palette={palette}
        visible={instructionsVisible}
        onClose={() => setInstructionsVisible(false)}
        instructions={workout.instructions}
      />
    </SafeAreaView>
  )
}
