/**
 * DMX Engine
 * Core DMX output engine with universe management
 */

import { EventEmitter } from 'events';
import {
  clampDMX,
  type Universe,
  type DMXValue,
  type DMXAddress,
  type UniverseId,
  type DMXInterfaceStatus,
  type DMXProtocol,
} from '@jdparty/shared';
import { serverConfig } from '../config/index.js';
import { USBDMXDriver } from './drivers/usb-dmx.js';
import { ArtNetDriver } from './drivers/artnet.js';

interface DMXDriver {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendFrame(channels: DMXValue[]): Promise<void>;
  isConnected(): boolean;
}

export class DMXEngine extends EventEmitter {
  private universes: Map<UniverseId, Universe>;
  private drivers: Map<UniverseId, DMXDriver>;
  private active: boolean = false;
  private frameInterval: NodeJS.Timeout | null = null;
  private frameRate: number;

  constructor() {
    super();
    this.universes = new Map();
    this.drivers = new Map();
    this.frameRate = serverConfig.dmx.frameRate;

    // Initialize universe 1 for MVP
    this.initializeUniverse(1, 'Universe 1', 'usb' as DMXProtocol);
  }

  async initialize(): Promise<void> {
    console.log('  📡 DMX Engine initializing...');

    // Discover USB DMX devices
    const usbDevices = await USBDMXDriver.discover();

    // Auto-connect to first USB device if available
    if (usbDevices.length > 0 && serverConfig.dmx.interface === 'usb') {
      try {
        const universe = this.universes.get(1)!;
        const driver = new USBDMXDriver(usbDevices[0]);
        await driver.connect();

        this.drivers.set(1, driver);
        universe.settings.devicePath = usbDevices[0];

        console.log('  ✅ USB DMX driver initialized');
      } catch (error: any) {
        console.error(`  ⚠️  Failed to initialize USB DMX: ${error.message}`);
        console.log('  ℹ️  DMX output will be disabled');
      }
    } else if (serverConfig.dmx.interface === 'artnet') {
      // Initialize Art-Net driver
      try {
        const universe = this.universes.get(1)!;
        const driver = new ArtNetDriver('255.255.255.255', 0);
        await driver.connect();

        this.drivers.set(1, driver);
        universe.protocol = 'artnet' as DMXProtocol;
        universe.settings.ipAddress = '255.255.255.255';
        universe.settings.artnetUniverse = 0;

        console.log('  ✅ Art-Net driver initialized');
      } catch (error: any) {
        console.error(`  ⚠️  Failed to initialize Art-Net: ${error.message}`);
        console.log('  ℹ️  DMX output will be disabled');
      }
    } else {
      console.log('  ℹ️  No DMX interface configured - running in demo mode');
    }

    console.log(`  ⚡ Frame rate: ${this.frameRate} fps`);
    console.log('  ✅ DMX Engine initialized');
  }

  private initializeUniverse(id: UniverseId, name: string, protocol: DMXProtocol): void {
    const universe: Universe = {
      id,
      name,
      protocol,
      settings: {},
      enabled: true,
      channels: new Array(512).fill(0),
    };

    this.universes.set(id, universe);
  }

  async start(): Promise<void> {
    if (this.active) {
      return;
    }

    this.active = true;
    const frameTime = 1000 / this.frameRate;

    this.frameInterval = setInterval(() => {
      this.outputFrame();
    }, frameTime);

    console.log('  ▶️  DMX output started');
    this.emit('started');
  }

  async stop(): Promise<void> {
    if (!this.active) {
      return;
    }

    this.active = false;

    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    // Blackout all universes
    for (const universe of this.universes.values()) {
      universe.channels.fill(0);
    }

    // Send final blackout frame
    await this.outputFrame();

    // Disconnect drivers
    for (const driver of this.drivers.values()) {
      await driver.disconnect();
    }

    console.log('  ⏸️  DMX output stopped');
    this.emit('stopped');
  }

  private async outputFrame(): Promise<void> {
    const outputPromises: Promise<void>[] = [];

    for (const [id, universe] of this.universes) {
      if (!universe.enabled) {
        continue;
      }

      const driver = this.drivers.get(id);
      if (driver && driver.isConnected()) {
        outputPromises.push(driver.sendFrame(universe.channels));
      }
    }

    // Send all frames in parallel
    await Promise.all(outputPromises);

    // Emit event for debugging
    this.emit('frame', { timestamp: Date.now() });
  }

