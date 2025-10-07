/**
 * Preload script — جسر آمن بين Electron والمتصفح
 */

const { contextBridge, ipcRenderer } = require('electron');

const EVENT_WHITELIST = new Set([
  'update:available',
  'update:downloaded',
  'app:deep-link',
]);

const api = {
  platform: process.platform,
  isElectron: true,
  versions: process.versions,

  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', String(url || '')),

  on: (channel, listener) => {
    if (!EVENT_WHITELIST.has(channel) || typeof listener !== 'function') {
      return () => {};
    }
    const wrapped = (_event, ...args) => listener(...args);
    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.removeListener(channel, wrapped);
  },

  send: (channel, ...args) => {
    ipcRenderer.send(channel, ...args);
  },
};

contextBridge.exposeInMainWorld('electronAPI', Object.freeze(api));

if (process.env.NODE_ENV === 'production') {
  window.addEventListener('DOMContentLoaded', () => {
    const noop = () => {};
    console.log = noop;
    console.info = noop;
    console.debug = noop;
  });
}