// main.js — Electron main process.
// Owns persistent state (imported songs + playlists), the embedded-Suno
// harvester, right-click import, and the experimental Chrome cookie import.
const { app, BrowserWindow, ipcMain, dialog, shell, session, net, webContents } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36 SunoKawaiiPlayer/1.1';

let mainWindow = null;

// silence harmless WebRTC STUN probes from the embedded page
app.commandLine.appendSwitch('force-webrtc-ip-handling-policy', 'disable_non_proxied_udp');

/* ===================== persistent state ===================== */
function configPath() { return path.join(app.getPath('userData'), 'config.json'); }
function readConfig() { try { return JSON.parse(fs.readFileSync(configPath(), 'utf8')); } catch { return {}; } }
function writeConfig(c) { try { fs.writeFileSync(configPath(), JSON.stringify(c, null, 2)); } catch {} }

const state = { tracks: [], playlists: [] };
function loadState() {
  const c = readConfig();
  state.tracks = Array.isArray(c.importedTracks) ? c.importedTracks : [];
  state.playlists = Array.isArray(c.playlists) ? c.playlists : [];
  // backfill addedAt for songs imported before it was tracked, preserving their
  // existing order — otherwise "newest/oldest first" has nothing to sort by
  let changed = false; const base = Date.now() - state.tracks.length * 1000;
  state.tracks.forEach((t, i) => { if (!t.addedAt) { t.addedAt = base + i * 1000; changed = true; } });
  if (changed) saveState();
}
function saveState() {
  const c = readConfig();
  c.importedTracks = state.tracks; c.playlists = state.playlists;
  writeConfig(c);
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('state:update', state);
}
function notify(msg, err) { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('toast', { msg, err: !!err }); }

function importTrack(t, playlistId) {
  if (!t || !t.id) return;
  if (!state.tracks.some((x) => x.id === t.id)) {
    state.tracks.push({ id: t.id, title: t.title || 'Suno song', audioUrl: t.audioUrl || null, cover: t.cover || null, lyrics: t.lyrics || null, source: 'suno', addedAt: Date.now() });
  }
  if (playlistId) {
    const p = state.playlists.find((p) => p.id === playlistId);
    if (p && !p.trackIds.includes(t.id)) p.trackIds.push(t.id);
  }
  saveState();
}

/* ===================== window ===================== */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 780, minWidth: 900, minHeight: 600,
    frame: false, backgroundColor: '#0c0a12', show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
      webviewTag: true,
    },
  });
  mainWindow.loadFile('index.html');

  // Hardening: the app shell is local. Don't let it be navigated away from
  // index.html, and route any window.open to the system browser (http/https
  // only) instead of spawning an uncontrolled BrowserWindow.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) e.preventDefault();
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('maximize', () => mainWindow.webContents.send('window:state', true));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window:state', false));
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  loadState();
  writeObsOverlayHtml();
  writeObsNowPlaying({ title: '', sub: 'Suno AI track', playing: false });
  startTiktokServer();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

/* ===================== OBS green-screen now-playing overlay =====================
   The app writes the current song to obs/nowplaying.js; overlay.html polls it and
   renders the title + "Suno AI track" on a chroma-green background. In OBS: add a
   Browser source → Local file → overlay.html, then key out the green.            */
// the latest now-playing payload, shared by the OBS file and the TikTok server
let nowPlaying = { title: '', sub: 'Suno AI track', playing: false };
function obsDir() { const d = path.join(app.getPath('userData'), 'obs'); try { fs.mkdirSync(d, { recursive: true }); } catch {} return d; }
function writeObsNowPlaying(np) { try { fs.writeFileSync(path.join(obsDir(), 'nowplaying.js'), 'window.__NOWPLAYING__ = ' + JSON.stringify(np || {}) + ';'); } catch {} }
function writeObsOverlayHtml() { try { fs.writeFileSync(path.join(obsDir(), 'overlay.html'), OBS_OVERLAY_HTML); } catch {} }
ipcMain.handle('obs:update', (_e, np) => { nowPlaying = np || nowPlaying; writeObsNowPlaying(np); return true; });
ipcMain.handle('obs:path', () => path.join(obsDir(), 'overlay.html'));
ipcMain.handle('obs:open', () => { shell.openPath(obsDir()); return true; });

