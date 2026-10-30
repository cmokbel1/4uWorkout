// One performed set: the weight used and reps done. Both optional so a set can
// be saved before the user fills in the numbers.
export interface WorkoutSet {
  weight?: number;
  reps?: number;
}

// How an exercise moves and is loaded, from the ExerciseDB Pro dataset.
export interface ExerciseTaxonomy {
  movementFamily: string;
  movementPattern: string;
  mechanic: string;
  forceType: string;
  planeOfMotion: string;
  laterality: string;
  bodyPosition: string;
  benchAngle: string;
  equipmentCategory: string;
  loadType: string;
  primaryRegion: string;
  isCompound: boolean;
  isUnilateral: boolean;
  isAssisted: boolean;
  isWeighted: boolean;
  signals: string[];
  confidence: string;
}

// A link from one exercise to another (similar, substitution, progression or
// regression). `type` and `conditions` are absent on similarExercises links.
export interface ExerciseRelation {
  id: string;
  name: string;
  score: number;
  confidence: string;
  scoreType: string;
  reviewStatus: string;
  reasons: string[];
  type?: string[];
  conditions?: string[];
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
  instructions: string[];
  // Pro fields. Optional because workouts saved before the Pro dataset don't
  // have them.
  secondaryMuscles?: string[];
  category?: string;
  taxonomy?: ExerciseTaxonomy;
  requiredEquipment?: string[];
  optionalEquipment?: string[];
  support?: string[];
  assistance?: string;
  aliases?: string[];
  similarExercises?: ExerciseRelation[];
  substitutions?: ExerciseRelation[];
  progressions?: ExerciseRelation[];
  regressions?: ExerciseRelation[];
  // Per-set weight/reps. The set count is this array's length.
  setDetails?: WorkoutSet[];
}
