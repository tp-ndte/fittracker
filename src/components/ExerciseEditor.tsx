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

  const [name, setName] = useState(exercise?.name || '');
  const [category, setCategory] = useState(exercise?.category || '');
  const [newCategory, setNewCategory] = useState('');
  const [details, setDetails] = useState(exercise?.details || '');
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
        details: details.trim() || undefined
      });
    } else if (!isEditing) {
      // Create new custom exercise
      await addCustomExercise({
        id: generateExerciseId(name),
        name,
        category: finalCategory,
        details: details.trim() || undefined,
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? (canEdit ? 'Edit Exercise' : 'View Exercise') : 'Create Exercise'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!canEdit ? 'bg-gray-100' : ''}`}
              placeholder="e.g., Cable Flyes"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {existingCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => canEdit && setCategory(cat)}
                  disabled={!canEdit}
                  className={`px-3 py-1 rounded-full text-sm ${
                    category === cat && !newCategory
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${!canEdit ? 'opacity-60' : ''}`}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Or enter a new category"
              />
            )}
          </div>

          {/* Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              disabled={!canEdit}
              rows={4}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${!canEdit ? 'bg-gray-100' : ''}`}
              placeholder="Add notes, instructions, or tips for this exercise..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          {/* Delete button - available for ALL exercises */}
          {isEditing && (
            <>
              {showDeleteConfirm ? (
                <div className="flex gap-2 mb-2">
                  <span className="text-sm text-gray-600 py-2">Delete this exercise?</span>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2 text-red-600 hover:text-red-700 font-medium"
                >
                  Delete Exercise
                </button>
              )}
            </>
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              {canEdit ? 'Cancel' : 'Close'}
            </button>
            {canEdit && (
              <button
                onClick={handleSave}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
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
