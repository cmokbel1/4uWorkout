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

type PublicRow = { public_id: string; data: ExerciseData }

// A list item as the API serves it: under its public id, never the delivered one.
const toPublicListItem = (row: PublicRow): ExerciseData => ({ ...toListItem(row.data), id: row.public_id })

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

// Easiest first.
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

// Pro's taxonomy.equipmentCategory: the main kind of resistance, not every item
// an exercise needs (a bodyweight dip still needs parallel bars).
export const EQUIPMENT_TYPES = ['free_weight', 'bodyweight', 'cable', 'machine', 'accessory', 'band'] as const
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number]

export type ExerciseFilters = {
  // Exact levels to include; the app sends a contiguous range from its slider.
  difficulties?: Difficulty[]
  target?: string
  equipmentTypes?: EquipmentType[]
}

export async function randomExercisesByBodyPart(
  bodyPart: string,
  filters: ExerciseFilters,
  limit: number,
): Promise<ExerciseData[]> {
  const { rows } = await getPool().query<PublicRow>(
    `SELECT public_id, data FROM exercises
     WHERE body_part = $1
       AND ($2::text[] IS NULL OR difficulty = ANY($2))
       AND ($3::text IS NULL OR target = $3)
       AND ($4::text[] IS NULL OR data->'taxonomy'->>'equipmentCategory' = ANY($4))
     ORDER BY random() LIMIT $5`,
    [bodyPart, filters.difficulties ?? null, filters.target ?? null, filters.equipmentTypes ?? null, limit],
  )
  return rows.map(toPublicListItem)
}

// A column lower-cased with every run of other characters as one space, the
// way queries and suggestions are normalised ("T-Bar" → "t bar"). Only ever
// called with a column name, never with input.
const normalised = (column: string) => `btrim(regexp_replace(lower(${column}), '[^a-z0-9]+', ' ', 'g'))`

// Exercises where every word appears somewhere in the name, aliases, target,
// body part or equipment, ignoring case. Words must be lower-case letters and
// digits only (the route checks), so they can't carry LIKE wildcards.
//
// Closest names come first: the name is the query, then starts with it, then
// contains it as whole words, then holds every word, then name and aliases
// do; the rest only match through target, body part or equipment. Random
// within each rank, so repeating a search (Shuffle) can bring a new set below
// the best matches. An exercise whose target, body part or equipment is the
// whole query (a suggestion pill, e.g. "chest") ranks first too, so browsing a
// category shows that category: "chest-supported row" isn't a "chest" match.
export async function randomExercisesByKeywords(words: string[], limit: number): Promise<ExerciseData[]> {
  const { rows } = await getPool().query<PublicRow>(
    `SELECT public_id, data FROM exercises
     WHERE lower(concat_ws(' ', name, target, body_part, equipment, data->>'aliases')) LIKE ALL ($1::text[])
     ORDER BY
       CASE
         WHEN $2::text IN (${normalised('target')}, ${normalised('body_part')}, ${normalised('equipment')}) THEN 0
         WHEN ${normalised('name')} = $2 THEN 0
         WHEN ${normalised('name')} || ' ' LIKE $2 || ' %' THEN 1
         WHEN ' ' || ${normalised('name')} || ' ' LIKE '% ' || $2 || ' %' THEN 2
         WHEN lower(name) LIKE ALL ($1::text[]) THEN 3
         WHEN lower(concat_ws(' ', name, data->>'aliases')) LIKE ALL ($1::text[]) THEN 4
         ELSE 5
       END,
       random()
     LIMIT $3`,
    [words.map((word) => `%${word}%`), words.join(' '), limit],
  )
  return rows.map(toPublicListItem)
}

