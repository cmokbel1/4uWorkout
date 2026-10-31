import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { fonts, radius, type Palette } from "../theme"

interface BottomSheetProps {
  palette: Palette
  visible: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

// A sheet that slides up from the bottom over a fading scrim. Tapping the scrim
// (or the Android back button) calls onClose; the sheet slides back down
// before it unmounts.
export function BottomSheet({ palette, visible, onClose, title, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets()
  // Updates when the window resizes (rotation, iPad Split View), so the sheet
  // always starts fully off-screen.
  const { height: windowHeight } = useWindowDimensions()
  const styles = useMemo(() => makeStyles(palette), [palette])
  // Stays mounted while the closing animation runs.
  const [mounted, setMounted] = useState(visible)
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      setMounted(true)
      Animated.timing(progress, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false)
      })
    }
  }, [visible, progress])

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [windowHeight, 0],
  })

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: progress }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityLabel="Close"
            accessibilityRole="button"
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16), transform: [{ translateY }] },
          ]}
        >
          <View style={styles.grabber} />
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {children}
        </Animated.View>
      </View>
    </Modal>
  )
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: "flex-end",
    },
    scrim: {
      backgroundColor: c.scrim,
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 16,
      paddingTop: 10,
      maxHeight: "70%",
      gap: 8,
    },
    grabber: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: c.borderStrong,
      marginBottom: 6,
    },
    title: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 18,
      paddingHorizontal: 4,
      paddingBottom: 4,
    },
  })
}
