import { useState, useEffect } from 'react';
import { Workout, WorkoutExercise } from '../types';
import { loadWorkouts, deleteWorkout } from '../utils/storage';
import { WorkoutEditor } from './WorkoutEditor';

export function WorkoutLibrary() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | undefined>(undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'Strength' | 'Mobility'>('all');

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

  const filteredWorkouts = workouts.filter(w =>
    filter === 'all' || w.category === filter
  );

  const strengthCount = workouts.filter(w => w.category === 'Strength').length;
  const mobilityCount = workouts.filter(w => w.category === 'Mobility').length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 bg-white border-b border-surface-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-surface-800">Workouts</h2>
            <p className="text-sm text-surface-500 mt-0.5">{workouts.length} workout{workouts.length !== 1 ? 's' : ''} created</p>
          </div>
          <button
            onClick={handleCreateWorkout}
            className="btn-primary btn-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`pill ${filter === 'all' ? 'pill-active' : 'pill-inactive'}`}
          >
            All ({workouts.length})
          </button>
          <button
            onClick={() => setFilter('Strength')}
            className={`pill ${filter === 'Strength' ? 'bg-strength-500 text-white' : 'pill-inactive'}`}
          >
            Strength ({strengthCount})
          </button>
          <button
            onClick={() => setFilter('Mobility')}
            className={`pill ${filter === 'Mobility' ? 'bg-mobility-500 text-white' : 'pill-inactive'}`}
          >
            Mobility ({mobilityCount})
          </button>
        </div>
      </div>

      {/* Workout Grid */}
      <div className="flex-1 overflow-y-auto p-5">
        {filteredWorkouts.length === 0 ? (
          <div className="empty-state py-12">
            <div className="w-20 h-20 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="empty-state-icon w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="empty-state-title">
              {filter === 'all' ? 'No workouts yet' : `No ${filter.toLowerCase()} workouts`}
            </p>
            <p className="empty-state-text">
              {filter === 'all' ? 'Create your first workout to get started' : `Create a ${filter.toLowerCase()} workout`}
            </p>
            <button
              onClick={handleCreateWorkout}
              className="btn-primary"
            >
              Create Workout
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredWorkouts.map(workout => {
              const supersetCount = getSupersetCount(workout.exercises);
              const isStrength = workout.category === 'Strength';

              return (
                <div
                  key={workout.id}
                  className="card group"
                >
                  {/* Gradient Accent */}
                  <div className={`h-1.5 -mx-5 -mt-5 mb-4 rounded-t-2xl ${isStrength ? 'gradient-strength' : 'gradient-mobility'}`} />

                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => handleEditWorkout(workout)}>
                      <h3 className="font-bold text-lg text-surface-800 mb-1">{workout.name}</h3>
                      <span className={isStrength ? 'tag-strength' : 'tag-mobility'}>
                        {workout.category}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditWorkout(workout)}
                        className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center text-surface-500 hover:text-primary-500 hover:bg-primary-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {showDeleteConfirm === workout.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteWorkout(workout.id)}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="px-3 py-1.5 bg-surface-200 text-surface-700 rounded-lg text-xs font-medium hover:bg-surface-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDeleteConfirm(workout.id)}
                          className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center text-surface-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {workout.description && (
                    <p className="text-sm text-surface-500 mt-2 line-clamp-2">{workout.description}</p>
                  )}

                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-surface-100">
                    <div className="flex items-center gap-1.5 text-sm text-surface-600">
                      <svg className="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                    </div>
                    {supersetCount > 0 && (
                      <div className="flex items-center gap-1.5 text-sm text-strength-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {supersetCount} superset{supersetCount !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {/* Exercise Preview Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {workout.exercises.slice(0, 3).map(ex => (
                      <span
                        key={ex.id}
                        className="px-2.5 py-1 bg-surface-100 text-surface-600 rounded-lg text-xs font-medium"
                      >
                        {ex.exerciseName}
                      </span>
                    ))}
                    {workout.exercises.length > 3 && (
                      <span className="px-2.5 py-1 bg-surface-100 text-surface-500 rounded-lg text-xs font-medium">
                        +{workout.exercises.length - 3} more
                      </span>
                    )}
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
