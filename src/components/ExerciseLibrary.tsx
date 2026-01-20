import { useState, useEffect } from 'react';
import { getAllExercises, getAllCategories, deleteExercise } from '../utils/exerciseUtils';
import { Exercise } from '../types';
import { ExerciseEditor } from './ExerciseEditor';

export function ExerciseLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | undefined>(undefined);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadExercises = async () => {
    const [exerciseData, categoryData] = await Promise.all([
      getAllExercises(),
      getAllCategories()
    ]);
    setExercises(exerciseData);
    setCategories(['All', ...categoryData]);
  };

  useEffect(() => {
    loadExercises();
  }, []);

  const filteredExercises = exercises
    .filter(ex => {
      const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory;
      const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleCreateExercise = () => {
    setEditingExercise(undefined);
    setShowEditor(true);
  };

  const handleEditExercise = (exercise: Exercise, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingExercise(exercise);
    setShowEditor(true);
  };

  const handleEditorSave = () => {
    loadExercises();
    setSelectedExercise(null);
  };

  const handleDeleteExercise = async () => {
    if (selectedExercise) {
      await deleteExercise(selectedExercise.id);
      await loadExercises();
      setSelectedExercise(null);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar with Create Button */}
      <div className="p-5 bg-white border-b border-surface-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-surface-800">Exercises</h2>
            <p className="text-sm text-surface-500 mt-0.5">{exercises.length} exercise{exercises.length !== 1 ? 's' : ''} available</p>
          </div>
          <button
            onClick={handleCreateExercise}
            className="btn-primary btn-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-12"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-5 py-3 bg-white border-b border-surface-100 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {['All', ...categories.filter(c => c !== 'All').sort((a, b) => a.localeCompare(b))].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`pill ${
                selectedCategory === category ? 'pill-active' : 'pill-inactive'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto">
        {filteredExercises.length === 0 ? (
          <div className="empty-state py-12">
            <div className="w-20 h-20 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="empty-state-icon w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <p className="empty-state-title">No exercises found</p>
            <p className="empty-state-text">Try adjusting your search or create a new exercise</p>
            <button
              onClick={handleCreateExercise}
              className="btn-primary"
            >
              Create Exercise
            </button>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {filteredExercises.map(exercise => (
              <div
                key={exercise.id}
                onClick={() => setSelectedExercise(exercise)}
                className="px-5 py-4 hover:bg-surface-50 active:bg-surface-100 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-surface-800 truncate">{exercise.name}</h3>
                    <p className="text-sm text-surface-500">{exercise.category}</p>
                  </div>
                  <button
                    onClick={(e) => handleEditExercise(exercise, e)}
                    className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-surface-400 hover:text-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div className="modal-backdrop" onClick={() => { setSelectedExercise(null); setShowDeleteConfirm(false); }}>
          <div
            className="bg-white w-full h-3/4 sm:h-auto sm:max-h-[80vh] sm:max-w-lg sm:rounded-2xl overflow-hidden flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="gradient-primary text-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2.5 py-1 bg-white/20 rounded-full text-xs font-semibold mb-2">
                    {selectedExercise.category}
                  </span>
                  <h2 className="text-2xl font-bold">{selectedExercise.name}</h2>
                </div>
                <button
                  onClick={() => { setSelectedExercise(null); setShowDeleteConfirm(false); }}
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
              {selectedExercise.details ? (
                <div>
                  <h3 className="font-bold text-surface-800 mb-3">Details</h3>
                  <div className="bg-surface-50 rounded-xl p-4">
                    <p className="text-surface-700 whitespace-pre-wrap">{selectedExercise.details}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-surface-500">No additional details for this exercise</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-5 border-t border-surface-100 space-y-3">
              <button
                onClick={(e) => {
                  handleEditExercise(selectedExercise, e);
                  setSelectedExercise(null);
                }}
                className="btn-secondary w-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Exercise
              </button>

              {showDeleteConfirm ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteExercise}
                    className="btn-danger flex-1"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 text-red-500 hover:bg-red-50 rounded-full font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Exercise
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exercise Editor Modal */}
      {showEditor && (
        <ExerciseEditor
          exercise={editingExercise}
          onClose={() => setShowEditor(false)}
          onSave={handleEditorSave}
        />
      )}
    </div>
  );
}
