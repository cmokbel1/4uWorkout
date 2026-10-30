// One-off import of the licensed ExerciseDB Pro package into Postgres.
//
//   npm run import:pro -- <path/to/exerciseData_pro.json> <path/to/gif/dir>
//
// The package must stay outside this repo (public repo, EULA §12). Re-running
// is safe: rows are upserted by id.
import { readFileSync } from 'fs'
import { join } from 'path'
import { getPool } from '../lib/db'

type ProExercise = {
  id: string
  name: string
  bodyPart: string
  target: string
  equipment: string
  difficulty: string
  category: string
  requiredEquipment: string[]
}

async function main(): Promise<void> {
  const [jsonPath, gifDir] = process.argv.slice(2)
  if (!jsonPath || !gifDir) throw new Error('usage: importPro <exerciseData_pro.json> <gif dir>')

  const exercises = JSON.parse(readFileSync(jsonPath, 'utf8')) as ProExercise[]
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    await client.query(readFileSync(join(__dirname, '../../src/db/schema.sql'), 'utf8'))
    for (const exercise of exercises) {
      await client.query(
        `INSERT INTO exercises (id, source, name, body_part, target, equipment, difficulty, category, required_equipment, data)
         VALUES ($1, 'exercisedb_pro', $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET source = EXCLUDED.source, name = EXCLUDED.name,
           body_part = EXCLUDED.body_part, target = EXCLUDED.target, equipment = EXCLUDED.equipment,
           difficulty = EXCLUDED.difficulty, category = EXCLUDED.category,
           required_equipment = EXCLUDED.required_equipment, data = EXCLUDED.data`,
        [exercise.id, exercise.name, exercise.bodyPart, exercise.target, exercise.equipment, exercise.difficulty, exercise.category, exercise.requiredEquipment, exercise],
      )
      await client.query(
        `INSERT INTO exercise_images (exercise_id, content_type, image) VALUES ($1, 'image/gif', $2)
         ON CONFLICT (exercise_id) DO UPDATE SET content_type = EXCLUDED.content_type, image = EXCLUDED.image`,
        [exercise.id, readFileSync(join(gifDir, `${exercise.id}.gif`))],
      )
    }
    await client.query('COMMIT')
    console.log(`Imported ${exercises.length} exercises and images`)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
    await getPool().end()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
