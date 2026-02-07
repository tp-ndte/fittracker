// Exercise - a single exercise like "Bench Press" or "Squat"
export interface Exercise {
  id: string;
  name: string;
  category: string;
  details?: string; // Free text notes/instructions about the exercise
  showHistory?: boolean; // Show previous performance during workouts (default: Strength=ON, Mobility/Warm Up=OFF)
  isCustom?: boolean;
  isDeleted?: boolean; // For soft-deleting built-in exercises
  createdAt?: string;
  updatedAt?: string;
}

// ProgramWorkout - a workout within a training program
export interface ProgramWorkout {
  workoutId: string;
  workoutName: string;
  sequenceOrder: number;
  targetCount: number;
  completedCount: number;
}

// Program - a training program with sequential workouts
export interface Program {
  id: string;
  name: string;
  active: boolean;
  workouts: ProgramWorkout[];
  lastCompletedWorkoutId?: string;
  createdAt: string;
  archivedAt?: string;
}

// Set - a single set within an exercise (reps x weight)
export interface SessionSet {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
}

// SessionExercise - an exercise being performed in a session
export interface SessionExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: SessionSet[];
  notes?: string;
  supersetGroupId?: string;
  supersetOrder?: number;
}

// Session - an instance when you go to the gym (e.g., "Today's leg day session")
export interface Session {
  id: string;
  date: string;
  name: string;
  exercises: SessionExercise[];
  duration?: number;
  notes?: string;
  workoutId?: string;    // Reference to the Workout used
  workoutName?: string;  // Name of the Workout used
  workoutCategory?: 'Strength' | 'Mobility';  // Type of workout
  programId?: string;    // Reference to Program if counted toward one
}

// WorkoutExercise - an exercise within a saved Workout
export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight?: number;
  supersetGroupId?: string;
  supersetOrder?: number;
  notes?: string;
}

// Workout - a saved set of exercises (e.g., "Leg Day", "Push Day")
export interface Workout {
  id: string;
  name: string;
  description?: string;
  category: 'Strength' | 'Mobility';
  exercises: WorkoutExercise[];
  favorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

// View types for navigation
export type View = 'home' | 'library' | 'exercises' | 'history';
