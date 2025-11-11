/**
 * Utility functions for formatting
 */

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatBPM(bpm: number): string {
  return Math.round(bpm).toString();
}

export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}
