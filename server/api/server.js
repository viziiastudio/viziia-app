require('dotenv').config({ path: '../.env' })
const express = require('express')
const app = express()
app.use(express.json())
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
app.use('/api/generate', require('./routes/generate'))
app.listen(process.env.PORT || 3000, () => {
  console.log(`API running on port ${process.env.PORT || 3000}`)
})
