/**
 * JDParty Shared Utilities
 * Common utility functions
 */

import type { BPM } from '../types';

/** Generate a unique ID */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Clamp DMX value (0-255) */
export function clampDMX(value: number): number {
  return clamp(Math.round(value), 0, 255);
}

/** Linear interpolation */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/** Map value from one range to another */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/** Check if BPM is within range */
export function isInBPMRange(bpm: BPM, min: BPM, max: BPM): boolean {
  return bpm >= min && bpm <= max;
}

/** Calculate BPM range category */
export function getBPMCategory(bpm: BPM): 'slow' | 'medium' | 'fast' | 'very-fast' {
  if (bpm < 90) return 'slow';
  if (bpm < 120) return 'medium';
  if (bpm < 150) return 'fast';
  return 'very-fast';
}

/** Convert BPM to milliseconds per beat */
export function bpmToMs(bpm: BPM): number {
  return (60 / bpm) * 1000;
}

/** Convert milliseconds to BPM */
export function msToBpm(ms: number): BPM {
  return (60 / ms) * 1000;
}

/** Format timestamp to readable string */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/** Debounce function */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/** Throttle function */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/** Sleep/delay function */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Check if object is empty */
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/** Deep clone object */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/** Create array of numbers from start to end */
export function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/** Chunk array into smaller arrays */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
