import express from 'express'
import { Queue } from 'bullmq'
import { z } from 'zod'

const router = express.Router()
const queue = new Queue('pipeline-jobs', {
  connection: { url: process.env.REDIS_URL }
})

// ─── Schema ───────────────────────────────────────────────────────────────────

const DimensionsSchema = z.object({
  frameWidthMm:   z.number().positive(),
  lensWidthMm:    z.number().positive(),
  lensHeightMm:   z.number().positive(),
  bridgeWidthMm:  z.number().positive(),
  templeLengthMm: z.number().positive(),
}).refine(
  d => d.frameWidthMm >= 2 * d.lensWidthMm + d.bridgeWidthMm,
  d => ({ message: `frameWidthMm (${d.frameWidthMm}) < lens span (${2 * d.lensWidthMm + d.bridgeWidthMm}) — impossible geometry` })
)

const LensSchema = z.object({
  tint:         z.enum(['clear', 'grey', 'brown', 'green', 'blue', 'rose']).optional(),
  tintStrength: z.number().min(0).max(1).optional(),
  transmission: z.number().min(0).max(1).optional(),
  rimStyle:     z.enum(['full-rim', 'semi-rimless', 'rimless', 'wire']).optional(),
  mirror:       z.boolean().optional(),
  mirrorColor:  z.enum(['silver', 'gold', 'blue', 'red']).optional(),
  arCoating:    z.boolean().optional(),
})

const FrameMetadataSchema = z.object({
  dimensions:  DimensionsSchema,
  bridgeType:  z.string().optional(),
  lens:        LensSchema.optional(),
})

const ClientPhotosSchema = z.object({
  front:    z.url(),
  left45:   z.url().optional(),
  right45:  z.url().optional(),
  closeup:  z.url().optional(),
})

const ModelParamsSchema = z.object({
  gender:      z.string().min(1),
  ethnicity:   z.string().min(1),
  age:         z.string().optional(),
  ageRange:    z.string().optional(),
  skinTone:    z.string().optional(),
  eyeColor:    z.string().optional(),
  hairStyle:   z.string().optional(),
  hairColor:   z.string().optional(),
  faceShape:   z.string().optional(),
  expression:  z.string().optional(),
  pose:        z.string().optional(),
  bodyType:    z.string().optional(),
  styling:     z.string().optional(),
  accessories: z.string().optional(),
})

const CameraParamsSchema = z.object({
  pose:         z.string().optional(),
  yaw:          z.number().optional(),
  pitch:        z.number().optional(),
  focalLength:  z.union([z.literal(35), z.literal(50), z.literal(85), z.literal(105)]).optional(),
  lighting:     z.string().optional(),
  filmGrain:    z.number().min(0).max(100).optional(),
  colorTemp:    z.string().optional(),
  depthOfField: z.string().optional(),
})

const SceneParamsSchema = z.object({
  environment:  z.string().optional(),
  background:   z.string().optional(),
  mood:         z.string().optional(),
  lighting:     z.string().optional(),
})

const GenerateJobSchema = z.object({
  skuId:          z.string().min(1),
  clientPhotos:   ClientPhotosSchema,
  frameMetadata:  FrameMetadataSchema,
  modelParams:    ModelParamsSchema,
  cameraParams:   CameraParamsSchema,
  sceneParams:    SceneParamsSchema,
  outputSettings: z.object({
    resolution: z.enum(['preview', '2K', '4K']),
    angles: z.array(z.enum(['front', 'three-quarter-left', 'three-quarter-right', 'profile-left'])).optional(),
  }),
  maxAttempts: z.number().int().min(1).max(5).optional(),
})

// ─── Route ────────────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const parsed = GenerateJobSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation failed',
      issues: parsed.error.issues.map(i => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    })
  }

  // Stamp userId from the verified token — never trust client-supplied userId
  const jobData = { ...parsed.data, userId: req.user.id }
  const job = await queue.add('generate', jobData)
  res.json({ jobId: job.id, status: 'queued', skuId: jobData.skuId })
})

// ─── Test multi-angle endpoint ────────────────────────────────────────────────
router.post('/test-angle', async (req, res) => {
  const { jobId, angle } = req.body;
  if (!jobId || !angle) return res.status(400).json({ error: 'jobId and angle required' });
  res.json({ status: 'queued', jobId, angle });
});

export default router
