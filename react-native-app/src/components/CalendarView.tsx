import { StatusBar } from "expo-status-bar"
import { useMemo, useState } from "react"
import { ScrollView, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Calendar } from "react-native-calendars"

import { AppHeader } from "./AppHeader"
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

  const today = todayKey()
  // The first day of the current month, e.g. "2026-06". Used to decide whether
  // the calendar is showing the current month so the forward arrow can be
  // disabled — there's nothing to save in the future.
  const currentMonth = today.slice(0, 7)
  const [visibleMonth, setVisibleMonth] = useState(currentMonth)

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.container}>
        <AppHeader isDark={isDark} />
        <View style={styles.card}>
          <View style={styles.headerButtonsRow}>
            <BackToTrainingButton />
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.heading}>Select a date</Text>
          <Calendar
            current={today}
            maxDate={today}
            disableArrowRight={visibleMonth >= currentMonth}
            onMonthChange={(month: any) =>
              setVisibleMonth(month.dateString.slice(0, 7))
            }
            markedDates={markedDates}
            onDayPress={(day: any) => onSelectDate(day.dateString)}
            theme={calendarTheme}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
