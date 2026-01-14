import { useState, useRef } from 'react';
import { View } from './types';
import { HomeView } from './components/HomeView';
import { WorkoutLibrary } from './components/WorkoutLibrary';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { HistoryView } from './components/HistoryView';
import { exportBackup, importBackup } from './utils/storage';

// Debug: Check environment variables
const DEBUG_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const DEBUG_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [showSettings, setShowSettings] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    await exportBackup();
    setImportStatus({ type: 'success', message: 'Backup downloaded!' });
    setTimeout(() => setImportStatus(null), 3000);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importBackup(file);
    setImportStatus({
      type: result.success ? 'success' : 'error',
      message: result.message
    });

    if (result.success) {
      setTimeout(() => {
        setShowSettings(false);
        setImportStatus(null);
        window.location.reload();
      }, 1500);
    } else {
      setTimeout(() => setImportStatus(null), 3000);
    }

    // Reset file input
    e.target.value = '';
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'library':
        return <WorkoutLibrary />;
      case 'exercises':
        return <ExerciseLibrary />;
      case 'history':
        return <HistoryView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* DEBUG BANNER - REMOVE AFTER TESTING */}
      <div className="bg-yellow-400 text-black text-xs p-2 text-center font-mono">
        DEBUG: URL={DEBUG_SUPABASE_URL ? 'true' : 'false'} |
        KEY={DEBUG_SUPABASE_KEY ? 'true' : 'false'} |
        URL_START={DEBUG_SUPABASE_URL ? DEBUG_SUPABASE_URL.substring(0, 10) + '...' : 'N/A'}
      </div>

      {/* Header */}
      <header className="bg-blue-600 text-white p-4 safe-top shadow-lg">
        <div className="flex items-center justify-between">
          <div className="w-10" />
          <h1 className="text-2xl font-bold">FitTracker</h1>
          <button
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-blue-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {renderView()}
      </main>

      {/* Bottom Navigation - 4 tabs */}
      <nav className="bg-white border-t border-gray-200 safe-bottom shadow-lg">
        <div className="grid grid-cols-4 h-16">
          {/* Home Tab */}
          <button
            onClick={() => setCurrentView('home')}
            className={`flex flex-col items-center justify-center gap-0.5 ${
              currentView === 'home'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs font-medium">Home</span>
          </button>

          {/* Workouts Tab (Workout Library) */}
          <button
            onClick={() => setCurrentView('library')}
            className={`flex flex-col items-center justify-center gap-0.5 ${
              currentView === 'library'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="text-xs font-medium">Workouts</span>
          </button>

          {/* Exercises Tab */}
          <button
            onClick={() => setCurrentView('exercises')}
            className={`flex flex-col items-center justify-center gap-0.5 ${
              currentView === 'exercises'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="text-xs font-medium">Exercises</span>
          </button>

          {/* History Tab */}
          <button
            onClick={() => setCurrentView('history')}
            className={`flex flex-col items-center justify-center gap-0.5 ${
              currentView === 'history'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs font-medium">History</span>
          </button>
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-2xl">
                &times;
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Data Backup</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Export your data before updates to prevent data loss.
                </p>
                <button
                  onClick={handleExport}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Data
                </button>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Restore Data</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Import a previously exported backup file.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={handleImportClick}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import Data
                </button>
              </div>

              {/* Status Message */}
              {importStatus && (
                <div className={`p-3 rounded-lg text-center font-medium ${
                  importStatus.type === 'success'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {importStatus.message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
