const express = require('express')
const { Queue } = require('bullmq')
const router = express.Router()
const queue = new Queue('pipeline-jobs', {
  connection: { url: process.env.REDIS_URL }
})
router.post('/', async (req, res) => {
  const { skuId } = req.body
  if (!skuId) return res.status(400).json({ error: 'skuId required' })
  const job = await queue.add('generate', { skuId, createdAt: new Date() })
  res.json({ jobId: job.id, status: 'queued', skuId })
})
module.exports = router
