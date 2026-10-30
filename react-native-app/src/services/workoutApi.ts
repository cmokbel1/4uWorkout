import { ExerciseFilters, FilterOptionsByBodyPart } from '../types/filters';
import { Workout } from '../types/workout';

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
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
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

  const response = await fetch(url, { method: 'GET' });

  if (!response.ok) {
    throw new Error(`Image request failed with status ${response.status}`);
  }

  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
