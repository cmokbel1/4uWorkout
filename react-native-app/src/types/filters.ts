// Search filters for GET /exercises/bodyPart/:bodyPart, and the choices
// GET /exercises/filters reports for each body part.

// Easiest first.
export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

// Pro's taxonomy.equipmentCategory: the main kind of resistance, not every
// item an exercise needs.
export type EquipmentType =
  | "free_weight"
  | "bodyweight"
  | "cable"
  | "machine"
  | "accessory"
  | "band";

// The user's choices. An absent field means "any".
export interface ExerciseFilters {
  // Exact levels to include — a contiguous range from the difficulty slider.
  difficulties?: Difficulty[];
  target?: string;
  equipmentTypes?: EquipmentType[];
}

// One choice and how many exercises it matches on its own (not combined with
// other choices).
export interface FilterOption {
  value: string;
  count: number;
  // `count` split by difficulty (levels with none are left out). Optional: a
  // server from before this field was added doesn't send it.
  byDifficulty?: Partial<Record<Difficulty, number>>;
}

export interface FilterOptions {
  difficulties: FilterOption[];
  targets: FilterOption[];
  equipmentTypes: FilterOption[];
}

export type FilterOptionsByBodyPart = Record<string, FilterOptions>;
