/**
 * Format seconds as M:SS or MM:SS
 * Examples: 60 -> "1:00", 90 -> "1:30", 5 -> "0:05", 125 -> "2:05"
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format seconds for compact display in history
 * Examples: 45 -> "45sec", 90 -> "1:30"
 */
export function formatDurationCompact(seconds: number): string {
  if (seconds < 60) return `${seconds}sec`;
  return formatDuration(seconds);
}
