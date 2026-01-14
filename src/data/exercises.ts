import { Exercise } from '../types';

export const EXERCISES: Exercise[] = [];

export const getExercisesByCategory = (category: string): Exercise[] => {
  return EXERCISES.filter(ex => ex.category === category);
};

export const getAllCategories = (): string[] => {
  return Array.from(new Set(EXERCISES.map(ex => ex.category)));
};

export const getExerciseById = (id: string): Exercise | undefined => {
  return EXERCISES.find(ex => ex.id === id);
};
