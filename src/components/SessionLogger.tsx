import { useState, useEffect } from 'react';
import { Session, SessionExercise, Workout, Exercise, Program } from '../types';
import { getAllExercises, getAllCategories } from '../utils/exerciseUtils';
import { addSession, updateSession, deleteSession, getLastExerciseHistory, ExerciseHistory, incrementProgramWorkoutCount } from '../utils/storage';
import { format } from 'date-fns';
import { ExerciseStats } from './ExerciseStats';

interface SessionLoggerProps {
  session?: Session;
  onClose: () => void;
  onSave: () => void;
  initialWorkout?: Workout;
  programId?: string;           // Auto-count toward program (from "Start Next Workout")
  activeProgram?: Program | null; // Show "count toward program?" if workout is in program
}

function workoutToExercises(workout: Workout): SessionExercise[] {
  return workout.exercises.map(wEx => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    exerciseId: wEx.exerciseId,
    exerciseName: wEx.exerciseName,
    sets: Array.from({ length: wEx.defaultSets }, (_, i) => ({
      id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      reps: wEx.defaultReps,
      weight: wEx.defaultWeight || 0,
      completed: false
    })),
    supersetGroupId: wEx.supersetGroupId,
    supersetOrder: wEx.supersetOrder
  }));
}

export function SessionLogger({ session, onClose, onSave, initialWorkout, programId, activeProgram }: SessionLoggerProps) {
  const getInitialState = () => {
    if (session) {
      return {
        name: session.name,
        exercises: session.exercises,
        workoutId: session.workoutId,
        workoutName: session.workoutName,
        showSelector: false
      };
    }
    if (initialWorkout) {
      return {
        name: initialWorkout.name,
        exercises: workoutToExercises(initialWorkout),
        workoutId: initialWorkout.id,
        workoutName: initialWorkout.name,
        showSelector: false
      };
    }
    return {
      name: '',
      exercises: [] as SessionExercise[],
      workoutId: undefined,
      workoutName: undefined,
      showSelector: false
    };
  };

  const initial = getInitialState();

  const [sessionName, setSessionName] = useState(initial.name);
  const [sessionDate, setSessionDate] = useState(session?.date || format(new Date(), 'yyyy-MM-dd'));
  const [exercises, setExercises] = useState<SessionExercise[]>(initial.exercises);
  const [notes, setNotes] = useState(session?.notes || '');
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [workoutId] = useState<string | undefined>(initial.workoutId);
  const [workoutName] = useState<string | undefined>(initial.workoutName);
  const [workoutCategory] = useState<'Strength' | 'Mobility' | undefined>(initialWorkout?.category || session?.workoutCategory);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [exerciseHistory, setExerciseHistory] = useState<Map<string, ExerciseHistory>>(new Map());
  const [showDetailsFor, setShowDetailsFor] = useState<Set<string>>(new Set());
  const [showProgramPrompt, setShowProgramPrompt] = useState(false);
  const [showStatsFor, setShowStatsFor] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const [exercisesData, categoriesData] = await Promise.all([
        getAllExercises(),
        getAllCategories()
      ]);
      setAllExercises(exercisesData);
      setCategories(['All', ...categoriesData]);
    };
    loadData();
  }, []);

  useEffect(() => {
    const allIds = new Set(exercises.map(ex => ex.id));
    setExpandedExercises(allIds);
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      const historyMap = new Map<string, ExerciseHistory>();
      for (const ex of exercises) {
        const history = await getLastExerciseHistory(ex.exerciseId, session?.id);
        if (history) {
          historyMap.set(ex.exerciseId, history);
        }
      }
      setExerciseHistory(historyMap);
    };
    if (exercises.length > 0) {
      loadHistory();
    }
  }, [exercises.length, session?.id]);

  const addExercise = async (exerciseId: string) => {
    const exercise = allExercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const newExercise: SessionExercise = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: [{ id: `${Date.now()}-1`, reps: 10, weight: 0, completed: false }],
      notes: ''
    };

    setExercises([...exercises, newExercise]);
    setExpandedExercises(prev => new Set(prev).add(newExercise.id));

    const history = await getLastExerciseHistory(exerciseId, session?.id);
    if (history) {
      setExerciseHistory(prev => new Map(prev).set(exerciseId, history));
    }

    setShowExercisePicker(false);
    setSearchTerm('');
    setSelectedCategory('All');
  };

  const removeExercise = (exerciseId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId));
  };

  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, {
            id: `${Date.now()}-${ex.sets.length}`,
            reps: lastSet?.reps || 10,
            weight: lastSet?.weight || 0,
            completed: false
          }]
        };
      }
      return ex;
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
      }
      return ex;
    }));
  };

  const updateSet = (exerciseId: string, setId: string, field: 'reps' | 'weight', value: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
        };
      }
      return ex;
    }));
  };

  const toggleSetComplete = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, completed: !s.completed } : s)
        };
      }
      return ex;
    }));
  };

  const toggleExpanded = (exerciseId: string) => {
    setExpandedExercises(prev => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  const markExerciseComplete = (exerciseId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return { ...ex, sets: ex.sets.map(s => ({ ...s, completed: true })) };
      }
      return ex;
    }));
    setCompletedExercises(prev => new Set(prev).add(exerciseId));
    setExpandedExercises(prev => {
      const next = new Set(prev);
      next.delete(exerciseId);
      return next;
    });
  };

  const undoExerciseComplete = (exerciseId: string) => {
    setCompletedExercises(prev => {
      const next = new Set(prev);
      next.delete(exerciseId);
      return next;
    });
    setExpandedExercises(prev => new Set(prev).add(exerciseId));
  };

  const markSupersetComplete = (groupId: string) => {
    const groupExercises = supersetGroups.get(groupId) || [];
    setExercises(exercises.map(ex => {
      if (ex.supersetGroupId === groupId) {
        return { ...ex, sets: ex.sets.map(s => ({ ...s, completed: true })) };
      }
      return ex;
    }));
    setCompletedExercises(prev => {
      const next = new Set(prev);
      groupExercises.forEach(ex => next.add(ex.id));
      return next;
    });
    setExpandedExercises(prev => {
      const next = new Set(prev);
      groupExercises.forEach(ex => next.delete(ex.id));
      return next;
    });
  };

  const undoSupersetComplete = (groupId: string) => {
    const groupExercises = supersetGroups.get(groupId) || [];
    setCompletedExercises(prev => {
      const next = new Set(prev);
      groupExercises.forEach(ex => next.delete(ex.id));
      return next;
    });
    setExpandedExercises(prev => {
      const next = new Set(prev);
      groupExercises.forEach(ex => next.add(ex.id));
      return next;
    });
  };

  const isSupersetComplete = (groupId: string): boolean => {
    const groupExercises = supersetGroups.get(groupId) || [];
    return groupExercises.every(ex => completedExercises.has(ex.id));
  };

  const updateExerciseNotes = (exerciseId: string, notes: string) => {
    setExercises(exercises.map(ex => ex.id === exerciseId ? { ...ex, notes } : ex));
  };

  const toggleShowDetails = (exerciseId: string) => {
    setShowDetailsFor(prev => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  const getExerciseDetails = (exerciseId: string): string | undefined => {
    return allExercises.find(ex => ex.id === exerciseId)?.details;
  };

  const isNewWorkoutSession = !session && !!initialWorkout;

  // Check if this workout is in the active program (and not already started from program)
  const workoutInProgram = !programId && activeProgram && workoutId
    ? activeProgram.workouts.find(w => w.workoutId === workoutId)
    : null;

  const buildSessionData = (countTowardProgram: boolean): Session => {
    const finalName = isNewWorkoutSession ? workoutName || 'Workout Session' : sessionName;
    return {
      id: session?.id || `${Date.now()}`,
      date: isNewWorkoutSession ? format(new Date(), 'yyyy-MM-dd') : sessionDate,
      name: finalName,
      exercises,
      notes,
      workoutId,
      workoutName,
      workoutCategory,
      programId: countTowardProgram ? (programId || activeProgram?.id) : undefined
    };
  };

  const saveSession = async (countTowardProgram: boolean) => {
    const sessionData = buildSessionData(countTowardProgram);

    if (session) {
      await updateSession(session.id, sessionData);
    } else {
      await addSession(sessionData);
    }

    // Increment program workout count if counting toward program
    if (countTowardProgram && workoutId) {
      const pid = programId || activeProgram?.id;
      if (pid) {
        await incrementProgramWorkoutCount(pid, workoutId);
      }
    }

    onSave();
    onClose();
  };

  const handleSave = async () => {
    const finalName = isNewWorkoutSession ? workoutName || 'Workout Session' : sessionName;
    if (!finalName.trim() || exercises.length === 0) {
      alert('Please add a session name and at least one exercise');
      return;
    }

    // If started from program "Start Next Workout", auto-count
    if (programId) {
      await saveSession(true);
      return;
    }

    // If workout is in active program, ask user
    if (workoutInProgram && !session) {
      setShowProgramPrompt(true);
      return;
    }

    // Normal save without program
    await saveSession(false);
  };

  const handleDelete = async () => {
    if (session) {
      await deleteSession(session.id);
      onSave();
      onClose();
    }
  };

  const filteredExercises = allExercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ex.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getSupersetGroups = (): Map<string, SessionExercise[]> => {
    const groups = new Map<string, SessionExercise[]>();
    exercises.forEach(ex => {
      if (ex.supersetGroupId) {
        const group = groups.get(ex.supersetGroupId) || [];
        group.push(ex);
        groups.set(ex.supersetGroupId, group);
      }
    });
    return groups;
  };

  const supersetGroups = getSupersetGroups();

  const getGroupedExercises = () => {
    const result: (SessionExercise | { type: 'superset'; groupId: string; exercises: SessionExercise[] })[] = [];
    const processedSupersets = new Set<string>();

    exercises.forEach(ex => {
      if (ex.supersetGroupId) {
        if (!processedSupersets.has(ex.supersetGroupId)) {
          processedSupersets.add(ex.supersetGroupId);
          const groupExercises = supersetGroups.get(ex.supersetGroupId) || [];
          result.push({
            type: 'superset',
            groupId: ex.supersetGroupId,
            exercises: groupExercises.sort((a, b) => (a.supersetOrder || 0) - (b.supersetOrder || 0))
          });
        }
      } else {
        result.push(ex);
      }
    });

    return result;
  };

  const shouldShowHistory = (exerciseId: string): boolean => {
    const exercise = allExercises.find(ex => ex.id === exerciseId);
    if (exercise?.showHistory !== undefined) return exercise.showHistory;
    // Fallback: default based on category
    const category = exercise?.category?.toLowerCase();
    return category !== 'warm up' && category !== 'mobility';
  };

  // Calculate progress
  const totalExercises = exercises.length;
  const completedCount = completedExercises.size;
  const progressPercent = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  const renderExerciseCard = (exercise: SessionExercise, inSuperset: boolean = false) => {
    const isExpanded = expandedExercises.has(exercise.id);
    const isCompleted = completedExercises.has(exercise.id);
    const exerciseDetails = getExerciseDetails(exercise.exerciseId);
    const showingDetails = showDetailsFor.has(exercise.id);
    const history = exerciseHistory.get(exercise.exerciseId);
    const showHistory = shouldShowHistory(exercise.exerciseId);

    return (
      <div
        key={exercise.id}
        className={`${inSuperset ? 'bg-white' : 'card'} overflow-hidden ${
          isCompleted
            ? `ring-2 ring-success-300 ${isExpanded ? 'bg-success-50' : 'bg-success-100'}`
            : ''
        }`}
      >
        {/* Accordion Header */}
        <div
          className={`${inSuperset ? 'p-4' : '-m-5 p-5'} flex items-center justify-between cursor-pointer transition-colors ${
            isCompleted ? 'bg-success-100' : 'hover:bg-surface-50'
          }`}
          onClick={() => toggleExpanded(exercise.id)}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            } ${isCompleted ? 'bg-success-500' : 'bg-surface-100'}`}>
              <svg className={`w-5 h-5 ${isCompleted ? 'text-white' : 'text-surface-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={`font-bold text-base leading-tight ${isCompleted ? 'text-success-800' : 'text-surface-800'}`}>
                {exercise.exerciseName}
              </h3>
              <span className={`text-sm ${isCompleted ? 'text-success-600' : 'text-surface-500'}`}>
                {exercise.sets.filter(s => s.completed).length}/{exercise.sets.length} sets completed
              </span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowStatsFor({ id: exercise.exerciseId, name: exercise.exerciseName });
            }}
            className="w-8 h-8 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center hover:bg-primary-100 transition-colors ml-3 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeExercise(exercise.id);
            }}
            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors ml-3 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Accordion Content */}
        {isExpanded && (
          <div className={`${inSuperset ? 'p-4 pt-0' : 'mt-5 pt-5 border-t border-surface-100'} space-y-4`}>
            {/* Exercise Details */}
            {exerciseDetails && (
              <div className="bg-primary-50 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleShowDetails(exercise.id)}
                  className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-primary-700"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Exercise Details
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${showingDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showingDetails && (
                  <div className="px-4 pb-4 text-sm text-primary-800 whitespace-pre-wrap">
                    {exerciseDetails}
                  </div>
                )}
              </div>
            )}

            {/* Previous Session History */}
            {history && showHistory && (
              <div className="bg-surface-100 rounded-xl p-4">
                <div className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Last time ({format(new Date(history.date), 'MMM d')})
                </div>
                <div className="text-sm font-medium text-surface-700">
                  {history.sets.map((s, i) => (
                    <span key={i}>{i > 0 && ' | '}{s.reps}×{s.weight}kg</span>
                  ))}
                </div>
                {history.notes && (
                  <div className="mt-2 text-xs text-strength-700 bg-strength-50 rounded-lg px-3 py-2">
                    Note: {history.notes}
                  </div>
                )}
              </div>
            )}

            {/* Sets */}
            <div className="space-y-3">
              {exercise.sets.map((set, idx) => (
                <div key={set.id} className="flex items-center gap-3">
                  <button
                    onClick={() => toggleSetComplete(exercise.id, set.id)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold transition-all ${
                      set.completed
                        ? 'bg-success-500 text-white shadow-button'
                        : 'bg-surface-100 text-surface-500 hover:bg-surface-200'
                    }`}
                  >
                    {set.completed ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : idx + 1}
                  </button>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="number"
                      value={set.reps}
                      onChange={(e) => updateSet(exercise.id, set.id, 'reps', Number(e.target.value))}
                      className="w-16 input input-sm text-center font-semibold"
                    />
                    <span className="text-sm text-surface-500">reps</span>
                    <input
                      type="number"
                      value={set.weight}
                      onChange={(e) => updateSet(exercise.id, set.id, 'weight', Number(e.target.value))}
                      className="w-16 input input-sm text-center font-semibold"
                      step="0.5"
                    />
                    <span className="text-sm text-surface-500">kg</span>
                  </div>
                  {exercise.sets.length > 1 && (
                    <button
                      onClick={() => removeSet(exercise.id, set.id)}
                      className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => addSet(exercise.id)}
              className="btn-ghost text-sm w-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Set
            </button>

            {/* Exercise Notes */}
            <div>
              <label className="text-xs font-semibold text-surface-500 uppercase tracking-wide block mb-2">Notes</label>
              <textarea
                value={exercise.notes || ''}
                onChange={(e) => updateExerciseNotes(exercise.id, e.target.value)}
                placeholder="Add notes (e.g., 'increase weight next time')..."
                className="input text-sm"
                rows={2}
              />
            </div>

            {/* Mark Complete Button */}
            {!inSuperset && (
              !isCompleted ? (
                <button onClick={() => markExerciseComplete(exercise.id)} className="btn-success w-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mark Complete
                </button>
              ) : (
                <button onClick={() => undoExerciseComplete(exercise.id)} className="btn-secondary w-full">
                  Undo Complete
                </button>
              )
            )}
          </div>
        )}

        {/* Collapsed completed hint */}
        {!isExpanded && isCompleted && (
          <div className={`${inSuperset ? 'px-4 pb-3' : 'mt-3'} text-sm text-success-600 font-medium`}>
            Tap to review
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="modal-backdrop">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="gradient-primary text-white p-5 safe-top">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center">
              <h2 className="text-xl font-bold">{session ? 'Edit' : 'Log'} Session</h2>
            </div>
            <button onClick={handleSave} className="px-4 py-2 bg-white/20 rounded-xl font-semibold hover:bg-white/30 transition-colors">
              Save
            </button>
          </div>

          {/* Progress Bar */}
          {totalExercises > 0 && (
            <div className="mt-4">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Session Details */}
          <div className="space-y-3">
            {session && (
              <>
                <input
                  type="text"
                  placeholder="Session Name"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="input"
                />
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="input"
                />
              </>
            )}
            {workoutName && (
              <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-primary-600 font-medium">Workout</p>
                  <p className="font-bold text-primary-800">{workoutName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Exercises */}
          <div className="space-y-6">
            {getGroupedExercises().map((item) => {
              if ('type' in item && item.type === 'superset') {
                const isComplete = isSupersetComplete(item.groupId);
                return (
                  <div
                    key={item.groupId}
                    className={`rounded-2xl overflow-hidden ${
                      isComplete ? 'ring-2 ring-success-400 bg-success-50' : 'ring-2 ring-strength-300'
                    }`}
                  >
                    <div className={`px-4 py-3 flex items-center gap-3 ${
                      isComplete ? 'bg-success-100' : 'bg-strength-100'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isComplete ? 'bg-success-500' : 'bg-strength-500'
                      }`}>
                        {isComplete ? (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm font-bold uppercase tracking-wide ${
                        isComplete ? 'text-success-700' : 'text-strength-700'
                      }`}>
                        Superset ({item.exercises.length})
                      </span>
                    </div>
                    <div className={`divide-y ${isComplete ? 'divide-success-200' : 'divide-strength-200'}`}>
                      {item.exercises.map(ex => renderExerciseCard(ex, true))}
                    </div>
                    <div className="p-4 bg-white">
                      {!isComplete ? (
                        <button onClick={() => markSupersetComplete(item.groupId)} className="btn-success w-full">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Mark Superset Complete
                        </button>
                      ) : (
                        <button onClick={() => undoSupersetComplete(item.groupId)} className="btn-secondary w-full">
                          Undo Complete
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              return renderExerciseCard(item as SessionExercise);
            })}
          </div>

          {/* Add Exercise Button */}
          <button
            onClick={() => setShowExercisePicker(true)}
            className="w-full py-4 border-2 border-dashed border-surface-300 rounded-2xl text-surface-500 font-semibold hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Exercise
          </button>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-surface-500 uppercase tracking-wide block mb-2">Session Notes</label>
            <textarea
              placeholder="How did your workout go?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              rows={3}
            />
          </div>

          {/* Delete Button */}
          {session && (
            <div className="pt-4 border-t border-surface-100">
              {showDeleteConfirm ? (
                <div className="flex gap-3">
                  <button onClick={handleDelete} className="btn-danger flex-1">
                    Confirm Delete
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 text-red-500 hover:bg-red-50 rounded-full font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Session
                </button>
              )}
            </div>
          )}
        </div>

        {/* Exercise Stats Modal */}
        {showStatsFor && (
          <div className="absolute inset-0 bg-white flex flex-col z-10 animate-slide-up">
            <div className="gradient-primary text-white p-5 safe-top">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowStatsFor(null)}
                  className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-lg font-bold truncate mx-3">{showStatsFor.name}</h2>
                <div className="w-10" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <ExerciseStats
                exerciseId={showStatsFor.id}
                exerciseName={showStatsFor.name}
              />
            </div>
          </div>
        )}

        {/* Program Prompt */}
        {showProgramPrompt && activeProgram && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 p-5">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-scale-in">
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-surface-800">Count toward program?</h3>
                <p className="text-sm text-surface-500 mt-2">
                  Count this session toward <span className="font-semibold text-surface-700">{activeProgram.name}</span>?
                </p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowProgramPrompt(false);
                    saveSession(true);
                  }}
                  className="btn-success w-full py-3"
                >
                  Yes, count it
                </button>
                <button
                  onClick={() => {
                    setShowProgramPrompt(false);
                    saveSession(false);
                  }}
                  className="btn-secondary w-full py-3"
                >
                  No, just save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exercise Picker Modal */}
        {showExercisePicker && (
          <div className="absolute inset-0 bg-white flex flex-col z-10">
            <div className="gradient-primary text-white p-5 safe-top">
              <div className="flex items-center justify-between">
                <button onClick={() => setShowExercisePicker(false)} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-xl font-bold">Select Exercise</h2>
                <div className="w-10"></div>
              </div>
            </div>

            <div className="p-5 space-y-4 border-b border-surface-100">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-12"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`pill ${selectedCategory === cat ? 'pill-active' : 'pill-inactive'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredExercises.map(exercise => (
                <button
                  key={exercise.id}
                  onClick={() => addExercise(exercise.id)}
                  className="w-full text-left px-5 py-4 border-b border-surface-100 hover:bg-surface-50 transition-colors flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-surface-800">{exercise.name}</div>
                    <div className="text-sm text-surface-500">{exercise.category}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
