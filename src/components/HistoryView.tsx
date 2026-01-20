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
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return sessions.filter(session => {
      if (!session || !session.date || !session.name || !Array.isArray(session.exercises)) {
        return false;
      }

      const sessionDate = parseISO(session.date);
      if (!isValid(sessionDate)) {
        return false;
      }

      const matchesSearch = searchTerm === '' ||
        session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.exercises.some(ex => ex.exerciseName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (session.workoutName?.toLowerCase().includes(searchTerm.toLowerCase()));

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
    <div key={exercise.id} className={`${inSuperset ? '' : 'py-3'}`}>
      <div className="font-semibold text-surface-800">{exercise.exerciseName}</div>
      <div className="mt-2 space-y-1.5">
        {exercise.sets.map((set, idx) => (
          <div key={set.id} className="flex items-center gap-3 text-sm">
            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-medium ${
              set.completed
                ? 'bg-success-500 text-white'
                : 'bg-surface-200 text-surface-500'
            }`}>
              {idx + 1}
            </span>
            <span className={set.completed ? 'text-surface-700' : 'text-surface-400'}>
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
      <div className="divide-y divide-surface-100">
        {session.exercises.map(ex => {
          if (ex.supersetGroupId) {
            if (!processedSupersets.has(ex.supersetGroupId)) {
              processedSupersets.add(ex.supersetGroupId);
              const groupExercises = supersetGroups.get(ex.supersetGroupId) || [];
              return (
                <div key={ex.supersetGroupId} className="py-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-strength-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-strength-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-strength-600 uppercase tracking-wide">Superset</span>
                  </div>
                  <div className="pl-4 border-l-2 border-strength-200 space-y-4">
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

  // Calculate totals for stats
  const totalExercises = filteredSessions.reduce((sum, s) => sum + s.exercises.length, 0);
  const totalCompletedSets = filteredSessions.reduce((sum, s) => sum + getSessionStats(s).completedSets, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filter */}
      <div className="p-5 bg-white border-b border-surface-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-surface-800">History</h2>
            <p className="text-sm text-surface-500 mt-0.5">Your workout journey</p>
          </div>
        </div>

        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-12"
          />
        </div>

        <div className="flex gap-2">
          {[
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'all', label: 'All Time' }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setDateFilter(filter.value as typeof dateFilter)}
              className={`pill ${dateFilter === filter.value ? 'pill-active' : 'pill-inactive'}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="px-5 py-4 bg-white border-b border-surface-100">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-primary-50 rounded-xl">
            <div className="text-2xl font-bold text-primary-500">{filteredSessions.length}</div>
            <div className="text-xs text-primary-600 font-medium mt-0.5">Sessions</div>
          </div>
          <div className="text-center p-3 bg-success-50 rounded-xl">
            <div className="text-2xl font-bold text-success-500">{totalExercises}</div>
            <div className="text-xs text-success-600 font-medium mt-0.5">Exercises</div>
          </div>
          <div className="text-center p-3 bg-secondary-50 rounded-xl">
            <div className="text-2xl font-bold text-secondary-500">{totalCompletedSets}</div>
            <div className="text-xs text-secondary-600 font-medium mt-0.5">Sets Done</div>
          </div>
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        {sortedDates.length === 0 ? (
          <div className="empty-state py-12">
            <div className="w-20 h-20 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="empty-state-icon w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="empty-state-title">No session history</p>
            <p className="empty-state-text">
              {searchTerm || dateFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Complete your first session to see it here'}
            </p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {sortedDates.map(dateKey => {
              const daySessions = groupedByDate.get(dateKey) || [];
              const parsedDate = parseISO(dateKey);

              return (
                <div key={dateKey}>
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {isValid(parsedDate) ? format(parsedDate, 'd') : '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-surface-800">
                        {isValid(parsedDate) ? format(parsedDate, 'EEEE') : 'Unknown'}
                      </p>
                      <p className="text-xs text-surface-500">
                        {isValid(parsedDate) ? format(parsedDate, 'MMMM yyyy') : ''}
                      </p>
                    </div>
                  </div>

                  {/* Sessions for this date */}
                  <div className="space-y-3">
                    {daySessions.map(session => {
                      const stats = getSessionStats(session);
                      const isExpanded = expandedSessions.has(session.id);

                      return (
                        <div key={session.id} className="card overflow-hidden">
                          {/* Session Summary */}
                          <button
                            onClick={() => toggleExpanded(session.id)}
                            className="w-full text-left -m-5 p-5 hover:bg-surface-50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-surface-800">{session.name}</span>
                                  {session.workoutCategory && (
                                    <span className={session.workoutCategory === 'Strength' ? 'tag-strength' : 'tag-mobility'}>
                                      {session.workoutCategory}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-surface-500 mt-1">
                                  {session.exercises.length} exercise{session.exercises.length !== 1 ? 's' : ''} &middot; {stats.completedSets}/{stats.totalSets} sets
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <svg
                                  className={`w-5 h-5 text-surface-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>

                            {/* Exercise preview when collapsed */}
                            {!isExpanded && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {session.exercises.slice(0, 3).map(ex => (
                                  <span
                                    key={ex.id}
                                    className="px-2.5 py-1 bg-surface-100 text-surface-600 rounded-lg text-xs font-medium"
                                  >
                                    {ex.exerciseName}
                                  </span>
                                ))}
                                {session.exercises.length > 3 && (
                                  <span className="px-2.5 py-1 bg-surface-100 text-surface-500 rounded-lg text-xs font-medium">
                                    +{session.exercises.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </button>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="mt-5 pt-5 border-t border-surface-100">
                              <div className="bg-surface-50 rounded-xl p-4">
                                {renderSessionExercises(session)}

                                {session.notes && (
                                  <div className="mt-4 pt-4 border-t border-surface-200">
                                    <div className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Notes</div>
                                    <p className="text-sm text-surface-700">{session.notes}</p>
                                  </div>
                                )}
                              </div>

                              {/* Volume Stats */}
                              {stats.totalVolume > 0 && (
                                <div className="mt-4 p-4 bg-success-50 rounded-xl">
                                  <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    <span className="text-sm font-semibold text-success-700">
                                      {stats.totalVolume.toLocaleString()} kgs total volume
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="mt-4 flex gap-3">
                                <button
                                  onClick={() => setEditingSession(session)}
                                  className="btn-secondary flex-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>

                                {deleteConfirmId === session.id ? (
                                  <>
                                    <button
                                      onClick={() => handleDeleteSession(session.id)}
                                      className="btn-danger flex-1"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="btn-secondary flex-1"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirmId(session.id)}
                                    className="flex-1 py-3 text-red-500 hover:bg-red-50 rounded-full font-semibold transition-colors flex items-center justify-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
