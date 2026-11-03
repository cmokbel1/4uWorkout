import { RequestHandler } from 'express'
import { initializeApp } from 'firebase-admin/app'
import { AppCheck, getAppCheck } from 'firebase-admin/app-check'

// Firebase App Check proves a request comes from a genuine install of the app
// (Play Integrity on Android, App Attest / DeviceCheck on iOS). It is app
// attestation, not user auth: there are still no accounts or sessions.
//
// `monitor` (the default) lets requests without a valid token through and only
// counts them, because builds released before App Check send no token.
// `enforce` answers 401 instead — switch only once old builds are gone.
const MODES = ['monitor', 'enforce'] as const
type Mode = typeof MODES[number]

const mode = (process.env.APP_CHECK_MODE ?? 'monitor') as Mode
if (!MODES.includes(mode)) {
  throw new Error(`APP_CHECK_MODE must be one of ${MODES.join(', ')}, got "${mode}"`)
}

let appCheck: AppCheck | undefined

// Verifying a token is a local JWT check against Firebase's public keys, which
// needs only the project id — no service account. Validated on first use,
// like DATABASE_URL.
function getVerifier(): AppCheck {
  if (appCheck) return appCheck
  const projectId = process.env.FIREBASE_PROJECT_ID
  if (!projectId) throw new Error('Missing FIREBASE_PROJECT_ID environment variable')
  appCheck = getAppCheck(initializeApp({ projectId }))
  return appCheck
}

// Logged as one summary line per interval, so the logs show how much traffic
// still comes from builds without App Check before switching to `enforce`.
const counts = { valid: 0, missing: 0, invalid: 0 }
const SUMMARY_INTERVAL_MS = 15 * 60_000
setInterval(() => {
  if (counts.valid + counts.missing + counts.invalid === 0) return
  console.log(`[appCheck] ${mode}, last 15 min: valid=${counts.valid} missing=${counts.missing} invalid=${counts.invalid}`)
  counts.valid = counts.missing = counts.invalid = 0
}, SUMMARY_INTERVAL_MS).unref()

export const appCheckMiddleware: RequestHandler = async (req, res, next) => {
  const token = req.get('X-Firebase-AppCheck')
  if (!token) {
    counts.missing++
    if (mode === 'monitor') return next()
    return res.status(401).json({ error: 'Missing App Check token' })
  }

  let verifier: AppCheck
  try {
    verifier = getVerifier()
  } catch (err) {
    console.error('[appCheck] error:', err instanceof Error ? err.message : err)
    if (mode === 'monitor') return next()
    return res.status(500).json({ error: 'Internal server error' })
  }

  try {
    await verifier.verifyToken(token)
  } catch (err) {
    counts.invalid++
    // firebase-admin echoes an unsigned token's claims in its error messages,
    // so the reason is JSON-escaped: a newline in it can't forge a log line.
    console.warn('[appCheck] invalid token:', JSON.stringify(err instanceof Error ? err.message : String(err)))
    if (mode === 'monitor') return next()
    return res.status(401).json({ error: 'Invalid App Check token' })
  }
  counts.valid++
  next()
}
