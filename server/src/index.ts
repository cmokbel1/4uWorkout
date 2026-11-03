import express from 'express'
import rateLimit from 'express-rate-limit'
import { appCheckMiddleware } from './lib/appCheck'
import { getPool } from './lib/db'
import exerciseRoutes from './routes/exercises'

const app = express()
const PORT = process.env.PORT || 3000

// Exercise ids are predictable, so without a limit a script could walk them
// and download the whole licensed catalogue (ExerciseDB EULA §13). 100 per
// 15 minutes is far above what one person tapping through the app uses, and
// stretches a full scrape out to hours. App Platform puts the client's address
// in `do-connecting-ip`; req.ip would be its load balancer.
const exerciseLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.get('do-connecting-ip') ?? req.ip ?? 'unknown',
  message: { error: 'Too many requests' },
})

app.use(express.json())
// The limiter runs first, so a flood of bad tokens is cut off before each one
// is verified.
app.use('/exercises', exerciseLimiter, appCheckMiddleware, exerciseRoutes)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// App Platform sends SIGTERM on every deploy. Stop accepting connections, let
// in-flight requests finish, then close the database pool so the process
// exits on its own.
process.on('SIGTERM', () => {
  server.close(() => {
    void getPool().end()
  })
})
