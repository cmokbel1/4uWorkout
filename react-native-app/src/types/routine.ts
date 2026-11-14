// An exercise in a routine: which one, and how many blank set rows it gets
// when the routine is added to a day. The rest of the workout (name, image,
// instructions) comes from the newest saved copy when it's added, so the
// routine doesn't store a second copy of its image.
export interface RoutineExercise {
  id: string;
  setCount: number;
}

// A named list of one day's exercises, to add to other days.
export interface Routine {
  id: string;
  name: string;
  exercises: RoutineExercise[];
}

export const ROUTINE_NAME_MAX_LENGTH = 40;
