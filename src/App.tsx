import { useState } from 'react';
import { View } from './types';
import { HomeView } from './components/HomeView';
import { WorkoutLibrary } from './components/WorkoutLibrary';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { HistoryView } from './components/HistoryView';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');

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
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 safe-top shadow-lg">
        <h1 className="text-2xl font-bold text-center">FitTracker</h1>
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
    </div>
  );
}

export default App;
