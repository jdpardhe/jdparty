/**
 * DMX Types
 * Core types for DMX control system
 */

/** DMX channel value (0-255) */
export type DMXValue = number;

/** DMX address (1-512) */
export type DMXAddress = number;

/** DMX universe ID (1-4 for MVP, expandable to 8) */
export type UniverseId = number;

/** DMX output protocol types */
export enum DMXProtocol {
  USB = 'usb',
  ARTNET = 'artnet',
  SACN = 'sacn',
}

/** DMX channel type classification */
export enum ChannelType {
  INTENSITY = 'intensity',
  RED = 'red',
  GREEN = 'green',
  BLUE = 'blue',
  AMBER = 'amber',
  WHITE = 'white',
  DIMMER = 'dimmer',
  STROBE = 'strobe',
  PAN = 'pan',
  TILT = 'tilt',
  COLOR_WHEEL = 'color_wheel',
  GOBO = 'gobo',
  PRISM = 'prism',
  FOCUS = 'focus',
  ZOOM = 'zoom',
  SHUTTER = 'shutter',
  GENERIC = 'generic',
}

/** Channel definition in a fixture profile */
export interface FixtureChannel {
  /** Channel offset (0-based) within fixture */
  offset: number;
  /** Channel type */
  type: ChannelType;
  /** Human-readable channel name */
  name: string;
  /** Valid value range */
  range: [number, number];
  /** Default value */
  default?: number;
  /** Optional capabilities/ranges for special values */
  capabilities?: Array<{
    range: [number, number];
    description: string;
  }>;
}

/** DMX fixture profile */
export interface FixtureProfile {
  /** Unique profile ID */
  id: string;
  /** Manufacturer name */
  manufacturer: string;
  /** Model name */
  model: string;
  /** Short name for display */
  shortName: string;
  /** Available personality modes */
  modes: Array<{
    name: string;
    channelCount: number;
    channels: FixtureChannel[];
  }>;
  /** Default mode index */
  defaultMode: number;
  /** Fixture category */
  category: 'par' | 'moving-head' | 'strip' | 'wash' | 'effect' | 'other';
  /** Fixture tags for searching */
  tags: string[];
}

/** Patched fixture instance */
export interface PatchedFixture {
  /** Unique fixture instance ID */
  id: string;
  /** Reference to fixture profile */
  profileId: string;
  /** Universe this fixture is patched to */
  universeId: UniverseId;
  /** Starting DMX address (1-512) */
  address: DMXAddress;
  /** Selected mode index */
  mode: number;
  /** User-assigned name */
  name: string;
  /** Optional fixture group ID */
  groupId?: string;
  /** Current channel values */
  values: DMXValue[];
}

/** Fixture group for simultaneous control */
export interface FixtureGroup {
  /** Unique group ID */
  id: string;
  /** Group name */
  name: string;
  /** Fixture IDs in this group */
  fixtureIds: string[];
  /** Group color tag */
  color?: string;
}

/** DMX universe configuration */
export interface Universe {
  /** Universe ID (1-4) */
  id: UniverseId;
  /** Universe name */
  name: string;
  /** Output protocol */
  protocol: DMXProtocol;
  /** Protocol-specific settings */
  settings: {
    /** For USB: device path */
    devicePath?: string;
    /** For Art-Net/sACN: IP address */
    ipAddress?: string;
    /** For Art-Net: universe number */
    artnetUniverse?: number;
    /** For sACN: universe number */
    sacnUniverse?: number;
  };
  /** Is this universe enabled */
  enabled: boolean;
  /** Current 512 channel values */
  channels: DMXValue[];
}

/** DMX output interface status */
export interface DMXInterfaceStatus {
  /** Interface type */
  protocol: DMXProtocol;
  /** Is connected */
  connected: boolean;
  /** Device identifier */
  device: string;
  /** Last error message */
  error?: string;
  /** Frames per second */
  fps?: number;
}
