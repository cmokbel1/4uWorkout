import express from 'express'
import exerciseRoutes from './routes/exercises'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use('/exercises', exerciseRoutes)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