/* ===================== TikTok now-playing overlay (local HTTP server) =====================
   TikTok LIVE Studio's "Browser" source asks for a Link (URL), not a local file like OBS, so
   we serve the same now-playing card over http://127.0.0.1:PORT/. Paste that URL into LIVE
   Studio → Add → Browser. The background is transparent (LIVE Studio keeps the alpha), so no
   chroma key is needed. It polls /nowplaying.js once a second and updates live.            */
const TIKTOK_PORT = 8787; // fixed so the overlay link is stable: http://127.0.0.1:8787/
let tiktokServer = null;
let tiktokPort = 0;
function tiktokHandler(req, res) {
  const route = (req.url || '/').split('?')[0];
  if (route === '/nowplaying.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
    res.end('window.__NOWPLAYING__ = ' + JSON.stringify(nowPlaying) + ';');
    return;
  }
  if (route === '/' || route === '/overlay.html' || route === '/tiktok.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(TIKTOK_OVERLAY_HTML);
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
}
function startTiktokServer() {
  if (tiktokServer) return;
  // bind to loopback only; prefer the fixed port, fall back to an OS-picked one if it's taken
  const listen = (port, allowFallback) => {
    const srv = http.createServer(tiktokHandler);
    srv.on('error', () => { if (allowFallback) listen(0, false); else { tiktokServer = null; tiktokPort = 0; } });
    srv.listen(port, '127.0.0.1', () => { tiktokServer = srv; try { tiktokPort = srv.address().port; } catch { tiktokPort = 0; } });
  };
  listen(TIKTOK_PORT, true);
}
ipcMain.handle('tiktok:url', () => (tiktokPort ? 'http://127.0.0.1:' + tiktokPort + '/' : ''));

const OBS_OVERLAY_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Suno — Now Playing (OBS overlay)</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Quicksand:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  /* The flat green is your chroma-key color in OBS (key/remove #00FF00). */
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #00ff00; font-family: 'Quicksand', system-ui, sans-serif; }
  #wrap {
    position: absolute; left: 64px; bottom: 64px; max-width: 84%;
    opacity: 0; transform: translateY(18px);
    transition: opacity .45s ease, transform .45s ease;
  }
  #wrap.show { opacity: 1; transform: translateY(0); }
  #title {
    font-family: 'Fredoka', system-ui, sans-serif; font-weight: 700;
    font-size: 76px; line-height: 1.04; letter-spacing: .5px;
    background: linear-gradient(90deg, #ff86b3, #ffce47);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent;
    filter: drop-shadow(0 5px 16px rgba(0,0,0,.45));
  }
  #sub {
    font-family: 'Quicksand', system-ui, sans-serif; font-weight: 600;
    font-size: 30px; color: #ffffff; margin-top: 12px; letter-spacing: .5px;
    filter: drop-shadow(0 2px 10px rgba(0,0,0,.55));
  }
  #sub .note { color: #ff5d8f; margin-right: 10px; filter: drop-shadow(0 0 8px rgba(255,93,143,.8)); }
</style>
</head>
<body>
  <div id="wrap">
    <div id="title">—</div>
    <div id="sub"><span class="note">&#9834;</span><span id="subtext">Suno AI track</span></div>
  </div>
<script>
  var wrap = document.getElementById('wrap');
  var titleEl = document.getElementById('title');
  var subEl = document.getElementById('subtext');
  var lastTitle = null;
  function render(np) {
    np = np || {};
    var t = (np.title || '').trim();
    if (!t) { wrap.classList.remove('show'); return; }
    if (t !== lastTitle) { titleEl.textContent = t; lastTitle = t; }
    subEl.textContent = np.sub || 'Suno AI track';
    wrap.classList.add('show');
  }
  // poll via a cache-busted <script> tag so it works from a local file in OBS (no fetch/CORS)
  function load() {
    var s = document.createElement('script');
    s.src = 'nowplaying.js?t=' + Date.now();
    s.onload = function () { render(window.__NOWPLAYING__); s.remove(); };
    s.onerror = function () { s.remove(); };
    document.head.appendChild(s);
  }
  setInterval(load, 1000);
  load();
