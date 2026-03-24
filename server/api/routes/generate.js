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
  bridgeType:  z.string(),
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
  ageRange:    z.string().min(1),
  skinTone:    z.string().min(1),
  eyeColor:    z.string().min(1),
  hairStyle:   z.string().min(1),
  hairColor:   z.string().min(1),
  faceShape:   z.string().min(1),
  expression:  z.string().min(1),
  pose:        z.string().min(1),
  bodyType:    z.string().min(1),
  styling:     z.string().min(1),
  accessories: z.string().min(1),
})

const CameraParamsSchema = z.object({
  focalLength:  z.union([z.literal(35), z.literal(50), z.literal(85), z.literal(105)]),
  lighting:     z.string().min(1),
  filmGrain:    z.number().min(0).max(100),
  colorTemp:    z.string().min(1),
  depthOfField: z.string().min(1),
})

const SceneParamsSchema = z.object({
  environment: z.string().min(1),
  mood:        z.string().min(1),
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

export default router
