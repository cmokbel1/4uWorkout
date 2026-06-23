import AsyncStorage from '@react-native-async-storage/async-storage';

import { Workout } from '../types/workout';

const SAVED_WORKOUTS_KEY = 'saved_workouts_v1';

// One-way "dirty" signal so the Training screen avoids re-parsing storage
// (up to 50 base64-bearing records) on focus when nothing changed. Every
// mutation flips it true; the Training screen reads then marks it clean.
// Starts true so the first focus loads once.
let savedWorkoutsDirty = true;

export function isSavedWorkoutsDirty(): boolean {
  return savedWorkoutsDirty;
}

export function markSavedWorkoutsClean(): void {
  savedWorkoutsDirty = false;
}

export async function readSavedWorkouts(): Promise<Workout[]> {
  const raw = await AsyncStorage.getItem(SAVED_WORKOUTS_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Workout[]) : [];
  } catch {
    return [];
  }
}

export async function writeSavedWorkouts(workouts: Workout[]): Promise<void> {
  await AsyncStorage.setItem(SAVED_WORKOUTS_KEY, JSON.stringify(workouts));
  savedWorkoutsDirty = true;
}

export async function clearSavedWorkouts(): Promise<void> {
  await AsyncStorage.removeItem(SAVED_WORKOUTS_KEY);
  savedWorkoutsDirty = true;
}

// Removes a single workout by id. Storage is one JSON array under one key, so
// this is necessarily a read-modify-write; the helper keeps that detail here
// instead of in the screen. Returns the updated list.
export async function removeSavedWorkout(id: string): Promise<Workout[]> {
  const current = await readSavedWorkouts();
  const next = current.filter((workout) => workout.id !== id);
  await writeSavedWorkouts(next);
  return next;
}