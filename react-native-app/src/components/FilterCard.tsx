import { Feather } from "@expo/vector-icons"
import { useMemo, type Dispatch, type SetStateAction } from "react"
import { StyleSheet, Text, View } from "react-native"

import { fonts, radius, type Palette } from "../theme"
import type { EquipmentType, ExerciseFilters, FilterOptions } from "../types/filters"
import {
  DIFFICULTY_LABELS,
  equipmentSelectOptions,
  fromDifficultyRange,
  targetSelectOptions,
  toDifficultyRange,
} from "../utils/filters"
import { toTitleCase } from "../utils/formatting"
import { RangeSlider } from "./RangeSlider"
import { SelectField } from "./SelectField"

interface FilterCardProps {
  palette: Palette
  bodyParts: string[]
  // "" until the user picks one.
  selectedBodyPart: string
  onChangeBodyPart: (bodyPart: string) => void
  // The selected body part's choices; undefined when they couldn't be loaded.
  filterOptions: FilterOptions | undefined
  filters: ExerciseFilters
  onChangeFilters: Dispatch<SetStateAction<ExerciseFilters>>
}

// The Training screen's search card: body part (step 1), then the optional
// difficulty, target and equipment filters.
export function FilterCard({
  palette,
  bodyParts,
  selectedBodyPart,
  onChangeBodyPart,
  filterOptions,
  filters,
  onChangeFilters,
}: FilterCardProps) {
  const styles = useMemo(() => makeStyles(palette), [palette])

  // Nothing is chosen by default: the filters stay locked until the user picks
  // a body part (target and equipment options depend on it).
  const hasBodyPart = Boolean(selectedBodyPart)
  const difficultyRange = toDifficultyRange(filters.difficulties)
  const difficultyRangeLabel =
    difficultyRange.min === difficultyRange.max
      ? DIFFICULTY_LABELS[difficultyRange.min]
      : `${DIFFICULTY_LABELS[difficultyRange.min]} – ${DIFFICULTY_LABELS[difficultyRange.max]}`
  const bodyPartOptions = bodyParts.map((bodyPart) => ({
    value: bodyPart,
    label: toTitleCase(bodyPart),
  }))

  return (
    <View style={styles.card}>
      <View style={styles.stepHeader}>
        <View style={styles.stepBadge}>
          {hasBodyPart ? (
            <Feather name="check" size={13} color={palette.onAccent} />
          ) : (
            <Text style={styles.stepBadgeText}>1</Text>
          )}
        </View>
        <Text style={[styles.sectionLabel, styles.stepHeaderLabel]}>SELECT A BODY PART</Text>
        {hasBodyPart ? null : (
          <View style={styles.startTag}>
            <Text style={styles.startTagText}>START HERE</Text>
          </View>
        )}
      </View>
      <SelectField
        palette={palette}
        title="Body part"
        placeholder="Select body part"
        highlighted={!hasBodyPart}
        options={bodyPartOptions}
        value={selectedBodyPart}
        onChange={onChangeBodyPart}
      />

      {/* Locked (dimmed, untappable, hidden from screen readers) until a
          body part is chosen. */}
      <View
        style={[styles.filterGroup, !hasBodyPart && styles.locked]}
        pointerEvents={hasBodyPart ? "auto" : "none"}
        accessibilityElementsHidden={!hasBodyPart}
        importantForAccessibility={hasBodyPart ? "auto" : "no-hide-descendants"}
      >
        <View style={styles.difficultyHeader}>
          <Text style={styles.difficultyTitle}>
            Difficulty <Text style={styles.optional}>(optional)</Text>
          </Text>
          <Text style={styles.rangeLabel}>{difficultyRangeLabel}</Text>
        </View>
        <Text style={styles.helperText}>
          Drag the handles for a range, or tap a level for just that one.
        </Text>
        <RangeSlider
          palette={palette}
          levels={DIFFICULTY_LABELS}
          value={difficultyRange}
          onChange={(range) =>
            onChangeFilters((prev) => ({ ...prev, difficulties: fromDifficultyRange(range) }))
          }
        />
        {hasBodyPart ? (
          <View style={styles.filterHint}>
            <Feather name="info" size={14} color={palette.accent} style={styles.filterHintIcon} />
            <Text style={styles.filterHintText}>
              Target and Equipment counts update to match your difficulty range.
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.selectRow}>
        <View style={styles.selectCell}>
          <SelectField
            palette={palette}
            size="compact"
            title="Target"
            disabled={!hasBodyPart}
            options={targetSelectOptions(filterOptions, filters.difficulties)}
            value={filters.target ?? ""}
            onChange={(value) =>
              onChangeFilters((prev) => ({ ...prev, target: value || undefined }))
            }
          />
        </View>
        <View style={styles.selectCell}>
          <SelectField
            palette={palette}
            size="compact"
            title="Equipment"
            disabled={!hasBodyPart}
            options={equipmentSelectOptions(filterOptions, filters.difficulties)}
            value={filters.equipmentTypes?.[0] ?? ""}
            onChange={(value) =>
              onChangeFilters((prev) => ({
                ...prev,
                equipmentTypes: value ? [value as EquipmentType] : undefined,
              }))
            }
          />
        </View>
      </View>
      {hasBodyPart ? null : (
        <Text style={styles.helperText}>Pick a body part to unlock the filters and Find.</Text>
      )}
    </View>
  )
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: 16,
      gap: 14,
    },
    sectionLabel: {
      color: c.textMuted,
      fontFamily: fonts.bold,
      fontSize: 12,
      letterSpacing: 1,
    },
    // Step 1 heading: number badge (a check once done), label, "Start here".
    stepHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    stepHeaderLabel: {
      flex: 1,
    },
    stepBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    stepBadgeText: {
      color: c.onAccent,
      fontFamily: fonts.extrabold,
      fontSize: 12,
    },
    startTag: {
      backgroundColor: c.accent,
      borderRadius: radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    startTagText: {
      color: c.onAccent,
      fontFamily: fonts.extrabold,
      fontSize: 11,
      letterSpacing: 0.8,
    },
    // Difficulty controls; same spacing as the card's gap.
    filterGroup: {
      gap: 14,
    },
    // Filters before a body part is chosen. Matches SelectField's disabled look.
    locked: {
      opacity: 0.5,
    },
    difficultyHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginTop: 4,
    },
    difficultyTitle: {
      color: c.text,
      fontFamily: fonts.bold,
      fontSize: 15,
    },
    optional: {
      color: c.textMuted,
      fontFamily: fonts.medium,
    },
    rangeLabel: {
      color: c.accent,
      fontFamily: fonts.bold,
      fontSize: 13,
    },
    helperText: {
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 13,
      lineHeight: 18,
    },
    // Note between the slider and the Target / Equipment fields.
    filterHint: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    // Lines the icon up with the first line of text.
    filterHintIcon: {
      marginTop: 2,
    },
    filterHintText: {
      flex: 1,
      color: c.textMuted,
      fontFamily: fonts.medium,
      fontSize: 13,
      lineHeight: 18,
    },
    selectRow: {
      flexDirection: "row",
      gap: 12,
    },
    selectCell: {
      flex: 1,
    },
  })
}
