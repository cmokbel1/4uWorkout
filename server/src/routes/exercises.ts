import { Router, Request, Response } from 'express'
import { exerciseApiFetch } from '../lib/exerciseApi'

const router = Router()

const imageCache = new Map<string, { buffer: Buffer; contentType: string }>()
const exerciseCache = new Map<string, Record<string, unknown>>()

// GET /exercises/bodyPartList
router.get('/bodyPartList', async (_req: Request, res: Response) => {
  try {
    const response = await exerciseApiFetch('/exercises/bodyPartList')
    if (!response.ok) {
      console.error(`[bodyPartList] upstream failed with status ${response.status}`)
      res.status(response.status).json({ error: 'Upstream request failed' })
      return
    }
    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.error('[bodyPartList] error:', err instanceof Error ? err.message : err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /exercises/targetList
router.get('/targetList', async (_req: Request, res: Response) => {
  try {
    const response = await exerciseApiFetch('/exercises/targetList')
    if (!response.ok) {
      console.error(`[targetList] upstream failed with status ${response.status}`)
      res.status(response.status).json({ error: 'Upstream request failed' })
      return
    }
    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.error('[targetList] error:', err instanceof Error ? err.message : err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /exercises/exercise/:id
router.get('/exercise/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const cached = exerciseCache.get(id)
    if (cached) {
      res.json(cached)
      return
    }

    const metaResponse = await exerciseApiFetch(`/exercises/exercise/${encodeURIComponent(id)}`)
    if (!metaResponse.ok) {
      console.error(`[exercise] upstream metadata failed with status ${metaResponse.status} for id="${id}"`)
      res.status(metaResponse.status).json({ error: 'Upstream request failed' })
      return
    }
    const exercise = await metaResponse.json() as Record<string, unknown>

    const imageResponse = await exerciseApiFetch(`/image?resolution=720&exerciseId=${encodeURIComponent(id)}`)
    if (!imageResponse.ok) {
      console.error(`[exercise] upstream image failed with status ${imageResponse.status} for id="${id}"`)
      res.status(imageResponse.status).json({ error: 'Upstream image request failed' })
      return
    }
    const contentType = imageResponse.headers.get('content-type') ?? 'image/jpeg'
    const buffer = Buffer.from(await imageResponse.arrayBuffer())
    const gifUrl = `data:${contentType};base64,${buffer.toString('base64')}`

    const entry = { ...exercise, gifUrl }
    exerciseCache.set(id, entry)
    res.json(entry)
  } catch (err) {
    console.error('[exercise] error:', err instanceof Error ? err.message : err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /exercises/bodyPart/:bodyPart
router.get('/bodyPart/:bodyPart', async (req: Request, res: Response) => {
  try {
    const { bodyPart } = req.params
    const response = await exerciseApiFetch(`/exercises/bodyPart/${encodeURIComponent(bodyPart)}`)
    if (!response.ok) {
      console.error(`[bodyPart] upstream failed with status ${response.status} for bodyPart="${bodyPart}"`)
      res.status(response.status).json({ error: 'Upstream request failed' })
      return
    }
    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.error('[bodyPart] error:', err instanceof Error ? err.message : err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /exercises/image?exerciseId=&resolution=
router.get('/image', async (req: Request, res: Response) => {
  try {
    const { exerciseId, resolution = '720' } = req.query as { exerciseId?: string; resolution?: string }
    if (!exerciseId) {
      res.status(400).json({ error: 'exerciseId is required' })
      return
    }

    const cached = imageCache.get(exerciseId)
    if (cached) {
      res.setHeader("Content-Type", cached.contentType)
      res.send(cached.buffer)
      return
    }

    const response = await exerciseApiFetch(
      `/image?resolution=${resolution}&exerciseId=${encodeURIComponent(exerciseId)}`
    )
    if (!response.ok) {
      console.error(`[image] upstream failed with status ${response.status} for exerciseId="${exerciseId}"`)
      res.status(response.status).json({ error: 'Upstream request failed' })
      return
    }
    const contentType = response.headers.get('content-type') ?? 'image/jpeg'
    const buffer = Buffer.from(await response.arrayBuffer())
    imageCache.set(exerciseId, { buffer, contentType })
    res.setHeader('Content-Type', contentType)
    res.send(buffer)
  } catch (err) {
    console.error('[image] error:', err instanceof Error ? err.message : err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
