const EXERCISE_API_BASE = 'https://exercisedb.p.rapidapi.com'

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
