import 'dotenv/config'
import express from 'express'
import generateRoute from './routes/generate.js'

const app = express()
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/generate', generateRoute)

app.listen(process.env.PORT || 3000, () => {
  console.log(`API running on port ${process.env.PORT || 3000}`)
})
