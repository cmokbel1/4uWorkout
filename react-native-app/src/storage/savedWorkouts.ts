import AsyncStorage from '@react-native-async-storage/async-storage';

import { Workout } from '../types/workout';
import { todayKey } from '../utils/date';

// v2 stores workouts keyed by local date (YYYY-MM-DD). The v1 flat-array key
// is intentionally no longer read — pre-date saved workouts are discarded.
const SAVED_WORKOUTS_KEY = 'saved_workouts_v2';

export type SavedWorkoutsByDate = Record<string, Workout[]>;

// One-way "dirty" signal so the Training screen avoids re-parsing storage on
// focus when nothing changed. Every mutation flips it true; the Training
// screen reads then marks it clean. Starts true so the first focus loads once.
let savedWorkoutsDirty = true;

export function isSavedWorkoutsDirty(): boolean {
  return savedWorkoutsDirty;
}

export function markSavedWorkoutsClean(): void {
  savedWorkoutsDirty = false;
}

export async function readSavedWorkouts(): Promise<SavedWorkoutsByDate> {
  const raw = await AsyncStorage.getItem(SAVED_WORKOUTS_KEY);
  if (!raw) return {};

  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as SavedWorkoutsByDate)
      : {};
  } catch {
    return {};
  }
}

export async function writeSavedWorkouts(
  map: SavedWorkoutsByDate,
): Promise<void> {
  await AsyncStorage.setItem(SAVED_WORKOUTS_KEY, JSON.stringify(map));
  savedWorkoutsDirty = true;
}

export async function clearSavedWorkouts(): Promise<void> {
  await AsyncStorage.removeItem(SAVED_WORKOUTS_KEY);
  savedWorkoutsDirty = true;
}

// Saves a workout under today's date (newest first). Returns the updated map.
export async function addWorkoutForToday(
  workout: Workout,
): Promise<SavedWorkoutsByDate> {
  const map = await readSavedWorkouts();
  const key = todayKey();
  const day = map[key] ?? [];
  const next: SavedWorkoutsByDate = { ...map, [key]: [workout, ...day] };
  await writeSavedWorkouts(next);
  return next;
}

// Removes one workout from a date bucket; drops the date entirely when it
// becomes empty so it stops being marked on the calendar. Returns the new map.
export async function removeSavedWorkout(
  date: string,
  id: string,
): Promise<SavedWorkoutsByDate> {
  const map = await readSavedWorkouts();
  const day = (map[date] ?? []).filter((workout) => workout.id !== id);
  const next: SavedWorkoutsByDate = { ...map };
  if (day.length) {
    next[date] = day;
  } else {
    delete next[date];
  }
  await writeSavedWorkouts(next);
  return next;
}
