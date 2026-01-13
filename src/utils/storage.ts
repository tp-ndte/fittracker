import { Session, Workout, Exercise } from '../types';

const SESSIONS_KEY = 'fittracker_sessions';
const WORKOUTS_KEY = 'fittracker_workouts';
const CUSTOM_EXERCISES_KEY = 'fittracker_custom_exercises';
const DELETED_EXERCISES_KEY = 'fittracker_deleted_exercises';

// ============================================
// SESSIONS STORAGE (gym visits)
// ============================================

export const saveSessions = (sessions: Session[]): void => {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving sessions:', error);
  }
};

export const loadSessions = (): Session[] => {
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    if (data) return JSON.parse(data);
    // Migrate from old key if exists
    const oldData = localStorage.getItem('fittracker_workouts');
    if (oldData) {
      const sessions = JSON.parse(oldData);
      // Migrate templateId/templateName to workoutId/workoutName
      const migrated = sessions.map((s: any) => ({
        ...s,
        workoutId: s.templateId || s.workoutId,
        workoutName: s.templateName || s.workoutName
      }));
      saveSessions(migrated);
      return migrated;
    }
    return [];
  } catch (error) {
    console.error('Error loading sessions:', error);
    return [];
  }
};

export const addSession = (session: Session): void => {
  const sessions = loadSessions();
  sessions.unshift(session);
  saveSessions(sessions);
};

export const updateSession = (sessionId: string, updatedSession: Session): void => {
  const sessions = loadSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index !== -1) {
    sessions[index] = updatedSession;
    saveSessions(sessions);
  }
};

export const deleteSession = (sessionId: string): void => {
  const sessions = loadSessions();
  const filtered = sessions.filter(s => s.id !== sessionId);
  saveSessions(filtered);
};

export const getSessionsByExercise = (exerciseId: string): Session[] => {
  const sessions = loadSessions();
  return sessions.filter(session =>
    session.exercises.some(ex => ex.exerciseId === exerciseId)
  );
};

// ============================================
// WORKOUTS STORAGE (saved workout plans like "Leg Day")
// ============================================

export const saveWorkouts = (workouts: Workout[]): void => {
  try {
    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
  } catch (error) {
    console.error('Error saving workouts:', error);
  }
};

export const loadWorkouts = (): Workout[] => {
  try {
    const data = localStorage.getItem(WORKOUTS_KEY);
    if (data) return JSON.parse(data);
    // Migrate from old templates key if exists
    const oldData = localStorage.getItem('fittracker_templates');
    if (oldData) {
      const templates = JSON.parse(oldData);
      // Add default category if missing
      const migrated = templates.map((t: any) => ({
        ...t,
        category: t.category || 'Strength'
      }));
      saveWorkouts(migrated);
      return migrated;
    }
    return [];
  } catch (error) {
    console.error('Error loading workouts:', error);
    return [];
  }
};

export const addWorkout = (workout: Workout): void => {
  const workouts = loadWorkouts();
  workouts.unshift(workout);
  saveWorkouts(workouts);
};

export const updateWorkout = (workoutId: string, updatedWorkout: Workout): void => {
  const workouts = loadWorkouts();
  const index = workouts.findIndex(w => w.id === workoutId);
  if (index !== -1) {
    workouts[index] = { ...updatedWorkout, updatedAt: new Date().toISOString() };
    saveWorkouts(workouts);
  }
};

export const deleteWorkout = (workoutId: string): void => {
  const workouts = loadWorkouts();
  const filtered = workouts.filter(w => w.id !== workoutId);
  saveWorkouts(filtered);
};

export const getWorkoutById = (workoutId: string): Workout | undefined => {
  const workouts = loadWorkouts();
  return workouts.find(w => w.id === workoutId);
};

// ============================================
// CUSTOM EXERCISES STORAGE
// ============================================

export const saveCustomExercises = (exercises: Exercise[]): void => {
  try {
    localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(exercises));
  } catch (error) {
    console.error('Error saving custom exercises:', error);
  }
};

export const loadCustomExercises = (): Exercise[] => {
  try {
    const data = localStorage.getItem(CUSTOM_EXERCISES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading custom exercises:', error);
    return [];
  }
};

export const addCustomExercise = (exercise: Exercise): void => {
  const exercises = loadCustomExercises();
  exercises.push({
    ...exercise,
    isCustom: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  saveCustomExercises(exercises);
};

export const updateCustomExercise = (exerciseId: string, updatedExercise: Exercise): void => {
  const exercises = loadCustomExercises();
  const index = exercises.findIndex(e => e.id === exerciseId);
  if (index !== -1) {
    exercises[index] = { ...updatedExercise, updatedAt: new Date().toISOString() };
    saveCustomExercises(exercises);
  }
};

export const deleteCustomExercise = (exerciseId: string): void => {
  const exercises = loadCustomExercises();
  const filtered = exercises.filter(e => e.id !== exerciseId);
  saveCustomExercises(filtered);
};

// ============================================
// DELETED EXERCISES STORAGE (for soft-deleting built-in exercises)
// ============================================

export const loadDeletedExerciseIds = (): string[] => {
  try {
    const data = localStorage.getItem(DELETED_EXERCISES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading deleted exercises:', error);
    return [];
  }
};

export const saveDeletedExerciseIds = (ids: string[]): void => {
  try {
    localStorage.setItem(DELETED_EXERCISES_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Error saving deleted exercises:', error);
  }
};

export const markExerciseAsDeleted = (exerciseId: string): void => {
  const deletedIds = loadDeletedExerciseIds();
  if (!deletedIds.includes(exerciseId)) {
    deletedIds.push(exerciseId);
    saveDeletedExerciseIds(deletedIds);
  }
};

export const restoreExercise = (exerciseId: string): void => {
  const deletedIds = loadDeletedExerciseIds();
  const filtered = deletedIds.filter(id => id !== exerciseId);
  saveDeletedExerciseIds(filtered);
};
