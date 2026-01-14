import { useState, useEffect } from 'react';
import { Workout, WorkoutExercise } from '../types';
import { loadWorkouts, deleteWorkout } from '../utils/storage';
import { WorkoutEditor } from './WorkoutEditor';

export function WorkoutLibrary() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | undefined>(undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const loadWorkoutsData = async () => {
    const data = await loadWorkouts();
    setWorkouts(data);
  };

  useEffect(() => {
    loadWorkoutsData();
  }, []);

  const handleCreateWorkout = () => {
    setEditingWorkout(undefined);
    setShowEditor(true);
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setShowEditor(true);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    await deleteWorkout(workoutId);
    await loadWorkoutsData();
    setShowDeleteConfirm(null);
  };

  const handleEditorSave = async () => {
    await loadWorkoutsData();
    setShowEditor(false);
  };

  const getSupersetCount = (exercises: WorkoutExercise[]): number => {
    const groups = new Set<string>();
    exercises.forEach(ex => {
      if (ex.supersetGroupId) {
        groups.add(ex.supersetGroupId);
      }
    });
    return groups.size;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Workout Library</h2>
            <p className="text-sm text-gray-500 mt-0.5">Create and manage your workout plans</p>
          </div>
          <button
            onClick={handleCreateWorkout}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </div>

      {/* Workout List */}
      <div className="flex-1 overflow-y-auto">
        {workouts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No workouts yet</h3>
            <p className="text-gray-500 mb-4">Create your first workout to get started</p>
            <button
              onClick={handleCreateWorkout}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Create Your First Workout
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {workouts.map(workout => {
              const supersetCount = getSupersetCount(workout.exercises);

              return (
                <div
                  key={workout.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1" onClick={() => handleEditWorkout(workout)}>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg text-gray-900">{workout.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          workout.category === 'Strength'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {workout.category}
                        </span>
                      </div>
                      {workout.description && (
                        <p className="text-sm text-gray-500 mb-2">{workout.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                        </span>
                        {supersetCount > 0 && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                            {supersetCount} superset{supersetCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {workout.exercises.slice(0, 4).map(ex => (
                          <span
                            key={ex.id}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {ex.exerciseName}
                          </span>
                        ))}
                        {workout.exercises.length > 4 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            +{workout.exercises.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleEditWorkout(workout)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                        title="Edit workout"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {showDeleteConfirm === workout.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteWorkout(workout.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDeleteConfirm(workout.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                          title="Delete workout"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Workout Editor */}
      {showEditor && (
        <WorkoutEditor
          workout={editingWorkout}
          onClose={() => setShowEditor(false)}
          onSave={handleEditorSave}
        />
      )}
    </div>
  );
}
