/**
 * Beat Clock
 * Generates beat-synchronized timing signals
 */

import { EventEmitter } from 'events';
import type { BeatClock as BeatClockInfo, BPM } from '@jdparty/shared';
import { bpmToMs } from '@jdparty/shared';

export class BeatClock extends EventEmitter {
  private bpm: BPM = 120;
  private beatNumber: number = 0;
  private isRunning: boolean = false;
  private interval: NodeJS.Timeout | null = null;
  private startTime: number = 0;
  private beatInterval: number = 0;

  constructor() {
    super();
  }

  start(bpm: BPM): void {
    if (this.isRunning) {
      this.stop();
    }

    this.bpm = bpm;
    this.beatNumber = 0;
    this.startTime = Date.now();
    this.beatInterval = bpmToMs(bpm);
    this.isRunning = true;

    // High-resolution timer (check every 10ms)
    this.interval = setInterval(() => {
      this.tick();
    }, 10);

    console.log(`  ▶️  Beat clock started at ${bpm} BPM`);
    this.emit('started', { bpm });
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    console.log('  ⏸️  Beat clock stopped');
    this.emit('stopped');
  }

  private tick(): void {
    if (!this.isRunning) {
      return;
    }

    const elapsed = Date.now() - this.startTime;
    const currentBeat = Math.floor(elapsed / this.beatInterval);

    if (currentBeat > this.beatNumber) {
      this.beatNumber = currentBeat;
      this.onBeat();
    }
  }

  private onBeat(): void {
    const info = this.getInfo();
    this.emit('beat', info);

    // Emit subdivision beats
    this.emitSubdivisions();
  }

  private emitSubdivisions(): void {
    // Emit events for different beat divisions
    if (this.beatNumber % 2 === 0) {
      this.emit('beat:1/2', this.beatNumber);
    }
    if (this.beatNumber % 4 === 0) {
      this.emit('beat:1/4', this.beatNumber);
    }
    if (this.beatNumber % 8 === 0) {
      this.emit('beat:1/8', this.beatNumber);
    }
    if (this.beatNumber % 16 === 0) {
      this.emit('beat:1/16', this.beatNumber);
    }
  }

  setBPM(bpm: BPM): void {
    if (bpm === this.bpm) {
      return;
    }

    const wasRunning = this.isRunning;

    if (wasRunning) {
      this.stop();
    }

    this.bpm = bpm;

    if (wasRunning) {
      this.start(bpm);
    }

    this.emit('bpmChanged', bpm);
  }

  getBPM(): BPM {
    return this.bpm;
  }

  getInfo(): BeatClockInfo {
    const elapsed = Date.now() - this.startTime;
    const phase = (elapsed % this.beatInterval) / this.beatInterval;
    const timeToNextBeat = this.beatInterval - (elapsed % this.beatInterval);

    return {
      bpm: this.bpm,
      beatNumber: this.beatNumber,
      phase,
      timeToNextBeat,
      isOnBeat: timeToNextBeat < 50, // Within 50ms of beat
      subdivision: 1,
    };
  }

  getRunning(): boolean {
    return this.isRunning;
  }
}
