// suno-preload.js — runs INSIDE the embedded Suno page (the webview guest).
// Primary harvest is DOM scraping (works regardless of how the page loads data,
// and works even with context isolation). Network hooks are a bonus for richer
// metadata. Talks to the host via ipcRenderer.sendToHost. No CDP debugger.
const { ipcRenderer } = require('electron');

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function send(tracks) { if (tracks && tracks.length) { try { ipcRenderer.sendToHost('suno-tracks', tracks); } catch {} } }

/* ---------- DOM scrape (primary) ---------- */
function scanDom() {
  try {
    const byId = new Map();
    // song links -> id + title
    document.querySelectorAll('a[href*="/song/"]').forEach((a) => {
      const href = a.getAttribute('href') || a.href || '';
      const m = href.match(UUID); if (!m) return;
      const id = m[0];
      let title = (a.getAttribute('title') || a.getAttribute('aria-label') || a.textContent || '').trim();
      if (title.length > 90 || /,/.test(title)) title = title.split('\n')[0].trim().slice(0, 90);
      if (!byId.has(id)) byId.set(id, { title: title || '', cover: null });
      else if (title && !byId.get(id).title) byId.get(id).title = title;
    });
    // covers: any img whose src carries the id
    document.querySelectorAll('img[src]').forEach((img) => {
      const m = (img.src || '').match(UUID); if (!m) return;
      const id = m[0]; if (byId.has(id) && !byId.get(id).cover) byId.get(id).cover = img.src;
    });
    const out = [];
    byId.forEach((v, id) => out.push({
      id: 'sunoR:' + id,
      title: v.title || 'Suno song',
      audioUrl: 'https://cdn1.suno.ai/' + id + '.mp3',
      cover: v.cover, source: 'suno',
    }));
    send(out);
  } catch {}
}

/* ---------- network hooks (bonus, richer data) ---------- */
function extractTracks(node, out, seen) {
  out = out || []; seen = seen || new Set();
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) { for (const x of node) extractTracks(x, out, seen); return out; }
  const audio = node.audio_url || node.audioUrl || node.audio || node.stream_url || null;
  if (audio && typeof audio === 'string' && /^https?:\/\//.test(audio) && /\.(mp3|m4a|mp4|ogg|wav)(\?|$)/i.test(audio)) {
    const id = String(node.id || node.clip_id || audio);
    if (!seen.has(id)) {
      seen.add(id);
      const md = node.metadata || {};
      out.push({ id: 'sunoR:' + id, title: node.title || md.title || 'Suno song', audioUrl: audio, cover: node.image_url || node.image_large_url || md.cover_image_url || null, lyrics: md.prompt || md.lyrics || node.lyrics || null, source: 'suno' });
    }
  }
  for (const k in node) { const v = node[k]; if (v && typeof v === 'object') extractTracks(v, out, seen); }
  return out;
}
function handleJson(text) { try { send(extractTracks(JSON.parse(text))); } catch {} }

try {
  const _fetch = window.fetch;
  if (_fetch) window.fetch = function () {
    return _fetch.apply(this, arguments).then((res) => {
      try { const ct = (res.headers && res.headers.get && res.headers.get('content-type')) || ''; if (/json/i.test(ct)) res.clone().text().then(handleJson).catch(() => {}); } catch {}
      return res;
    });
  };
  const _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function () {
    try { this.addEventListener('load', function () { try { const ct = (this.getResponseHeader && this.getResponseHeader('content-type')) || ''; if (/json/i.test(ct) && typeof this.responseText === 'string') handleJson(this.responseText); } catch {} }); } catch {}
    return _send.apply(this, arguments);
  };
} catch {}

/* ---------- played detection (click a song card, or audio src w/ id) ---------- */
function idFromNode(node) {
  if (!node) return null;
  const link = (node.matches && node.matches('a[href*="/song/"]')) ? node : (node.querySelector && node.querySelector('a[href*="/song/"]'));
  const href = link ? (link.getAttribute('href') || link.href || '') : '';
  let m = href.match(UUID);
  if (!m && node.getAttribute) { const dc = node.getAttribute('data-clip-id') || node.getAttribute('data-key') || ''; m = dc.match(UUID); }
  return m ? m[0] : null;
}
try {
  document.addEventListener('click', (e) => {
    try {
      const card = (e.target.closest && (e.target.closest('a[href*="/song/"]') || e.target.closest('[data-clip-id],[class*="card"],[class*="row"],li,article'))) || null;
      const id = idFromNode(card);
      if (id) ipcRenderer.sendToHost('suno-played', 'sunoR:' + id);
    } catch {}
  }, true);
  document.addEventListener('play', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'AUDIO' || t.tagName === 'VIDEO')) {
      const m = String(t.currentSrc || t.src || '').match(UUID);
      if (m) { try { ipcRenderer.sendToHost('suno-played', 'sunoR:' + m[0]); } catch {} }
    }
  }, true);
} catch {}

/* ---------- SPA route-change detection (reset list on page change) ---------- */
let lastUrl = location.href;
function checkUrl() {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    try { ipcRenderer.sendToHost('suno-reset'); } catch {}
    setTimeout(scanDom, 400); setTimeout(scanDom, 1200); setTimeout(scanDom, 2500);
  }
}
try {
  const _push = history.pushState; history.pushState = function () { const r = _push.apply(this, arguments); checkUrl(); return r; };
  const _replace = history.replaceState; history.replaceState = function () { const r = _replace.apply(this, arguments); checkUrl(); return r; };
  window.addEventListener('popstate', checkUrl);
} catch {}

/* ---------- run ---------- */
function start() {
  try { ipcRenderer.sendToHost('suno-ready'); } catch {}
  scanDom();
  setInterval(scanDom, 1800);
  setInterval(checkUrl, 900);
  try { new MutationObserver(() => { clearTimeout(window.__kwScan); window.__kwScan = setTimeout(scanDom, 600); }).observe(document.documentElement, { childList: true, subtree: true }); } catch {}
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