</script>
</body>
</html>`;

// Same now-playing card as OBS, but on a transparent background so it drops straight
// onto a TikTok LIVE Studio "Browser" source (no chroma key needed). Served over HTTP.
const TIKTOK_OVERLAY_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Suno — Now Playing (TikTok overlay)</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Quicksand:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  /* Transparent — TikTok LIVE Studio keeps the alpha, so this sits over your video. */
  html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; font-family: 'Quicksand', system-ui, sans-serif; }
  #wrap {
    position: absolute; left: 64px; bottom: 64px; max-width: 84%;
    opacity: 0; transform: translateY(18px);
    transition: opacity .45s ease, transform .45s ease;
  }
  #wrap.show { opacity: 1; transform: translateY(0); }
  #title {
    font-family: 'Fredoka', system-ui, sans-serif; font-weight: 700;
    font-size: 76px; line-height: 1.04; letter-spacing: .5px;
    background: linear-gradient(90deg, #ff86b3, #ffce47);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent;
    filter: drop-shadow(0 5px 16px rgba(0,0,0,.55));
  }
  #sub {
    font-family: 'Quicksand', system-ui, sans-serif; font-weight: 600;
    font-size: 30px; color: #ffffff; margin-top: 12px; letter-spacing: .5px;
    filter: drop-shadow(0 2px 10px rgba(0,0,0,.7));
  }
  #sub .note { color: #ff5d8f; margin-right: 10px; filter: drop-shadow(0 0 8px rgba(255,93,143,.9)); }
</style>
</head>
<body>
  <div id="wrap">
    <div id="title">—</div>
    <div id="sub"><span class="note">&#9834;</span><span id="subtext">Suno AI track</span></div>
  </div>
<script>
  var wrap = document.getElementById('wrap');
  var titleEl = document.getElementById('title');
  var subEl = document.getElementById('subtext');
  var lastTitle = null;
  function render(np) {
    np = np || {};
    var t = (np.title || '').trim();
    if (!t) { wrap.classList.remove('show'); return; }
    if (t !== lastTitle) { titleEl.textContent = t; lastTitle = t; }
    subEl.textContent = np.sub || 'Suno AI track';
    wrap.classList.add('show');
  }
  // served over HTTP, so a cache-busted <script> tag is the simplest live poll
  function load() {
    var s = document.createElement('script');
    s.src = 'nowplaying.js?t=' + Date.now();
    s.onload = function () { render(window.__NOWPLAYING__); s.remove(); };
    s.onerror = function () { s.remove(); };
    document.head.appendChild(s);
  }
  setInterval(load, 1000);
  load();
</script>
</body>
</html>`;

