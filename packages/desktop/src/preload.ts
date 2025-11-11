/**
 * Electron preload script
 * Exposes safe APIs to renderer process
 */

import { contextBridge } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Add any APIs you want to expose to the renderer here
  platform: process.platform,
  version: process.versions.electron,
});
