import { useState, useEffect } from 'react';
import { Session, SessionExercise, Workout, Exercise } from '../types';
import { getAllExercises, getAllCategories } from '../utils/exerciseUtils';
import { addSession, updateSession, deleteSession } from '../utils/storage';
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

  const addExercise = (exerciseId: string) => {
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

  const handleSave = async () => {
    if (!sessionName.trim() || exercises.length === 0) {
      alert('Please add a session name and at least one exercise');
      return;
    }

    const sessionData: Session = {
      id: session?.id || `${Date.now()}`,
      date: sessionDate,
      name: sessionName,
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

  const renderExerciseCard = (exercise: SessionExercise, inSuperset: boolean = false) => (
    <div key={exercise.id} className={`${inSuperset ? 'bg-white' : 'border border-gray-200 rounded-lg'} p-4 space-y-3`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{exercise.exerciseName}</h3>
        <button
          onClick={() => removeExercise(exercise.id)}
          className="text-red-500 text-xl"
        >
          &times;
        </button>
      </div>

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

      <button
        onClick={() => addSet(exercise.id)}
        className="text-blue-600 text-sm font-medium"
      >
        + Add Set
      </button>
    </div>
  );

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
            {workoutName && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>From workout: <strong>{workoutName}</strong></span>
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
                    className="border-2 border-orange-300 rounded-lg overflow-hidden"
                  >
                    <div className="px-3 py-2 bg-orange-100 flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm font-medium text-orange-800">
                        Superset ({item.exercises.length} exercises)
                      </span>
                    </div>
                    <div className="divide-y divide-orange-200 bg-orange-50">
                      {item.exercises.map(ex => renderExerciseCard(ex, true))}
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
