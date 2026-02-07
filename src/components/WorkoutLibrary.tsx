import { useState, useEffect, useMemo } from 'react';
import { Workout, WorkoutExercise, Program } from '../types';
import { loadWorkouts, deleteWorkout, loadActiveProgram, toggleWorkoutFavorite } from '../utils/storage';
import { WorkoutEditor } from './WorkoutEditor';
import { SessionLogger } from './SessionLogger';

export function WorkoutLibrary() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | undefined>(undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'Strength' | 'Mobility'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startingSession, setStartingSession] = useState<Workout | null>(null);
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);

  const loadData = async () => {
    const [data, program] = await Promise.all([
      loadWorkouts(),
      loadActiveProgram()
    ]);
    setWorkouts(data);
    setActiveProgram(program);
  };

  useEffect(() => {
    loadData();
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
    await loadData();
    setShowDeleteConfirm(null);
  };

  const handleEditorSave = async () => {
    await loadData();
    setShowEditor(false);
  };

  const handleStartWorkout = (workout: Workout) => {
    setStartingSession(workout);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, workout: Workout) => {
    e.stopPropagation();
    const newFav = !workout.favorite;
    // Optimistic update
    setWorkouts(prev => prev.map(w => w.id === workout.id ? { ...w, favorite: newFav } : w));
    await toggleWorkoutFavorite(workout.id, newFav);
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

  // Filter + search
  const filteredWorkouts = useMemo(() => {
    return workouts.filter(w => {
      const matchesCategory = filter === 'all' || w.category === filter;
      const matchesSearch = searchTerm === '' ||
        w.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [workouts, filter, searchTerm]);

  // Split favorites from the rest
  const favoriteWorkouts = filteredWorkouts.filter(w => w.favorite);
  const regularWorkouts = filteredWorkouts.filter(w => !w.favorite);

  const strengthCount = workouts.filter(w => w.category === 'Strength').length;
  const mobilityCount = workouts.filter(w => w.category === 'Mobility').length;

  const renderWorkoutCard = (workout: Workout) => {
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

          {/* Favorite + Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => handleToggleFavorite(e, workout)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                workout.favorite
                  ? 'bg-amber-50 text-amber-500'
                  : 'bg-surface-100 text-surface-400 hover:text-amber-500 hover:bg-amber-50'
              }`}
            >
              <svg className="w-5 h-5" fill={workout.favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
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

        {/* Start Workout Button */}
        <button
          onClick={() => handleStartWorkout(workout)}
          className="btn-success btn-sm w-full mt-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Start Workout
        </button>
      </div>
    );
  };

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

        {/* Search Bar */}
        <div className="relative mb-3">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search workouts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-11"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface-200 text-surface-500 flex items-center justify-center hover:bg-surface-300"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
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
              {searchTerm
                ? 'No matches found'
                : filter === 'all'
                  ? 'No workouts yet'
                  : `No ${filter.toLowerCase()} workouts`
              }
            </p>
            <p className="empty-state-text">
              {searchTerm
                ? `No workouts matching "${searchTerm}"`
                : filter === 'all'
                  ? 'Create your first workout to get started'
                  : `Create a ${filter.toLowerCase()} workout`
              }
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateWorkout}
                className="btn-primary"
              >
                Create Workout
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Favorites Section */}
            {favoriteWorkouts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-amber-500" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-surface-600 uppercase tracking-wide">Favorites</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favoriteWorkouts.map(renderWorkoutCard)}
                </div>
              </div>
            )}

            {/* Regular Workouts */}
            {regularWorkouts.length > 0 && (
              <div>
                {favoriteWorkouts.length > 0 && (
                  <h3 className="text-sm font-semibold text-surface-600 uppercase tracking-wide mb-3">All Workouts</h3>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {regularWorkouts.map(renderWorkoutCard)}
                </div>
              </div>
            )}
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

      {/* Session Logger */}
      {startingSession && (
        <SessionLogger
          initialWorkout={startingSession}
          activeProgram={activeProgram}
          onClose={() => setStartingSession(null)}
          onSave={() => {
            setStartingSession(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
