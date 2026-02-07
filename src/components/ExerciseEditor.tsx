import { useState, useEffect } from 'react';
import { Exercise } from '../types';
import { addCustomExercise, updateCustomExercise } from '../utils/storage';
import { generateExerciseId, getAllCategories, isCustomExercise, deleteExercise } from '../utils/exerciseUtils';

interface ExerciseEditorProps {
  exercise?: Exercise;
  onClose: () => void;
  onSave: () => void;
}

export const ExerciseEditor = ({ exercise, onClose, onSave }: ExerciseEditorProps) => {
  const isEditing = !!exercise;

  const getDefaultShowHistory = (cat: string): boolean => {
    const lower = cat.toLowerCase();
    return lower !== 'mobility' && lower !== 'warm up';
  };

  const [name, setName] = useState(exercise?.name || '');
  const [category, setCategory] = useState(exercise?.category || '');
  const [newCategory, setNewCategory] = useState('');
  const [details, setDetails] = useState(exercise?.details || '');
  const [showHistory, setShowHistory] = useState(
    exercise?.showHistory !== undefined ? exercise.showHistory : getDefaultShowHistory(exercise?.category || '')
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [isCustom, setIsCustom] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const categories = await getAllCategories();
      setExistingCategories(categories);

      if (exercise) {
        const custom = await isCustomExercise(exercise.id);
        setIsCustom(custom);
      }
      setLoading(false);
    };
    init();
  }, [exercise]);

  const handleSave = async () => {
    const finalCategory = newCategory || category;
    if (!name || !finalCategory) {
      alert('Name and category are required');
      return;
    }

    if (isEditing && exercise && isCustom) {
      // Update existing custom exercise
      await updateCustomExercise(exercise.id, {
        ...exercise,
        name,
        category: finalCategory,
        details: details.trim() || undefined,
        showHistory
      });
    } else if (!isEditing) {
      // Create new custom exercise
      await addCustomExercise({
        id: generateExerciseId(name),
        name,
        category: finalCategory,
        details: details.trim() || undefined,
        showHistory,
        isCustom: true
      });
    }
    onSave();
    onClose();
  };

  const handleDelete = async () => {
    if (exercise) {
      await deleteExercise(exercise.id);
      onSave();
      onClose();
    }
  };

  // For built-in exercises, only allow viewing (not editing)
  const canEdit = !isEditing || isCustom;

  if (loading) {
    return (
      <div className="modal-backdrop">
        <div className="bg-white p-8 rounded-2xl shadow-card animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-surface-600 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-content w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-200">
          <h2 className="text-xl font-bold text-surface-800">
            {isEditing ? (canEdit ? 'Edit Exercise' : 'View Exercise') : 'Create Exercise'}
          </h2>
          <button onClick={onClose} className="p-2 text-surface-400 hover:text-surface-600 rounded-full hover:bg-surface-100 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Exercise Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
              className={`input ${!canEdit ? 'bg-surface-100 text-surface-500 cursor-not-allowed' : ''}`}
              placeholder="e.g., Cable Flyes"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Category *</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {[...existingCategories].sort((a, b) => a.localeCompare(b)).map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    if (!canEdit) return;
                    setCategory(cat);
                    if (!isEditing) setShowHistory(getDefaultShowHistory(cat));
                  }}
                  disabled={!canEdit}
                  className={`pill transition-all duration-200 ${
                    category === cat && !newCategory
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                  } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {canEdit && (
              <input
                type="text"
                value={newCategory}
                onChange={(e) => { setNewCategory(e.target.value); setCategory(''); }}
                className="input"
                placeholder="Or enter a new category"
              />
            )}
          </div>

          {/* Details */}
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Details</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              disabled={!canEdit}
              rows={4}
              className={`input resize-none ${!canEdit ? 'bg-surface-100 text-surface-500 cursor-not-allowed' : ''}`}
              placeholder="Add notes, instructions, or tips for this exercise..."
            />
          </div>

          {/* Show History Toggle */}
          <div className={`flex items-center justify-between p-4 bg-surface-50 rounded-xl ${!canEdit ? 'opacity-60' : ''}`}>
            <div>
              <p className="text-sm font-semibold text-surface-700">Show previous performance</p>
              <p className="text-xs text-surface-500 mt-0.5">Display last session's sets during workouts</p>
            </div>
            <button
              onClick={() => canEdit && setShowHistory(!showHistory)}
              disabled={!canEdit}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                showHistory ? 'bg-primary-500' : 'bg-surface-300'
              } ${!canEdit ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                showHistory ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-surface-200 bg-surface-50 space-y-3">
          {/* Delete button - available for ALL exercises */}
          {isEditing && (
            <>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <span className="text-sm text-red-700 font-medium flex-1">Delete this exercise?</span>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-surface-200 text-surface-700 rounded-xl font-semibold hover:bg-surface-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2 text-red-500 hover:text-red-600 font-semibold transition-colors"
                >
                  Delete Exercise
                </button>
              )}
            </>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              {canEdit ? 'Cancel' : 'Close'}
            </button>
            {canEdit && (
              <button
                onClick={handleSave}
                className="btn-primary flex-1"
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
