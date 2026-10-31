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
import { todayKey } from "../utils/date"
import { AppMenu } from "./AppMenu"

interface CalendarViewProps {
  isDark: boolean
  onToggleDark: (value: boolean) => void
  // Calendar markings (dotted days + selected day) built by the parent screen.
  markedDates: Record<string, object>
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.topBar}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* A GO_BACK like Android's back button, so it follows the Saved
                Workouts screen's view history: back to the day view if that's
                where the calendar was opened from, otherwise out to Training. */}
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Feather name="chevron-left" size={22} color={palette.text} />
            </Pressable>
            <View>
              <Text style={styles.brand}>4UWORKOUT</Text>
              <Text style={styles.title} accessibilityRole="header">
                Trainer
              </Text>
            </View>
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
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
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
  })
}
