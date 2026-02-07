import { useState, useEffect } from 'react';
import { SessionExercise } from '../types';
import { loadSessions } from '../utils/storage';
import { format } from 'date-fns';
import { LineChart, Line, YAxis, ResponsiveContainer, Tooltip, LabelList } from 'recharts';

interface ExerciseStatsProps {
  exerciseId: string;
  exerciseName: string;
}

interface SessionRecord {
  date: string;
  sessionName: string;
  maxWeight: number;
  sets: { reps: number; weight: number }[];
}

export function ExerciseStats({ exerciseId }: ExerciseStatsProps) {
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const sessions = await loadSessions();

      const exerciseRecords: SessionRecord[] = [];
      for (const session of sessions) {
        const exerciseData = session.exercises.find(
          (ex: SessionExercise) => ex.exerciseId === exerciseId
        );
        if (exerciseData) {
          const completedSets = exerciseData.sets.filter(s => s.completed && s.weight > 0);
          if (completedSets.length === 0) continue;
          const maxWeight = Math.max(...completedSets.map(s => s.weight));
          exerciseRecords.push({
            date: session.date,
            sessionName: session.name,
            maxWeight,
            sets: completedSets.map(s => ({ reps: s.reps, weight: s.weight }))
          });
        }
      }

      // Sort by date ascending for chart
      exerciseRecords.sort((a, b) => a.date.localeCompare(b.date));
      setRecords(exerciseRecords);
      setLoading(false);
    };
    load();
  }, [exerciseId]);

  if (loading) {
    return (
      <div className="py-8 text-center text-surface-400 text-sm">Loading stats...</div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="py-6 text-center">
        <div className="w-12 h-12 bg-surface-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm text-surface-500">No performance data yet</p>
        <p className="text-xs text-surface-400 mt-1">Complete sessions with this exercise to see stats</p>
      </div>
    );
  }

  const allTimeMax = Math.max(...records.map(r => r.maxWeight));
  const mostRecent = records[records.length - 1];
  const chartData = records.slice(-6);

  // Check if weight is trending up, down, or flat
  const getTrend = () => {
    if (chartData.length < 2) return null;
    const first = chartData[0].maxWeight;
    const last = chartData[chartData.length - 1].maxWeight;
    if (last > first) return 'up';
    if (last < first) return 'down';
    return 'flat';
  };
  const trend = getTrend();

  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-50 rounded-xl p-3.5">
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1">All-Time Max</p>
          <p className="text-2xl font-bold text-surface-800">{allTimeMax}<span className="text-sm font-medium text-surface-500 ml-1">kg</span></p>
        </div>
        <div className="bg-surface-50 rounded-xl p-3.5">
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1">Last Session</p>
          <p className="text-2xl font-bold text-surface-800">{mostRecent.maxWeight}<span className="text-sm font-medium text-surface-500 ml-1">kg</span></p>
          <p className="text-xs text-surface-400 mt-0.5">
            {mostRecent.sets.length} set{mostRecent.sets.length !== 1 ? 's' : ''} &middot; {format(new Date(mostRecent.date), 'MMM d')}
          </p>
        </div>
      </div>

      {/* Progress Chart */}
      {chartData.length >= 2 && (
        <div className="bg-surface-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Progress (Last {chartData.length} Sessions)</p>
            {trend && (
              <span className={`text-xs font-semibold flex items-center gap-1 ${
                trend === 'up' ? 'text-success-600' : trend === 'down' ? 'text-red-500' : 'text-surface-500'
              }`}>
                {trend === 'up' && (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                )}
                {trend === 'down' && (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
                {trend === 'flat' && '—'}
                {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
              </span>
            )}
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 5, left: 30 }}>
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload as SessionRecord;
                    return (
                      <div className="bg-surface-800 text-white px-3 py-2 rounded-lg text-xs shadow-lg">
                        <p className="font-semibold">{data.maxWeight} kg</p>
                        <p className="text-surface-300">{format(new Date(data.date), 'MMM d, yyyy')}</p>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="maxWeight"
                  stroke="#00308F"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#00308F', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#00308F', strokeWidth: 2, stroke: '#fff' }}
                >
                  <LabelList
                    dataKey="maxWeight"
                    position="top"
                    offset={10}
                    formatter={(v: number) => `${v}kg`}
                    style={{ fontSize: 11, fontWeight: 600, fill: '#6B7280' }}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Session History */}
      <div>
        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Session History</p>
        <div className="space-y-2">
          {[...records].reverse().map((record, i) => (
            <div key={i} className="bg-surface-50 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-surface-800">
                  {format(new Date(record.date), 'MMM d, yyyy')}
                </span>
                <span className="text-sm font-bold text-primary-600">{record.maxWeight} kg</span>
              </div>
              <div className="text-xs text-surface-500">
                {record.sets.map((s, j) => (
                  <span key={j}>{j > 0 && ' | '}{s.reps}&times;{s.weight}kg</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
