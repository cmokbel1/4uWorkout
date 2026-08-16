const EXERCISE_API_BASE = 'https://exercisedb.p.rapidapi.com'

// RapidAPI answers 429 both for the short-window request throttle and for an
// exhausted monthly plan quota. The status alone cannot tell them apart — only
// these headers can, so every non-2xx log line carries them.
const RATE_LIMIT_HEADERS = [
  'x-ratelimit-requests-limit',
  'x-ratelimit-requests-remaining',
  'x-ratelimit-requests-reset',
  'x-ratelimit-rapid-free-plans-hard-limit-limit',
  'x-ratelimit-rapid-free-plans-hard-limit-remaining',
  'x-ratelimit-rapid-free-plans-hard-limit-reset',
  'retry-after',
]

export function rateLimitInfo(response: Response): string {
  const parts: string[] = []
  for (const name of RATE_LIMIT_HEADERS) {
    const value = response.headers.get(name)
    if (value !== null) parts.push(`${name}=${value}`)
  }
  return parts.length ? ` [${parts.join(' ')}]` : ' [no rate-limit headers]'
}

function getApiKey(): string {
  const key = process.env.EXERCISE_API_KEY
  if (!key) throw new Error('Missing EXERCISE_API_KEY environment variable')
  return key
}

export async function exerciseApiFetch(path: string): Promise<Response> {
  const apiKey = getApiKey()
  return fetch(`${EXERCISE_API_BASE}${path}`, {
    method: 'GET',
    headers: {
      'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
      'x-rapidapi-key': apiKey,
    },
  })
}
