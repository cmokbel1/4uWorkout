import { Router, Request, Response } from 'express'
import {
  getExercise,
  getExerciseImage,
  listBodyParts,
  listTargets,
  randomExercisesByBodyPart,
} from '../lib/exerciseStore'

const router = Router()

// One shown workout plus 10 "similar" ones. Never return a whole body part:
// the ExerciseDB licence (§13) forbids endpoints that allow bulk download.
const BODY_PART_SAMPLE_SIZE = 11

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

// GET /exercises/bodyPart/:bodyPart
router.get('/bodyPart/:bodyPart', async (req: Request, res: Response) => {
  try {
    const bodyPart = req.params.bodyPart.trim().toLowerCase()
    res.json(await randomExercisesByBodyPart(bodyPart, BODY_PART_SAMPLE_SIZE))
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
