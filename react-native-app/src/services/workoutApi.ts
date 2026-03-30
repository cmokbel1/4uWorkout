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

export async function searchExercisesByBodyPart(bodyPart: string): Promise<Workout[]> {
  const normalized = bodyPart.trim().toLowerCase();
  if (!normalized) return [];

  return requestBuilder<Workout[]>(`/exercises/bodyPart/${encodeURIComponent(normalized)}`);
}

export async function getAllowedBodyParts(): Promise<string[]> {
  const bodyParts = await requestBuilder<string[]>('/exercises/bodyPartList');
  return bodyParts.map((item) => item.trim().toLowerCase());
}

export async function getAllowedTargets(): Promise<string[]> {
  const targets = await requestBuilder<string[]>('/exercises/targetList');
  return targets.map((item) => item.trim().toLowerCase());
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
