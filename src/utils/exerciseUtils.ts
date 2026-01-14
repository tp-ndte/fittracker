import { Exercise } from '../types';
import { EXERCISES } from '../data/exercises';
import { loadCustomExercises, loadDeletedExerciseIds, markExerciseAsDeleted, deleteCustomExercise } from './storage';

/**
 * Get all exercises (built-in + custom) excluding deleted ones
 */
export const getAllExercises = async (): Promise<Exercise[]> => {
  const builtInExercises = EXERCISES;
  const customExercises = await loadCustomExercises();
  const deletedIds = await loadDeletedExerciseIds();

  // Filter out deleted built-in exercises
  const activeBuiltIn = builtInExercises.filter(ex => !deletedIds.includes(ex.id));

  // Combine: built-in first, then custom
  return [...activeBuiltIn, ...customExercises];
};

/**
 * Get exercise by ID from merged list
 */
export const getExerciseById = async (id: string): Promise<Exercise | undefined> => {
  const exercises = await getAllExercises();
  return exercises.find(ex => ex.id === id);
};

/**
 * Get exercises by category from merged list
 */
export const getExercisesByCategory = async (category: string): Promise<Exercise[]> => {
  const exercises = await getAllExercises();
  return exercises.filter(ex => ex.category === category);
};

/**
 * Get all unique categories from merged list
 */
export const getAllCategories = async (): Promise<string[]> => {
  const exercises = await getAllExercises();
  return Array.from(new Set(exercises.map(ex => ex.category)));
};

/**
 * Check if exercise is custom
 */
export const isCustomExercise = async (exerciseId: string): Promise<boolean> => {
  const customExercises = await loadCustomExercises();
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
export const deleteExercise = async (exerciseId: string): Promise<void> => {
  const isCustom = await isCustomExercise(exerciseId);
  if (isCustom) {
    await deleteCustomExercise(exerciseId);
  } else if (isBuiltInExercise(exerciseId)) {
    await markExerciseAsDeleted(exerciseId);
  }
};

/**
 * Generate unique ID for custom exercise
 */
export const generateExerciseId = (name: string): string => {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `custom-${slug}-${Date.now()}`;
};
