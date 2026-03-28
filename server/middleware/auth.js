import { jwtVerify, createRemoteJWKSet } from 'jose'

const JWKS_URI = process.env.JWKS_URI
const JWT_ISSUER = process.env.JWT_ISSUER
const JWT_AUDIENCE = process.env.JWT_AUDIENCE

// Lazy-initialised so the module can load even before env vars are validated
let jwks

function getJWKS() {
  if (!JWKS_URI) throw new Error('Missing required env var: JWKS_URI')
  jwks ??= createRemoteJWKSet(new URL(JWKS_URI))
  return jwks
}

/**
 * requireAuth — verifies a signed JWT Bearer token and sets req.user.
 *
 * Sets req.user = { id, email, ...claims } on success.
 * Returns 401 on missing/invalid token, never calls next() on failure.
 */
export async function requireAuth(req, res, next) {
  // BYPASS_AUTH=true for testing without Clerk
  if (process.env.BYPASS_AUTH === 'true') {
    req.user = { id: 'test-user', email: 'test@viziia.com' }
    return next()
  }

  const authHeader = req.headers['authorization'] ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' })
  }

  const token = authHeader.slice(7)

  try {
    const { payload } = await jwtVerify(token, getJWKS(), {
      issuer:   JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })

    // Normalise: support both `sub` (standard) and `userId` (legacy) claims
    const userId = payload.sub ?? payload.userId
    if (!userId) {
      return res.status(401).json({ error: 'Token missing subject claim' })
    }

    req.user = { id: userId, email: payload.email, ...payload }
    next()
  } catch (err) {
    // Distinguish expired vs. invalid so clients can handle refresh
    const expired = err.code === 'ERR_JWT_EXPIRED'
    res.status(401).json({ error: expired ? 'Token expired' : 'Invalid token' })
  }
}
