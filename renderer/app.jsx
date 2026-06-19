/* app.jsx — Suno Kawaii Player UI (source). Compiled to app.js by build.js. */
const { useState, useEffect, useRef, useCallback } = React;
const api = window.kawaii;

const fmt = (s) => { if (!s || !isFinite(s)) return '0:00'; const m = Math.floor(s / 60); const ss = Math.floor(s % 60).toString().padStart(2, '0'); return m + ':' + ss; };
const GLYPHS = ['🎀', '🌸', '⭐', '💜', '🍓', '🐾', '🌙', '🍰'];

/* ===================== cosmetics ===================== */
function useCosmetics() {
  useEffect(() => {
    const pcv = document.getElementById('bg-particles'), tcv = document.getElementById('cursor-trail');
    const pctx = pcv.getContext('2d'), tctx = tcv.getContext('2d');
    let raf; const COLORS = ['#ff7ec2', '#ffe066', '#ff4fa3', '#caa7ff'];
    function size() { for (const c of [pcv, tcv]) { c.width = innerWidth; c.height = innerHeight; } }
    size(); addEventListener('resize', size);
    const parts = Array.from({ length: 52 }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: 1 + Math.random() * 3, vx: (Math.random() - 0.5) * 0.35, vy: -0.2 - Math.random() * 0.5, a: 0.25 + Math.random() * 0.55, c: COLORS[(Math.random() * COLORS.length) | 0] }));
    let trail = [];
    const onMove = (e) => { trail.push({ x: e.clientX, y: e.clientY, life: 1 }); if (trail.length > 28) trail.shift(); };
    addEventListener('mousemove', onMove);
    const onClick = (e) => { const r = document.createElement('div'); r.className = 'ripple'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; r.style.width = r.style.height = '230px'; document.body.appendChild(r); setTimeout(() => r.remove(), 660); };
    addEventListener('click', onClick);
    function loop() {
      pctx.clearRect(0, 0, pcv.width, pcv.height);
      for (const p of parts) { p.x += p.vx; p.y += p.vy; if (p.y < -10) { p.y = innerHeight + 10; p.x = Math.random() * innerWidth; } if (p.x < -10) p.x = innerWidth + 10; if (p.x > innerWidth + 10) p.x = -10; pctx.globalAlpha = p.a; pctx.fillStyle = p.c; pctx.beginPath(); pctx.arc(p.x, p.y, p.r, 0, 7); pctx.fill(); }
      pctx.globalAlpha = 1;
      tctx.clearRect(0, 0, tcv.width, tcv.height);
      for (let i = 0; i < trail.length; i++) { const t = trail[i]; t.life *= 0.92; const rr = (i / trail.length) * 7 + 1; tctx.globalAlpha = t.life * 0.6; tctx.fillStyle = i % 2 ? '#ffe066' : '#ff7ec2'; tctx.beginPath(); tctx.arc(t.x, t.y, rr, 0, 7); tctx.fill(); }
      tctx.globalAlpha = 1; raf = requestAnimationFrame(loop);
    }
    loop();
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size); removeEventListener('mousemove', onMove); removeEventListener('click', onClick); };
  }, []);
}

/* ===================== titlebar ===================== */
function TitleBar({ collapsed, onToggle }) {
  const [max, setMax] = useState(false);
  useEffect(() => { api.onMaximizeState && api.onMaximizeState(setMax); }, []);
  return (
    <div className="titlebar">
      <button className="rail-btn" title={collapsed ? 'Show list' : 'Hide list'} onClick={onToggle}>{collapsed ? '▶' : '◀'}</button>
      <div className="brand"><span className="heart">♥</span> Suno Kawaii Player</div>
      <div className="spacer" />
      <div className="win-btns">
        <button className="win-btn" title="Minimize" onClick={() => api.minimize()}>—</button>
        <button className="win-btn" title="Maximize" onClick={() => api.maximize()}>{max ? '❐' : '▢'}</button>
        <button className="win-btn close" title="Close" onClick={() => api.close()}>✕</button>
      </div>
    </div>
  );
}

