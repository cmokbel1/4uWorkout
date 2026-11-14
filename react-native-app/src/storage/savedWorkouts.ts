import AsyncStorage from '@react-native-async-storage/async-storage';

import { Routine } from '../types/routine';
import { Workout } from '../types/workout';
import { todayKey } from '../utils/date';

// v3 stores workouts keyed by local date (YYYY-MM-DD), each workout carrying
// per-set weight/reps (setDetails). Earlier keys (v1 flat array, v2 with
// single sets/reps numbers) are intentionally no longer read.
const SAVED_WORKOUTS_KEY = 'saved_workouts_v3';

export type SavedWorkoutsByDate = Record<string, Workout[]>;

// Bumped by every write, so a screen that keeps its own copy of the saved
// workouts (useSavedWorkouts) can skip re-parsing storage on focus when
// nothing changed since it loaded. A counter, not a flag: several screens
// each compare it with the version they loaded, so one screen catching up
// doesn't hide the change from another.
let savedWorkoutsVersion = 0;

export function getSavedWorkoutsVersion(): number {
  return savedWorkoutsVersion;
}

// Keeps the first (newest) copy of each workout per day. The same workout
// could be saved twice in one day before addWorkoutForToday checked, which
// breaks list keys and makes edit/delete hit both copies. Cleaned on read;
// the cleaned map is written back on the next save.
function withoutDuplicates(map: SavedWorkoutsByDate): SavedWorkoutsByDate {
  const clean: SavedWorkoutsByDate = {};
  for (const [date, workouts] of Object.entries(map)) {
    const seen = new Set<string>();
    clean[date] = workouts.filter((workout) => {
      if (seen.has(workout.id)) return false;
      seen.add(workout.id);
      return true;
    });
  }
  return clean;
}

export async function readSavedWorkouts(): Promise<SavedWorkoutsByDate> {
  const raw = await AsyncStorage.getItem(SAVED_WORKOUTS_KEY);
  if (!raw) return {};

  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? withoutDuplicates(parsed as SavedWorkoutsByDate)
      : {};
  } catch {
    return {};
  }
}

export async function writeSavedWorkouts(
  map: SavedWorkoutsByDate,
): Promise<void> {
  await AsyncStorage.setItem(SAVED_WORKOUTS_KEY, JSON.stringify(map));
  savedWorkoutsVersion += 1;
}

export async function clearSavedWorkouts(): Promise<void> {
  await AsyncStorage.removeItem(SAVED_WORKOUTS_KEY);
  savedWorkoutsVersion += 1;
}

// Saves a workout under today's date (newest first). Returns the updated map.
// A workout already saved today is left as it is (sets included), so the
// store never holds the same workout twice in a day.
export async function addWorkoutForToday(
  workout: Workout,
): Promise<SavedWorkoutsByDate> {
  const map = await readSavedWorkouts();
  const key = todayKey();
  const day = map[key] ?? [];
  if (day.some((saved) => saved.id === workout.id)) return map;
  const next: SavedWorkoutsByDate = { ...map, [key]: [workout, ...day] };
  await writeSavedWorkouts(next);
  return next;
}

// Adds a routine's exercises to a day, in the routine's order, ahead of the
// day's existing workouts. Each gets `setCount` blank sets (no reps or
// weight), no note, and the routine's id. Exercises already on that day are
// skipped, so the day never holds the same workout twice.
export async function addRoutineToDay(
  date: string,
  routine: Routine,
): Promise<SavedWorkoutsByDate> {
  const map = await readSavedWorkouts();
  const day = map[date] ?? [];
  const onDay = new Set(day.map((workout) => workout.id));
  const added: Workout[] = routine.exercises
    .filter((exercise) => !onDay.has(exercise.id))
    .map(({ setCount, ...exercise }) => ({
      ...exercise,
      setDetails: Array.from({ length: setCount }, () => ({})),
      routineId: routine.id,
    }));
  if (!added.length) return map;
  const next: SavedWorkoutsByDate = { ...map, [date]: [...added, ...day] };
  await writeSavedWorkouts(next);
  return next;
}

// Tags every workout on a day with a routine's id, after the day was saved
// as that routine (or updated it), so the day stays linked to it. Returns the
// new map.
export async function tagDayWithRoutine(
  date: string,
  routineId: string,
): Promise<SavedWorkoutsByDate> {
  const map = await readSavedWorkouts();
  const next: SavedWorkoutsByDate = {
    ...map,
    [date]: (map[date] ?? []).map((workout) => ({ ...workout, routineId })),
  };
  await writeSavedWorkouts(next);
  return next;
}

export interface DatedNote {
  date: string;
  note: string;
}

// Every note saved for an exercise, newest first. With `beforeDate`, only
// notes from earlier days are included (so a day doesn't list its own note).
export function notesForExercise(
  map: SavedWorkoutsByDate,
  exerciseId: string,
  beforeDate?: string,
): DatedNote[] {
  const notes: DatedNote[] = [];
  for (const [date, workouts] of Object.entries(map)) {
    if (beforeDate && date >= beforeDate) continue;
    const note = workouts.find((workout) => workout.id === exerciseId)?.note;
    if (note) notes.push({ date, note });
  }
  // Date keys are YYYY-MM-DD, so they sort as strings.
  return notes.sort((a, b) => b.date.localeCompare(a.date));
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
