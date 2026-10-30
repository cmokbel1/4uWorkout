import { Router, Request, Response } from 'express'
import {
  DIFFICULTIES,
  Difficulty,
  EQUIPMENT_TYPES,
  EquipmentType,
  ExerciseFilters,
  emptyFilterOptions,
  filterOptionsByBodyPart,
  getExercise,
  getExerciseImage,
  listBodyParts,
  listTargets,
  randomExercisesByBodyPart,
} from '../lib/exerciseStore'

const router = Router()

// One shown workout plus 10 "similar" ones. Never return a whole body part:
// the ExerciseDB licence (§13) forbids endpoints that allow bulk download.
// Filters only narrow this sample; never add paging or "show all".
const BODY_PART_SAMPLE_SIZE = 11

// Reads the optional ?difficulty=&target=&equipmentType= query params.
// Returns an error message instead when a value is not a known option.
function parseFilters(query: Request['query']): ExerciseFilters | string {
  const { difficulty, target, equipmentType } = query
  const filters: ExerciseFilters = {}
  if (difficulty !== undefined) {
    const value = typeof difficulty === 'string' ? difficulty.trim().toLowerCase() : ''
    if (!DIFFICULTIES.includes(value as Difficulty)) {
      return `difficulty must be one of: ${DIFFICULTIES.join(', ')}`
    }
    filters.maxDifficulty = value as Difficulty
  }
  if (target !== undefined) {
    if (typeof target !== 'string' || !target.trim()) return 'target must be a single value'
    filters.target = target.trim().toLowerCase()
  }
  if (equipmentType !== undefined) {
    const values = typeof equipmentType === 'string'
      ? equipmentType.split(',').map((value) => value.trim().toLowerCase())
      : []
    if (!values.length || !values.every((value) => EQUIPMENT_TYPES.includes(value as EquipmentType))) {
      return `equipmentType must be a comma-separated list of: ${EQUIPMENT_TYPES.join(', ')}`
    }
    filters.equipmentTypes = values as EquipmentType[]
  }
  return filters
}

// GET /exercises/bodyPartList
router.get('/bodyPartList', async (_req: Request, res: Response) => {
  try {
    res.json(await listBodyParts())
  } catch (err) {
    console.error('[bodyPartList] error:', err instanceof Error ? err.message : err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /exercises/targetList
router.get('/targetList', async (_req: Request, res: Response) => {
  try {
    res.json(await listTargets())
  } catch (err) {
    console.error('[targetList] error:', err instanceof Error ? err.message : err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /exercises/exercise/:id
router.get('/exercise/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const [exercise, image] = await Promise.all([getExercise(id), getExerciseImage(id)])
    if (!exercise || !image) {
      res.status(404).json({ error: 'Exercise not found' })
      return
    }
    const gifUrl = `data:${image.contentType};base64,${image.image.toString('base64')}`
    res.json({ ...exercise, gifUrl })
  } catch (err) {
    console.error('[exercise] error:', err instanceof Error ? err.message : err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /exercises/filters            — every body part's options, keyed by body part
// GET /exercises/filters?bodyPart=  — one body part's options
router.get('/filters', async (req: Request, res: Response) => {
  try {
    const { bodyPart } = req.query
    if (bodyPart !== undefined && (typeof bodyPart !== 'string' || !bodyPart.trim())) {
      res.status(400).json({ error: 'bodyPart must be a single value' })
      return
    }
    const options = await filterOptionsByBodyPart()
    if (bodyPart === undefined) {
      res.json(options)
      return
    }
    res.json(options[bodyPart.trim().toLowerCase()] ?? emptyFilterOptions())
  } catch (err) {
    console.error('[filters] error:', err instanceof Error ? err.message : err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /exercises/bodyPart/:bodyPart?difficulty=&target=&equipmentType=
router.get('/bodyPart/:bodyPart', async (req: Request, res: Response) => {
  try {
    const bodyPart = req.params.bodyPart.trim().toLowerCase()
    const filters = parseFilters(req.query)
    if (typeof filters === 'string') {
      res.status(400).json({ error: filters })
      return
    }
    res.json(await randomExercisesByBodyPart(bodyPart, filters, BODY_PART_SAMPLE_SIZE))
  } catch (err) {
    console.error('[bodyPart] error:', err instanceof Error ? err.message : err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /exercises/image?exerciseId=
// Only one resolution (360) is stored, so `resolution` is accepted and ignored.
router.get('/image', async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.query as { exerciseId?: string }
    if (!exerciseId) {
      res.status(400).json({ error: 'exerciseId is required' })
      return
    }
    const image = await getExerciseImage(exerciseId)
    if (!image) {
      res.status(404).json({ error: 'Image not found' })
      return
    }
    res.setHeader('Content-Type', image.contentType)
    // Images only change on a re-import.
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.send(image.image)
  } catch (err) {
    console.error('[image] error:', err instanceof Error ? err.message : err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
