import { useState, useEffect } from 'react';
import { Workout, WorkoutExercise } from '../types';
import { loadWorkouts } from '../utils/storage';
import { SessionLogger } from './SessionLogger';

export function HomeView() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [startingSession, setStartingSession] = useState<Workout | null>(null);

  const loadData = async () => {
    const workoutsData = await loadWorkouts();
    setWorkouts(workoutsData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartSession = (workout: Workout) => {
    setSelectedWorkout(null);
    setStartingSession(workout);
  };

  const getSupersetGroups = (exercises: WorkoutExercise[]): Map<string, WorkoutExercise[]> => {
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

  const renderExercisePreview = (exercise: WorkoutExercise, inSuperset: boolean = false) => {
    return (
      <div key={exercise.id} className={`${inSuperset ? 'py-2.5' : 'py-3'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-medium text-surface-800">{exercise.exerciseName}</div>
            <div className="text-sm text-surface-500">
              {exercise.defaultSets} sets x {exercise.defaultReps} reps
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWorkoutExercises = (workout: Workout) => {
    const supersetGroups = getSupersetGroups(workout.exercises);
    const processedSupersets = new Set<string>();

    return (
      <div className="divide-y divide-surface-100">
        {workout.exercises.map(ex => {
          if (ex.supersetGroupId) {
            if (!processedSupersets.has(ex.supersetGroupId)) {
              processedSupersets.add(ex.supersetGroupId);
              const groupExercises = supersetGroups.get(ex.supersetGroupId) || [];
              return (
                <div key={ex.supersetGroupId} className="py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-strength-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-strength-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-strength-600 uppercase tracking-wide">Superset</span>
                  </div>
                  <div className="pl-4 border-l-2 border-strength-200 divide-y divide-surface-100">
                    {groupExercises
                      .sort((a, b) => (a.supersetOrder || 0) - (b.supersetOrder || 0))
                      .map(gex => renderExercisePreview(gex, true))}
                  </div>
                </div>
              );
            }
            return null;
          }
          return renderExercisePreview(ex);
        })}
      </div>
    );
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Hero Section */}
      <div className="px-5 py-6 bg-white">
        <h2 className="text-2xl font-bold text-surface-800">{greeting()}</h2>
      </div>

      {/* Section Header */}
      <div className="px-5 pt-4 pb-3">
        <h3 className="text-lg font-bold text-surface-800">Your Workouts</h3>
      </div>

      {/* Workout List */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {workouts.length === 0 ? (
          <div className="empty-state py-12">
            <div className="w-20 h-20 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="empty-state-icon w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="empty-state-title">No workouts yet</p>
            <p className="empty-state-text">Create workouts in the Workouts tab to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.map(workout => {
              const supersetGroups = getSupersetGroups(workout.exercises);
              const supersetCount = supersetGroups.size;
              const isStrength = workout.category === 'Strength';

              return (
                <div
                  key={workout.id}
                  onClick={() => setSelectedWorkout(workout)}
                  className="card card-hover cursor-pointer"
                >
                  {/* Card Header with Gradient Accent */}
                  <div className={`h-1.5 -mx-5 -mt-5 mb-4 rounded-t-2xl ${isStrength ? 'gradient-strength' : 'gradient-mobility'}`} />

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-surface-800">{workout.name}</h3>
                      </div>
                      <span className={isStrength ? 'tag-strength' : 'tag-mobility'}>
                        {workout.category}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Workout Preview Modal */}
      {selectedWorkout && (
        <div className="modal-backdrop" onClick={() => setSelectedWorkout(null)}>
          <div
            className="bg-white w-full h-[85vh] sm:h-auto sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl overflow-hidden flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`p-5 text-white ${selectedWorkout.category === 'Strength' ? 'gradient-strength' : 'gradient-mobility'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2.5 py-1 bg-white/20 rounded-full text-xs font-semibold mb-2">
                    {selectedWorkout.category}
                  </span>
                  <h2 className="text-2xl font-bold">{selectedWorkout.name}</h2>
                  <p className="text-white/80 text-sm mt-1">
                    {selectedWorkout.exercises.length} exercise{selectedWorkout.exercises.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedWorkout(null)}
                  className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {selectedWorkout.description && (
                <div className="mb-5 p-4 bg-surface-50 rounded-xl">
                  <p className="text-surface-700">{selectedWorkout.description}</p>
                </div>
              )}

              <h3 className="font-bold text-surface-800 mb-3">Exercises</h3>
              <div className="bg-surface-50 rounded-xl p-4">
                {renderWorkoutExercises(selectedWorkout)}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-surface-100 bg-white">
              <button
                onClick={() => handleStartSession(selectedWorkout)}
                className="btn-success w-full py-4 text-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Logger */}
      {startingSession && (
        <SessionLogger
          initialWorkout={startingSession}
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
