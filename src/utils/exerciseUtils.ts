import { Exercise } from '../types';
import { EXERCISES } from '../data/exercises';
import { loadCustomExercises, loadDeletedExerciseIds, markExerciseAsDeleted, deleteCustomExercise } from './storage';

/**
 * Get all exercises (built-in + custom) excluding deleted ones
 */
export const getAllExercises = (): Exercise[] => {
  const builtInExercises = EXERCISES;
  const customExercises = loadCustomExercises();
  const deletedIds = loadDeletedExerciseIds();

  // Filter out deleted built-in exercises
  const activeBuiltIn = builtInExercises.filter(ex => !deletedIds.includes(ex.id));

  // Combine: built-in first, then custom
  return [...activeBuiltIn, ...customExercises];
};

/**
 * Get exercise by ID from merged list
 */
export const getExerciseById = (id: string): Exercise | undefined => {
  return getAllExercises().find(ex => ex.id === id);
};

/**
 * Get exercises by category from merged list
 */
export const getExercisesByCategory = (category: string): Exercise[] => {
  return getAllExercises().filter(ex => ex.category === category);
};

/**
 * Get all unique categories from merged list
 */
export const getAllCategories = (): string[] => {
  const exercises = getAllExercises();
  return Array.from(new Set(exercises.map(ex => ex.category)));
};

/**
 * Check if exercise is custom
 */
export const isCustomExercise = (exerciseId: string): boolean => {
  const customExercises = loadCustomExercises();
  return customExercises.some(ex => ex.id === exerciseId);
};

/**
 * Check if exercise is built-in
 */
export const isBuiltInExercise = (exerciseId: string): boolean => {
  return EXERCISES.some(ex => ex.id === exerciseId);
};

/**
 * Delete any exercise (custom or built-in)
 */
export const deleteExercise = (exerciseId: string): void => {
  if (isCustomExercise(exerciseId)) {
    deleteCustomExercise(exerciseId);
  } else if (isBuiltInExercise(exerciseId)) {
    markExerciseAsDeleted(exerciseId);
  }
};

/**
 * Generate unique ID for custom exercise
 */
export const generateExerciseId = (name: string): string => {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `custom-${slug}-${Date.now()}`;
};

/**
 * Get all unique muscle groups from merged list
 */
export const getAllMuscleGroups = (): string[] => {
  const exercises = getAllExercises();
  const muscleGroups = new Set<string>();
  exercises.forEach(ex => ex.muscleGroups.forEach(mg => muscleGroups.add(mg)));
  return Array.from(muscleGroups).sort();
};
