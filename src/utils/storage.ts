import { Session, Workout, Exercise } from '../types';
import { supabase, getDeviceId } from '../lib/supabase';

// ============================================
// SESSIONS STORAGE (gym visits)
// ============================================

export const saveSessions = async (sessions: Session[]): Promise<void> => {
  const deviceId = getDeviceId();

  // Delete all existing sessions for this device and insert new ones
  await supabase.from('sessions').delete().eq('device_id', deviceId);

  if (sessions.length > 0) {
    const rows = sessions.map(s => ({
      id: s.id,
      device_id: deviceId,
      date: s.date,
      name: s.name,
      exercises: s.exercises,
      duration: s.duration,
      notes: s.notes,
      workout_id: s.workoutId,
      workout_name: s.workoutName
    }));

    await supabase.from('sessions').insert(rows);
  }
};

export const loadSessions = async (): Promise<Session[]> => {
  const deviceId = getDeviceId();

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error loading sessions:', error);
    return [];
  }

  return data.map(row => ({
    id: row.id,
    date: row.date,
    name: row.name,
    exercises: row.exercises,
    duration: row.duration,
    notes: row.notes,
    workoutId: row.workout_id,
    workoutName: row.workout_name
  }));
};

export const addSession = async (session: Session): Promise<void> => {
  const deviceId = getDeviceId();

  await supabase.from('sessions').insert({
    id: session.id,
    device_id: deviceId,
    date: session.date,
    name: session.name,
    exercises: session.exercises,
    duration: session.duration,
    notes: session.notes,
    workout_id: session.workoutId,
    workout_name: session.workoutName
  });
};

export const updateSession = async (sessionId: string, updatedSession: Session): Promise<void> => {
  const deviceId = getDeviceId();

  await supabase
    .from('sessions')
    .update({
      date: updatedSession.date,
      name: updatedSession.name,
      exercises: updatedSession.exercises,
      duration: updatedSession.duration,
      notes: updatedSession.notes,
      workout_id: updatedSession.workoutId,
      workout_name: updatedSession.workoutName
    })
    .eq('id', sessionId)
    .eq('device_id', deviceId);
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  const deviceId = getDeviceId();

  await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
    .eq('device_id', deviceId);
};

export const getSessionsByExercise = async (exerciseId: string): Promise<Session[]> => {
  const sessions = await loadSessions();
  return sessions.filter(session =>
    session.exercises.some(ex => ex.exerciseId === exerciseId)
  );
};

// Get the last session's data for a specific exercise (for showing history during workout)
export interface ExerciseHistory {
  date: string;
  sessionName: string;
  sets: { reps: number; weight: number; completed: boolean }[];
  notes?: string;
}

export const getLastExerciseHistory = async (exerciseId: string, excludeSessionId?: string): Promise<ExerciseHistory | null> => {
  const sessions = await loadSessions();

  // Sort by date descending
  const sortedSessions = sessions
    .filter(s => s.id !== excludeSessionId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  for (const session of sortedSessions) {
    const exerciseData = session.exercises.find(ex => ex.exerciseId === exerciseId);
    if (exerciseData) {
      return {
        date: session.date,
        sessionName: session.name,
        sets: exerciseData.sets.map(s => ({
          reps: s.reps,
          weight: s.weight,
          completed: s.completed
        })),
        notes: exerciseData.notes
      };
    }
  }

  return null;
};

// ============================================
// WORKOUTS STORAGE (saved workout plans like "Leg Day")
// ============================================

export const saveWorkouts = async (workouts: Workout[]): Promise<void> => {
  const deviceId = getDeviceId();

  // Delete all existing workouts for this device and insert new ones
  await supabase.from('workouts').delete().eq('device_id', deviceId);

  if (workouts.length > 0) {
    const rows = workouts.map(w => ({
      id: w.id,
      device_id: deviceId,
      name: w.name,
      description: w.description,
      category: w.category,
      exercises: w.exercises,
      created_at: w.createdAt,
      updated_at: w.updatedAt
    }));

    await supabase.from('workouts').insert(rows);
  }
};

export const loadWorkouts = async (): Promise<Workout[]> => {
  const deviceId = getDeviceId();

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error loading workouts:', error);
    return [];
  }

  return data.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    exercises: row.exercises,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
};

export const addWorkout = async (workout: Workout): Promise<void> => {
  const deviceId = getDeviceId();

  await supabase.from('workouts').insert({
    id: workout.id,
    device_id: deviceId,
    name: workout.name,
    description: workout.description,
    category: workout.category,
    exercises: workout.exercises,
    created_at: workout.createdAt,
    updated_at: workout.updatedAt
  });
};

