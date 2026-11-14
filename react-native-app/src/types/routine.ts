import { Workout } from './workout';

// An exercise in a routine: the workout as it was saved, without that day's
// sets, note or routine tag. `setCount` is how many blank set rows it gets
// when the routine is added to a day.
export type RoutineExercise = Omit<Workout, 'setDetails' | 'note' | 'similar' | 'routineId'> & {
  setCount: number;
};

// A named copy of one day's exercises, to add to other days.
export interface Routine {
  id: string;
  name: string;
  exercises: RoutineExercise[];
}

export const ROUTINE_NAME_MAX_LENGTH = 40;
