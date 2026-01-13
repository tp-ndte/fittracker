import { Exercise } from '../types';

export const EXERCISES: Exercise[] = [
  // Chest
  {
    id: 'bench-press',
    name: 'Bench Press',
    category: 'Chest',
    muscleGroups: ['Chest', 'Triceps', 'Shoulders']
  },
  {
    id: 'dumbbell-press',
    name: 'Dumbbell Press',
    category: 'Chest',
    muscleGroups: ['Chest', 'Triceps', 'Shoulders']
  },
  {
    id: 'push-ups',
    name: 'Push-Ups',
    category: 'Chest',
    muscleGroups: ['Chest', 'Triceps', 'Shoulders', 'Core']
  },

  // Back
  {
    id: 'deadlift',
    name: 'Deadlift',
    category: 'Back',
    muscleGroups: ['Back', 'Glutes', 'Hamstrings', 'Core']
  },
  {
    id: 'pull-ups',
    name: 'Pull-Ups',
    category: 'Back',
    muscleGroups: ['Back', 'Biceps', 'Shoulders']
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    category: 'Back',
    muscleGroups: ['Back', 'Biceps']
  },

  // Legs
  {
    id: 'squat',
    name: 'Squat',
    category: 'Legs',
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core']
  },
  {
    id: 'lunges',
    name: 'Lunges',
    category: 'Legs',
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings']
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    category: 'Legs',
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings']
  },

  // Shoulders
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    category: 'Shoulders',
    muscleGroups: ['Shoulders', 'Triceps', 'Core']
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    category: 'Shoulders',
    muscleGroups: ['Shoulders']
  },

  // Arms
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    category: 'Arms',
    muscleGroups: ['Biceps']
  },
  {
    id: 'tricep-dips',
    name: 'Tricep Dips',
    category: 'Arms',
    muscleGroups: ['Triceps', 'Chest', 'Shoulders']
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    category: 'Arms',
    muscleGroups: ['Biceps', 'Forearms']
  },

  // Core
  {
    id: 'plank',
    name: 'Plank',
    category: 'Core',
    muscleGroups: ['Core', 'Shoulders']
  },
  {
    id: 'crunches',
    name: 'Crunches',
    category: 'Core',
    muscleGroups: ['Abs']
  }
];

export const getExercisesByCategory = (category: string): Exercise[] => {
  return EXERCISES.filter(ex => ex.category === category);
};

export const getAllCategories = (): string[] => {
  return Array.from(new Set(EXERCISES.map(ex => ex.category)));
};

export const getExerciseById = (id: string): Exercise | undefined => {
  return EXERCISES.find(ex => ex.id === id);
};
