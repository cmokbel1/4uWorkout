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

export async function randomExercisesByBodyPart(bodyPart: string, limit: number): Promise<ExerciseData[]> {
  const { rows } = await getPool().query<{ data: ExerciseData }>(
    'SELECT data FROM exercises WHERE body_part = $1 ORDER BY random() LIMIT $2',
    [bodyPart, limit],
  )
  return rows.map((row) => toListItem(row.data))
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
  return rows[0] && { contentType: rows[0].content_type, image: rows[0].image }
}
