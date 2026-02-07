import { useState, useEffect } from 'react';
import { Workout, Program } from '../types';
import { loadActiveProgram, getNextProgramWorkout, getWorkoutById } from '../utils/storage';
import { SessionLogger } from './SessionLogger';
import { ProgramManager } from './ProgramManager';

interface HomeViewProps {
  onNavigate?: (view: string) => void;
}

export function HomeView({ onNavigate }: HomeViewProps) {
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [loadingProgram, setLoadingProgram] = useState(true);
  const [showProgramManager, setShowProgramManager] = useState(false);
  const [programSessionWorkout, setProgramSessionWorkout] = useState<Workout | null>(null);

  const loadData = async () => {
    const programData = await loadActiveProgram();
    setActiveProgram(programData);
    setLoadingProgram(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartProgramSession = async () => {
    if (!activeProgram) return;
    const nextWorkout = getNextProgramWorkout(activeProgram);
    if (!nextWorkout) return;

    const workout = await getWorkoutById(nextWorkout.workoutId);
    if (workout) {
      setProgramSessionWorkout(workout);
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const nextProgramWorkout = activeProgram ? getNextProgramWorkout(activeProgram) : null;
  const programTotalCompleted = activeProgram
    ? activeProgram.workouts.reduce((sum, w) => sum + w.completedCount, 0)
    : 0;
  const programTotalTarget = activeProgram
    ? activeProgram.workouts.reduce((sum, w) => sum + w.targetCount, 0)
    : 0;
  const programPercent = programTotalTarget > 0
    ? Math.round((programTotalCompleted / programTotalTarget) * 100)
    : 0;
  const programComplete = activeProgram && !nextProgramWorkout;

  return (
    <div className="h-full flex flex-col">
      {/* Hero Section */}
      <div className="px-5 py-6 bg-white">
        <h2 className="text-2xl font-bold text-surface-800">{greeting()}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {!loadingProgram && (
          <>
            {activeProgram ? (
              /* ===== ACTIVE PROGRAM CARD ===== */
              <div className="card !p-0 overflow-hidden">
                <div className="h-1.5 gradient-primary" />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-1">Current Program</p>
                      <h3 className="font-bold text-lg text-surface-800">{activeProgram.name}</h3>
                    </div>
                    <button
                      onClick={() => setShowProgramManager(true)}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      Manage
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-surface-500 mb-1.5">
                      <span>{programTotalCompleted} of {programTotalTarget} workouts</span>
                      <span>{programPercent}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${programComplete ? 'bg-success-500' : 'bg-primary-500'}`}
                        style={{ width: `${programPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Individual workout progress */}
                  <div className="text-sm text-surface-600 mb-4">
                    {[...activeProgram.workouts]
                      .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                      .map((w, i, arr) => (
                        <span key={w.workoutId}>
                          <span className={w.completedCount >= w.targetCount ? 'text-success-600 font-medium' : ''}>
                            {w.workoutName}: {w.completedCount}/{w.targetCount}
                          </span>
                          {i < arr.length - 1 && <span className="text-surface-300"> &bull; </span>}
                        </span>
                      ))
                    }
                  </div>

                  {/* Next workout or completion message */}
                  {programComplete ? (
                    <div className="bg-success-50 rounded-xl p-4 mb-4 text-center">
                      <p className="font-bold text-success-700">Program Complete!</p>
                      <p className="text-sm text-success-600 mt-1">All workout targets have been met</p>
                    </div>
                  ) : nextProgramWorkout && (
                    <div className="bg-primary-50 rounded-xl p-3 mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-primary-600 font-medium">Next Up</p>
                        <p className="font-bold text-primary-800">{nextProgramWorkout.workoutName}</p>
                      </div>
                    </div>
                  )}

                  {/* Start Next Workout button */}
                  {!programComplete && nextProgramWorkout && (
                    <button
                      onClick={handleStartProgramSession}
                      className="btn-success w-full py-3.5"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Start Next Workout
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* ===== NO PROGRAM — TWO OPTIONS ===== */
              <div className="space-y-4">
                {/* Create a Program */}
                <div className="card !p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-surface-800 mb-1">Create a Program</h3>
                      <p className="text-sm text-surface-500 mb-3">
                        Build a structured training program with sequential workouts and track your progress
                      </p>
                      <button
                        onClick={() => setShowProgramManager(true)}
                        className="btn-primary"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Program
                      </button>
                    </div>
                  </div>
                </div>

                {/* Start a One-Off Workout */}
                <div className="card !p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-success-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-surface-800 mb-1">Start a One-Off Workout</h3>
                      <p className="text-sm text-surface-500 mb-3">
                        Pick a workout from your library and start a session without a program
                      </p>
                      <button
                        onClick={() => onNavigate?.('library')}
                        className="btn-success"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Browse Workouts
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Session Logger (from program) */}
      {programSessionWorkout && (
        <SessionLogger
          initialWorkout={programSessionWorkout}
          programId={activeProgram?.id}
          activeProgram={activeProgram}
          onClose={() => setProgramSessionWorkout(null)}
          onSave={() => {
            setProgramSessionWorkout(null);
            loadData();
          }}
        />
      )}

      {/* Program Manager */}
      {showProgramManager && (
        <ProgramManager
          activeProgram={activeProgram}
          onClose={() => setShowProgramManager(false)}
          onUpdate={() => {
            setShowProgramManager(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
