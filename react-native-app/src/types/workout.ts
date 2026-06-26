// One performed set: the weight used and reps done. Both optional so a set can
// be saved before the user fills in the numbers.
export interface WorkoutSet {
  weight?: number;
  reps?: number;
}

export interface Workout {
  id: string;
  bodyPart: string;
  target: string;
  name: string;
  gifUrl: string;
  equipment: string;
  description: string;
  difficulty: string;
  instructions: string;
  // Per-set weight/reps. The set count is this array's length.
  setDetails?: WorkoutSet[];
  // Legacy single-value fields — superseded by setDetails, removed in step 3.
  sets?: number;
  reps?: number;
}
