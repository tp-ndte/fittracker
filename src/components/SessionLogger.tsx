import { useState, useEffect } from 'react';
import { Session, SessionExercise, Workout, Exercise } from '../types';
import { getAllExercises, getAllCategories } from '../utils/exerciseUtils';
import { addSession, updateSession, deleteSession, getLastExerciseHistory, ExerciseHistory } from '../utils/storage';
import { format } from 'date-fns';

interface SessionLoggerProps {
  session?: Session;
  onClose: () => void;
  onSave: () => void;
  initialWorkout?: Workout;
}

// Helper to convert workout to session exercises
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

export function SessionLogger({ session, onClose, onSave, initialWorkout }: SessionLoggerProps) {
  // Initialize state based on session, initialWorkout, or defaults
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
  const [sessionDate, setSessionDate] = useState(
    session?.date || format(new Date(), 'yyyy-MM-dd')
  );
  const [exercises, setExercises] = useState<SessionExercise[]>(initial.exercises);
  const [notes, setNotes] = useState(session?.notes || '');
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [workoutId] = useState<string | undefined>(initial.workoutId);
  const [workoutName] = useState<string | undefined>(initial.workoutName);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  // Accordion state - track which exercises are expanded
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  // Track which exercises are marked complete
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  // Exercise history from previous sessions
  const [exerciseHistory, setExerciseHistory] = useState<Map<string, ExerciseHistory>>(new Map());
  // Track which exercises have details shown
  const [showDetailsFor, setShowDetailsFor] = useState<Set<string>>(new Set());

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

  // Initialize expanded state - all exercises expanded by default for new sessions
  useEffect(() => {
    const allIds = new Set(exercises.map(ex => ex.id));
    setExpandedExercises(allIds);
  }, []); // Only run once on mount

  // Load exercise history for all exercises
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
      sets: [
        { id: `${Date.now()}-1`, reps: 10, weight: 0, completed: false }
      ],
      notes: ''
    };

    setExercises([...exercises, newExercise]);
    // Auto-expand the new exercise
    setExpandedExercises(prev => new Set(prev).add(newExercise.id));

    // Load history for this exercise
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
          sets: [
            ...ex.sets,
            {
              id: `${Date.now()}-${ex.sets.length}`,
              reps: lastSet?.reps || 10,
              weight: lastSet?.weight || 0,
              completed: false
            }
          ]
        };
      }
      return ex;
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.filter(s => s.id !== setId)
        };
      }
      return ex;
    }));
  };

  const updateSet = (exerciseId: string, setId: string, field: 'reps' | 'weight', value: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s =>
            s.id === setId ? { ...s, [field]: value } : s
          )
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
          sets: ex.sets.map(s =>
            s.id === setId ? { ...s, completed: !s.completed } : s
          )
        };
      }
      return ex;
    }));
  };

  // Toggle accordion expand/collapse
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

  // Mark exercise as complete - mark all sets complete, collapse, and show visual
  const markExerciseComplete = (exerciseId: string) => {
    // Mark all sets as completed
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s => ({ ...s, completed: true }))
        };
      }
      return ex;
    }));
    // Add to completed set
    setCompletedExercises(prev => new Set(prev).add(exerciseId));
    // Collapse the exercise
    setExpandedExercises(prev => {
      const next = new Set(prev);
      next.delete(exerciseId);
      return next;
    });
  };

  // Undo exercise completion
  const undoExerciseComplete = (exerciseId: string) => {
    setCompletedExercises(prev => {
      const next = new Set(prev);
      next.delete(exerciseId);
      return next;
    });
    // Expand to show again
    setExpandedExercises(prev => new Set(prev).add(exerciseId));
  };

  // Mark all exercises in a superset as complete
  const markSupersetComplete = (groupId: string) => {
    const groupExercises = supersetGroups.get(groupId) || [];
    // Mark all sets as completed for all exercises in the superset
    setExercises(exercises.map(ex => {
      if (ex.supersetGroupId === groupId) {
        return {
          ...ex,
          sets: ex.sets.map(s => ({ ...s, completed: true }))
        };
      }
      return ex;
    }));
    // Add all exercises to completed set
    setCompletedExercises(prev => {
      const next = new Set(prev);
      groupExercises.forEach(ex => next.add(ex.id));
      return next;
    });
    // Collapse all exercises in the superset
    setExpandedExercises(prev => {
      const next = new Set(prev);
      groupExercises.forEach(ex => next.delete(ex.id));
      return next;
    });
  };

  // Undo superset completion
  const undoSupersetComplete = (groupId: string) => {
    const groupExercises = supersetGroups.get(groupId) || [];
    setCompletedExercises(prev => {
      const next = new Set(prev);
      groupExercises.forEach(ex => next.delete(ex.id));
      return next;
    });
    // Expand all exercises to show again
    setExpandedExercises(prev => {
      const next = new Set(prev);
      groupExercises.forEach(ex => next.add(ex.id));
      return next;
    });
  };

  // Check if all exercises in a superset are complete
  const isSupersetComplete = (groupId: string): boolean => {
    const groupExercises = supersetGroups.get(groupId) || [];
    return groupExercises.every(ex => completedExercises.has(ex.id));
  };

  // Update exercise notes
  const updateExerciseNotes = (exerciseId: string, notes: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return { ...ex, notes };
      }
      return ex;
    }));
  };

  // Toggle showing exercise details
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

  // Get exercise details from library
  const getExerciseDetails = (exerciseId: string): string | undefined => {
    return allExercises.find(ex => ex.id === exerciseId)?.details;
  };

  // Determine if this is a new session from a workout (not editing)
  const isNewWorkoutSession = !session && !!initialWorkout;

  const handleSave = async () => {
    // For new workout sessions, use the workout name; otherwise require manual entry
    const finalName = isNewWorkoutSession ? workoutName || 'Workout Session' : sessionName;

    if (!finalName.trim() || exercises.length === 0) {
      alert('Please add a session name and at least one exercise');
      return;
    }

    const sessionData: Session = {
      id: session?.id || `${Date.now()}`,
      date: isNewWorkoutSession ? format(new Date(), 'yyyy-MM-dd') : sessionDate,
      name: finalName,
      exercises,
      notes,
      workoutId,
      workoutName
    };

    if (session) {
      await updateSession(session.id, sessionData);
    } else {
      await addSession(sessionData);
    }

    onSave();
    onClose();
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

  // Group exercises by superset
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

  // Get exercises grouped for display
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

  // Get exercise category from library
  const getExerciseCategory = (exerciseId: string): string | undefined => {
    return allExercises.find(ex => ex.id === exerciseId)?.category;
  };

  // Check if exercise is in a category that should skip history display
  const shouldShowHistory = (exerciseId: string): boolean => {
    const category = getExerciseCategory(exerciseId)?.toLowerCase();
    return category !== 'warm up' && category !== 'mobility';
  };

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
        className={`${inSuperset ? 'bg-white' : 'border border-gray-200 rounded-lg'} overflow-hidden ${
          isCompleted ? 'bg-green-50 border-green-300' : ''
        }`}
      >
        {/* Accordion Header */}
        <div
          className={`p-4 flex items-center justify-between cursor-pointer ${
            isCompleted ? 'bg-green-100' : 'bg-gray-50'
          }`}
          onClick={() => toggleExpanded(exercise.id)}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Expand/Collapse Icon */}
            <svg
              className={`w-5 h-5 flex-shrink-0 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {/* Completion indicator */}
            {isCompleted && (
              <span className="w-6 h-6 flex-shrink-0 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                ✓
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h3 className={`font-semibold text-lg truncate ${isCompleted ? 'text-green-800' : ''}`}>
                {exercise.exerciseName}
              </h3>
              <span className="text-sm text-gray-500">
                {exercise.sets.filter(s => s.completed).length}/{exercise.sets.length} sets
              </span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeExercise(exercise.id);
            }}
            className="text-red-500 text-xl ml-2 flex-shrink-0"
          >
            &times;
          </button>
        </div>

        {/* Accordion Content */}
        {isExpanded && (
          <div className="p-4 space-y-4 border-t border-gray-200">
            {/* Exercise Details (if available) */}
            {exerciseDetails && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg">
                <button
                  onClick={() => toggleShowDetails(exercise.id)}
                  className="w-full px-3 py-2 flex items-center justify-between text-sm text-blue-700"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Exercise Details
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showingDetails ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showingDetails && (
                  <div className="px-3 pb-3 text-sm text-blue-800 whitespace-pre-wrap">
                    {exerciseDetails}
                  </div>
                )}
              </div>
            )}

            {/* Previous Session History - skip for warm up/mobility */}
            {history && showHistory && (
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Last time ({format(new Date(history.date), 'MMM d')}):
                </div>
                <div className="text-sm text-gray-700">
                  {history.sets.map((s, i) => (
                    <span key={i}>
                      {i > 0 && ' | '}
                      {s.reps}×{s.weight}kg
                    </span>
                  ))}
                </div>
                {history.notes && (
                  <div className="mt-2 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                    Note: {history.notes}
                  </div>
                )}
              </div>
            )}

            {/* Sets */}
            <div className="space-y-2">
              {exercise.sets.map((set, idx) => (
                <div key={set.id} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSetComplete(exercise.id, set.id)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      set.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {set.completed && '✓'}
                  </button>
                  <span className="text-sm font-medium w-6 flex-shrink-0">#{idx + 1}</span>
                  <input
                    type="number"
                    value={set.reps}
                    onChange={(e) => updateSet(exercise.id, set.id, 'reps', Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                    placeholder="Reps"
                  />
                  <span className="text-sm flex-shrink-0">reps</span>
                  <input
                    type="number"
                    value={set.weight}
                    onChange={(e) => updateSet(exercise.id, set.id, 'weight', Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                    placeholder="Weight"
                    step="0.5"
                  />
                  <span className="text-sm flex-shrink-0">kgs</span>
                  {exercise.sets.length > 1 && (
                    <button
                      onClick={() => removeSet(exercise.id, set.id)}
                      className="text-red-500 ml-auto flex-shrink-0"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => addSet(exercise.id)}
                className="text-blue-600 text-sm font-medium"
              >
                + Add Set
              </button>
            </div>

            {/* Exercise Notes */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Notes for this exercise</label>
              <textarea
                value={exercise.notes || ''}
                onChange={(e) => updateExerciseNotes(exercise.id, e.target.value)}
                placeholder="Add notes (e.g., 'increase weight next time')..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>

            {/* Mark Complete Button - only show for non-superset exercises */}
            {!inSuperset && (
              !isCompleted ? (
                <button
                  onClick={() => markExerciseComplete(exercise.id)}
                  className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mark Complete
                </button>
              ) : (
                <button
                  onClick={() => undoExerciseComplete(exercise.id)}
                  className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                >
                  Undo Complete
                </button>
              )
            )}
          </div>
        )}

        {/* Collapsed completed indicator */}
        {!isExpanded && isCompleted && (
          <div className="px-4 pb-2 text-sm text-green-600">
            Tap to expand and review
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between safe-top">
          <button onClick={onClose} className="text-2xl">&times;</button>
          <h2 className="text-xl font-bold">{session ? 'Edit' : 'New'} Session</h2>
          <button onClick={handleSave} className="font-semibold">Save</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Session Details */}
          <div className="space-y-3">
            {/* Only show name/date fields when editing an existing session */}
            {session && (
              <>
                <input
                  type="text"
                  placeholder="Session Name"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </>
            )}
            {workoutName && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Workout: <strong>{workoutName}</strong></span>
              </div>
            )}
          </div>

          {/* Exercises */}
          <div className="space-y-3">
            {getGroupedExercises().map((item) => {
              if ('type' in item && item.type === 'superset') {
                return (
                  <div
                    key={item.groupId}
                    className={`border-2 rounded-lg overflow-hidden ${
                      isSupersetComplete(item.groupId) ? 'border-green-400 bg-green-50' : 'border-orange-300'
                    }`}
                  >
                    <div className={`px-3 py-2 flex items-center gap-2 ${
                      isSupersetComplete(item.groupId) ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      {isSupersetComplete(item.groupId) ? (
                        <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
                      ) : (
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                      <span className={`text-sm font-medium ${
                        isSupersetComplete(item.groupId) ? 'text-green-800' : 'text-orange-800'
                      }`}>
                        Superset ({item.exercises.length} exercises)
                      </span>
                    </div>
                    <div className={`divide-y ${
                      isSupersetComplete(item.groupId) ? 'divide-green-200 bg-green-50' : 'divide-orange-200 bg-orange-50'
                    }`}>
                      {item.exercises.map(ex => renderExerciseCard(ex, true))}
                    </div>
                    {/* Superset Complete Button */}
                    <div className="p-3 bg-white border-t border-orange-200">
                      {!isSupersetComplete(item.groupId) ? (
                        <button
                          onClick={() => markSupersetComplete(item.groupId)}
                          className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Mark Superset Complete
                        </button>
                      ) : (
                        <button
                          onClick={() => undoSupersetComplete(item.groupId)}
                          className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                        >
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
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 font-medium hover:border-blue-500 hover:text-blue-500"
          >
            + Add Exercise
          </button>

          {/* Notes */}
          <textarea
            placeholder="Session notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />

          {/* Delete Button */}
          {session && (
            <>
              {showDeleteConfirm ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
                >
                  Delete Session
                </button>
              )}
            </>
          )}
        </div>

        {/* Exercise Picker Modal */}
        {showExercisePicker && (
          <div className="absolute inset-0 bg-white flex flex-col z-10">
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between safe-top">
              <button onClick={() => setShowExercisePicker(false)} className="text-2xl">
                &larr;
              </button>
              <h2 className="text-xl font-bold">Select Exercise</h2>
              <div className="w-8"></div>
            </div>

            <div className="p-4 space-y-3 border-b">
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
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
                  className="w-full text-left p-4 border-b border-gray-200 hover:bg-gray-50"
                >
                  <div className="font-semibold">{exercise.name}</div>
                  <div className="text-sm text-gray-500">{exercise.category}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
