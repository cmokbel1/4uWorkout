import { Feather } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { StatusBar } from "expo-status-bar"
import { useMemo, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Calendar } from "react-native-calendars"

import { fonts, getPalette, radius, type Palette } from "../theme"
import type { Workout } from "../types/workout"
import type { RootStackParamList } from "../../App"
import { formatShortDate, todayKey } from "../utils/date"
import { AppMenu } from "./AppMenu"
import { ThemedButton } from "./ThemedButton"

interface CalendarViewProps {
  isDark: boolean
  onToggleDark: (value: boolean) => void
  // Calendar markings (dotted days + selected day) built by the parent screen.
  markedDates: Record<string, object>
  selectedDate: string
  // Workouts saved on the selected date.
  dayWorkouts: Workout[]
  onSelectDate: (date: string) => void
  onOpenWorkout: (workout: Workout) => void
  // Opens the day view (where sets are edited and workouts deleted) for the
  // selected date.
  onEditDay: () => void
  // Opens the day view for today ("Today's workouts" in the menu).
  onOpenToday: () => void
}

// The month view of the Saved Workouts screen, in the redesigned look. Same
// header as Training (brand, title, cog menu). Tapping a day selects it and
// shows that day's saved workouts below the calendar.
export function CalendarView({
  isDark,
  onToggleDark,
  markedDates,
  selectedDate,
  dayWorkouts,
  onSelectDate,
  onOpenWorkout,
  onEditDay,
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
  const isToday = selectedDate === today
  const openTraining = () => navigation.navigate("Training")

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.topBar}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>4UWORKOUT</Text>
            <Text style={styles.title} accessibilityRole="header">
              Trainer
            </Text>
          </View>
          <Pressable
            onPress={() => setMenuVisible(true)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            accessibilityLabel="Open menu"
            accessibilityRole="button"
          >
            <Feather name="settings" size={20} color={palette.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          onPress={openTraining}
          style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Training"
        >
          <Text style={styles.pillText}>Training</Text>
        </Pressable>

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
            current={selectedDate}
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
        </View>

        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle}>
            {isToday ? `Today · ${formatShortDate(selectedDate)}` : formatShortDate(selectedDate)}
          </Text>
          {dayWorkouts.length ? (
            <Pressable
              onPress={onEditDay}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Edit workouts saved on ${formatShortDate(selectedDate)}`}
            >
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          ) : (
            <Text style={styles.dayStatus}>Nothing saved</Text>
          )}
        </View>

        {dayWorkouts.length ? (
          <View style={styles.list}>
            {dayWorkouts.map((workout) => {
              const sets = workout.setDetails?.length ?? 0
              return (
                <Pressable
                  key={workout.id}
                  onPress={() => onOpenWorkout(workout)}
                  style={({ pressed }) => [styles.item, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`${workout.name}, ${sets} ${sets === 1 ? "set" : "sets"}`}
                >
                  <View style={styles.itemText}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {workout.name}
                    </Text>
                    <Text style={styles.itemSub}>
                      {sets} {sets === 1 ? "set" : "sets"}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={palette.textMuted} />
                </Pressable>
              )
            })}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No workouts saved for this day</Text>
            {/* Workouts are always saved for today, so finding one only helps
                when today is selected. */}
            {isToday ? (
              <View style={styles.emptyAction}>
                <ThemedButton
                  palette={palette}
                  label="Find a workout"
                  icon="shuffle"
                  onPress={openTraining}
                />
              </View>
            ) : null}
          </View>
        )}
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
    // Same header as Training's top bar (without its collapsing nav cards).
    topBar: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: c.bg,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
    brand: {
      color: c.accent,
      fontFamily: fonts.extrabold,
      fontSize: 13,
      letterSpacing: 1.4,
    },
    title: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 34,
      lineHeight: 40,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
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
    pill: {
      alignSelf: "flex-start",
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: 20,
      borderRadius: radius.pill,
      backgroundColor: c.accent,
    },
    pillText: {
      color: c.onAccent,
      fontFamily: fonts.bold,
      fontSize: 15,
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
    arrow: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.surfaceRaised,
      alignItems: "center",
      justifyContent: "center",
    },
    dayHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginTop: 4,
    },
    dayTitle: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 18,
    },
    dayStatus: {
      color: c.textMuted,
      fontFamily: fonts.semibold,
      fontSize: 13,
    },
    editLink: {
      color: c.accent,
      fontFamily: fonts.bold,
      fontSize: 14,
    },
    list: {
      gap: 10,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    itemText: {
      flex: 1,
      gap: 2,
    },
    itemName: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 15,
      textTransform: "capitalize",
    },
    itemSub: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 13,
    },
    emptyCard: {
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: c.borderStrong,
      borderRadius: radius.lg,
      paddingVertical: 28,
      paddingHorizontal: 24,
      alignItems: "center",
      gap: 14,
    },
    emptyTitle: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 16,
      textAlign: "center",
    },
    emptyAction: {
      flexDirection: "row",
    },
  })
}
