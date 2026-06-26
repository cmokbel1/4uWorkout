import { StatusBar } from "expo-status-bar"
import { useMemo } from "react"
import { ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Calendar } from "react-native-calendars"

import { BackToTrainingButton } from "./BackToTrainingButton"
import { todayKey } from "../utils/date"
import {
  makeCalendarTheme,
  makeStyles,
} from "../screens/stylesheets/SavedWorkoutsScreen.styles"

interface CalendarViewProps {
  isDark: boolean
  // Calendar markings (dotted days + selected day) built by the parent screen.
  markedDates: Record<string, object>
  onSelectDate: (date: string) => void
}

// The "zoomed out" month view of the Saved Workouts screen. Opens on the
// current month; tapping a day calls onSelectDate.
export function CalendarView({
  isDark,
  markedDates,
  onSelectDate,
}: CalendarViewProps) {
  const styles = useMemo(() => makeStyles(isDark), [isDark])
  const calendarTheme = useMemo(() => makeCalendarTheme(isDark), [isDark])

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.container}>
        <BackToTrainingButton isDark={isDark} />
        <Text style={styles.heading}>Select a date</Text>
        <View style={styles.calendarCard}>
          <Calendar
            current={todayKey()}
            markedDates={markedDates}
            onDayPress={(day: any) => onSelectDate(day.dateString)}
            theme={calendarTheme}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
