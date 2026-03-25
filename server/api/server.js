import 'dotenv/config'
import express from 'express'
import generateRoute from './routes/generate.js'
import jobsRoute from './routes/jobs.js'
import { defaultLimiter, generateLimiter } from './middleware/rateLimit.js'
import { requireAuth } from './middleware/auth.js'

const app = express()
app.use(express.json())
app.use(defaultLimiter)

// Health check — no auth required
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// All API routes require a valid JWT
app.use('/api/generate', requireAuth, generateLimiter, generateRoute)
app.use('/api/jobs',     requireAuth, jobsRoute)

app.listen(process.env.PORT || 3000, () => {
  console.log(`API running on port ${process.env.PORT || 3000}`)
})
