import { Session, Workout, Exercise, Program, ProgramWorkout } from '../types';
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
    workoutName: row.workout_name,
    programId: row.program_id
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
    workout_name: session.workoutName,
    program_id: session.programId
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
      workout_name: updatedSession.workoutName,
      program_id: updatedSession.programId
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
  sets: { reps: number; weight: number; duration?: number; completed: boolean }[];
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
          duration: s.duration,
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
    favorite: row.favorite || false,
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
    favorite: workout.favorite || false,
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

export const toggleWorkoutFavorite = async (workoutId: string, favorite: boolean): Promise<void> => {
  const deviceId = getDeviceId();

  await supabase
    .from('workouts')
    .update({ favorite })
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
    favorite: data.favorite || false,
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
    exerciseType: row.exercise_type || 'weight',
    details: row.details,
    showHistory: row.show_history,
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
    exercise_type: exercise.exerciseType || 'weight',
    show_history: exercise.showHistory,
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
      exercise_type: updatedExercise.exerciseType || 'weight',
      show_history: updatedExercise.showHistory,
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

// ============================================
// PROGRAMS STORAGE (training programs)
// ============================================

export const loadActiveProgram = async (): Promise<Program | null> => {
  const deviceId = getDeviceId();

  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('device_id', deviceId)
    .eq('active', true)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('Error loading active program:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    active: data.active,
    workouts: data.workouts,
    lastCompletedWorkoutId: data.last_completed_workout_id,
    createdAt: data.created_at,
    archivedAt: data.archived_at
  };
};

export const loadArchivedPrograms = async (): Promise<Program[]> => {
  const deviceId = getDeviceId();

  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('device_id', deviceId)
    .eq('active', false)
    .order('archived_at', { ascending: false });

  if (error || !data) {
    if (error) console.error('Error loading archived programs:', error);
    return [];
  }

  return data.map(row => ({
    id: row.id,
    name: row.name,
    active: row.active,
    workouts: row.workouts,
    lastCompletedWorkoutId: row.last_completed_workout_id,
    createdAt: row.created_at,
    archivedAt: row.archived_at
  }));
};

export const addProgram = async (program: Program): Promise<void> => {
  const deviceId = getDeviceId();

  // Deactivate any existing active program first
  await supabase
    .from('programs')
    .update({ active: false, archived_at: new Date().toISOString() })
    .eq('device_id', deviceId)
    .eq('active', true);

  await supabase.from('programs').insert({
    id: program.id,
    device_id: deviceId,
    name: program.name,
    active: true,
    workouts: program.workouts,
    last_completed_workout_id: program.lastCompletedWorkoutId || null,
    created_at: program.createdAt
  });
};

export const updateProgram = async (programId: string, updates: Partial<Program>): Promise<void> => {
  const deviceId = getDeviceId();

  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.workouts !== undefined) updateData.workouts = updates.workouts;
  if (updates.lastCompletedWorkoutId !== undefined) updateData.last_completed_workout_id = updates.lastCompletedWorkoutId;
  if (updates.active !== undefined) updateData.active = updates.active;
  if (updates.archivedAt !== undefined) updateData.archived_at = updates.archivedAt;

  await supabase
    .from('programs')
    .update(updateData)
    .eq('id', programId)
    .eq('device_id', deviceId);
};

export const archiveProgram = async (programId: string): Promise<void> => {
  await updateProgram(programId, {
    active: false,
    archivedAt: new Date().toISOString()
  });
};

export const incrementProgramWorkoutCount = async (programId: string, workoutId: string): Promise<void> => {
  const deviceId = getDeviceId();

  const { data } = await supabase
    .from('programs')
    .select('workouts')
    .eq('id', programId)
    .eq('device_id', deviceId)
    .single();

  if (!data) return;

  const updatedWorkouts = (data.workouts as ProgramWorkout[]).map(w =>
    w.workoutId === workoutId
      ? { ...w, completedCount: w.completedCount + 1 }
      : w
  );

  await supabase
    .from('programs')
    .update({
      workouts: updatedWorkouts,
      last_completed_workout_id: workoutId
    })
    .eq('id', programId)
    .eq('device_id', deviceId);
};

// Get the next workout in the program sequence
export const getNextProgramWorkout = (program: Program): ProgramWorkout | null => {
  if (program.workouts.length === 0) return null;

  const sorted = [...program.workouts].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  // Check if all workouts have met their targets
  const allCompleted = sorted.every(w => w.completedCount >= w.targetCount);
  if (allCompleted) return null;

  // Find starting position
  let startIndex = 0;
  if (program.lastCompletedWorkoutId) {
    const lastIdx = sorted.findIndex(w => w.workoutId === program.lastCompletedWorkoutId);
    if (lastIdx !== -1) {
      startIndex = (lastIdx + 1) % sorted.length;
    }
  }

  // Find next workout that hasn't met its target
  for (let i = 0; i < sorted.length; i++) {
    const idx = (startIndex + i) % sorted.length;
    if (sorted[idx].completedCount < sorted[idx].targetCount) {
      return sorted[idx];
    }
  }

  return null;
};

