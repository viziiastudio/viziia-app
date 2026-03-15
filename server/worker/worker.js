require('dotenv').config({ path: '../../.env' })
const { Worker } = require('bullmq')

const worker = new Worker('pipeline-jobs', async (job) => {
  console.log(`Processing job ${job.id}:`, job.data)
  return { status: 'done', jobId: job.id }
}, {
  connection: { url: process.env.REDIS_URL },
  concurrency: 3
})

worker.on('completed', job => console.log(`Job ${job.id} completed`))
worker.on('failed', (job, err) => console.error(`Job ${job.id} failed:`, err))
console.log('Worker running — waiting for jobs...')
