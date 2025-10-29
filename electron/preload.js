import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('GenerativeOS', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, listener) => {
    const subscription = (_event, ...data) => listener(...data);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
});

contextBridge.exposeInMainWorld('electronEnv', {
  isElectron: true,
  platform: process.platform,
  versions: process.versions,
});
