import 'dotenv/config'
import express from 'express'
import generateRoute from './routes/generate.js'
import jobsRoute from './routes/jobs.js'
import { defaultLimiter, generateLimiter } from './middleware/rateLimit.js'
import { requireAuth as _requireAuth } from './middleware/auth.js'

const requireAuth = (req, res, next) => {
  if (process.env.BYPASS_AUTH === 'true') {
    req.user = { id: 'test-user', email: 'test@viziia.com' }
    return next()
  }
  return _requireAuth(req, res, next)
}

const app = express()
app.use(express.json())
app.use(defaultLimiter)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/generate', requireAuth, generateLimiter, generateRoute)
app.use('/api/jobs',     requireAuth, jobsRoute)

app.listen(process.env.PORT || 3000, () => {
  console.log(`API running on port ${process.env.PORT || 3000}`)
})
