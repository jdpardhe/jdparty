/**
 * Art-Net Driver
 * Network DMX over Art-Net protocol
 */

import { createSocket, type Socket } from 'dgram';
import type { DMXValue } from '@jdparty/shared';

export class ArtNetDriver {
  private socket: Socket | null = null;
  private host: string;
  private universe: number;
  private connected: boolean = false;
  private sequence: number = 0;

  constructor(host: string = '255.255.255.255', universe: number = 0) {
    this.host = host;
    this.universe = universe;
  }

  async connect(): Promise<void> {
    try {
      this.socket = createSocket('udp4');
      this.socket.bind(() => {
        if (this.socket) {
          this.socket.setBroadcast(true);
        }
      });

      this.connected = true;
      console.log(`  ✅ Art-Net connected: ${this.host} (Universe ${this.universe})`);
    } catch (error: any) {
      throw new Error(`Failed to connect to Art-Net: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
      console.log('  👋 Art-Net disconnected');
    }
  }

  async sendFrame(channels: DMXValue[]): Promise<void> {
    if (!this.socket || !this.connected) {
      return;
    }

    try {
      // Create Art-Net DMX packet
      const packet = this.createArtNetPacket(channels);

      // Send to Art-Net port (6454)
      this.socket.send(packet, 6454, this.host, (err) => {
        if (err) {
          console.error(`  ⚠️  Failed to send Art-Net frame: ${err.message}`);
        }
      });
    } catch (error: any) {
      console.error(`  ⚠️  Failed to send Art-Net frame: ${error.message}`);
    }
  }

  private createArtNetPacket(channels: DMXValue[]): Buffer {
    // Art-Net DMX packet structure
    const packet = Buffer.alloc(18 + 512);

    // Header
    packet.write('Art-Net\0', 0); // ID (8 bytes)
    packet.writeUInt16LE(0x5000, 8); // OpCode (ArtDMX)
    packet.writeUInt16BE(14, 10); // Protocol version
    packet.writeUInt8(this.sequence++, 12); // Sequence
    packet.writeUInt8(0, 13); // Physical
    packet.writeUInt16LE(this.universe, 14); // Universe
    packet.writeUInt16BE(512, 16); // Length

    // DMX data (512 channels)
    for (let i = 0; i < 512; i++) {
      packet.writeUInt8(channels[i] || 0, 18 + i);
    }

    if (this.sequence > 255) this.sequence = 0;

    return packet;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getHost(): string {
    return this.host;
  }

  getUniverse(): number {
    return this.universe;
  }

  setUniverse(universe: number): void {
    this.universe = universe;
  }

  /**
   * Discover Art-Net nodes on the network
   */
  static async discover(): Promise<string[]> {
    // Art-Net discovery would require listening for ArtPoll replies
    // For MVP, we'll just return empty array and rely on manual configuration
    console.log('  ℹ️  Art-Net discovery not implemented - use manual configuration');
    return [];
  }
}