/* ===================== window controls ===================== */
ipcMain.on('window:minimize', () => mainWindow && mainWindow.minimize());
ipcMain.on('window:maximize', () => { if (mainWindow) mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize(); });
ipcMain.on('window:close', () => mainWindow && mainWindow.close());
ipcMain.on('open:external', (_e, url) => { if (/^https?:\/\//i.test(url)) shell.openExternal(url); });

/* ===================== update check (compares running version to UPDATE.md) ===================== */
function cmpVer(a, b) {
  const num = (v) => String(v).split('.').map((n) => { const x = parseInt(n, 10); return Number.isFinite(x) ? x : 0; });
  const pa = num(a), pb = num(b);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) > (pb[i] || 0)) return 1; if ((pa[i] || 0) < (pb[i] || 0)) return -1; }
  return 0;
}
ipcMain.handle('update:check', async () => {
  const current = app.getVersion();
  try {
    const txt = await fetchRaw('https://raw.githubusercontent.com/ferisooo/KawaiiSuno/main/UPDATE.md');
    const m = txt.match(/##\s*\d{4}-\d{2}-\d{2}\s*[—-]\s*v(\d+\.\d+\.\d+)/);
    const latest = m ? m[1] : null;
    return { ok: true, current, latest, newer: latest ? cmpVer(latest, current) > 0 : false, url: 'https://github.com/ferisooo/KawaiiSuno' };
  } catch (e) { return { ok: false, current, error: e.message }; }
});
// Live in-place update: download the changed source files straight from the repo
// over HTTPS (no git, no browser), then relaunch into the new version. Only the
// app's own files are touched; user data lives in userData/ and is never overwritten.
const UPDATE_REPO = 'ferisooo/KawaiiSuno';
ipcMain.handle('update:apply', async () => {
  const dir = app.getAppPath();
  if (dir.includes('app.asar')) return { ok: false, error: 'packaged build (can\'t self-update)' };
  try {
    // list every tracked file at the tip of main, then pull each one's raw contents
    const treeJson = await fetchRaw('https://api.github.com/repos/' + UPDATE_REPO + '/git/trees/main?recursive=1');
    const tree = JSON.parse(treeJson);
    const files = (tree.tree || []).filter((t) => t.type === 'blob' && !t.path.startsWith('.github/')).map((t) => t.path);
    if (!files.length) return { ok: false, error: 'nothing to download' };
    let count = 0;
    for (const p of files) {
      const buf = await fetchRaw('https://raw.githubusercontent.com/' + UPDATE_REPO + '/main/' + p, { binary: true });
      const dest = path.join(dir, p);
      const rel = path.relative(dir, dest);
      if (rel.startsWith('..') || path.isAbsolute(rel)) continue;   // guard against path escapes
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const old = fs.existsSync(dest) ? fs.readFileSync(dest) : null;
      if (!old || !old.equals(buf)) { fs.writeFileSync(dest, buf); count++; }   // only rewrite what changed
    }
    setTimeout(() => { app.relaunch(); app.exit(0); }, 600);        // restart into the new version
    return { ok: true, count };
  } catch (e) { return { ok: false, error: e.message }; }
});

/* ===================== settings (prefs / sort / favorites) ===================== */
ipcMain.handle('settings:get', () => readConfig().settings || {});
ipcMain.handle('settings:set', (_e, patch) => { const c = readConfig(); c.settings = Object.assign({}, c.settings, patch || {}); writeConfig(c); return c.settings; });

/* ===================== state IPC ===================== */
ipcMain.handle('state:get', () => state);
ipcMain.handle('track:import', (_e, t, playlistId) => { importTrack(t, playlistId); return true; });
ipcMain.handle('track:remove', (_e, id) => {
  state.tracks = state.tracks.filter((t) => t.id !== id);
  state.playlists.forEach((p) => { p.trackIds = p.trackIds.filter((x) => x !== id); });
  saveState(); return true;
});
ipcMain.handle('playlist:create', (_e, name) => {
  const p = { id: 'pl_' + Date.now().toString(36), name: (name || 'New playlist').slice(0, 40), trackIds: [] };
  state.playlists.push(p); saveState(); return p;
});
ipcMain.handle('playlist:rename', (_e, id, name) => { const p = state.playlists.find((p) => p.id === id); if (p) p.name = (name || p.name).slice(0, 40); saveState(); return true; });
ipcMain.handle('playlist:delete', (_e, id) => { state.playlists = state.playlists.filter((p) => p.id !== id); saveState(); return true; });
ipcMain.handle('playlist:add', (_e, pid, tid) => { const p = state.playlists.find((p) => p.id === pid); if (p && !p.trackIds.includes(tid)) p.trackIds.push(tid); saveState(); return true; });
ipcMain.handle('playlist:remove', (_e, pid, tid) => { const p = state.playlists.find((p) => p.id === pid); if (p) p.trackIds = p.trackIds.filter((x) => x !== tid); saveState(); return true; });

/* ===================== tiny fetch helper ===================== */
function fetchRaw(url, { binary = false, redirects = 5, auth = null } = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const headers = { 'User-Agent': USER_AGENT, 'Accept': '*/*' };
    if (auth) headers['Authorization'] = auth;
    const req = lib.get(url, { headers }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        if (redirects <= 0) return reject(new Error('Too many redirects'));
        res.resume();
        return resolve(fetchRaw(new URL(res.headers.location, url).toString(), { binary, redirects: redirects - 1, auth }));
      }
      if (res.statusCode < 200 || res.statusCode >= 300) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => { const buf = Buffer.concat(chunks); resolve(binary ? buf : buf.toString('utf8')); });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => req.destroy(new Error('Request timed out')));
  });
}

