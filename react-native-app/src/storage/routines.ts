import AsyncStorage from '@react-native-async-storage/async-storage';

import { Routine, RoutineExercise } from '../types/routine';
import { Workout } from '../types/workout';

// Routines, newest first. Kept under their own key so saved_workouts_v3
// keeps its shape.
const ROUTINES_KEY = 'saved_routines_v1';

export async function readRoutines(): Promise<Routine[]> {
  const raw = await AsyncStorage.getItem(ROUTINES_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Routine[]) : [];
  } catch {
    return [];
  }
}

async function writeRoutines(routines: Routine[]): Promise<void> {
  await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
}

// A day's workouts as routine exercises: each exercise and how many sets it
// had, not the day's reps, weights or notes.
function toRoutineExercises(workouts: Workout[]): RoutineExercise[] {
  return workouts.map(({ setDetails, note, similar, routineId, ...exercise }) => ({
    ...exercise,
    setCount: setDetails?.length ?? 1,
  }));
}

// True when a day holds exactly the routine's exercises with the same set
// counts, so saving the day as a routine would add nothing new. Order,
// reps, weights and notes don't count.
export function routineMatchesDay(routine: Routine, workouts: Workout[]): boolean {
  if (routine.exercises.length !== workouts.length) return false;
  const setCounts = new Map(routine.exercises.map((ex) => [ex.id, ex.setCount]));
  return workouts.every(
    (workout) => setCounts.get(workout.id) === (workout.setDetails?.length ?? 1),
  );
}

// Saves a day's workouts as a new routine. Returns the new list, newest (the
// new routine) first.
export async function saveRoutineFromDay(
  name: string,
  workouts: Workout[],
): Promise<Routine[]> {
  const routine: Routine = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    exercises: toRoutineExercises(workouts),
  };
  const next = [routine, ...(await readRoutines())];
  await writeRoutines(next);
  return next;
}

// Replaces a routine's exercises with a day's workouts, keeping its id and
// name. Returns the new list.
export async function overwriteRoutine(
  id: string,
  workouts: Workout[],
): Promise<Routine[]> {
  const next = (await readRoutines()).map((routine) =>
    routine.id === id ? { ...routine, exercises: toRoutineExercises(workouts) } : routine,
  );
  await writeRoutines(next);
  return next;
}

// Deletes a routine. Workouts already added from it keep their routineId.
export async function deleteRoutine(id: string): Promise<Routine[]> {
  const next = (await readRoutines()).filter((routine) => routine.id !== id);
  await writeRoutines(next);
  return next;
}
