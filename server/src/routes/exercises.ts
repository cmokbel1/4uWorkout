import { Router, Request, Response } from 'express'
import { exerciseApiFetch, rateLimitInfo } from '../lib/exerciseApi'

const router = Router()

const imageCache = new Map<string, { buffer: Buffer; contentType: string }>()
const exerciseCache = new Map<string, Record<string, unknown>>()

// The ExerciseDB BASIC plan caps `limit` at 10 per request, so the full list
// for a body part is gathered by paging with `offset`. Aggregated results are
// cached per body part to avoid re-paging on every search. Randomization
// happens client-side, so caching does not reduce variety.
type BodyPartEntry = {
  exercises: Record<string, unknown>[]
  // Set only when an upstream error cut the page loop short. A complete entry
  // has no `failure` and lives for the process lifetime; an incomplete one
  // serves whatever was gathered until `expiresAt`, then gets re-paged. Without
  // this, one rate-limited search would pin a truncated list in the cache
  // forever, silently shrinking the pool of exercises the client can pick from.
  failure?: { status: number; expiresAt: number }
}

const bodyPartCache = new Map<string, BodyPartEntry>()
const BODY_PART_PAGE_SIZE = 10 // free-tier max results per request
// Safety backstop (~400 exercises). Well clear of the largest real body part,
// but low enough that a runaway loop cannot spend a four-figure request budget.
const BODY_PART_MAX_PAGES = 40
// How long an incomplete entry serves before we try upstream again. Doubles as
// a negative cache: when a body part failed with nothing gathered, repeat
// searches are refused from memory rather than re-firing the whole page burst.
const BODY_PART_RETRY_MS = 5 * 60_000

function isEntryUsable(entry: BodyPartEntry): boolean {
  return !entry.failure || Date.now() < entry.failure.expiresAt
}

// GET /exercises/bodyPartList
router.get('/bodyPartList', async (_req: Request, res: Response) => {
  try {
    const response = await exerciseApiFetch('/exercises/bodyPartList')
    if (!response.ok) {
      console.error(`[bodyPartList] upstream failed with status ${response.status}${rateLimitInfo(response)}`)
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
      console.error(`[targetList] upstream failed with status ${response.status}${rateLimitInfo(response)}`)
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
      console.error(`[exercise] upstream metadata failed with status ${metaResponse.status} for id="${id}"${rateLimitInfo(metaResponse)}`)
      res.status(metaResponse.status).json({ error: 'Upstream request failed' })
      return
    }
    const exercise = await metaResponse.json() as Record<string, unknown>

    const imageResponse = await exerciseApiFetch(`/image?resolution=720&exerciseId=${encodeURIComponent(id)}`)
    if (!imageResponse.ok) {
      console.error(`[exercise] upstream image failed with status ${imageResponse.status} for id="${id}"${rateLimitInfo(imageResponse)}`)
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
    if (cached && isEntryUsable(cached)) {
      // A failed entry that gathered nothing is a negative cache — refuse from
      // memory instead of re-firing the page burst at an upstream that just
      // rate-limited us.
      if (cached.failure && cached.exercises.length === 0) {
        res.status(cached.failure.status).json({ error: 'Upstream request failed' })
        return
      }
      res.json(cached.exercises)
      return
    }

    const seen = new Set<string>()
    const all: Record<string, unknown>[] = []
    let failure: BodyPartEntry['failure']
    for (let page = 0; page < BODY_PART_MAX_PAGES; page++) {
      const offset = page * BODY_PART_PAGE_SIZE
      const response = await exerciseApiFetch(
        `/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=${BODY_PART_PAGE_SIZE}&offset=${offset}`,
      )
      if (!response.ok) {
        console.error(`[bodyPart] upstream failed with status ${response.status} for bodyPart="${bodyPart}" offset=${offset}${rateLimitInfo(response)}`)
        failure = { status: response.status, expiresAt: Date.now() + BODY_PART_RETRY_MS }
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

    bodyPartCache.set(cacheKey, { exercises: all, failure })
    // Surface the error only if we have nothing; otherwise serve what we gathered.
    if (failure && all.length === 0) {
      res.status(failure.status).json({ error: 'Upstream request failed' })
      return
    }
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
      console.error(`[image] upstream failed with status ${response.status} for exerciseId="${exerciseId}"${rateLimitInfo(response)}`)
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
