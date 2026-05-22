import { Router, Request, Response } from 'express'
import { exerciseApiFetch } from '../lib/exerciseApi'

const router = Router()

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
    const response = await exerciseApiFetch(
      `/image?resolution=${resolution}&exerciseId=${encodeURIComponent(exerciseId)}`
    )
    if (!response.ok) {
      console.error(`[image] upstream failed with status ${response.status} for exerciseId="${exerciseId}"`)
      res.status(response.status).json({ error: 'Upstream request failed' })
      return
    }
    const contentType = response.headers.get('content-type') ?? 'image/jpeg'
    res.setHeader('Content-Type', contentType)
    const buffer = await response.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (err) {
    console.error('[image] error:', err instanceof Error ? err.message : err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
