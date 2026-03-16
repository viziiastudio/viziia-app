import 'dotenv/config'
import { Worker } from 'bullmq'
import { runViziiaV5Pipeline } from '../pipeline/index.js'

const worker = new Worker('pipeline-jobs', async (job) => {
  console.log(`Processing job ${job.id}`)
  console.log('Full job data:', JSON.stringify(job.data, null, 2))
  const result = await runViziiaV5Pipeline(job.data)
  return result
}, {
  connection: { url: process.env.REDIS_URL },
  concurrency: 3
})

worker.on('completed', job => console.log(`Job ${job.id} completed`))
worker.on('failed', (job, err) => console.error(`Job ${job.id} failed:`, err.message))
console.log('Worker running — waiting for jobs...')
