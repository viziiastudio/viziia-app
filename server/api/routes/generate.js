import express from 'express'
import { Queue } from 'bullmq'

const router = express.Router()
const queue = new Queue('pipeline-jobs', {
  connection: { url: process.env.REDIS_URL }
})

router.post('/', async (req, res) => {
  const jobData = req.body
  if (!jobData.skuId) return res.status(400).json({ error: 'skuId required' })
  const job = await queue.add('generate', jobData)
  res.json({ jobId: job.id, status: 'queued', skuId: jobData.skuId })
})

export default router
