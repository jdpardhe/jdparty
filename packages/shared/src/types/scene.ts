/**
 * Scene Types
 * Types for static and animated lighting scenes
 */

import type { DMXValue } from './dmx';

/** Scene ID type */
export type SceneId = string;

/** BPM (beats per minute) value */
export type BPM = number;

/** Scene category for organization */
export enum SceneCategory {
  AMBIENT = 'ambient',
  ENERGETIC = 'energetic',
  STROBE = 'strobe',
  COLOR = 'color',
  CUSTOM = 'custom',
}

/** Static lighting scene */
export interface Scene {
  /** Unique scene ID */
  id: SceneId;
  /** Scene name */
  name: string;
  /** Scene description */
  description?: string;
  /** Scene category */
  category: SceneCategory;
  /** Color tag for UI */
  colorTag?: string;
  /** Scene thumbnail (base64 or URL) */
  thumbnail?: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last modified timestamp */
  modifiedAt: number;
  /** Usage count */
  usageCount: number;
  /** Is favorite */
  isFavorite: boolean;
  /** BPM range for automatic selection */
  bpmRange?: {
    min: BPM;
    max: BPM;
    optimal?: BPM;
  };
  /** Energy level range (0-1) from Spotify */
  energyRange?: {
    min: number;
    max: number;
  };
  /** Fixture states */
  fixtureStates: Record<
    string,
    {
      /** Fixture ID */
      fixtureId: string;
      /** Channel values */
      values: DMXValue[];
    }
  >;
}

/** Beat division for synchronized animations */
export enum BeatDivision {
  /** Every beat */
  WHOLE = '1/1',
  /** Every 2 beats */
  HALF = '1/2',
  /** Every 4 beats */
  QUARTER = '1/4',
  /** Every 8 beats */
  EIGHTH = '1/8',
  /** Every 16 beats */
  SIXTEENTH = '1/16',
}

/** Animation easing curve types */
export enum EasingCurve {
  LINEAR = 'linear',
  EASE_IN = 'ease-in',
  EASE_OUT = 'ease-out',
  EASE_IN_OUT = 'ease-in-out',
  BOUNCE = 'bounce',
  ELASTIC = 'elastic',
}

/** Animation type */
export enum AnimationType {
  STEP = 'step',
  TRANSITION = 'transition',
  WAVE = 'wave',
  STROBE = 'strobe',
}

/** Base animated scene properties */
interface BaseAnimatedScene extends Omit<Scene, 'fixtureStates'> {
  /** Animation type */
  animationType: AnimationType;
  /** Beat division for animation timing */
  beatDivision: BeatDivision;
  /** Loop mode */
  loopMode: 'repeat' | 'bounce' | 'once';
}

/** Step animation - discrete states on beat */
export interface StepAnimation extends BaseAnimatedScene {
  animationType: AnimationType.STEP;
  /** Animation steps (2-16) */
  steps: Array<{
    /** Step index */
    index: number;
    /** Fixture states for this step */
    fixtureStates: Scene['fixtureStates'];
  }>;
}

/** Transition animation - interpolated keyframes */
export interface TransitionAnimation extends BaseAnimatedScene {
  animationType: AnimationType.TRANSITION;
  /** Keyframes (2-8) */
  keyframes: Array<{
    /** Time in beats */
    time: number;
    /** Fixture states */
    fixtureStates: Scene['fixtureStates'];
    /** Easing to next keyframe */
    easing: EasingCurve;
  }>;
}

/** Wave animation - propagating effect */
export interface WaveAnimation extends BaseAnimatedScene {
  animationType: AnimationType.WAVE;
  /** Wave parameters */
  wave: {
    /** Wave type */
    type: 'sine' | 'square' | 'sawtooth';
    /** Direction */
    direction: 'left-right' | 'front-back' | 'circular';
    /** Amplitude (0-1) */
    amplitude: number;
    /** Speed multiplier */
    speed: number;
  };
  /** Base state to apply wave to */
  baseState: Scene['fixtureStates'];
}

/** Strobe/flash animation */
export interface StrobeAnimation extends BaseAnimatedScene {
  animationType: AnimationType.STROBE;
  /** Flash parameters */
  flash: {
    /** Flash duration (ms) */
    duration: number;
    /** Recovery time (ms) */
    recovery: number;
    /** Intensity curve */
    curve: EasingCurve;
    /** Target fixtures */
    fixtureIds: string[];
  };
  /** Off state */
  offState: Scene['fixtureStates'];
  /** On state */
  onState: Scene['fixtureStates'];
}

/** Union type for all animated scenes */
export type AnimatedScene =
  | StepAnimation
  | TransitionAnimation
  | WaveAnimation
  | StrobeAnimation;

/** Scene triggering mode */
export enum SceneTriggerMode {
  /** Automatic based on music */
  AUTO = 'auto',
  /** Manual trigger only */
  MANUAL = 'manual',
}

/** Scene trigger configuration */
export interface SceneTriggerConfig {
  /** Trigger mode */
  mode: SceneTriggerMode;
  /** Fade time in seconds */
  fadeTime: number;
  /** Priority (higher = more likely to be selected) */
  priority: number;
}
