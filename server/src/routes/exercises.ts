import { Router, Request, Response } from 'express'
import { exerciseApiFetch } from '../lib/exerciseApi'

const router = Router()

const imageCache = new Map<string, { buffer: Buffer; contentType: string }>()
const exerciseCache = new Map<string, Record<string, unknown>>()

// The ExerciseDB BASIC plan caps `limit` at 10 per request, so the full list
// for a body part is gathered by paging with `offset`. Aggregated results are
// cached per body part for the process lifetime to avoid re-paging on every
// search. Randomization happens client-side, so caching does not reduce variety.
const bodyPartCache = new Map<string, Record<string, unknown>[]>()
const BODY_PART_PAGE_SIZE = 10 // free-tier max results per request
const BODY_PART_MAX_PAGES = 100 // safety backstop (~1000 exercises)

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
    const cacheKey = bodyPart.toLowerCase()

    const cached = bodyPartCache.get(cacheKey)
    if (cached) {
      res.json(cached)
      return
    }

    const seen = new Set<string>()
    const all: Record<string, unknown>[] = []
    for (let page = 0; page < BODY_PART_MAX_PAGES; page++) {
      const offset = page * BODY_PART_PAGE_SIZE
      const response = await exerciseApiFetch(
        `/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=${BODY_PART_PAGE_SIZE}&offset=${offset}`,
      )
      if (!response.ok) {
        console.error(`[bodyPart] upstream failed with status ${response.status} for bodyPart="${bodyPart}" offset=${offset}`)
        // Surface the error only if we have nothing; otherwise serve what we gathered.
        if (all.length === 0) {
          res.status(response.status).json({ error: 'Upstream request failed' })
          return
        }
        break
      }
      const pageData = (await response.json()) as Record<string, unknown>[]
      let added = 0
      for (const exercise of pageData) {
        const id = String(exercise.id)
        if (!seen.has(id)) {
          seen.add(id)
          all.push(exercise)
          added++
        }
      }
      // Last page (short read) or offset not honored (no new items) — stop.
      if (pageData.length < BODY_PART_PAGE_SIZE || added === 0) break
    }

    bodyPartCache.set(cacheKey, all)
    res.json(all)
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
