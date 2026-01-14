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
      <div className="p-4 bg-white border-b">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleCreateExercise}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="p-4 bg-white border-b overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto">
        {filteredExercises.map(exercise => (
          <div
            key={exercise.id}
            onClick={() => setSelectedExercise(exercise)}
            className="w-full text-left p-4 border-b border-gray-200 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{exercise.name}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">{exercise.category}</div>
              </div>
              <button
                onClick={(e) => handleEditExercise(exercise, e)}
                className="p-2 text-gray-400 hover:text-blue-600"
                title="Edit exercise"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {filteredExercises.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>No exercises found</p>
            <button
              onClick={handleCreateExercise}
              className="mt-4 text-blue-600 font-medium hover:text-blue-700"
            >
              Create a new exercise
            </button>
          </div>
        )}
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full h-3/4 sm:h-auto sm:max-h-[80vh] sm:max-w-lg sm:rounded-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{selectedExercise.name}</h2>
              <button onClick={() => { setSelectedExercise(null); setShowDeleteConfirm(false); }} className="text-2xl">
                &times;
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">Category</h3>
                <p className="text-gray-900">{selectedExercise.category}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-200 space-y-2">
              <button
                onClick={(e) => {
                  handleEditExercise(selectedExercise, e);
                  setSelectedExercise(null);
                }}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Exercise
              </button>

              {/* Delete button - available for all exercises */}
              {showDeleteConfirm ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteExercise}
                    className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center justify-center gap-2"
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