// POST JSON helper (used by the DeepSeek proxy)
function postJson(url, bodyObj, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = Buffer.from(JSON.stringify(bodyObj));
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request({
      method: 'POST', hostname: u.hostname, port: u.port || undefined, path: u.pathname + u.search,
      headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': data.length, 'User-Agent': USER_AGENT, 'Accept': 'application/json' }, headers),
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.setTimeout(90000, () => req.destroy(new Error('Request timed out')));
    req.write(data); req.end();
  });
}

/* ===================== DeepSeek (Creation tab) ===================== */
ipcMain.handle('deepseek:getKey', () => { return readConfig().deepseekKey || ''; });
ipcMain.handle('deepseek:setKey', (_e, key) => { const c = readConfig(); c.deepseekKey = String(key || '').trim(); writeConfig(c); return true; });
ipcMain.handle('deepseek:chat', async (_e, payload) => {
  const key = (readConfig().deepseekKey || '').trim();
  if (!key) return { ok: false, error: 'No DeepSeek API key set — add it at the top of the Create tab.' };
  const { messages, temperature, maxTokens } = payload || {};
  if (!Array.isArray(messages)) return { ok: false, error: 'Bad request (no messages).' };
  try {
    const r = await postJson('https://api.deepseek.com/v1/chat/completions',
      { model: 'deepseek-chat', messages, temperature, max_tokens: maxTokens },
      { Authorization: 'Bearer ' + key });
    if (r.status < 200 || r.status >= 300) {
      let msg = 'HTTP ' + r.status;
      if (r.status === 401) msg += ' — your DeepSeek API key looks wrong or expired.';
      else { try { const e = JSON.parse(r.text); if (e.error && e.error.message) msg += ' — ' + e.error.message; } catch { msg += ' ' + r.text.slice(0, 160); } }
      return { ok: false, error: msg };
    }
    const data = JSON.parse(r.text);
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (content == null) return { ok: false, error: 'Empty response from DeepSeek.' };
    return { ok: true, content };
  } catch (e) { return { ok: false, error: e.message || 'DeepSeek request failed.' }; }
});

/* ===================== paste-a-link loader ===================== */
function extractSunoId(input) {
  const s = String(input || '').replace(/[\u00a0\u200b\u200c\u200d\ufeff]/g, '').trim();
  const uuid = s.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuid) return uuid[0];
  const seg = s.split(/[?#]/)[0].split('/').filter(Boolean).pop();
  if (seg && /^[0-9a-z_-]{6,}$/i.test(seg)) return seg;
  if (/^[0-9a-z_-]{6,}$/i.test(s)) return s;
  return null;
}
function metaTag(html, prop) {
  const re1 = new RegExp('<meta[^>]+(?:property|name)=["\']' + prop + '["\'][^>]*content=["\']([^"\']+)["\']', 'i');
  const re2 = new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]*(?:property|name)=["\']' + prop + '["\']', 'i');
  const m = html.match(re1) || html.match(re2);
  return m ? m[1] : null;
}
ipcMain.handle('suno:load', async (_e, input) => {
  const id = extractSunoId(input);
  if (!id) throw new Error('Couldn\'t find a song id in that link.');
  let title = 'Suno Track', cover = null, audioUrl = null, lyrics = null;
  try {
    const html = await fetchRaw('https://suno.com/song/' + id);
    title = metaTag(html, 'og:title') || title;
    cover = metaTag(html, 'og:image') || cover;
    audioUrl = metaTag(html, 'og:audio') || (html.match(/https:\/\/cdn[0-9]*\.suno\.ai\/[0-9a-f-]+\.mp3/i) || [])[0] || audioUrl;
  } catch {}
  if (!audioUrl) audioUrl = 'https://cdn1.suno.ai/' + id + '.mp3';
  return { id: 'suno:' + id, title, cover, audioUrl, lyrics };
});

/* ===================== Suno session + audio fetch ===================== */
function sunoSession() { return session.fromPartition('persist:suno'); }
let sunoAuth = null;

// Only suno.com / suno.ai (and their subdomains, e.g. cdn1.suno.ai) are trusted.
// Used to gate where we'll fetch audio and — critically — where the captured Suno
// bearer token may be sent, so a tampered backup can't exfiltrate it to a 3rd party.
function isSunoHost(u) {
  try {
    const h = new URL(u).hostname.toLowerCase();
    return h === 'suno.com' || h === 'suno.ai' || h.endsWith('.suno.com') || h.endsWith('.suno.ai');
  } catch { return false; }
}

