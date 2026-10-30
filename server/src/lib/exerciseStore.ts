import { getPool } from './db'

type ExerciseData = Record<string, unknown>

// The fields the RapidAPI list endpoint used to return. List responses are
// limited to these; the Pro additions (taxonomy, equipment lists,
// relationships) are only served one exercise at a time from getExercise.
const LIST_FIELDS = [
  'bodyPart', 'equipment', 'id', 'name', 'target', 'secondaryMuscles',
  'instructions', 'description', 'difficulty', 'category',
] as const

// A field missing from a record comes out undefined and is dropped from the
// JSON; the client must treat absent fields as unknown. (Every Pro record has
// all ten, so this only matters for exercises we add ourselves.)
function toListItem(data: ExerciseData): ExerciseData {
  const item: ExerciseData = {}
  for (const field of LIST_FIELDS) item[field] = data[field]
  return item
}

export async function listBodyParts(): Promise<string[]> {
  const { rows } = await getPool().query<{ body_part: string }>(
    'SELECT DISTINCT body_part FROM exercises ORDER BY body_part',
  )
  return rows.map((row) => row.body_part)
}

export async function listTargets(): Promise<string[]> {
  const { rows } = await getPool().query<{ target: string }>(
    'SELECT DISTINCT target FROM exercises ORDER BY target',
  )
  return rows.map((row) => row.target)
}

// Easiest first; a difficulty filter means "up to and including" that level.
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

// Pro's taxonomy.equipmentCategory: the main kind of resistance, not every item
// an exercise needs (a bodyweight dip still needs parallel bars).
export const EQUIPMENT_TYPES = ['free_weight', 'bodyweight', 'cable', 'machine', 'accessory', 'band'] as const
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number]

export type ExerciseFilters = {
  maxDifficulty?: Difficulty
  target?: string
  equipmentTypes?: EquipmentType[]
}

export async function randomExercisesByBodyPart(
  bodyPart: string,
  filters: ExerciseFilters,
  limit: number,
): Promise<ExerciseData[]> {
  const difficulties = filters.maxDifficulty
    ? DIFFICULTIES.slice(0, DIFFICULTIES.indexOf(filters.maxDifficulty) + 1)
    : null
  const { rows } = await getPool().query<{ data: ExerciseData }>(
    `SELECT data FROM exercises
     WHERE body_part = $1
       AND ($2::text[] IS NULL OR difficulty = ANY($2))
       AND ($3::text IS NULL OR target = $3)
       AND ($4::text[] IS NULL OR data->'taxonomy'->>'equipmentCategory' = ANY($4))
     ORDER BY random() LIMIT $5`,
    [bodyPart, difficulties, filters.target ?? null, filters.equipmentTypes ?? null, limit],
  )
  return rows.map((row) => toListItem(row.data))
}

type FilterOption = { value: string; count: number }

type FilterOptions = {
  difficulties: FilterOption[]
  targets: FilterOption[]
  equipmentTypes: FilterOption[]
}

// The choices that exist for every body part, keyed by body part, with how
// many exercises each matches on its own. Counts are per choice, not for
// combinations of choices. Small enough (a few KB) for the client to load once.
export async function filterOptionsByBodyPart(): Promise<Record<string, FilterOptions>> {
  const { rows } = await getPool().query<{
    body_part: string
    facet: keyof FilterOptions
    value: string
    count: number
  }>(
    `SELECT body_part, 'difficulties' AS facet, difficulty AS value, count(*)::int AS count
       FROM exercises GROUP BY body_part, difficulty
     UNION ALL
     SELECT body_part, 'targets', target, count(*)::int
       FROM exercises GROUP BY body_part, target
     UNION ALL
     SELECT body_part, 'equipmentTypes', data->'taxonomy'->>'equipmentCategory', count(*)::int
       FROM exercises GROUP BY body_part, data->'taxonomy'->>'equipmentCategory'
     ORDER BY body_part, count DESC`,
  )
  const options: Record<string, FilterOptions> = {}
  for (const { body_part, facet, value, count } of rows) {
    options[body_part] ??= { difficulties: [], targets: [], equipmentTypes: [] }
    options[body_part][facet].push({ value, count })
  }
  const rank = (option: FilterOption) => DIFFICULTIES.indexOf(option.value as Difficulty)
  for (const bodyPartOptions of Object.values(options)) {
    bodyPartOptions.difficulties.sort((a, b) => rank(a) - rank(b))
  }
  return options
}

export async function getExercise(id: string): Promise<ExerciseData | undefined> {
  const { rows } = await getPool().query<{ data: ExerciseData }>(
    'SELECT data FROM exercises WHERE id = $1',
    [id],
  )
  return rows[0]?.data
}

export async function getExerciseImage(id: string): Promise<{ contentType: string; image: Buffer } | undefined> {
  const { rows } = await getPool().query<{ content_type: string; image: Buffer }>(
    'SELECT content_type, image FROM exercise_images WHERE exercise_id = $1',
    [id],
  )
  return rows[0] ? { contentType: rows[0].content_type, image: rows[0].image } : undefined
}
