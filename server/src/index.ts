import express from 'express'
import exerciseRoutes, { warmBodyPartCache } from './routes/exercises'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use('/exercises', exerciseRoutes)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  // Fire and forget — the server serves traffic while this runs, and every
  // upstream call it makes is paced by exerciseApiFetch.
  void warmBodyPartCache()
})