function sunoFetchOnce(url, { auth, referer }) {
  return new Promise((resolve, reject) => {
    const request = net.request({ url, session: sunoSession(), useSessionCookies: true });
    request.setHeader('User-Agent', USER_AGENT);
    request.setHeader('Accept', '*/*');
    if (referer) { request.setHeader('Referer', 'https://suno.com/'); request.setHeader('Origin', 'https://suno.com'); }
    // never attach the user's Suno auth token to a non-Suno host
    if (auth && sunoAuth && isSunoHost(url)) request.setHeader('Authorization', sunoAuth);
    request.on('response', (r) => {
      const c = [];
      r.on('data', (d) => c.push(d));
      r.on('end', () => { if (r.statusCode >= 200 && r.statusCode < 300) resolve(Buffer.concat(c)); else reject(new Error('HTTP ' + r.statusCode)); });
    });
    request.on('error', reject);
    request.end();
  });
}

async function sunoFetchBuffer(url) {
  // build candidate urls: the captured one (only if it's a Suno host) + plain
  // public CDN forms by id. A non-Suno url is dropped so we never reach out to,
  // or send credentials to, an arbitrary host smuggled in via an imported backup.
  const id = extractSunoId(url);
  const candidates = [];
  if (isSunoHost(url)) candidates.push(url);
  if (id) { candidates.push('https://cdn1.suno.ai/' + id + '.mp3', 'https://cdn2.suno.ai/' + id + '.mp3'); }
  if (!candidates.length) throw new Error('Not a Suno audio URL.');
  // header variants — some CDNs 403 with an Authorization header, some need Referer
  const variants = [{ auth: false, referer: true }, { auth: true, referer: true }, { auth: false, referer: false }];
  let lastErr;
  for (const u of candidates) {
    for (const v of variants) {
      try { const buf = await sunoFetchOnce(u, v); if (buf && buf.length > 1024) return buf; }
      catch (e) { lastErr = e; if (!/HTTP 40[0-9]|HTTP 5/.test(e.message)) { /* network err: try next */ } }
    }
  }
  throw lastErr || new Error('Could not fetch audio.');
}

