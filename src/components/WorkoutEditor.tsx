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

  const addExercise = (exercise: Exercise) => {
    const newExercise: WorkoutExercise = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      defaultSets: 3,
      defaultReps: 10
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

  const updateExercise = (exerciseId: string, field: 'defaultSets' | 'defaultReps', value: number) => {
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
      description: description.trim() || undefined,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-lg max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Edit Workout' : 'Create Workout'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Workout Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workout Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Push Day, Leg Day"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <div className="flex gap-2">
              <button
                onClick={() => setCategory('Strength')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  category === 'Strength'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Strength
              </button>
              <button
                onClick={() => setCategory('Mobility')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  category === 'Mobility'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mobility
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional description..."
            />
          </div>

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Exercises</label>
              {exercises.length >= 2 && (
                <button
                  onClick={() => setSupersetMode(!supersetMode)}
                  className={`text-sm font-medium ${
                    supersetMode ? 'text-orange-600' : 'text-gray-500 hover:text-orange-600'
                  }`}
                >
                  {supersetMode ? 'Cancel Superset' : 'Create Superset'}
                </button>
              )}
            </div>

            {supersetMode && (
              <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  Select 2 or more exercises to group as a superset
                </p>
                {selectedForSuperset.size >= 2 && (
                  <button
                    onClick={createSuperset}
                    className="mt-2 px-4 py-1 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
                  >
                    Create Superset ({selectedForSuperset.size} selected)
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2">
              {getGroupedExercises().map((item) => {
                if ('type' in item && item.type === 'superset') {
                  return (
                    <div
                      key={item.groupId}
                      className="border-2 border-orange-300 rounded-lg overflow-hidden bg-orange-50"
                    >
                      <div className="px-3 py-2 bg-orange-100 flex items-center justify-between">
                        <span className="text-sm font-medium text-orange-800">
                          Superset ({item.exercises.length} exercises)
                        </span>
                        <button
                          onClick={() => {
                            item.exercises.forEach(ex => removeFromSuperset(ex.id));
                          }}
                          className="text-xs text-orange-600 hover:text-orange-800"
                        >
                          Ungroup
                        </button>
                      </div>
                      <div className="divide-y divide-orange-200">
                        {item.exercises.map((ex, exIdx) => (
                          <div key={ex.id} className="p-3 bg-white">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">
                                {exIdx + 1}. {ex.exerciseName}
                              </span>
                              <button
                                onClick={() => removeExercise(ex.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Sets:</label>
                                <input
                                  type="number"
                                  value={ex.defaultSets}
                                  onChange={(e) => updateExercise(ex.id, 'defaultSets', Number(e.target.value))}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                  min="1"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Reps:</label>
                                <input
                                  type="number"
                                  value={ex.defaultReps}
                                  onChange={(e) => updateExercise(ex.id, 'defaultReps', Number(e.target.value))}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                  min="1"
                                />
                              </div>
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
                    className={`p-3 border rounded-lg ${
                      supersetMode && selectedForSuperset.has(ex.id)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 bg-white'
                    }`}
                    onClick={() => supersetMode && toggleSupersetSelection(ex.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {supersetMode && (
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              selectedForSuperset.has(ex.id)
                                ? 'border-orange-500 bg-orange-500 text-white'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedForSuperset.has(ex.id) && (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{ex.exerciseName}</span>
                      </div>
                      {!supersetMode && (
                        <button
                          onClick={() => removeExercise(ex.id)}
                          className="text-red-500 hover:text-red-700"
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
                          <label className="text-sm text-gray-600">Sets:</label>
                          <input
                            type="number"
                            value={ex.defaultSets}
                            onChange={(e) => updateExercise(ex.id, 'defaultSets', Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                            min="1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Reps:</label>
                          <input
                            type="number"
                            value={ex.defaultReps}
                            onChange={(e) => updateExercise(ex.id, 'defaultReps', Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                            min="1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Exercise Button */}
            <button
              onClick={() => setShowExercisePicker(true)}
              className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 font-medium"
            >
              + Add Exercise
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Save Workout
            </button>
          </div>
        </div>
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[60]">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold">Add Exercise</h3>
                <button onClick={() => setShowExercisePicker(false)} className="text-2xl text-gray-500">
                  &times;
                </button>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search exercises..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {['All', ...exerciseCategories.filter(c => c !== 'All').sort((a, b) => a.localeCompare(b))].map(cat => (
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
              {filteredExercises.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No exercises found</div>
              ) : (
                filteredExercises.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => addExercise(ex)}
                    className="w-full text-left p-4 border-b border-gray-200 hover:bg-gray-50"
                  >
                    <div className="font-medium">{ex.name}</div>
                    <div className="text-sm text-gray-500">{ex.category}</div>
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
