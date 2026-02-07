import { useState, useEffect } from 'react';
import { Program, ProgramWorkout, Workout } from '../types';
import { loadWorkouts, addProgram, updateProgram, archiveProgram, loadArchivedPrograms } from '../utils/storage';

interface ProgramManagerProps {
  onClose: () => void;
  onUpdate: () => void;
  activeProgram: Program | null;
}

export function ProgramManager({ onClose, onUpdate, activeProgram }: ProgramManagerProps) {
  const [mode, setMode] = useState<'main' | 'create' | 'edit' | 'archives'>(activeProgram ? 'main' : 'create');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [archivedPrograms, setArchivedPrograms] = useState<Program[]>([]);
  const [expandedArchive, setExpandedArchive] = useState<string | null>(null);

  // Form state
  const [programName, setProgramName] = useState(activeProgram?.name || '');
  const [selectedWorkouts, setSelectedWorkouts] = useState<ProgramWorkout[]>(
    activeProgram?.workouts ? [...activeProgram.workouts].sort((a, b) => a.sequenceOrder - b.sequenceOrder) : []
  );
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [w, archived] = await Promise.all([loadWorkouts(), loadArchivedPrograms()]);
      setWorkouts(w);
      setArchivedPrograms(archived);
    };
    loadData();
  }, []);

  const handleAddWorkout = (workout: Workout) => {
    const alreadyAdded = selectedWorkouts.some(w => w.workoutId === workout.id);
    if (alreadyAdded) return;

    setSelectedWorkouts([...selectedWorkouts, {
      workoutId: workout.id,
      workoutName: workout.name,
      sequenceOrder: selectedWorkouts.length,
      targetCount: 12,
      completedCount: 0
    }]);
    setShowWorkoutPicker(false);
  };

  const handleRemoveWorkout = (workoutId: string) => {
    const filtered = selectedWorkouts.filter(w => w.workoutId !== workoutId);
    setSelectedWorkouts(filtered.map((w, i) => ({ ...w, sequenceOrder: i })));
  };

  const handleMoveWorkout = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedWorkouts.length) return;

    const updated = [...selectedWorkouts];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSelectedWorkouts(updated.map((w, i) => ({ ...w, sequenceOrder: i })));
  };

  const handleUpdateTarget = (workoutId: string, target: number) => {
    setSelectedWorkouts(selectedWorkouts.map(w =>
      w.workoutId === workoutId ? { ...w, targetCount: Math.max(1, target) } : w
    ));
  };

  const handleSave = async () => {
    if (!programName.trim() || selectedWorkouts.length === 0) return;
    setSaving(true);

    if (mode === 'edit' && activeProgram) {
      await updateProgram(activeProgram.id, {
        name: programName,
        workouts: selectedWorkouts
      });
    } else {
      const program: Program = {
        id: `program-${Date.now()}`,
        name: programName,
        active: true,
        workouts: selectedWorkouts,
        createdAt: new Date().toISOString()
      };
      await addProgram(program);
    }

    setSaving(false);
    onUpdate();
    onClose();
  };

  const handleEndProgram = async () => {
    if (!activeProgram) return;
    await archiveProgram(activeProgram.id);
    onUpdate();
    onClose();
  };

  const getTotalCompleted = (program: Program) =>
    program.workouts.reduce((sum, w) => sum + w.completedCount, 0);
  const getTotalTarget = (program: Program) =>
    program.workouts.reduce((sum, w) => sum + w.targetCount, 0);

  const availableWorkouts = workouts.filter(
    w => !selectedWorkouts.some(sw => sw.workoutId === w.id)
  );

  const renderForm = () => (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Program Name */}
      <div>
        <label className="text-xs font-semibold text-surface-500 uppercase tracking-wide block mb-2">Program Name</label>
        <input
          type="text"
          value={programName}
          onChange={(e) => setProgramName(e.target.value)}
          placeholder="e.g., Strength Building Program"
          className="input"
        />
      </div>

      {/* Selected Workouts */}
      <div>
        <label className="text-xs font-semibold text-surface-500 uppercase tracking-wide block mb-2">
          Workout Sequence ({selectedWorkouts.length} workout{selectedWorkouts.length !== 1 ? 's' : ''})
        </label>

        {selectedWorkouts.length === 0 ? (
          <div className="text-center py-8 bg-surface-50 rounded-xl">
            <p className="text-surface-500 text-sm">No workouts added yet</p>
            <p className="text-surface-400 text-xs mt-1">Add workouts to define your program sequence</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedWorkouts.map((pw, index) => (
              <div key={pw.workoutId} className="card !p-4">
                <div className="flex items-center gap-3">
                  {/* Sequence number */}
                  <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>

                  {/* Workout name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-surface-800 truncate">{pw.workoutName}</p>
                  </div>

                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => handleMoveWorkout(index, 'up')}
                      disabled={index === 0}
                      className={`w-6 h-6 rounded flex items-center justify-center ${
                        index === 0 ? 'text-surface-300' : 'text-surface-500 hover:bg-surface-100'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleMoveWorkout(index, 'down')}
                      disabled={index === selectedWorkouts.length - 1}
                      className={`w-6 h-6 rounded flex items-center justify-center ${
                        index === selectedWorkouts.length - 1 ? 'text-surface-300' : 'text-surface-500 hover:bg-surface-100'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveWorkout(pw.workoutId)}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Target count */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-surface-100">
                  <span className="text-sm text-surface-500">Target completions:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateTarget(pw.workoutId, pw.targetCount - 1)}
                      className="w-8 h-8 rounded-lg bg-surface-100 text-surface-600 flex items-center justify-center hover:bg-surface-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      value={pw.targetCount}
                      onChange={(e) => handleUpdateTarget(pw.workoutId, Number(e.target.value))}
                      className="w-16 input input-sm text-center font-semibold"
                      min={1}
                    />
                    <button
                      onClick={() => handleUpdateTarget(pw.workoutId, pw.targetCount + 1)}
                      className="w-8 h-8 rounded-lg bg-surface-100 text-surface-600 flex items-center justify-center hover:bg-surface-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  {mode === 'edit' && (
                    <span className="text-xs text-surface-400 ml-auto">
                      Done: {pw.completedCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Workout Button */}
        <button
          onClick={() => setShowWorkoutPicker(true)}
          className="w-full mt-3 py-3 border-2 border-dashed border-surface-300 rounded-xl text-surface-500 font-semibold hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Workout
        </button>
      </div>

      {/* End Program (edit mode only) */}
      {mode === 'edit' && activeProgram && (
        <div className="pt-4 border-t border-surface-100">
          {showEndConfirm ? (
            <div className="space-y-3">
              <p className="text-sm text-surface-600 text-center">Are you sure? This will archive the program.</p>
              <div className="flex gap-3">
                <button onClick={handleEndProgram} className="btn-danger flex-1">
                  End Program
                </button>
                <button onClick={() => setShowEndConfirm(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowEndConfirm(true)}
              className="w-full py-3 text-red-500 hover:bg-red-50 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              End Program
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderMain = () => (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Active Program Summary */}
      {activeProgram && (
        <div className="space-y-4">
          <div className="card !p-5">
            <h3 className="font-bold text-lg text-surface-800 mb-3">{activeProgram.name}</h3>
            <div className="space-y-2">
              {[...activeProgram.workouts].sort((a, b) => a.sequenceOrder - b.sequenceOrder).map((w, i) => (
                <div key={w.workoutId} className="flex items-center justify-between text-sm">
                  <span className="text-surface-600">
                    <span className="font-medium text-surface-800">{i + 1}.</span> {w.workoutName}
                  </span>
                  <span className={`font-semibold ${
                    w.completedCount >= w.targetCount ? 'text-success-600' : 'text-surface-500'
                  }`}>
                    {w.completedCount}/{w.targetCount}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-surface-100">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-surface-500">Overall Progress</span>
                <span className="font-semibold text-surface-700">
                  {getTotalCompleted(activeProgram)}/{getTotalTarget(activeProgram)}
                </span>
              </div>
              <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${Math.round((getTotalCompleted(activeProgram) / Math.max(1, getTotalTarget(activeProgram))) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setMode('edit');
              setProgramName(activeProgram.name);
              setSelectedWorkouts([...activeProgram.workouts].sort((a, b) => a.sequenceOrder - b.sequenceOrder));
            }}
            className="btn-primary w-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Program
          </button>
        </div>
      )}

      {/* Archived Programs */}
      {archivedPrograms.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">Archived Programs</h3>
          <div className="space-y-2">
            {archivedPrograms.map(ap => (
              <div key={ap.id} className="card !p-4">
                <button
                  onClick={() => setExpandedArchive(expandedArchive === ap.id ? null : ap.id)}
                  className="w-full flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-surface-700">{ap.name}</p>
                    <p className="text-xs text-surface-400">
                      {getTotalCompleted(ap)}/{getTotalTarget(ap)} completed
                    </p>
                  </div>
                  <svg className={`w-5 h-5 text-surface-400 transition-transform ${expandedArchive === ap.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedArchive === ap.id && (
                  <div className="mt-3 pt-3 border-t border-surface-100 space-y-1">
                    {[...ap.workouts].sort((a, b) => a.sequenceOrder - b.sequenceOrder).map(w => (
                      <div key={w.workoutId} className="flex justify-between text-sm">
                        <span className="text-surface-600">{w.workoutName}</span>
                        <span className="text-surface-500">{w.completedCount}/{w.targetCount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const headerTitle = mode === 'create' ? 'Create Program' : mode === 'edit' ? 'Edit Program' : 'Manage Program';

  return (
    <div className="modal-backdrop">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="gradient-primary text-white p-5 safe-top">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (mode === 'edit' || mode === 'archives') {
                  if (activeProgram) {
                    setMode('main');
                  } else {
                    onClose();
                  }
                } else {
                  onClose();
                }
              }}
              className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {(mode === 'edit' || mode === 'archives') && activeProgram ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
            </button>
            <h2 className="text-xl font-bold">{headerTitle}</h2>
            <div className="w-10" />
          </div>
        </div>

        {/* Content */}
        {(mode === 'create' || mode === 'edit') ? renderForm() : renderMain()}

        {/* Footer */}
        {(mode === 'create' || mode === 'edit') && (
          <div className="p-5 border-t border-surface-100 bg-white">
            <button
              onClick={handleSave}
              disabled={!programName.trim() || selectedWorkouts.length === 0 || saving}
              className="btn-success w-full py-4 text-lg disabled:opacity-50"
            >
              {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Program'}
            </button>
          </div>
        )}
      </div>

      {/* Workout Picker */}
      {showWorkoutPicker && (
        <div className="absolute inset-0 bg-white flex flex-col z-10 animate-slide-up">
          <div className="gradient-primary text-white p-5 safe-top">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowWorkoutPicker(false)}
                className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-xl font-bold">Select Workout</h2>
              <div className="w-10" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {availableWorkouts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-surface-500">No more workouts available</p>
                <p className="text-surface-400 text-sm mt-1">All workouts have been added to the program</p>
              </div>
            ) : (
              availableWorkouts.map(workout => (
                <button
                  key={workout.id}
                  onClick={() => handleAddWorkout(workout)}
                  className="w-full text-left px-5 py-4 border-b border-surface-100 hover:bg-surface-50 transition-colors flex items-center gap-4"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    workout.category === 'Strength' ? 'bg-strength-100' : 'bg-mobility-100'
                  }`}>
                    <svg className={`w-6 h-6 ${
                      workout.category === 'Strength' ? 'text-strength-500' : 'text-mobility-500'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-surface-800">{workout.name}</div>
                    <div className="text-sm text-surface-500">
                      {workout.category} &middot; {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