export const updateWorkout = async (workoutId: string, updatedWorkout: Workout): Promise<void> => {
  const deviceId = getDeviceId();
  const now = new Date().toISOString();

  await supabase
    .from('workouts')
    .update({
      name: updatedWorkout.name,
      description: updatedWorkout.description,
      category: updatedWorkout.category,
      exercises: updatedWorkout.exercises,
      updated_at: now
    })
    .eq('id', workoutId)
    .eq('device_id', deviceId);
};

export const deleteWorkout = async (workoutId: string): Promise<void> => {
  const deviceId = getDeviceId();

  await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId)
    .eq('device_id', deviceId);
};

export const getWorkoutById = async (workoutId: string): Promise<Workout | undefined> => {
  const deviceId = getDeviceId();

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', workoutId)
    .eq('device_id', deviceId)
    .single();

  if (error || !data) {
    return undefined;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    category: data.category,
    exercises: data.exercises,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

// ============================================
// CUSTOM EXERCISES STORAGE
// ============================================

export const saveCustomExercises = async (exercises: Exercise[]): Promise<void> => {
  const deviceId = getDeviceId();

  // Delete all existing custom exercises for this device and insert new ones
  await supabase.from('exercises').delete().eq('device_id', deviceId);

  if (exercises.length > 0) {
    const rows = exercises.map(e => ({
      id: e.id,
      device_id: deviceId,
      name: e.name,
      category: e.category,
      details: e.details,
      created_at: e.createdAt,
      updated_at: e.updatedAt
    }));

    await supabase.from('exercises').insert(rows);
  }
};

export const loadCustomExercises = async (): Promise<Exercise[]> => {
  const deviceId = getDeviceId();
  console.log('[Storage] loadCustomExercises called, deviceId:', deviceId);

  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('device_id', deviceId)
    .order('name', { ascending: true });

  console.log('[Storage] loadCustomExercises result:', { dataCount: data?.length, error });

  if (error || !data) {
    console.error('[Storage] Error loading custom exercises:', error);
    return [];
  }

  return data.map(row => ({
    id: row.id,
    name: row.name,
    category: row.category,
    details: row.details,
    isCustom: true,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
};

export const addCustomExercise = async (exercise: Exercise): Promise<void> => {
  const deviceId = getDeviceId();
  const now = new Date().toISOString();

  await supabase.from('exercises').insert({
    id: exercise.id,
    device_id: deviceId,
    name: exercise.name,
    category: exercise.category,
    details: exercise.details,
    created_at: now,
    updated_at: now
  });
};

export const updateCustomExercise = async (exerciseId: string, updatedExercise: Exercise): Promise<void> => {
  const deviceId = getDeviceId();
  const now = new Date().toISOString();

  await supabase
    .from('exercises')
    .update({
      name: updatedExercise.name,
      category: updatedExercise.category,
      details: updatedExercise.details,
      updated_at: now
    })
    .eq('id', exerciseId)
    .eq('device_id', deviceId);
};

export const deleteCustomExercise = async (exerciseId: string): Promise<void> => {
  const deviceId = getDeviceId();

  await supabase
    .from('exercises')
    .delete()
    .eq('id', exerciseId)
    .eq('device_id', deviceId);
};

// ============================================
// DELETED EXERCISES STORAGE (for soft-deleting built-in exercises)
// ============================================

export const loadDeletedExerciseIds = async (): Promise<string[]> => {
  const deviceId = getDeviceId();

  const { data, error } = await supabase
    .from('deleted_exercises')
    .select('exercise_id')
    .eq('device_id', deviceId);

  if (error || !data) {
    console.error('Error loading deleted exercises:', error);
    return [];
  }

  return data.map(row => row.exercise_id);
};

export const saveDeletedExerciseIds = async (ids: string[]): Promise<void> => {
  const deviceId = getDeviceId();

  // Delete all existing and insert new ones
  await supabase.from('deleted_exercises').delete().eq('device_id', deviceId);

  if (ids.length > 0) {
    const rows = ids.map(id => ({
      device_id: deviceId,
      exercise_id: id
    }));

    await supabase.from('deleted_exercises').insert(rows);
  }
};

export const markExerciseAsDeleted = async (exerciseId: string): Promise<void> => {
  const deviceId = getDeviceId();

  // Use upsert to handle duplicates
  await supabase.from('deleted_exercises').upsert({
    device_id: deviceId,
    exercise_id: exerciseId
  }, {
    onConflict: 'device_id,exercise_id'
  });
};

export const restoreExercise = async (exerciseId: string): Promise<void> => {
  const deviceId = getDeviceId();

  await supabase
    .from('deleted_exercises')
    .delete()
    .eq('device_id', deviceId)
    .eq('exercise_id', exerciseId);
};

