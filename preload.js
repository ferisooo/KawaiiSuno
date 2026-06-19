// preload.js — the only bridge between the UI and Node.
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

const SUNO_PRELOAD = pathToFileURL(path.join(__dirname, 'renderer', 'suno-preload.js')).href;

contextBridge.exposeInMainWorld('kawaii', {
  sunoPreloadPath: SUNO_PRELOAD,
  // window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  onMaximizeState: (cb) => ipcRenderer.on('window:state', (_e, m) => cb(m)),
  openExternal: (url) => ipcRenderer.send('open:external', url),

  // state (imported tracks + playlists)
  getState: () => ipcRenderer.invoke('state:get'),
  onState: (cb) => ipcRenderer.on('state:update', (_e, s) => cb(s)),
  importTrack: (t, playlistId) => ipcRenderer.invoke('track:import', t, playlistId),
  removeTrack: (id) => ipcRenderer.invoke('track:remove', id),
  downloadTracks: (ids) => ipcRenderer.invoke('tracks:download', ids),
  createPlaylist: (name) => ipcRenderer.invoke('playlist:create', name),
  renamePlaylist: (id, name) => ipcRenderer.invoke('playlist:rename', id, name),
  deletePlaylist: (id) => ipcRenderer.invoke('playlist:delete', id),
  addToPlaylist: (pid, tid) => ipcRenderer.invoke('playlist:add', pid, tid),
  removeFromPlaylist: (pid, tid) => ipcRenderer.invoke('playlist:remove', pid, tid),

  // suno
  loadSuno: (input) => ipcRenderer.invoke('suno:load', input),
  attachSuno: (wcId) => ipcRenderer.invoke('suno:attach', wcId),
  fetchSunoUrl: (url) => ipcRenderer.invoke('suno:fetchUrl', url),
  exportLibrary: () => ipcRenderer.invoke('config:export'),
  importLibrary: () => ipcRenderer.invoke('config:import'),

  // settings (prefs, sort, favorites)
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),

  // deepseek (Creation tab)
  deepseek: (payload) => ipcRenderer.invoke('deepseek:chat', payload),
  getDsKey: () => ipcRenderer.invoke('deepseek:getKey'),
  setDsKey: (key) => ipcRenderer.invoke('deepseek:setKey', key),

  // toasts pushed from main (e.g. after right-click import)
  onToast: (cb) => ipcRenderer.on('toast', (_e, p) => cb(p)),
});
