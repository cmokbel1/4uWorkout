import type { LevelRange } from "../components/RangeSlider"
import type { SelectOption } from "../components/SelectField"
import {
  DIFFICULTIES,
  type Difficulty,
  type EquipmentType,
  type ExerciseFilters,
  type FilterOption,
  type FilterOptions,
} from "../types/filters"
import { toTitleCase } from "./formatting"

export const DIFFICULTY_LABELS = DIFFICULTIES.map((level) => toTitleCase(level))
const FULL_DIFFICULTY_RANGE: LevelRange = { min: 0, max: DIFFICULTIES.length - 1 }

const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  free_weight: "Free weights",
  bodyweight: "Bodyweight",
  cable: "Cable",
  machine: "Machine",
  accessory: "Accessory",
  band: "Band",
}

// "" stands for "no filter" in the target and equipment fields.
const ANY_OPTION: SelectOption = { value: "", label: "Any" }

export function hasActiveFilters(filters: ExerciseFilters): boolean {
  return Boolean(
    filters.difficulties?.length || filters.target || filters.equipmentTypes?.length,
  )
}

// The slider shows the selected difficulties as a range; no filter is the
// full range.
export function toDifficultyRange(difficulties: Difficulty[] | undefined): LevelRange {
  return difficulties?.length
    ? {
        min: DIFFICULTIES.indexOf(difficulties[0]),
        max: DIFFICULTIES.indexOf(difficulties[difficulties.length - 1]),
      }
    : FULL_DIFFICULTY_RANGE
}

// The full range means "any difficulty", so it clears the filter.
export function fromDifficultyRange(range: LevelRange): Difficulty[] | undefined {
  const isFullRange =
    range.min === FULL_DIFFICULTY_RANGE.min && range.max === FULL_DIFFICULTY_RANGE.max
  return isFullRange ? undefined : DIFFICULTIES.slice(range.min, range.max + 1)
}

// How many exercises an option matches within the selected difficulty range:
// exercises outside the range don't count. Without a difficulty filter (or
// from a server that doesn't send byDifficulty) it's the plain total.
function countInDifficultyRange(
  option: FilterOption,
  difficulties: Difficulty[] | undefined,
): number {
  return difficulties?.length && option.byDifficulty
    ? difficulties.reduce((sum, level) => sum + (option.byDifficulty?.[level] ?? 0), 0)
    : option.count
}

// "Any", then each option with its count in the difficulty range. An option
// with nothing in range is shown with its 0 but can't be picked.
function toSelectOptions(
  options: FilterOption[] | undefined,
  difficulties: Difficulty[] | undefined,
  label: (value: string) => string,
): SelectOption[] {
  return [
    ANY_OPTION,
    ...(options ?? []).map((option) => {
      const count = countInDifficultyRange(option, difficulties)
      return {
        value: option.value,
        label: label(option.value),
        detail: String(count),
        disabled: count === 0,
      }
    }),
  ]
}

export function targetSelectOptions(
  options: FilterOptions | undefined,
  difficulties: Difficulty[] | undefined,
): SelectOption[] {
  return toSelectOptions(options?.targets, difficulties, toTitleCase)
}

export function equipmentSelectOptions(
  options: FilterOptions | undefined,
  difficulties: Difficulty[] | undefined,
): SelectOption[] {
  return toSelectOptions(
    options?.equipmentTypes,
    difficulties,
    (value) => EQUIPMENT_LABELS[value as EquipmentType] ?? toTitleCase(value),
  )
}

// Targets and equipment types differ per body part, so drop choices the new
// body part doesn't have. Difficulty applies to every body part and is kept.
export function keepFiltersOffered(
  filters: ExerciseFilters,
  options: FilterOptions | undefined,
): ExerciseFilters {
  const isOffered = (list: FilterOption[] | undefined, value: string) =>
    Boolean(list?.some((option) => option.value === value))
  const equipmentTypes = filters.equipmentTypes?.filter((type) =>
    isOffered(options?.equipmentTypes, type),
  )
  return {
    difficulties: filters.difficulties,
    target:
      filters.target && isOffered(options?.targets, filters.target)
        ? filters.target
        : undefined,
    equipmentTypes: equipmentTypes?.length ? equipmentTypes : undefined,
  }
}
