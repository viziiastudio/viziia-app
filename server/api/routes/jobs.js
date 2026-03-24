import express from 'express'
import { Queue } from 'bullmq'

const router = express.Router()
const queue = new Queue('pipeline-jobs', {
  connection: { url: process.env.REDIS_URL }
})

/**
 * GET /api/jobs/:jobId
 *
 * Returns the status and result of a pipeline job.
 * IDOR guard: the job's userId must match the authenticated user.
 * Returning 404 (not 403) on mismatch avoids leaking that the job exists.
 */
router.get('/:jobId', async (req, res) => {
  const job = await queue.getJob(req.params.jobId)

  // Job not found
  if (!job) {
    return res.status(404).json({ error: 'Job not found' })
  }

  // IDOR check — always 404, never 403 (don't confirm existence to other users)
  if (job.data.userId !== req.user.id) {
    return res.status(404).json({ error: 'Job not found' })
  }

  const state  = await job.getState()
  const failed = state === 'failed'

  res.json({
    jobId:      job.id,
    status:     state,
    skuId:      job.data.skuId,
    createdAt:  new Date(job.timestamp).toISOString(),
    result:     failed ? null : (job.returnvalue ?? null),
    error:      failed ? job.failedReason : null,
  })
})

export default router
