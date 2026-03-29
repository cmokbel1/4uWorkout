import AsyncStorage from '@react-native-async-storage/async-storage';

import { Workout } from '../types/workout';

const SAVED_WORKOUTS_KEY = 'saved_workouts_v1';

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
}

export async function clearSavedWorkouts(): Promise<void> {
  await AsyncStorage.removeItem(SAVED_WORKOUTS_KEY);
}