import { useState, useEffect, useMemo } from 'react';
import { Session, SessionExercise } from '../types';
import { loadSessions, deleteSession } from '../utils/storage';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, isValid } from 'date-fns';
import { SessionLogger } from './SessionLogger';

export function HistoryView() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const fetchSessions = async () => {
    const data = await loadSessions();
    setSessions(data);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
    setDeleteConfirmId(null);
    await fetchSessions();
  };

  const filteredSessions = useMemo(() => {
    const now = new Date();

    // Calendar week: Sunday to Saturday
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // 0 = Sunday
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

    // Calendar month
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return sessions.filter(session => {
      // Validate session has required fields
      if (!session || !session.date || !session.name || !Array.isArray(session.exercises)) {
        return false;
      }

      // Validate date is parseable
      const sessionDate = parseISO(session.date);
      if (!isValid(sessionDate)) {
        return false;
      }

      // Search filter
      const matchesSearch = searchTerm === '' ||
        session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.exercises.some(ex => ex.exerciseName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.workoutName?.toLowerCase().includes(searchTerm.toLowerCase()));

      // Date filter
      let matchesDate = true;

      if (dateFilter === 'week') {
        matchesDate = isWithinInterval(sessionDate, { start: weekStart, end: weekEnd });
      } else if (dateFilter === 'month') {
        matchesDate = isWithinInterval(sessionDate, { start: monthStart, end: monthEnd });
      }

      return matchesSearch && matchesDate;
    });
  }, [sessions, searchTerm, dateFilter]);

  const toggleExpanded = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const getSessionStats = (session: Session) => {
    let totalSets = 0;
    let completedSets = 0;
    let totalVolume = 0;

    session.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        totalSets++;
        if (set.completed) {
          completedSets++;
          totalVolume += set.reps * set.weight;
        }
      });
    });

    return { totalSets, completedSets, totalVolume };
  };

  const getSupersetGroups = (exercises: SessionExercise[]): Map<string, SessionExercise[]> => {
    const groups = new Map<string, SessionExercise[]>();
    exercises.forEach(ex => {
      if (ex.supersetGroupId) {
        const group = groups.get(ex.supersetGroupId) || [];
        group.push(ex);
        groups.set(ex.supersetGroupId, group);
      }
    });
    return groups;
  };

  const renderExerciseDetails = (exercise: SessionExercise, inSuperset: boolean = false) => (
    <div key={exercise.id} className={`${inSuperset ? '' : 'py-2'}`}>
      <div className="font-medium text-gray-800">{exercise.exerciseName}</div>
      <div className="mt-1 space-y-1">
        {exercise.sets.map((set, idx) => (
          <div key={set.id} className="flex items-center gap-2 text-sm">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              set.completed
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}>
              {idx + 1}
            </span>
            <span className={set.completed ? 'text-gray-700' : 'text-gray-400'}>
              {set.reps} reps @ {set.weight} kgs
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSessionExercises = (session: Session) => {
    const supersetGroups = getSupersetGroups(session.exercises);
    const processedSupersets = new Set<string>();

    return (
      <div className="divide-y divide-gray-100">
        {session.exercises.map(ex => {
          if (ex.supersetGroupId) {
            if (!processedSupersets.has(ex.supersetGroupId)) {
              processedSupersets.add(ex.supersetGroupId);
              const groupExercises = supersetGroups.get(ex.supersetGroupId) || [];
              return (
                <div key={ex.supersetGroupId} className="py-2">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs font-medium text-orange-600 uppercase">Superset</span>
                  </div>
                  <div className="pl-4 border-l-2 border-orange-300 space-y-3">
                    {groupExercises
                      .sort((a, b) => (a.supersetOrder || 0) - (b.supersetOrder || 0))
                      .map(gex => renderExerciseDetails(gex, true))}
                  </div>
                </div>
              );
            }
            return null;
          }
          return renderExerciseDetails(ex);
        })}
      </div>
    );
  };

  // Group sessions by date for display
  const groupedByDate = useMemo(() => {
    const groups = new Map<string, Session[]>();
    filteredSessions.forEach(session => {
      const dateKey = session.date;
      const group = groups.get(dateKey) || [];
      group.push(session);
      groups.set(dateKey, group);
    });
    return groups;
  }, [filteredSessions]);

  const sortedDates = Array.from(groupedByDate.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Search and Filter */}
      <div className="p-4 bg-white border-b space-y-3">
        <input
          type="text"
          placeholder="Search sessions, exercises, or workouts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'all', label: 'All Time' }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setDateFilter(filter.value as typeof dateFilter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                dateFilter === filter.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="p-4 bg-white border-b">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{filteredSessions.length}</div>
            <div className="text-xs text-gray-500">Sessions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {filteredSessions.reduce((sum, s) => sum + s.exercises.length, 0)}
            </div>
            <div className="text-xs text-gray-500">Exercises</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {filteredSessions.reduce((sum, s) => {
                const stats = getSessionStats(s);
                return sum + stats.completedSets;
              }, 0)}
            </div>
            <div className="text-xs text-gray-500">Sets Completed</div>
          </div>
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        {sortedDates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">No session history</p>
            <p className="mt-1 text-sm">
              {searchTerm || dateFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Complete your first session to see it here'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedDates.map(dateKey => {
              const daySessions = groupedByDate.get(dateKey) || [];
              const parsedDate = parseISO(dateKey);
              const formattedDate = isValid(parsedDate)
                ? format(parsedDate, 'EEEE, MMMM d, yyyy')
                : dateKey;

              return (
                <div key={dateKey}>
                  {/* Date Header */}
                  <div className="px-4 py-2 bg-gray-100 sticky top-0 z-10">
                    <span className="text-sm font-semibold text-gray-600">{formattedDate}</span>
                  </div>

                  {/* Sessions for this date */}
                  {daySessions.map(session => {
                    const stats = getSessionStats(session);
                    const isExpanded = expandedSessions.has(session.id);

                    return (
                      <div
                        key={session.id}
                        className="bg-white border-b border-gray-100"
                      >
                        {/* Session Summary (clickable) */}
                        <button
                          onClick={() => toggleExpanded(session.id)}
                          className="w-full p-4 text-left hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{session.name}</span>
                                {session.workoutName && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                    {session.workoutName}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {session.exercises.length} exercise{session.exercises.length !== 1 ? 's' : ''} &middot; {stats.completedSets}/{stats.totalSets} sets
                              </div>
                              {stats.totalVolume > 0 && (
                                <div className="text-sm text-gray-400">
                                  {stats.totalVolume.toLocaleString()} kgs total volume
                                </div>
                              )}
                            </div>
                            <svg
                              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>

                          {/* Exercise preview when collapsed */}
                          {!isExpanded && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {session.exercises.slice(0, 4).map(ex => (
                                <span
                                  key={ex.id}
                                  className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                                >
                                  {ex.exerciseName}
                                </span>
                              ))}
                              {session.exercises.length > 4 && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                  +{session.exercises.length - 4} more
                                </span>
                              )}
                            </div>
                          )}
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 bg-gray-50">
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              {renderSessionExercises(session)}

                              {session.notes && (
                                <div className="mt-4 pt-3 border-t border-gray-100">
                                  <div className="text-xs font-medium text-gray-500 mb-1">Notes</div>
                                  <p className="text-sm text-gray-700">{session.notes}</p>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-3 space-y-2">
                              {/* Edit Button */}
                              <button
                                onClick={() => setEditingSession(session)}
                                className="w-full py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Session
                              </button>

                              {/* Delete Button */}
                              {deleteConfirmId === session.id ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleDeleteSession(session.id)}
                                    className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                                  >
                                    Confirm Delete
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmId(session.id)}
                                  className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center justify-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete Session
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Session Editor Modal */}
      {editingSession && (
        <SessionLogger
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSave={() => {
            fetchSessions();
            setEditingSession(null);
          }}
        />
      )}
    </div>
  );
}
