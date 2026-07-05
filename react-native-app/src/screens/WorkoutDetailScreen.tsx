import { StatusBar } from "expo-status-bar"
import { useMemo } from "react"
import { ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { ActionButton } from "../components/ActionButton"
import { WorkoutPanel } from "../components/WorkoutPanel"
import type { RootStackParamList } from "../../App"
import { makeStyles } from "./stylesheets/TrainingScreen.styles"

type Props = NativeStackScreenProps<RootStackParamList, "WorkoutDetail">

// Read-only view of a single saved workout. The full Workout object is passed
// as a route param (it already carries a base64 gifUrl), so nothing is fetched
// here. Editing sets stays on the Saved Workouts card.
export function WorkoutDetailScreen({ route, navigation }: Props) {
  const { workout, isDark } = route.params
  const styles = useMemo(() => makeStyles(isDark), [isDark])

  const sets = workout.setDetails ?? []

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.row}>
          <ActionButton
            label="Saved Workouts"
            variant="secondary"
            size="small"
            onPress={() => navigation.goBack()}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{workout.name}</Text>
          <WorkoutPanel workout={workout} isDark={isDark} showNameLabel={false} />

          {sets.length ? (
            <>
              <Text style={styles.savedTitle}>Sets</Text>
              {sets.map((set, index) => (
                <View key={index} style={styles.setRow}>
                  <Text style={styles.setRowLabel}>Set {index + 1}</Text>
                  <Text style={styles.detailLabel}>
                    Weight: {set.weight != null ? `${set.weight} lbs` : "—"}
                    {"   ·   "}
                    Reps: {set.reps != null ? set.reps : "—"}
                  </Text>
                </View>
              ))}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
