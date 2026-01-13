import { useState, useEffect } from 'react';
import { Workout, WorkoutExercise } from '../types';
import { loadWorkouts } from '../utils/storage';
import { getExerciseById } from '../utils/exerciseUtils';
import { SessionLogger } from './SessionLogger';

export function HomeView() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [startingSession, setStartingSession] = useState<Workout | null>(null);

  const loadWorkoutsData = () => {
    setWorkouts(loadWorkouts());
  };

  useEffect(() => {
    loadWorkoutsData();
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
    const fullExercise = getExerciseById(exercise.exerciseId);

    return (
      <div key={exercise.id} className={`${inSuperset ? 'py-2' : 'py-3'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-medium text-gray-900">{exercise.exerciseName}</div>
            <div className="text-sm text-gray-500">
              {exercise.defaultSets} sets x {exercise.defaultReps} reps
            </div>
            {fullExercise?.muscleGroups && (
              <div className="text-xs text-blue-600 mt-1">
                {fullExercise.muscleGroups.join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWorkoutExercises = (workout: Workout) => {
    const supersetGroups = getSupersetGroups(workout.exercises);
    const processedSupersets = new Set<string>();

    return (
      <div className="divide-y divide-gray-100">
        {workout.exercises.map(ex => {
          if (ex.supersetGroupId) {
            if (!processedSupersets.has(ex.supersetGroupId)) {
              processedSupersets.add(ex.supersetGroupId);
              const groupExercises = supersetGroups.get(ex.supersetGroupId) || [];
              return (
                <div key={ex.supersetGroupId} className="py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs font-semibold text-orange-600 uppercase">Superset</span>
                  </div>
                  <div className="pl-4 border-l-2 border-orange-300 divide-y divide-gray-100">
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

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b">
        <h2 className="text-xl font-bold text-gray-900">Start a Session</h2>
        <p className="text-sm text-gray-500 mt-0.5">Select a workout to begin</p>
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
            <p className="text-gray-500">Create workouts in the Workout Library tab first</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {workouts.map(workout => {
              const supersetGroups = getSupersetGroups(workout.exercises);
              const supersetCount = supersetGroups.size;

              return (
                <div
                  key={workout.id}
                  onClick={() => setSelectedWorkout(workout)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow active:bg-gray-50"
                >
                  <div className="flex items-center gap-2 mb-2">
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
                    {workout.exercises.slice(0, 3).map(ex => (
                      <span
                        key={ex.id}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {ex.exerciseName}
                      </span>
                    ))}
                    {workout.exercises.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
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

      {/* Workout Preview Modal */}
      {selectedWorkout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full h-[85vh] sm:h-auto sm:max-h-[85vh] sm:max-w-lg sm:rounded-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{selectedWorkout.name}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedWorkout.category === 'Strength'
                      ? 'bg-blue-500 text-white'
                      : 'bg-green-500 text-white'
                  }`}>
                    {selectedWorkout.category}
                  </span>
                </div>
                <p className="text-sm text-blue-100 mt-0.5">
                  {selectedWorkout.exercises.length} exercise{selectedWorkout.exercises.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={() => setSelectedWorkout(null)} className="text-2xl">
                &times;
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedWorkout.description && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{selectedWorkout.description}</p>
                </div>
              )}

              <h3 className="font-semibold text-gray-900 mb-3">Exercises</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                {renderWorkoutExercises(selectedWorkout)}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => handleStartSession(selectedWorkout)}
                className="w-full py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2 text-lg"
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
            loadWorkoutsData();
          }}
        />
      )}
    </div>
  );
}
