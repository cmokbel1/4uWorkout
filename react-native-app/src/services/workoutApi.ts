import { ExerciseFilters, FilterOptionsByBodyPart } from '../types/filters';
import { SearchSuggestions } from '../types/search';
import { Workout } from '../types/workout';
import { getAppCheckHeaders } from './appCheck';

// A non-2xx response. `status` lets a caller tell a route the server doesn't
// have yet (404) or the rate limit (429) from other failures.
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Request failed with status ${status}`);
    this.status = status;
  }
}

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;

function getApiBase(): string {
  if (!API_BASE) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL in your environment.');
  }
  return API_BASE;
}

async function requestBuilder<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBase()}${path}`, {
    method: "GET",
    headers: await getAppCheckHeaders(),
  })

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<T>;
}

// Up to SEARCH_SAMPLE_SIZE exercises matching every word, closest names first
// (random within each rank), or none. `query` must already be clean (see utils/search): the server
// answers 400 to anything else.
export async function searchExercises(query: string): Promise<Workout[]> {
  return requestBuilder<Workout[]>(`/exercises/search?q=${encodeURIComponent(query)}`);
}

export async function getSearchSuggestions(): Promise<SearchSuggestions> {
  return requestBuilder<SearchSuggestions>('/exercises/search/suggestions');
}

// Returns up to 11 random matches; filters can make it fewer, or none.
export async function searchExercisesByBodyPart(
  bodyPart: string,
  filters: ExerciseFilters = {},
): Promise<Workout[]> {
  const normalized = bodyPart.trim().toLowerCase();
  if (!normalized) return [];

  // Built by hand: React Native's URLSearchParams doesn't implement set().
  const params: string[] = [];
  if (filters.difficulties?.length) {
    params.push(`difficulty=${encodeURIComponent(filters.difficulties.join(','))}`);
  }
  if (filters.target) params.push(`target=${encodeURIComponent(filters.target)}`);
  if (filters.equipmentTypes?.length) {
    params.push(`equipmentType=${encodeURIComponent(filters.equipmentTypes.join(','))}`);
  }
  const query = params.length ? `?${params.join('&')}` : '';

  return requestBuilder<Workout[]>(`/exercises/bodyPart/${encodeURIComponent(normalized)}${query}`);
}

// Every body part's filter choices, keyed by body part. Small and only changes
// when the server's data is re-imported, so the app loads it once per session.
export async function getFilterOptions(): Promise<FilterOptionsByBodyPart> {
  return requestBuilder<FilterOptionsByBodyPart>('/exercises/filters');
}

export async function getAllowedBodyParts(): Promise<string[]> {
  const bodyParts = await requestBuilder<string[]>('/exercises/bodyPartList');
  return bodyParts.map((item) => item.trim().toLowerCase());
}

export async function getAllowedTargets(): Promise<string[]> {
  const targets = await requestBuilder<string[]>('/exercises/targetList');
  return targets.map((item) => item.trim().toLowerCase());
}

export async function getExerciseById(id: string): Promise<Workout> {
  return requestBuilder<Workout>(`/exercises/exercise/${encodeURIComponent(id)}`);
}

export async function getExerciseImageById(id: string): Promise<string> {
  const url = `${getApiBase()}/exercises/image?exerciseId=${encodeURIComponent(id)}&resolution=720`;

  const response = await fetch(url, { method: 'GET', headers: await getAppCheckHeaders() });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