  isActive(): boolean {
    return this.active;
  }

  getUniverse(id: UniverseId): Universe | undefined {
    return this.universes.get(id);
  }

  getAllUniverses(): Universe[] {
    return Array.from(this.universes.values());
  }

  setChannel(universeId: UniverseId, address: DMXAddress, value: DMXValue): void {
    const universe = this.universes.get(universeId);
    if (!universe) {
      throw new Error(`Universe ${universeId} not found`);
    }

    if (address < 1 || address > 512) {
      throw new Error(`Invalid DMX address: ${address}`);
    }

    universe.channels[address - 1] = clampDMX(value);
    this.emit('channelChange', { universeId, address, value });
  }

  setChannels(universeId: UniverseId, startAddress: DMXAddress, values: DMXValue[]): void {
    const universe = this.universes.get(universeId);
    if (!universe) {
      throw new Error(`Universe ${universeId} not found`);
    }

    for (let i = 0; i < values.length; i++) {
      const address = startAddress + i;
      if (address < 1 || address > 512) {
        continue;
      }
      universe.channels[address - 1] = clampDMX(values[i]);
    }

    this.emit('channelsChange', { universeId, startAddress, values });
  }

  getChannel(universeId: UniverseId, address: DMXAddress): DMXValue {
    const universe = this.universes.get(universeId);
    if (!universe) {
      throw new Error(`Universe ${universeId} not found`);
    }

    if (address < 1 || address > 512) {
      throw new Error(`Invalid DMX address: ${address}`);
    }

    return universe.channels[address - 1];
  }

  getChannels(universeId: UniverseId): DMXValue[] {
    const universe = this.universes.get(universeId);
    if (!universe) {
      throw new Error(`Universe ${universeId} not found`);
    }

    return [...universe.channels];
  }

  blackout(): void {
    for (const universe of this.universes.values()) {
      universe.channels.fill(0);
    }
    this.emit('blackout');
  }

  masterDimmer(level: number): void {
    const intensity = clampDMX(level * 255);

    for (const universe of this.universes.values()) {
      // Apply to all channels (simplified for MVP)
      for (let i = 0; i < 512; i++) {
        if (universe.channels[i] > 0) {
          universe.channels[i] = Math.floor((universe.channels[i] / 255) * intensity);
        }
      }
    }

    this.emit('masterDimmer', level);
  }

  getInterfaceStatus(): DMXInterfaceStatus[] {
    const statuses: DMXInterfaceStatus[] = [];

    for (const [id, universe] of this.universes) {
      const driver = this.drivers.get(id);

      statuses.push({
        protocol: universe.protocol,
        connected: driver ? driver.isConnected() : false,
        device: universe.settings.devicePath || universe.settings.ipAddress || `Universe ${id}`,
        fps: this.active && driver?.isConnected() ? this.frameRate : 0,
      });
    }

    return statuses;
  }

  /**
   * Add a new universe (for future multi-universe support)
   */
  async addUniverse(
    id: UniverseId,
    name: string,
    protocol: DMXProtocol,
    settings: Universe['settings']
  ): Promise<void> {
    if (this.universes.has(id)) {
      throw new Error(`Universe ${id} already exists`);
    }

    this.initializeUniverse(id, name, protocol);
    const universe = this.universes.get(id)!;
    universe.settings = settings;

    // Initialize driver for this universe
    if (protocol === 'usb' && settings.devicePath) {
      const driver = new USBDMXDriver(settings.devicePath);
      await driver.connect();
      this.drivers.set(id, driver);
    } else if (protocol === 'artnet' && settings.ipAddress) {
      const driver = new ArtNetDriver(settings.ipAddress, settings.artnetUniverse || 0);
      await driver.connect();
      this.drivers.set(id, driver);
    }

    this.emit('universeAdded', { id, universe });
  }

  /**
   * Remove a universe
   */
  async removeUniverse(id: UniverseId): Promise<void> {
    const driver = this.drivers.get(id);
    if (driver) {
      await driver.disconnect();
      this.drivers.delete(id);
    }

    this.universes.delete(id);
    this.emit('universeRemoved', { id });
  }
}
