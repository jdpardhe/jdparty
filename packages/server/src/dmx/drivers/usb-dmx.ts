/**
 * USB DMX Driver
 * Supports FTDI-based USB DMX interfaces
 */

import { SerialPort } from 'serialport';
import type { DMXValue } from '@jdparty/shared';

export class USBDMXDriver {
  private port: SerialPort | null = null;
  private devicePath: string;
  private connected: boolean = false;

  constructor(devicePath: string) {
    this.devicePath = devicePath;
  }

  async connect(): Promise<void> {
    try {
      this.port = new SerialPort({
        path: this.devicePath,
        baudRate: 250000, // DMX512 baud rate
        dataBits: 8,
        stopBits: 2,
        parity: 'none',
      });

      await new Promise<void>((resolve, reject) => {
        this.port!.on('open', () => {
          this.connected = true;
          console.log(`  ✅ USB DMX connected: ${this.devicePath}`);
          resolve();
        });

        this.port!.on('error', (err) => {
          console.error(`  ❌ USB DMX error: ${err.message}`);
          reject(err);
        });
      });
    } catch (error: any) {
      throw new Error(`Failed to connect to USB DMX: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.port && this.port.isOpen) {
      await new Promise<void>((resolve) => {
        this.port!.close(() => {
          this.connected = false;
          console.log('  👋 USB DMX disconnected');
          resolve();
        });
      });
    }
  }

  async sendFrame(channels: DMXValue[]): Promise<void> {
    if (!this.port || !this.connected) {
      return;
    }

    try {
      // DMX frame structure:
      // Break (88-1000μs), Mark After Break (8-1000μs), Start Code (0x00), 512 channels
      const frame = Buffer.alloc(513);
      frame[0] = 0x00; // Start code

      // Copy channel values
      for (let i = 0; i < 512; i++) {
        frame[i + 1] = channels[i] || 0;
      }

      // Write frame to serial port
      await new Promise<void>((resolve, reject) => {
        this.port!.write(frame, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } catch (error: any) {
      console.error(`  ⚠️  Failed to send DMX frame: ${error.message}`);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getDevicePath(): string {
    return this.devicePath;
  }

  /**
   * Discover available USB DMX devices
   */
  static async discover(): Promise<string[]> {
    const devices: string[] = [];

    try {
      const ports = await SerialPort.list();

      for (const port of ports) {
        // Look for FTDI-based devices (common in USB DMX interfaces)
        const isFTDI =
          port.manufacturer?.toLowerCase().includes('ftdi') ||
          port.vendorId === '0403' || // FTDI Vendor ID
          port.productId === '6001'; // FTDI Product ID

        if (isFTDI) {
          devices.push(port.path);
        }
      }

      if (devices.length > 0) {
        console.log(`  🔍 Found ${devices.length} USB DMX device(s):`, devices);
      } else {
        console.log('  ℹ️  No USB DMX devices found');
      }
    } catch (error: any) {
      console.error(`  ⚠️  Failed to discover USB DMX devices: ${error.message}`);
    }

    return devices;
  }
}
