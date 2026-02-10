import { useState, useEffect } from 'react';
import { Workout, WorkoutExercise, Exercise } from '../types';
import { addWorkout, updateWorkout } from '../utils/storage';
import { getAllExercises, getAllCategories } from '../utils/exerciseUtils';

interface WorkoutEditorProps {
  workout?: Workout;
  onClose: () => void;
  onSave: () => void;
}

export const WorkoutEditor = ({ workout, onClose, onSave }: WorkoutEditorProps) => {
  const isEditing = !!workout;

  const [name, setName] = useState(workout?.name || '');
  const [description, setDescription] = useState(workout?.description || '');
  const [category, setCategory] = useState<'Strength' | 'Mobility'>(workout?.category || 'Strength');
  const [exercises, setExercises] = useState<WorkoutExercise[]>(workout?.exercises || []);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedForSuperset, setSelectedForSuperset] = useState<Set<string>>(new Set());
  const [supersetMode, setSupersetMode] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [exerciseCategories, setExerciseCategories] = useState<string[]>(['All']);

  useEffect(() => {
    const loadData = async () => {
      const [exercisesData, categoriesData] = await Promise.all([
        getAllExercises(),
        getAllCategories()
      ]);
      setAllExercises(exercisesData);
      setExerciseCategories(['All', ...categoriesData]);
    };
    loadData();
  }, []);

  const filteredExercises = allExercises.filter(ex => {
    const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory;
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
    const notAlreadyAdded = !exercises.some(e => e.exerciseId === ex.id);
    return matchesCategory && matchesSearch && notAlreadyAdded;
  });

  const getExerciseType = (exerciseId: string): 'weight' | 'time' => {
    return allExercises.find(ex => ex.id === exerciseId)?.exerciseType || 'weight';
  };

  const addExercise = (exercise: Exercise) => {
    const isTimeBased = exercise.exerciseType === 'time';
    const newExercise: WorkoutExercise = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      defaultSets: 3,
      defaultReps: isTimeBased ? 1 : 10,
      defaultDuration: isTimeBased ? 30 : undefined
    };
    setExercises([...exercises, newExercise]);
    setShowExercisePicker(false);
    setSearchTerm('');
  };

  const removeExercise = (exerciseId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId));
    selectedForSuperset.delete(exerciseId);
    setSelectedForSuperset(new Set(selectedForSuperset));
  };

  const updateExercise = (exerciseId: string, field: 'defaultSets' | 'defaultReps' | 'defaultDuration', value: number) => {
    setExercises(exercises.map(ex =>
      ex.id === exerciseId ? { ...ex, [field]: value } : ex
    ));
  };

  const toggleSupersetSelection = (exerciseId: string) => {
    const newSelection = new Set(selectedForSuperset);
    if (newSelection.has(exerciseId)) {
      newSelection.delete(exerciseId);
    } else {
      newSelection.add(exerciseId);
    }
    setSelectedForSuperset(newSelection);
  };

  const createSuperset = () => {
    if (selectedForSuperset.size < 2) return;

    const supersetId = `superset-${Date.now()}`;
    let order = 0;

    setExercises(exercises.map(ex => {
      if (selectedForSuperset.has(ex.id)) {
        return { ...ex, supersetGroupId: supersetId, supersetOrder: order++ };
      }
      return ex;
    }));

    setSelectedForSuperset(new Set());
    setSupersetMode(false);
  };

  const removeFromSuperset = (exerciseId: string) => {
    setExercises(exercises.map(ex =>
      ex.id === exerciseId ? { ...ex, supersetGroupId: undefined, supersetOrder: undefined } : ex
    ));
  };

  const getSupersetGroups = (): Map<string, WorkoutExercise[]> => {
    const groups = new Map<string, WorkoutExercise[]>();
    exercises.forEach(ex => {
      if (ex.supersetGroupId) {
        const group = groups.get(ex.supersetGroupId) || [];
        group.push(ex);
        groups.set(ex.supersetGroupId, group);
      }
    });
    return groups;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a workout name');
      return;
    }
    if (exercises.length === 0) {
      alert('Please add at least one exercise');
      return;
    }

    const workoutData: Workout = {
      id: workout?.id || `workout-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || null,
      category,
      exercises,
      createdAt: workout?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isEditing) {
      await updateWorkout(workout.id, workoutData);
    } else {
      await addWorkout(workoutData);
    }

    onSave();
    onClose();
  };

  const supersetGroups = getSupersetGroups();

  // Group exercises by superset for display
  const getGroupedExercises = () => {
    const result: (WorkoutExercise | { type: 'superset'; groupId: string; exercises: WorkoutExercise[] })[] = [];
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

  return (
    <div className="modal-backdrop">
      <div className="modal-content w-full sm:max-w-lg max-h-[95vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-200">
          <h2 className="text-xl font-bold text-surface-800">
            {isEditing ? 'Edit Workout' : 'Create Workout'}
          </h2>
          <button onClick={onClose} className="p-2 text-surface-400 hover:text-surface-600 rounded-full hover:bg-surface-100 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Workout Name */}
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Workout Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g., Push Day, Leg Day"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Category *</label>
            <div className="flex gap-3">
              <button
                onClick={() => setCategory('Strength')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                  category === 'Strength'
                    ? 'gradient-strength text-white shadow-md'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                }`}
              >
                Strength
              </button>
              <button
                onClick={() => setCategory('Mobility')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                  category === 'Mobility'
                    ? 'gradient-mobility text-white shadow-md'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                }`}
              >
                Mobility
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="input resize-none"
              placeholder="Optional description..."
            />
          </div>

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-surface-700">Exercises</label>
              {exercises.length >= 2 && (
                <button
                  onClick={() => setSupersetMode(!supersetMode)}
                  className={`text-sm font-semibold transition-colors ${
                    supersetMode ? 'text-strength-500' : 'text-surface-500 hover:text-strength-500'
                  }`}
                >
                  {supersetMode ? 'Cancel Superset' : 'Create Superset'}
                </button>
              )}
            </div>

            {supersetMode && (
              <div className="mb-4 p-4 bg-strength-50 border border-strength-200 rounded-xl">
                <p className="text-sm text-strength-700 font-medium">
                  Select 2 or more exercises to group as a superset
                </p>
                {selectedForSuperset.size >= 2 && (
                  <button
                    onClick={createSuperset}
                    className="mt-3 px-4 py-2 gradient-strength text-white rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    Create Superset ({selectedForSuperset.size} selected)
                  </button>
                )}
              </div>
            )}

            <div className="space-y-3">
              {getGroupedExercises().map((item) => {
                if ('type' in item && item.type === 'superset') {
                  return (
                    <div
                      key={item.groupId}
                      className="border-2 border-strength-300 rounded-2xl overflow-hidden bg-strength-50"
                    >
                      <div className="px-4 py-3 bg-strength-100 flex items-center justify-between">
                        <span className="text-sm font-semibold text-strength-700">
                          Superset ({item.exercises.length} exercises)
                        </span>
                        <button
                          onClick={() => {
                            item.exercises.forEach(ex => removeFromSuperset(ex.id));
                          }}
                          className="text-xs font-medium text-strength-600 hover:text-strength-800 transition-colors"
                        >
                          Ungroup
                        </button>
                      </div>
                      <div className="divide-y divide-strength-200">
                        {item.exercises.map((ex, exIdx) => (
                          <div key={ex.id} className="p-4 bg-white">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold text-surface-800">
                                {exIdx + 1}. {ex.exerciseName}
                              </span>
                              <button
                                onClick={() => removeExercise(ex.id)}
                                className="text-red-400 hover:text-red-600 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-surface-500 font-medium">Sets:</label>
                                <input
                                  type="number"
                                  value={ex.defaultSets}
                                  onChange={(e) => updateExercise(ex.id, 'defaultSets', Number(e.target.value))}
                                  className="w-16 px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl text-center font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                  min="1"
                                />
                              </div>
                              {getExerciseType(ex.exerciseId) === 'time' ? (
                                <div className="flex items-center gap-2">
                                  <label className="text-sm text-surface-500 font-medium">Sec:</label>
                                  <input
                                    type="number"
                                    value={ex.defaultDuration || 30}
                                    onChange={(e) => updateExercise(ex.id, 'defaultDuration', Number(e.target.value))}
                                    className="w-16 px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl text-center font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    min="1"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <label className="text-sm text-surface-500 font-medium">Reps:</label>
                                  <input
                                    type="number"
                                    value={ex.defaultReps}
                                    onChange={(e) => updateExercise(ex.id, 'defaultReps', Number(e.target.value))}
                                    className="w-16 px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl text-center font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    min="1"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                const ex = item as WorkoutExercise;
                return (
                  <div
                    key={ex.id}
                    className={`p-4 rounded-xl transition-all duration-200 ${
                      supersetMode && selectedForSuperset.has(ex.id)
                        ? 'border-2 border-strength-500 bg-strength-50'
                        : 'border border-surface-200 bg-white hover:shadow-card'
                    }`}
                    onClick={() => supersetMode && toggleSupersetSelection(ex.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {supersetMode && (
                          <div
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              selectedForSuperset.has(ex.id)
                                ? 'border-strength-500 bg-strength-500 text-white'
                                : 'border-surface-300'
                            }`}
                          >
                            {selectedForSuperset.has(ex.id) && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        )}
                        <span className="font-semibold text-surface-800">{ex.exerciseName}</span>
                      </div>
                      {!supersetMode && (
                        <button
                          onClick={() => removeExercise(ex.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {!supersetMode && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-surface-500 font-medium">Sets:</label>
                          <input
                            type="number"
                            value={ex.defaultSets}
                            onChange={(e) => updateExercise(ex.id, 'defaultSets', Number(e.target.value))}
                            className="w-16 px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl text-center font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            min="1"
                          />
                        </div>
                        {getExerciseType(ex.exerciseId) === 'time' ? (
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-surface-500 font-medium">Sec:</label>
                            <input
                              type="number"
                              value={ex.defaultDuration || 30}
                              onChange={(e) => updateExercise(ex.id, 'defaultDuration', Number(e.target.value))}
                              className="w-16 px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl text-center font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              min="1"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-surface-500 font-medium">Reps:</label>
                            <input
                              type="number"
                              value={ex.defaultReps}
                              onChange={(e) => updateExercise(ex.id, 'defaultReps', Number(e.target.value))}
                              className="w-16 px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl text-center font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              min="1"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Exercise Button */}
            <button
              onClick={() => setShowExercisePicker(true)}
              className="mt-4 w-full py-3 border-2 border-dashed border-surface-300 rounded-xl text-surface-500 hover:border-primary-500 hover:text-primary-500 font-semibold transition-all duration-200"
            >
              + Add Exercise
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-surface-200 bg-surface-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn-primary flex-1"
            >
              Save Workout
            </button>
          </div>
        </div>
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[60] animate-fade-in">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl max-h-[80vh] overflow-hidden flex flex-col animate-slide-up">
            <div className="p-5 border-b border-surface-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-surface-800">Add Exercise</h3>
                <button
                  onClick={() => setShowExercisePicker(false)}
                  className="p-2 text-surface-400 hover:text-surface-600 rounded-full hover:bg-surface-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search exercises..."
                className="input mb-3"
              />
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {['All', ...exerciseCategories.filter(c => c !== 'All').sort((a, b) => a.localeCompare(b))].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`pill whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredExercises.length === 0 ? (
                <div className="p-8 text-center text-surface-500">No exercises found</div>
              ) : (
                filteredExercises.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => addExercise(ex)}
                    className="w-full text-left p-4 border-b border-surface-100 hover:bg-surface-50 transition-colors"
                  >
                    <div className="font-semibold text-surface-800">{ex.name}</div>
                    <div className="text-sm text-surface-500">{ex.category}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
