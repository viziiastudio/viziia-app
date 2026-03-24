import { rateLimit } from 'express-rate-limit'

/**
 * Strict limiter for the generation endpoint.
 * Each job hits multiple paid APIs (~$0.075/image) — cap burst abuse hard.
 */
export const generateLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  limit: 10,                 // 10 jobs per IP per minute
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many generation requests — please wait before retrying.' },
})

/**
 * General limiter for all other API routes.
 */
export const defaultLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests — please slow down.' },
})
