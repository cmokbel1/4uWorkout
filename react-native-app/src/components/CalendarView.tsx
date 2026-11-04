import { Feather } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { StatusBar } from "expo-status-bar"
import { useMemo, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Calendar } from "react-native-calendars"

import { fonts, getPalette, radius, type Palette } from "../theme"
import type { RootStackParamList } from "../../App"
import type { SavedWorkoutsByDate } from "../storage/savedWorkouts"
import { formatDateLabel, toDateKey, todayKey } from "../utils/date"
import { toTitleCase } from "../utils/formatting"
import { AppMenu } from "./AppMenu"
import { NavCard } from "./NavCard"
import { ScreenHeader } from "./ScreenHeader"

interface CalendarViewProps {
  isDark: boolean
  onToggleDark: (value: boolean) => void
  // Calendar markings (dotted days + selected day) built by the parent screen.
  markedDates: Record<string, object>
  // All saved workouts by date, for the month summary and recent days.
  savedWorkouts: SavedWorkoutsByDate
  // Opens the day view for the tapped date.
  onSelectDate: (date: string) => void
  // Opens the day view for today ("Today's workouts" in the menu).
  onOpenToday: () => void
}

// The month view of the Saved Workouts screen, in the redesigned look. Same
// header as Training (brand, title, cog menu) plus a back button. Tapping a day opens the day view
// for it — the same screen Training's "Today's workouts" opens.
export function CalendarView({
  isDark,
  onToggleDark,
  markedDates,
  savedWorkouts,
  onSelectDate,
  onOpenToday,
}: CalendarViewProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const palette = getPalette(isDark)
  const styles = useMemo(() => makeStyles(palette), [palette])
  const calendarTheme = useMemo(() => makeCalendarTheme(palette), [palette])
  const [menuVisible, setMenuVisible] = useState(false)

  const today = todayKey()
  // The current month, e.g. "2026-06". The forward arrow is disabled on it:
  // there's nothing to save in the future.
  const currentMonth = today.slice(0, 7)
  const [visibleMonth, setVisibleMonth] = useState(currentMonth)
  const openTraining = () => navigation.navigate("Training")

  const summary = useMemo(
    () => summarizeMonth(savedWorkouts, visibleMonth, visibleMonth === currentMonth),
    [savedWorkouts, visibleMonth, currentMonth],
  )
  // The latest days with saved workouts, newest first. Date keys sort as text.
  const recentDays = useMemo(
    () =>
      Object.keys(savedWorkouts)
        .filter((date) => savedWorkouts[date].length)
        .sort()
        .reverse()
        .slice(0, RECENT_DAYS),
    [savedWorkouts],
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {/* Back is a GO_BACK like Android's back button, so it follows the Saved
          Workouts screen's view history: back to the day view if that's where
          the calendar was opened from, otherwise out to Training. */}
      <ScreenHeader
        palette={palette}
        title="Trainer"
        onBack={() => navigation.goBack()}
        onOpenMenu={() => setMenuVisible(true)}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.navRow}>
          <NavCard
            palette={palette}
            icon="shuffle"
            title="Training"
            subtitle="Find a workout"
            onPress={openTraining}
          />
          <NavCard
            palette={palette}
            icon="zap"
            title="Today's workouts"
            subtitle="Your plan"
            onPress={onOpenToday}
          />
        </View>
        {/* Sets the nav cards off from the content, like the header's divider. */}
        <View style={styles.divider} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select a date</Text>
          <View style={styles.hint}>
            <Feather name="info" size={14} color={palette.accent} style={styles.hintIcon} />
            <Text style={styles.hintText}>
              Days with saved workouts are marked with a dot.
            </Text>
          </View>
          <Calendar
            // The library reads its theme once; remount it when the theme changes.
            key={isDark ? "dark" : "light"}
            current={today}
            maxDate={today}
            hideExtraDays={false}
            disableArrowRight={visibleMonth >= currentMonth}
            onMonthChange={(month: { dateString: string }) =>
              setVisibleMonth(month.dateString.slice(0, 7))
            }
            markedDates={markedDates}
            onDayPress={(day: { dateString: string }) => onSelectDate(day.dateString)}
            renderArrow={(direction: "left" | "right") => (
              <View style={styles.arrow}>
                <Feather
                  name={direction === "left" ? "chevron-left" : "chevron-right"}
                  size={18}
                  color={palette.text}
                />
              </View>
            )}
            theme={calendarTheme}
          />
          <View style={styles.summary}>
            <Text style={styles.summaryMonth}>{summary.month}</Text>
            <Text style={styles.summaryText}>{summary.text}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent workouts</Text>
          {recentDays.length ? (
            <View style={styles.hint}>
              <Feather name="info" size={14} color={palette.accent} style={styles.hintIcon} />
              <Text style={styles.hintText}>
                Your last {RECENT_DAYS} days with saved workouts. Tap one to see it.
              </Text>
            </View>
          ) : null}
          {recentDays.length ? (
            <View>
              {recentDays.map((date, index) => {
                const workouts = savedWorkouts[date]
                const bodyParts = [...new Set(workouts.map((w) => toTitleCase(w.bodyPart)))]
                const detail = `${pluralize(workouts.length, "workout")} · ${bodyParts.join(", ")}`
                return (
                  <Pressable
                    key={date}
                    onPress={() => onSelectDate(date)}
                    style={({ pressed }) => [
                      styles.recentRow,
                      index > 0 && styles.recentRowDivider,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatDateLabel(date)}, ${detail}`}
                  >
                    <View style={styles.recentText}>
                      <Text style={styles.recentDate}>{formatDateLabel(date)}</Text>
                      <Text style={styles.recentDetail} numberOfLines={1}>
                        {detail}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={palette.textMuted} />
                  </Pressable>
                )
              })}
            </View>
          ) : (
            <Text style={styles.hintText}>Workouts you save will show up here.</Text>
          )}
        </View>
      </ScrollView>

      <AppMenu
        palette={palette}
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        links={[
          { title: "Training", subtitle: "Find a workout", icon: "shuffle", onPress: openTraining },
          { title: "Today's workouts", subtitle: "Your plan", icon: "zap", onPress: onOpenToday },
        ]}
        isDark={isDark}
        onToggleDark={onToggleDark}
      />
    </SafeAreaView>
  )
}

// How many days the Recent workouts card lists.
const RECENT_DAYS = 5

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`
}

// The summary under the calendar for the month shown ("YYYY-MM"): days
// trained and workouts saved that month, plus the current streak when the
// current month is shown.
function summarizeMonth(
  saved: SavedWorkoutsByDate,
  month: string,
  isCurrentMonth: boolean,
): { month: string; text: string } {
  const [year, monthNumber] = month.split("-").map(Number)
  const label = new Date(year, monthNumber - 1, 1).toLocaleDateString(undefined, {
    month: "long",
  })

  let days = 0
  let workouts = 0
  for (const [date, list] of Object.entries(saved)) {
    if (date.startsWith(month) && list.length) {
      days += 1
      workouts += list.length
    }
  }
  if (!days) return { month: label, text: "No workouts saved" }

  const parts = [pluralize(days, "day") + " trained", pluralize(workouts, "workout")]
  if (isCurrentMonth) {
    const streak = currentStreak(saved)
    if (streak) parts.push(`${streak}-day streak`)
  }
  return { month: label, text: parts.join(" · ") }
}

// Consecutive days with saved workouts, counting back from today. If nothing
// is saved today yet, it counts back from yesterday, so the streak doesn't
// read 0 before today's workout.
function currentStreak(saved: SavedWorkoutsByDate): number {
  const hasWorkouts = (day: Date) => Boolean(saved[toDateKey(day)]?.length)
  const day = new Date()
  if (!hasWorkouts(day)) day.setDate(day.getDate() - 1)
  let streak = 0
  while (hasWorkouts(day)) {
    streak += 1
    day.setDate(day.getDate() - 1)
  }
  return streak
}

function makeCalendarTheme(c: Palette) {
  return {
    calendarBackground: c.surface,
    monthTextColor: c.text,
    textMonthFontFamily: fonts.extrabold,
    textMonthFontSize: 17,
    textSectionTitleColor: c.textMuted,
    textDayHeaderFontFamily: fonts.semibold,
    textDayHeaderFontSize: 13,
    dayTextColor: c.text,
    textDayFontFamily: fonts.bold,
    textDayFontSize: 16,
    // Days of the neighbouring months, and future days (can't be picked).
    textInactiveColor: c.textMuted,
    textDisabledColor: c.textDisabled,
    todayTextColor: c.accent,
    selectedDayBackgroundColor: c.accent,
    selectedDayTextColor: c.onAccent,
    dotColor: c.accent,
    selectedDotColor: c.onAccent,
  }
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.bg,
    },
    pressed: {
      opacity: 0.75,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 32,
      gap: 16,
    },
    navRow: {
      flexDirection: "row",
      gap: 12,
    },
    // Full width (past the content's padding), matching ScreenHeader's divider.
    divider: {
      height: 1,
      marginHorizontal: -20,
      backgroundColor: c.border,
    },
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: 16,
      gap: 10,
    },
    cardTitle: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 20,
    },
    hint: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    // Lines the icon up with the first line of text.
    hintIcon: {
      marginTop: 2,
    },
    hintText: {
      flex: 1,
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 13,
      lineHeight: 18,
    },
    // The month summary under the calendar, set off by a divider.
    summary: {
      flexDirection: "row",
      alignItems: "baseline",
      flexWrap: "wrap",
      columnGap: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    summaryMonth: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 15,
    },
    summaryText: {
      color: c.textMuted,
      fontFamily: fonts.semibold,
      fontSize: 13,
    },
    recentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 56,
      paddingVertical: 10,
    },
    recentRowDivider: {
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    recentText: {
      flex: 1,
      gap: 2,
    },
    recentDate: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 15,
    },
    recentDetail: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 13,
    },
    arrow: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.surfaceRaised,
      alignItems: "center",
      justifyContent: "center",
    },
  })
}