/* ===================== track row ===================== */
function TrackRow({ track, index, active, playing, onPlay, onMenu, selectable, checked, onToggle }) {
  return (
    <div className={'track' + (active ? ' active' : '') + (checked ? ' picked' : '')} style={{ animationDelay: Math.min(index * 0.035, 0.5) + 's' }}
         onClick={onPlay} onContextMenu={onMenu}>
      {selectable && <div className={'chk' + (checked ? ' on' : '')} onClick={(e) => { e.stopPropagation(); onToggle(); }}>{checked ? '✓' : ''}</div>}
      {track.cover
        ? <img className="thumb" src={track.cover} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
        : <div className="tnum">{active && playing ? <div className="eqbars"><span/><span/><span/><span/></div> : GLYPHS[index % GLYPHS.length]}</div>}
      <div className="tmeta"><div className="tname">{track.title}</div><div className="tsrc">💜 Suno</div></div>
      {active && playing && track.cover && <div className="eqbars" style={{ marginLeft: 'auto' }}><span/><span/><span/><span/></div>}
    </div>
  );
}

const REPEAT_MODES = ['off', 'all', 'one'];

/* ===================== app ===================== */
function App() {
  useCosmetics();
  const [tab, setTab] = useState('library');
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [selPl, setSelPl] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [curId, setCurId] = useState(null);
  const [current, setCurrent] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off');
  const [sunoInput, setSunoInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [embedded, setEmbedded] = useState(false);
  const [sunoStart, setSunoStart] = useState('https://suno.com/me');
  const [ctx, setCtx] = useState(null);          // {x,y,track}
  const [pageTracks, setPageTracks] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [played, setPlayed] = useState({});       // explore: id -> true (streamed)
  const [onlyPlayed, setOnlyPlayed] = useState(false);
  const [selected, setSelected] = useState([]);   // library: selected track ids
  const [plMenuOpen, setPlMenuOpen] = useState(false);

  const audioRef = useRef(null), sunoRef = useRef(null), webviewRef = useRef(null);
  const urlCache = useRef(new Map()), vizRef = useRef(null), lyricsRef = useRef(null);
  const audioCtxRef = useRef(null), analyserRef = useRef(null);
  const queueRef = useRef([]), idxRef = useRef(-1);
  const repeatRef = useRef('off'), shuffleRef = useRef(false);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);

  const flash = (msg, err) => { setToast({ msg, err }); setTimeout(() => setToast(null), err ? 4800 : 2600); };
  const tracksById = buildIdMap(tracks);

  /* ---- state from main ---- */
  useEffect(() => {
    (async () => { try { const s = await api.getState(); setTracks(s.tracks || []); setPlaylists(s.playlists || []); } catch {} })();
    api.onState && api.onState((s) => { setTracks(s.tracks || []); setPlaylists(s.playlists || []); });
    api.onToast && api.onToast(({ msg, err }) => flash(msg, err));
    api.onSunoPage && api.onSunoPage(({ tracks: pt }) => setPageTracks(pt || []));
    api.onSunoPlayed && api.onSunoPlayed(({ id }) => setPlayed((p) => ({ ...p, [id]: true })));
  }, []);

  /* ---- audio + analyser ---- */
  useEffect(() => {
    const a = new Audio(); a.volume = volume; audioRef.current = a;
    const onTime = () => setProgress(a.currentTime);
    const onMeta = () => setDuration(a.duration || 0);
    const onEnd = () => endedRef.current();
    a.addEventListener('timeupdate', onTime); a.addEventListener('loadedmetadata', onMeta); a.addEventListener('ended', onEnd);
    return () => { a.pause(); a.removeEventListener('timeupdate', onTime); a.removeEventListener('loadedmetadata', onMeta); a.removeEventListener('ended', onEnd); };
    // eslint-disable-next-line
  }, []);
  function ensureAnalyser() {
    if (analyserRef.current) return;
    try { const Ctx = window.AudioContext || window.webkitAudioContext; const ctx = new Ctx(); const src = ctx.createMediaElementSource(audioRef.current); const an = ctx.createAnalyser(); an.fftSize = 128; src.connect(an); an.connect(ctx.destination); audioCtxRef.current = ctx; analyserRef.current = an; } catch {}
  }

  /* ---- visualizer ---- */
  useEffect(() => {
    let raf;
    const draw = () => {
      const bars = vizRef.current ? vizRef.current.children : []; const an = analyserRef.current;
      if (an && playing) { const data = new Uint8Array(an.frequencyBinCount); an.getByteFrequencyData(data); for (let i = 0; i < bars.length; i++) bars[i].style.height = (6 + (data[i % data.length] / 255) * 58) + 'px'; }
      else { for (let i = 0; i < bars.length; i++) bars[i].style.height = (6 + (Math.sin(Date.now() / 380 + i) + 1) * 5) + 'px'; }
      raf = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(raf);
  }, [playing]);

  /* ---- lyrics auto-scroll with progress ---- */
  const lyricLines = (current && current.lyrics ? String(current.lyrics).split(/\n+/).map((l) => l.trim()).filter(Boolean) : []);
  useEffect(() => {
    const box = lyricsRef.current; if (!box || !lyricLines.length || !duration) return;
    const ratio = Math.min(1, progress / duration);
    const active = Math.min(lyricLines.length - 1, Math.floor(ratio * lyricLines.length));
    const lines = box.children;
    for (let i = 0; i < lines.length; i++) lines[i].classList.toggle('on', i === active);
    const el = lines[active]; if (el) box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' });
  }, [progress, duration, current]);

  /* ---- playback ---- */
  const resolveUrl = useCallback(async (track) => {
    if (urlCache.current.has(track.id)) return urlCache.current.get(track.id);
    let bytes;
    if (track.bytes) bytes = track.bytes;
    else if (track.audioUrl) bytes = (await api.fetchSunoUrl(track.audioUrl)).bytes;
    else throw new Error('No audio source for this track.');
    const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
    urlCache.current.set(track.id, url); return url;
  }, []);

  const playFrom = useCallback(async (list, idx) => {
    if (idx < 0 || idx >= list.length) return;
    queueRef.current = list; idxRef.current = idx;
    const track = list[idx]; setCurrent(track); setCurId(track.id);
    try { const url = await resolveUrl(track); const a = audioRef.current; a.src = url; ensureAnalyser(); if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume(); await a.play(); setPlaying(true); }
    catch (e) { flash('Couldn\'t play that — ' + e.message, true); setPlaying(false); }
  }, [resolveUrl]);

  const activeList = useCallback(() => {
    if (tab === 'playlists' && selPl) { const p = playlists.find((p) => p.id === selPl); return p ? p.trackIds.map((id) => tracksById[id]).filter(Boolean) : []; }
    return tracks;
  }, [tab, selPl, playlists, tracks, tracksById]);

  const togglePlay = useCallback(async () => {
    const a = audioRef.current;
    if (!current) { const l = activeList(); if (l.length) playFrom(l, 0); return; }
    if (a.paused) { ensureAnalyser(); if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume(); try { await a.play(); setPlaying(true); } catch {} }
    else { a.pause(); setPlaying(false); }
  }, [current, activeList, playFrom]);

  const computeNext = useCallback(() => {
    const list = queueRef.current, i = idxRef.current; if (!list.length) return -1;
    if (shuffleRef.current) { if (list.length === 1) return i; let n; do { n = (Math.random() * list.length) | 0; } while (n === i); return n; }
    if (i + 1 < list.length) return i + 1; return repeatRef.current === 'all' ? 0 : -1;
  }, []);
  const playNext = useCallback(() => { const n = computeNext(); if (n >= 0) playFrom(queueRef.current, n); }, [computeNext, playFrom]);
  const playPrev = useCallback(() => { const a = audioRef.current; if (a.currentTime > 4) { a.currentTime = 0; return; } const l = queueRef.current; if (!l.length) return; playFrom(l, (idxRef.current - 1 + l.length) % l.length); }, [playFrom]);
  const onEnded = useCallback(() => { const a = audioRef.current; if (repeatRef.current === 'one') { a.currentTime = 0; a.play(); return; } const n = computeNext(); if (n >= 0) playFrom(queueRef.current, n); else setPlaying(false); }, [computeNext, playFrom]);
  const endedRef = useRef(onEnded); useEffect(() => { endedRef.current = onEnded; }, [onEnded]);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  const seek = (e) => { const r = e.currentTarget.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); if (audioRef.current && duration) audioRef.current.currentTime = p * duration; };
  const setVol = (e) => { const r = e.currentTarget.getBoundingClientRect(); setVolume(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))); };

  /* ---- suno + import actions ---- */
  const loadSuno = async () => {
    const v = ((sunoRef.current && sunoRef.current.value) || sunoInput || '').trim();
    if (!v) { flash('Paste a Suno song link or id first.', true); return; }
    setBusy(true);
    try { const r = await api.loadSuno(v); await api.importTrack(r); flash('Loaded from Suno 💜'); setSunoInput(''); }
    catch (e) { flash(e.message || 'Suno load failed.', true); } finally { setBusy(false); }
  };
  function navSuno(url) { const wv = webviewRef.current; if (wv && wv.loadURL) { try { wv.loadURL(url); } catch {} } else setSunoStart(url); }
  const importSunoPlaylist = () => { setEmbedded(true); setSunoStart('https://suno.com/me'); setTab('explore'); navSuno('https://suno.com/me'); flash('Open a playlist, then right-click songs (or ⬇ import all) 🎀'); };
  const connect = () => { setEmbedded(true); setSunoStart('https://suno.com/me'); setTab('explore'); navSuno('https://suno.com/me'); flash('Log into Suno below — it\'s remembered after 🔑'); };
  const chromeLogin = async () => { setBusy(true); flash('Trying to import your Chrome login… 🔑'); try { const r = await api.chromeLogin(); flash(r.ok ? ('Imported ' + r.count + ' cookies — you should be logged in 💜') : r.message, !r.ok); if (r.ok) { setEmbedded(true); setTab('explore'); } } catch (e) { flash('Chrome import failed.', true); } finally { setBusy(false); } };

  useEffect(() => {
    if (!embedded) return; const wv = webviewRef.current; if (!wv) return;
    const onReady = () => { try { api.attachSuno(wv.getWebContentsId()); } catch {} };
    const onMsg = (e) => {
      if (e.channel === 'suno-tracks') {
        const got = e.args[0] || [];
        setPageTracks((prev) => {
          const map = new Map(prev.map((t) => [t.id, t]));
          for (const t of got) {
            const ex = map.get(t.id);
            if (!ex) map.set(t.id, t);
            else map.set(t.id, { ...ex, title: (t.title && t.title !== 'Suno song' && t.title !== 'Untitled Suno song') ? t.title : ex.title, cover: ex.cover || t.cover, audioUrl: ex.audioUrl || t.audioUrl, lyrics: ex.lyrics || t.lyrics });
          }
          return Array.from(map.values()).slice(-400);
        });
      } else if (e.channel === 'suno-played') {
        const id = e.args[0]; if (id) setPlayed((p) => ({ ...p, [id]: true }));
      } else if (e.channel === 'suno-ready') {
        flash('Connected to Suno 🎀');
      } else if (e.channel === 'suno-reset') {
        setPageTracks([]);
      }
    };
    const onNav = () => setPageTracks([]);
    const onCrash = () => { try { wv.reload(); } catch {} };
    wv.addEventListener('dom-ready', onReady);
    wv.addEventListener('ipc-message', onMsg);
    wv.addEventListener('did-navigate', onNav);
    wv.addEventListener('crashed', onCrash);
    wv.addEventListener('render-process-gone', onCrash);
    return () => {
      wv.removeEventListener('dom-ready', onReady); wv.removeEventListener('ipc-message', onMsg);
      wv.removeEventListener('did-navigate', onNav); wv.removeEventListener('crashed', onCrash);
      wv.removeEventListener('render-process-gone', onCrash);
    };
  }, [embedded]);

  /* ---- context menu + selection ---- */
  const openMenu = (track) => (e) => { e.preventDefault(); setCtx({ x: Math.min(e.clientX, innerWidth - 220), y: Math.min(e.clientY, innerHeight - 240), track }); };
  useEffect(() => { const close = () => { setCtx(null); setPlMenuOpen(false); }; addEventListener('click', close); return () => removeEventListener('click', close); }, []);

  const toggleSel = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : s.concat(id));
  const downloadSel = async () => { const r = await api.downloadTracks(selected); if (r.canceled) return; flash(r.ok ? ('Downloaded ' + r.count + ' song' + (r.count > 1 ? 's' : '') + ' 💾') : (r.message || 'Download failed.'), !r.ok); };
  const removeSel = () => { selected.forEach((id) => api.removeTrack(id)); flash('Removed ' + selected.length + ' from library'); setSelected([]); };
  const moveSel = (pid, name) => { selected.forEach((id) => api.addToPlaylist(pid, id)); flash('Moved ' + selected.length + ' to ' + name + ' 💜'); setSelected([]); setPlMenuOpen(false); };

  const newPlaylist = async () => { const p = await api.createPlaylist('Playlist ' + (playlists.length + 1)); if (p) { setTab('playlists'); setSelPl(p.id); } };

  const list = activeList();
  const pct = duration ? (progress / duration) * 100 : 0;
  const repeatOn = repeat !== 'off';
  const curPl = playlists.find((p) => p.id === selPl);

  // explore: hide already-imported, collapse same-title dupes, optionally played-only
  const importedIds = new Set(tracks.map((t) => t.id));
  const importedTitles = new Set(tracks.map((t) => (t.title || '').toLowerCase()));
  let pageView = pageTracks.filter((t) => !importedIds.has(t.id) && !importedTitles.has((t.title || '').toLowerCase()));
  const seenTitle = new Set();
  pageView = pageView.filter((t) => { const k = (t.title || '').toLowerCase(); if (seenTitle.has(k)) return false; seenTitle.add(k); return true; });
  if (onlyPlayed) pageView = pageView.filter((t) => played[t.id]);
  const selectable = tab === 'library' || (tab === 'playlists' && curPl);

  return (
    <>
      <TitleBar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className={'workspace' + (collapsed ? ' collapsed' : '')}>
        {/* ---------- sidebar ---------- */}
        <aside className="sidebar">
          <div className="tabs">
            <div className={'tab' + (tab === 'library' ? ' active' : '')} onClick={() => setTab('library')}>🎵 Library</div>
            <div className={'tab' + (tab === 'playlists' ? ' active' : '')} onClick={() => setTab('playlists')}>📃 Playlists</div>
            <div className={'tab' + (tab === 'explore' ? ' active' : '')} onClick={() => { setTab('explore'); setEmbedded(true); }}>🌟 Explore</div>
          </div>

          {tab === 'library' && (
            <>
              <div className="side-head">
                <div className="side-title">Your songs <small>{tracks.length}</small></div>
                {tracks.length > 0 && <button className="pill-btn" onClick={() => setSelected(selected.length === tracks.length ? [] : tracks.map((t) => t.id))}>{selected.length === tracks.length && tracks.length ? '✓ none' : '✓ all'}</button>}
              </div>
              <button className="connect-btn" onClick={importSunoPlaylist}>⬇ Import from my Suno playlists</button>
              <div className="sub-actions">
                <button className="ghost-btn" onClick={connect}>🔑 Connect Suno</button>
                <button className="ghost-btn" onClick={chromeLogin} disabled={busy}>🌐 Use Chrome login</button>
              </div>
              <div className="sub-actions">
                <button className="ghost-btn" onClick={async () => { const ok = await api.exportLibrary(); if (ok) flash('Library backed up 💾'); }}>💾 Backup</button>
                <button className="ghost-btn" onClick={async () => { const ok = await api.importLibrary(); flash(ok ? 'Library restored 💜' : 'Nothing restored.', !ok); }}>📂 Restore</button>
              </div>
            </>
          )}

          {tab === 'playlists' && (
            <>
              <div className="side-head"><div className="side-title">{curPl ? curPl.name : 'Playlists'} <small>{curPl ? curPl.trackIds.length : playlists.length}</small></div>
                {curPl ? <button className="pill-btn" onClick={() => setSelPl(null)}>← all</button> : <button className="pill-btn" onClick={() => { setCreating((c) => !c); setNewName(''); }}>＋ New</button>}</div>
              {!curPl && creating && (
                <div className="suno-box">
                  <input autoFocus value={newName} placeholder="Playlist name…" onChange={(e) => setNewName(e.target.value)}
                         onKeyDown={async (e) => { if (e.key === 'Enter') { const nm = newName.trim() || ('Playlist ' + (playlists.length + 1)); const p = await api.createPlaylist(nm); setCreating(false); setNewName(''); if (p) setSelPl(p.id); } if (e.key === 'Escape') setCreating(false); }} />
                  <button className="pill-btn" onClick={async () => { const nm = newName.trim() || ('Playlist ' + (playlists.length + 1)); const p = await api.createPlaylist(nm); setCreating(false); setNewName(''); if (p) setSelPl(p.id); }}>Make</button>
                </div>
              )}
              {!curPl && (
                <div className="pl-grid">
                  {playlists.length === 0 && !creating && <div className="empty-note">No playlists yet 🌸<br/>Make one, then right-click songs to add them.</div>}
                  {playlists.map((p) => (
                    <div key={p.id} className="pl-card" onClick={() => setSelPl(p.id)}>
                      <div className="pl-emoji">{GLYPHS[(p.name.length) % GLYPHS.length]}</div>
                      <div className="pl-name">{p.name}</div>
                      <div className="pl-count">{p.trackIds.length} songs</div>
                      <button className="pl-del" title="Delete" onClick={(e) => { e.stopPropagation(); api.deletePlaylist(p.id); }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'explore' && (
            <>
              <div className="side-head"><div className="side-title">To import <small>{pageView.length}</small></div>
                <button className={'pill-btn' + (onlyPlayed ? ' hot' : '')} onClick={() => setOnlyPlayed((v) => !v)}>{onlyPlayed ? '▶ played' : 'all'}</button></div>
              {pageView.length > 0 && <button className="connect-btn" onClick={() => { pageView.forEach((t) => api.importTrack(t)); flash('Imported ' + pageView.length + ' song' + (pageView.length > 1 ? 's' : '') + ' 💜'); }}>＋ Import these {pageView.length}</button>}
              <div className="tracklist">
                {pageView.length === 0 && <div className="empty-note">{onlyPlayed ? <>Play the songs you want on the right ▶<br/>Only ones you play show here (toggle “played” off to see all).</> : <>Browse Suno on the right 🌸<br/>New songs appear here — tap ＋ to import.</>}</div>}
                {pageView.map((t, i) => (
                  <div key={t.id + ':' + i} className="track" style={{ animationDelay: Math.min(i * 0.03, 0.4) + 's' }}>
                    {!played[t.id] && <span className="newdot" title="not played yet" />}
                    {t.cover ? <img className="thumb" src={t.cover} alt="" onError={(e) => { e.target.style.display = 'none'; }} /> : <div className="tnum">{GLYPHS[i % GLYPHS.length]}</div>}
                    <div className="tmeta"><div className="tname">{t.title}</div><div className="tsrc">{played[t.id] ? '▶ played' : '💜 Suno'}</div></div>
                    <button className="imp-btn" title="Import" onClick={() => { api.importTrack(t); flash('Imported "' + String(t.title).slice(0, 24) + '" 💜'); }}>＋</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {selectable && selected.length > 0 && (
            <div className="selbar">
              <span className="selcount">{selected.length} selected</span>
              <button className="sel-act" onClick={downloadSel}>⬇ Download</button>
              <div className="movewrap" onClick={(e) => e.stopPropagation()}>
                <button className="sel-act" onClick={() => setPlMenuOpen((o) => !o)}>📃 Move ▾</button>
                {plMenuOpen && (
                  <div className="movemenu">
                    {playlists.length === 0 && <div className="ctx-empty">No playlists</div>}
                    {playlists.map((p) => <button key={p.id} className="ctx-item" onClick={() => moveSel(p.id, p.name)}>{GLYPHS[p.name.length % GLYPHS.length]} {p.name}</button>)}
                    <button className="ctx-item" onClick={async () => { const p = await api.createPlaylist('Playlist ' + (playlists.length + 1)); if (p) moveSel(p.id, p.name); }}>＋ New playlist</button>
                  </div>
                )}
              </div>
              <button className="sel-act danger" onClick={removeSel}>🗑</button>
              <button className="sel-act" onClick={() => setSelected([])}>✕</button>
            </div>
          )}

          {(tab === 'library' || (tab === 'playlists' && curPl)) && (
            <div className="tracklist">
              {list.length === 0 && <div className="empty-note">{tab === 'playlists' ? <>Empty playlist 🌸<br/>Select songs in Library → Move here.</> : <>No songs yet 🌸<br/>Import from your Suno playlists or Explore.</>}</div>}
              {list.map((t, i) => (
                <TrackRow key={t.id + ':' + i} track={t} index={i} active={t.id === curId} playing={playing}
                          onPlay={() => playFrom(list, i)} onMenu={openMenu(t)}
                          selectable selected={selected.includes(t.id)} onToggle={() => toggleSel(t.id)} />
              ))}
            </div>
          )}
        </aside>

        {/* ---------- stage ---------- */}
        <main className="stage">
          <div className="stage-inner">
            <div className="now-view" style={{ display: tab === 'explore' ? 'none' : 'flex' }}>
              <section className="now">
                <div className="art-wrap">
                  <div className={'art-ring' + (playing ? ' live' : '')} />
                  <div className="art">{current && current.cover ? <img src={current.cover} alt="" /> : <div className="art-glyph">{current ? '🎵' : '🎧'}</div>}</div>
                </div>
                <div className="now-meta">
                  <div className="now-kicker">{playing ? 'Now Playing' : (current ? 'Paused' : 'Ready')}</div>
                  <div className="now-title glow">{current ? current.title : 'Pick a song to begin'}</div>
                  <div className="now-sub">{current ? 'Suno AI track' : 'Your kawaii music corner 🎀'}</div>
                  <div className="viz" ref={vizRef}>{Array.from({ length: 28 }).map((_, i) => <span key={i} />)}</div>
                </div>
              </section>
              {lyricLines.length > 0 && (
                <div className="lyrics" ref={lyricsRef}>{lyricLines.map((l, i) => <div key={i} className="lyric-line">{l}</div>)}</div>
              )}
            </div>

            {embedded && (
              <div className="suno-embed" style={{ display: tab === 'explore' ? 'flex' : 'none' }}>
                <div className="embed-nav">
                  <button className="pill-btn" onClick={() => navSuno('https://suno.com/explore')}>🌟 Explore</button>
                  <button className="pill-btn" onClick={() => navSuno('https://suno.com/me')}>🔑 My songs</button>
                  <button className="pill-btn" onClick={() => { const w = webviewRef.current; if (w && w.canGoBack && w.canGoBack()) w.goBack(); }}>←</button>
                  <button className="pill-btn" onClick={() => { const w = webviewRef.current; if (w && w.reload) w.reload(); }}>⟳</button>
                  <span className="embed-hint">songs show in the list ← tap ＋ to import 💜</span>
                </div>
                <webview ref={webviewRef} className="suno-webview" src={sunoStart} partition="persist:suno"
                         preload={api.sunoPreloadPath} webpreferences="contextIsolation=no,sandbox=no,nodeIntegration=no"></webview>
              </div>
            )}
          </div>

          {/* ---------- transport ---------- */}
          <div className="transport">
            <div className="seek">
              <div className="time">{fmt(progress)}</div>
              <div className="bar" onClick={seek}><div className="fill" style={{ width: pct + '%' }} /><div className="knob" style={{ left: pct + '%' }} /></div>
              <div className="time">{fmt(duration)}</div>
            </div>
            <div className="controls">
              <button className={'ctl' + (shuffle ? ' on' : '')} title={'Shuffle: ' + (shuffle ? 'on' : 'off')} onClick={() => setShuffle((s) => !s)}>🔀</button>
              <button className="ctl" title="Previous" onClick={playPrev}>⏮</button>
              <button className="ctl play" title="Play / Pause" onClick={togglePlay}>{playing ? '❚❚' : '►'}</button>
              <button className="ctl" title="Next" onClick={playNext}>⏭</button>
              <button className={'ctl' + (repeatOn ? ' on' : '')} title={'Repeat: ' + repeat} onClick={() => setRepeat((r) => REPEAT_MODES[(REPEAT_MODES.indexOf(r) + 1) % 3])}>🔁{repeat === 'one' && <span className="badge">1</span>}</button>
              <div className="volwrap"><span style={{ fontSize: 15 }}>{volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</span><div className="vol" onClick={setVol}><div className="vfill" style={{ width: (volume * 100) + '%' }} /></div></div>
            </div>
          </div>
        </main>
      </div>

      {/* context menu */}
      {ctx && (
        <div className="ctx" style={{ left: ctx.x, top: ctx.y }} onClick={(e) => e.stopPropagation()}>
          <div className="ctx-head">Add to playlist</div>
          {playlists.length === 0 && <div className="ctx-empty">No playlists yet</div>}
          {playlists.map((p) => (
            <button key={p.id} className="ctx-item" onClick={() => { api.addToPlaylist(p.id, ctx.track.id); flash('Added to ' + p.name + ' 💜'); setCtx(null); }}>{GLYPHS[p.name.length % GLYPHS.length]} {p.name}</button>
          ))}
          <button className="ctx-item" onClick={async () => { const p = await api.createPlaylist('Playlist ' + (playlists.length + 1)); if (p) { api.addToPlaylist(p.id, ctx.track.id); flash('Added to new playlist 💜'); } setCtx(null); }}>＋ New playlist…</button>
          <div className="ctx-sep" />
          {tab === 'playlists' && curPl && <button className="ctx-item" onClick={() => { api.removeFromPlaylist(curPl.id, ctx.track.id); setCtx(null); }}>➖ Remove from this list</button>}
          <button className="ctx-item danger" onClick={() => { api.removeTrack(ctx.track.id); setCtx(null); }}>🗑 Remove from library</button>
        </div>
      )}

      {toast && <div className={'toast' + (toast.err ? ' err' : '')}>{busy && <div className="spinner" />}<span>{toast.msg}</span></div>}
    </>
  );
}

// tiny helper: id -> track lookup map
function buildIdMap(tracks) {
  const map = {};
  for (const t of tracks) map[t.id] = t;
  return map;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