// Up to `limit` exercises like the one with this public id, to fill out a
// search that found fewer than a full sample: its similar exercises, then its
// substitutions, best score first; if that's still short, random ones with the
// same target and body part. Never the exercise itself or one in
// `excludePublicIds` (the matches already being returned). Each is marked
// `similar: true` so the app can list them apart from the matches. List
// fields only, like the rest of /search.
export async function similarExercisesFor(
  publicId: string,
  excludePublicIds: string[],
  limit: number,
): Promise<ExerciseData[]> {
  // links ranks every linked id: similar exercises before substitutions, best
  // score first, an id in both lists keeping its better place. Exercises with
  // no rank are the same-target fallback, in random order after the links.
  const { rows } = await getPool().query<PublicRow>(
    `WITH source AS (
       SELECT id, target, body_part, data FROM exercises WHERE public_id = $1
     ),
     links AS (
       SELECT id, min(rank) AS rank
       FROM (
         SELECT relation->>'id' AS id,
                row_number() OVER (
                  ORDER BY list, coalesce((relation->>'score')::numeric, 0) DESC, position
                ) AS rank
         FROM source,
              LATERAL (VALUES
                (1, coalesce(data->'similarExercises', '[]')),
                (2, coalesce(data->'substitutions', '[]'))
              ) AS lists (list, relations),
              jsonb_array_elements(relations) WITH ORDINALITY AS elements (relation, position)
       ) AS ranked
       GROUP BY id
     )
     SELECT exercises.public_id, exercises.data
     FROM source
     JOIN exercises ON exercises.id <> source.id
     LEFT JOIN links ON links.id = exercises.id
     WHERE exercises.public_id <> ALL($2)
       AND (links.id IS NOT NULL OR (exercises.target = source.target AND exercises.body_part = source.body_part))
     ORDER BY links.rank NULLS LAST, random()
     LIMIT $3`,
    [publicId, excludePublicIds, limit],
  )
  return rows.map((row) => ({ ...toPublicListItem(row), similar: true }))
}

type Suggestion = { value: string; count: number }

type SearchSuggestions = {
  equipment: Suggestion[]
  bodyParts: Suggestion[]
  targets: Suggestion[]
}

const SUGGESTIONS_PER_GROUP = 10

// The most common equipment, body parts and targets, as words a search
// accepts: anything but letters and digits becomes a space ("pull-up" →
// "pull up"), and values shorter than a search (3 characters) are left out.
export async function searchSuggestions(): Promise<SearchSuggestions> {
  const { rows } = await getPool().query<{ grp: keyof SearchSuggestions; value: string; count: number }>(
    `SELECT 'equipment' AS grp, equipment AS value, count(*)::int AS count FROM exercises GROUP BY equipment
     UNION ALL
     SELECT 'bodyParts', body_part, count(*)::int FROM exercises GROUP BY body_part
     UNION ALL
     SELECT 'targets', target, count(*)::int FROM exercises GROUP BY target`,
  )
  const suggestions: SearchSuggestions = { equipment: [], bodyParts: [], targets: [] }
  for (const { grp, value, count } of rows) {
    const word = value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    if (word.length < 3) continue
    const list = suggestions[grp]
    const existing = list.find((suggestion) => suggestion.value === word)
    if (existing) existing.count += count
    else list.push({ value: word, count })
  }
  for (const list of Object.values(suggestions)) {
    list.sort((a, b) => b.count - a.count)
    list.splice(SUGGESTIONS_PER_GROUP)
  }
  return suggestions
}

type FilterOption = {
  value: string
  count: number
  // The same count split by difficulty (levels with none are left out), so the
  // app can count only what falls inside the user's difficulty range.
  byDifficulty: Partial<Record<Difficulty, number>>
}

type FilterOptions = {
  difficulties: FilterOption[]
  targets: FilterOption[]
  equipmentTypes: FilterOption[]
}