ipcMain.handle('suno:fetchUrl', async (_e, url) => {
  // host-based check (not a substring match, which https://evil.com/suno.com would pass)
  if (!isSunoHost(url) && !extractSunoId(url)) throw new Error('That URL is not a Suno address.');
  try {
    const buf = await sunoFetchBuffer(url);
    return { bytes: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
  } catch (e) {
    throw new Error('Suno blocked the audio (' + e.message + '). Make sure you\'re logged in, then play it once in the Explore pane and re-import.');
  }
});

ipcMain.handle('tracks:download', async (_e, ids) => {
  const picks = state.tracks.filter((t) => ids.includes(t.id) && t.audioUrl);
  if (!picks.length) return { ok: false, message: 'Those songs have no downloadable audio.' };
  const res = await dialog.showOpenDialog(mainWindow, { title: 'Choose a download folder', properties: ['openDirectory', 'createDirectory'] });
  if (res.canceled || !res.filePaths.length) return { ok: false, canceled: true };
  const dir = res.filePaths[0]; let n = 0, fail = 0, lastErr = '';
  for (const t of picks) {
    try {
      const buf = await sunoFetchBuffer(t.audioUrl);
      const base = (t.title || 'song').replace(/[\\/:*?"<>|]/g, '_').slice(0, 80).trim() || 'song';
      let file = path.join(dir, base + '.mp3'); let i = 1;
      while (fs.existsSync(file)) file = path.join(dir, base + ' (' + (i++) + ').mp3');
      fs.writeFileSync(file, buf); n++;
    } catch (e) { fail++; lastErr = e.message || 'fetch failed'; }
  }
  let message;
  if (n === 0) message = 'Suno blocked the audio (' + lastErr + '). Open Explore and sign into Suno once so the app can authorize, then try again.';
  else if (fail) message = 'Downloaded ' + n + ', but ' + fail + ' couldn\'t be fetched (' + lastErr + ').';
  return { ok: n > 0, count: n, failed: fail, dir, message };
});

/* ===================== offline cache (play from disk, works offline) ===================== */
function offlineDir() { const d = path.join(app.getPath('userData'), 'offline'); try { fs.mkdirSync(d, { recursive: true }); } catch {} return d; }
function offlineFile(id) { return path.join(offlineDir(), String(id).replace(/[^a-z0-9_-]/gi, '_') + '.mp3'); }
ipcMain.handle('offline:get', (_e, id) => {
  try { const f = offlineFile(id); if (fs.existsSync(f)) { const b = fs.readFileSync(f); return { bytes: b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) }; } } catch {}
  return { bytes: null };
});
ipcMain.handle('offline:save', (_e, id, arrbuf) => {
  try { fs.writeFileSync(offlineFile(id), Buffer.from(arrbuf)); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('offline:saveUrl', async (_e, id, url) => {
  try { const f = offlineFile(id); if (fs.existsSync(f)) return { ok: true, cached: true }; const buf = await sunoFetchBuffer(url); fs.writeFileSync(f, buf); return { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('offline:list', () => { try { return fs.readdirSync(offlineDir()).filter((f) => f.endsWith('.mp3')); } catch { return []; } });
ipcMain.handle('offline:clear', () => { try { const d = offlineDir(); for (const f of fs.readdirSync(d)) if (f.endsWith('.mp3')) fs.unlinkSync(path.join(d, f)); return { ok: true }; } catch (e) { return { ok: false, error: e.message }; } });

/* ===================== embedded Suno: capture auth token for private audio ===================== */
const attached = new Set();

function attachHarvest(wc) {
  if (!wc || attached.has(wc.id)) return;
  attached.add(wc.id);
  wc.on('destroyed', () => { attached.delete(wc.id); });

  try { wc.setWebRTCIPHandlingPolicy('disable_non_proxied_udp'); } catch {}

  // Suno links that try to open a new tab/window get sent to the system browser
  // (http/https only) rather than silently swallowed or opened inside the app.
  try {
    wc.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
      return { action: 'deny' };
    });
  } catch {}

  // capture the bearer token Suno's page sends, so we can fetch private audio
  // for the songs you Pick.
  try {
    wc.session.webRequest.onBeforeSendHeaders((details, cb) => {
      const h = details.requestHeaders;
      const auth = h['Authorization'] || h['authorization'];
      if (auth && /suno/i.test(details.url)) sunoAuth = auth;
      cb({ requestHeaders: h });
    });
  } catch {}
}

ipcMain.handle('suno:attach', (_e, wcId) => { attachHarvest(webContents.fromId(wcId)); return true; });

/* ===================== backup / restore ===================== */
ipcMain.handle('config:export', async () => {
  const res = await dialog.showSaveDialog(mainWindow, { title: 'Backup library', defaultPath: 'kawaii-library.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
  if (res.canceled || !res.filePath) return false;
  try { fs.writeFileSync(res.filePath, JSON.stringify({ importedTracks: state.tracks, playlists: state.playlists }, null, 2)); return true; } catch { return false; }
});
ipcMain.handle('config:import', async () => {
  const res = await dialog.showOpenDialog(mainWindow, { title: 'Restore library', properties: ['openFile'], filters: [{ name: 'JSON', extensions: ['json'] }] });
  if (res.canceled || !res.filePaths.length) return false;
  try {
    const d = JSON.parse(fs.readFileSync(res.filePaths[0], 'utf8'));
    if (Array.isArray(d.importedTracks)) { const have = new Set(state.tracks.map((t) => t.id)); for (const t of d.importedTracks) if (t && t.id && !have.has(t.id)) state.tracks.push(t); }
    if (Array.isArray(d.playlists)) {
      const have = new Set(state.playlists.map((p) => p.id));
      for (const p of d.playlists) {
        if (!p || !p.id || have.has(p.id)) continue;
        // normalize so a hand-edited backup can't break later playlist ops
        state.playlists.push({ id: p.id, name: String(p.name || 'Playlist').slice(0, 40), trackIds: Array.isArray(p.trackIds) ? p.trackIds : [] });
      }
    }
    saveState(); return true;
  } catch { return false; }
});

