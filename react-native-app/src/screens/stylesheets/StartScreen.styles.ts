import { StyleSheet } from 'react-native'

import { fonts, type Palette } from '../../theme'

// The logo's rings, measured from the mockup (radius in points).
export const RING_RADII = { inner: 70, middle: 100, outer: 130 } as const
// The orbit area is square; leave room for the dots that sit on the outer ring.
const ORBIT_SIZE = RING_RADII.outer * 2 + 12
export const ORBIT_CENTER = ORBIT_SIZE / 2
const LOGO_SIZE = 96

// Decorative ring colours sampled from the mockups (not text, so no contrast
// requirement). Only this screen uses them.
const RING_COLORS = {
  dark: { inner: '#29445C', middle: '#192D46', outer: '#1F3652' },
  light: { inner: '#CED2D9', middle: '#E5E8EC', outer: '#E1E4E8' },
}

function ring(radius: number) {
  return {
    left: ORBIT_CENTER - radius,
    top: ORBIT_CENTER - radius,
    width: radius * 2,
    height: radius * 2,
    borderRadius: radius,
  }
}

export function makeStyles(c: Palette, isDark: boolean) {
  const rings = isDark ? RING_COLORS.dark : RING_COLORS.light

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.bg,
    },
    hero: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    orbit: {
      width: ORBIT_SIZE,
      height: ORBIT_SIZE,
      marginBottom: 28,
    },
    ring: {
      position: 'absolute',
      borderWidth: 1.5,
    },
    ringOuter: {
      ...ring(RING_RADII.outer),
      borderStyle: 'dashed',
      borderColor: rings.outer,
    },
    ringMiddle: {
      ...ring(RING_RADII.middle),
      borderColor: rings.middle,
    },
    ringInner: {
      ...ring(RING_RADII.inner),
      borderColor: rings.inner,
    },
    logo: {
      position: 'absolute',
      left: ORBIT_CENTER - LOGO_SIZE / 2,
      top: ORBIT_CENTER - LOGO_SIZE / 2,
      width: LOGO_SIZE,
      height: LOGO_SIZE,
    },
    title: {
      color: c.text,
      fontFamily: fonts.extrabold,
      fontSize: 44,
      lineHeight: 50,
      textAlign: 'center',
    },
    titleAccent: {
      color: c.accent,
    },
    subtitle: {
      maxWidth: 300,
      marginTop: 16,
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingTop: 12,
    },
  })
}