// The choices that exist for every body part, keyed by body part, with how
// many exercises each matches on its own — in total and per difficulty. Counts
// are per choice, not for combinations of choices (apart from the difficulty
// split). Small enough (a few KB) for the client to load once.
export async function filterOptionsByBodyPart(): Promise<Record<string, FilterOptions>> {
  const { rows } = await getPool().query<{
    body_part: string
    facet: keyof FilterOptions
    value: string
    difficulty: Difficulty
    count: number
  }>(
    `SELECT body_part, 'difficulties' AS facet, difficulty AS value, difficulty, count(*)::int AS count
       FROM exercises GROUP BY body_part, difficulty
     UNION ALL
     SELECT body_part, 'targets', target, difficulty, count(*)::int
       FROM exercises GROUP BY body_part, target, difficulty
     UNION ALL
     SELECT body_part, 'equipmentTypes', data->'taxonomy'->>'equipmentCategory', difficulty, count(*)::int
       FROM exercises GROUP BY body_part, data->'taxonomy'->>'equipmentCategory', difficulty`,
  )
  const options: Record<string, FilterOptions> = {}
  for (const { body_part, facet, value, difficulty, count } of rows) {
    options[body_part] ??= { difficulties: [], targets: [], equipmentTypes: [] }
    const list = options[body_part][facet]
    let option = list.find((existing) => existing.value === value)
    if (!option) {
      option = { value, count: 0, byDifficulty: {} }
      list.push(option)
    }
    option.count += count
    option.byDifficulty[difficulty] = count
  }
  const rank = (option: FilterOption) => DIFFICULTIES.indexOf(option.value as Difficulty)
  for (const bodyPartOptions of Object.values(options)) {
    bodyPartOptions.difficulties.sort((a, b) => rank(a) - rank(b))
    bodyPartOptions.targets.sort((a, b) => b.count - a.count)
    bodyPartOptions.equipmentTypes.sort((a, b) => b.count - a.count)
  }
  return options
}

// Pro fields that link to other exercises by their delivered id.
const RELATION_FIELDS = ['similarExercises', 'substitutions', 'progressions', 'regressions'] as const
type Relation = { id: string } & Record<string, unknown>

// The full record, with its own id and every relation's id swapped for public
// ids. A relation whose exercise isn't in the table is dropped rather than
// sent with its delivered id.
export async function getExercise(publicId: string): Promise<ExerciseData | undefined> {
  const { rows } = await getPool().query<PublicRow>(
    'SELECT public_id, data FROM exercises WHERE public_id = $1',
    [publicId],
  )
  const row = rows[0]
  if (!row) return undefined

  const relationsOf = (field: (typeof RELATION_FIELDS)[number]) => row.data[field] as Relation[] | undefined
  const linkedIds = RELATION_FIELDS.flatMap((field) => (relationsOf(field) ?? []).map((relation) => relation.id))
  const { rows: idRows } = linkedIds.length
    ? await getPool().query<{ id: string; public_id: string }>(
        'SELECT id, public_id FROM exercises WHERE id = ANY($1)',
        [linkedIds],
      )
    : { rows: [] }
  const publicIds = new Map(idRows.map((idRow) => [idRow.id, idRow.public_id]))

  const exercise: ExerciseData = { ...row.data, id: row.public_id }
  for (const field of RELATION_FIELDS) {
    const relations = relationsOf(field)
    if (!relations) continue
    exercise[field] = relations
      .filter((relation) => publicIds.has(relation.id))
      .map((relation) => ({ ...relation, id: publicIds.get(relation.id) }))
  }
  return exercise
}

export async function getExerciseImage(publicId: string): Promise<{ contentType: string; image: Buffer } | undefined> {
  const { rows } = await getPool().query<{ content_type: string; image: Buffer }>(
    `SELECT images.content_type, images.image
     FROM exercise_images images JOIN exercises ON exercises.id = images.exercise_id
     WHERE exercises.public_id = $1`,
    [publicId],
  )
  return rows[0] ? { contentType: rows[0].content_type, image: rows[0].image } : undefined
}
