(() => {
  // renderer/app.jsx
  var { useState, useEffect, useRef, useCallback } = React;
  var api = window.kawaii;
  var fmt = (s) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60).toString().padStart(2, "0");
    return m + ":" + ss;
  };
  var GLYPHS = ["\u{1F380}", "\u{1F338}", "\u2B50", "\u{1F49C}", "\u{1F353}", "\u{1F43E}", "\u{1F319}", "\u{1F370}"];
  function useCosmetics() {
    useEffect(() => {
      const pcv = document.getElementById("bg-particles"), tcv = document.getElementById("cursor-trail");
      const pctx = pcv.getContext("2d"), tctx = tcv.getContext("2d");
      let raf;
      const COLORS = ["#ff7ec2", "#ffe066", "#ff4fa3", "#caa7ff"];
      function size() {
        for (const c of [pcv, tcv]) {
          c.width = innerWidth;
          c.height = innerHeight;
        }
      }
      size();
      addEventListener("resize", size);
      const parts = Array.from({ length: 52 }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: 1 + Math.random() * 3, vx: (Math.random() - 0.5) * 0.35, vy: -0.2 - Math.random() * 0.5, a: 0.25 + Math.random() * 0.55, c: COLORS[Math.random() * COLORS.length | 0] }));
      let trail = [];
      const onMove = (e) => {
        trail.push({ x: e.clientX, y: e.clientY, life: 1 });
        if (trail.length > 28) trail.shift();
      };
      addEventListener("mousemove", onMove);
      const onClick = (e) => {
        const r = document.createElement("div");
        r.className = "ripple";
        r.style.left = e.clientX + "px";
        r.style.top = e.clientY + "px";
        r.style.width = r.style.height = "230px";
        document.body.appendChild(r);
        setTimeout(() => r.remove(), 660);
      };
      addEventListener("click", onClick);
      function loop() {
        pctx.clearRect(0, 0, pcv.width, pcv.height);
        for (const p of parts) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < -10) {
            p.y = innerHeight + 10;
            p.x = Math.random() * innerWidth;
          }
          if (p.x < -10) p.x = innerWidth + 10;
          if (p.x > innerWidth + 10) p.x = -10;
          pctx.globalAlpha = p.a;
          pctx.fillStyle = p.c;
          pctx.beginPath();
          pctx.arc(p.x, p.y, p.r, 0, 7);
          pctx.fill();
        }
        pctx.globalAlpha = 1;
        tctx.clearRect(0, 0, tcv.width, tcv.height);
        for (let i = 0; i < trail.length; i++) {
          const t = trail[i];
          t.life *= 0.92;
          const rr = i / trail.length * 7 + 1;
          tctx.globalAlpha = t.life * 0.6;
          tctx.fillStyle = i % 2 ? "#ffe066" : "#ff7ec2";
          tctx.beginPath();
          tctx.arc(t.x, t.y, rr, 0, 7);
          tctx.fill();
        }
        tctx.globalAlpha = 1;
        raf = requestAnimationFrame(loop);
      }
      loop();
      return () => {
        cancelAnimationFrame(raf);
        removeEventListener("resize", size);
        removeEventListener("mousemove", onMove);
        removeEventListener("click", onClick);
      };
    }, []);
  }
  function TitleBar({ collapsed, onToggle }) {
    const [max, setMax] = useState(false);
    useEffect(() => {
      api.onMaximizeState && api.onMaximizeState(setMax);
    }, []);
    return /* @__PURE__ */ React.createElement("div", { className: "titlebar" }, /* @__PURE__ */ React.createElement("button", { className: "rail-btn", title: collapsed ? "Show list" : "Hide list", onClick: onToggle }, collapsed ? "\u25B6" : "\u25C0"), /* @__PURE__ */ React.createElement("div", { className: "brand" }, /* @__PURE__ */ React.createElement("span", { className: "heart" }, "\u2665"), " Suno Kawaii Player"), /* @__PURE__ */ React.createElement("div", { className: "spacer" }), /* @__PURE__ */ React.createElement("div", { className: "win-btns" }, /* @__PURE__ */ React.createElement("button", { className: "win-btn", title: "Minimize", onClick: () => api.minimize() }, "\u2014"), /* @__PURE__ */ React.createElement("button", { className: "win-btn", title: "Maximize", onClick: () => api.maximize() }, max ? "\u2750" : "\u25A2"), /* @__PURE__ */ React.createElement("button", { className: "win-btn close", title: "Close", onClick: () => api.close() }, "\u2715")));
  }
  function TrackRow({ track, index, active, playing, onPlay, onMenu, selectable, checked, onToggle }) {
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "track" + (active ? " active" : "") + (checked ? " picked" : ""),
        style: { animationDelay: Math.min(index * 0.035, 0.5) + "s" },
        onClick: onPlay,
        onContextMenu: onMenu
      },
      selectable && /* @__PURE__ */ React.createElement("div", { className: "chk" + (checked ? " on" : ""), onClick: (e) => {
        e.stopPropagation();
        onToggle();
      } }, checked ? "\u2713" : ""),
      track.cover ? /* @__PURE__ */ React.createElement("img", { className: "thumb", src: track.cover, alt: "", onError: (e) => {
        e.target.style.display = "none";
      } }) : /* @__PURE__ */ React.createElement("div", { className: "tnum" }, active && playing ? /* @__PURE__ */ React.createElement("div", { className: "eqbars" }, /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("span", null)) : GLYPHS[index % GLYPHS.length]),
      /* @__PURE__ */ React.createElement("div", { className: "tmeta" }, /* @__PURE__ */ React.createElement("div", { className: "tname" }, track.title), /* @__PURE__ */ React.createElement("div", { className: "tsrc" }, "\u{1F49C} Suno")),
      active && playing && track.cover && /* @__PURE__ */ React.createElement("div", { className: "eqbars", style: { marginLeft: "auto" } }, /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("span", null))
    );
  }
  var REPEAT_MODES = ["off", "all", "one"];
  function App() {
    useCosmetics();
    const [tab, setTab] = useState("library");
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
    const [repeat, setRepeat] = useState("off");
    const [sunoInput, setSunoInput] = useState("");
    const [busy, setBusy] = useState(false);
    const [toast, setToast] = useState(null);
    const [embedded, setEmbedded] = useState(false);
    const [sunoStart, setSunoStart] = useState("https://suno.com/me");
    const [ctx, setCtx] = useState(null);
    const [pageTracks, setPageTracks] = useState([]);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [played, setPlayed] = useState({});
    const [onlyPlayed, setOnlyPlayed] = useState(false);
    const [selected, setSelected] = useState([]);
    const [plMenuOpen, setPlMenuOpen] = useState(false);
    const audioRef = useRef(null), sunoRef = useRef(null), webviewRef = useRef(null);
    const urlCache = useRef(/* @__PURE__ */ new Map()), vizRef = useRef(null), lyricsRef = useRef(null);
    const audioCtxRef = useRef(null), analyserRef = useRef(null);
    const queueRef = useRef([]), idxRef = useRef(-1);
    const repeatRef = useRef("off"), shuffleRef = useRef(false);
    useEffect(() => {
      repeatRef.current = repeat;
    }, [repeat]);
    useEffect(() => {
      shuffleRef.current = shuffle;
    }, [shuffle]);
    const flash = (msg, err) => {
      setToast({ msg, err });
      setTimeout(() => setToast(null), err ? 4800 : 2600);
    };
    const tracksById = buildIdMap(tracks);
    useEffect(() => {
      (async () => {
        try {
          const s = await api.getState();
          setTracks(s.tracks || []);
          setPlaylists(s.playlists || []);
        } catch {
        }
      })();
      api.onState && api.onState((s) => {
        setTracks(s.tracks || []);
        setPlaylists(s.playlists || []);
      });
      api.onToast && api.onToast(({ msg, err }) => flash(msg, err));
      api.onSunoPage && api.onSunoPage(({ tracks: pt }) => setPageTracks(pt || []));
      api.onSunoPlayed && api.onSunoPlayed(({ id }) => setPlayed((p) => ({ ...p, [id]: true })));
    }, []);
    useEffect(() => {
      const a = new Audio();
      a.volume = volume;
      audioRef.current = a;
      const onTime = () => setProgress(a.currentTime);
      const onMeta = () => setDuration(a.duration || 0);
      const onEnd = () => endedRef.current();
      a.addEventListener("timeupdate", onTime);
      a.addEventListener("loadedmetadata", onMeta);
      a.addEventListener("ended", onEnd);
      return () => {
        a.pause();
        a.removeEventListener("timeupdate", onTime);
        a.removeEventListener("loadedmetadata", onMeta);
        a.removeEventListener("ended", onEnd);
      };
    }, []);
    function ensureAnalyser() {
      if (analyserRef.current) return;
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx2 = new Ctx();
        const src = ctx2.createMediaElementSource(audioRef.current);
        const an = ctx2.createAnalyser();
        an.fftSize = 128;
        src.connect(an);
        an.connect(ctx2.destination);
        audioCtxRef.current = ctx2;
        analyserRef.current = an;
      } catch {
      }
    }
    useEffect(() => {
      let raf;
      const draw = () => {
        const bars = vizRef.current ? vizRef.current.children : [];
        const an = analyserRef.current;
        if (an && playing) {
          const data = new Uint8Array(an.frequencyBinCount);
          an.getByteFrequencyData(data);
          for (let i = 0; i < bars.length; i++) bars[i].style.height = 6 + data[i % data.length] / 255 * 58 + "px";
        } else {
          for (let i = 0; i < bars.length; i++) bars[i].style.height = 6 + (Math.sin(Date.now() / 380 + i) + 1) * 5 + "px";
        }
        raf = requestAnimationFrame(draw);
      };
      draw();
      return () => cancelAnimationFrame(raf);
    }, [playing]);
    const lyricLines = current && current.lyrics ? String(current.lyrics).split(/\n+/).map((l) => l.trim()).filter(Boolean) : [];
    useEffect(() => {
      const box = lyricsRef.current;
      if (!box || !lyricLines.length || !duration) return;
      const ratio = Math.min(1, progress / duration);
      const active = Math.min(lyricLines.length - 1, Math.floor(ratio * lyricLines.length));
      const lines = box.children;
      for (let i = 0; i < lines.length; i++) lines[i].classList.toggle("on", i === active);
      const el = lines[active];
      if (el) box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2, behavior: "smooth" });
    }, [progress, duration, current]);
    const resolveUrl = useCallback(async (track) => {
      if (urlCache.current.has(track.id)) return urlCache.current.get(track.id);
      let bytes;
      if (track.bytes) bytes = track.bytes;
      else if (track.audioUrl) bytes = (await api.fetchSunoUrl(track.audioUrl)).bytes;
      else throw new Error("No audio source for this track.");
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      urlCache.current.set(track.id, url);
      return url;
    }, []);
    const playFrom = useCallback(async (list2, idx) => {
      if (idx < 0 || idx >= list2.length) return;
      queueRef.current = list2;
      idxRef.current = idx;
      const track = list2[idx];
      setCurrent(track);
      setCurId(track.id);
      try {
        const url = await resolveUrl(track);
        const a = audioRef.current;
        a.src = url;
        ensureAnalyser();
        if (audioCtxRef.current && audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
        await a.play();
        setPlaying(true);
      } catch (e) {
        flash("Couldn't play that \u2014 " + e.message, true);
        setPlaying(false);
      }
    }, [resolveUrl]);
    const activeList = useCallback(() => {
      if (tab === "playlists" && selPl) {
        const p = playlists.find((p2) => p2.id === selPl);
        return p ? p.trackIds.map((id) => tracksById[id]).filter(Boolean) : [];
      }
      return tracks;
    }, [tab, selPl, playlists, tracks, tracksById]);
    const togglePlay = useCallback(async () => {
      const a = audioRef.current;
      if (!current) {
        const l = activeList();
        if (l.length) playFrom(l, 0);
        return;
      }
      if (a.paused) {
        ensureAnalyser();
        if (audioCtxRef.current && audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
        try {
          await a.play();
          setPlaying(true);
        } catch {
        }
      } else {
        a.pause();
        setPlaying(false);
      }
    }, [current, activeList, playFrom]);
    const computeNext = useCallback(() => {
      const list2 = queueRef.current, i = idxRef.current;
      if (!list2.length) return -1;
      if (shuffleRef.current) {
        if (list2.length === 1) return i;
        let n;
        do {
          n = Math.random() * list2.length | 0;
        } while (n === i);
        return n;
      }
      if (i + 1 < list2.length) return i + 1;
      return repeatRef.current === "all" ? 0 : -1;
    }, []);
    const playNext = useCallback(() => {
      const n = computeNext();
      if (n >= 0) playFrom(queueRef.current, n);
    }, [computeNext, playFrom]);
    const playPrev = useCallback(() => {
      const a = audioRef.current;
      if (a.currentTime > 4) {
        a.currentTime = 0;
        return;
      }
      const l = queueRef.current;
      if (!l.length) return;
      playFrom(l, (idxRef.current - 1 + l.length) % l.length);
    }, [playFrom]);
    const onEnded = useCallback(() => {
      const a = audioRef.current;
      if (repeatRef.current === "one") {
        a.currentTime = 0;
        a.play();
        return;
      }
      const n = computeNext();
      if (n >= 0) playFrom(queueRef.current, n);
      else setPlaying(false);
    }, [computeNext, playFrom]);
    const endedRef = useRef(onEnded);
    useEffect(() => {
      endedRef.current = onEnded;
    }, [onEnded]);
    useEffect(() => {
      if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);
    const seek = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      if (audioRef.current && duration) audioRef.current.currentTime = p * duration;
    };
    const setVol = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      setVolume(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    };
    const loadSuno = async () => {
      const v = (sunoRef.current && sunoRef.current.value || sunoInput || "").trim();
      if (!v) {
        flash("Paste a Suno song link or id first.", true);
        return;
      }
      setBusy(true);
      try {
        const r = await api.loadSuno(v);
        await api.importTrack(r);
        flash("Loaded from Suno \u{1F49C}");
        setSunoInput("");
      } catch (e) {
        flash(e.message || "Suno load failed.", true);
      } finally {
        setBusy(false);
      }
    };
    function navSuno(url) {
      const wv = webviewRef.current;
      if (wv && wv.loadURL) {
        try {
          wv.loadURL(url);
        } catch {
        }
      } else setSunoStart(url);
    }
    const importSunoPlaylist = () => {
      setEmbedded(true);
      setSunoStart("https://suno.com/me");
      setTab("explore");
      navSuno("https://suno.com/me");
      flash("Open a playlist, then right-click songs (or \u2B07 import all) \u{1F380}");
    };
    const connect = () => {
      setEmbedded(true);
      setSunoStart("https://suno.com/me");
      setTab("explore");
      navSuno("https://suno.com/me");
      flash("Log into Suno below \u2014 it's remembered after \u{1F511}");
    };
    const chromeLogin = async () => {
      setBusy(true);
      flash("Trying to import your Chrome login\u2026 \u{1F511}");
      try {
        const r = await api.chromeLogin();
        flash(r.ok ? "Imported " + r.count + " cookies \u2014 you should be logged in \u{1F49C}" : r.message, !r.ok);
        if (r.ok) {
          setEmbedded(true);
          setTab("explore");
        }
      } catch (e) {
        flash("Chrome import failed.", true);
      } finally {
        setBusy(false);
      }
    };
    useEffect(() => {
      if (!embedded) return;
      const wv = webviewRef.current;
      if (!wv) return;
      const onReady = () => {
        try {
          api.attachSuno(wv.getWebContentsId());
        } catch {
        }
      };
      const onMsg = (e) => {
        if (e.channel === "suno-tracks") {
          const got = e.args[0] || [];
          setPageTracks((prev) => {
            const map = new Map(prev.map((t) => [t.id, t]));
            for (const t of got) {
              const ex = map.get(t.id);
              if (!ex) map.set(t.id, t);
              else map.set(t.id, { ...ex, title: t.title && t.title !== "Suno song" && t.title !== "Untitled Suno song" ? t.title : ex.title, cover: ex.cover || t.cover, audioUrl: ex.audioUrl || t.audioUrl, lyrics: ex.lyrics || t.lyrics });
            }
            return Array.from(map.values()).slice(-400);
          });
        } else if (e.channel === "suno-played") {
          const id = e.args[0];
          if (id) setPlayed((p) => ({ ...p, [id]: true }));
        } else if (e.channel === "suno-ready") {
          flash("Connected to Suno \u{1F380}");
        } else if (e.channel === "suno-reset") {
          setPageTracks([]);
        }
      };
      const onNav = () => setPageTracks([]);
      const onCrash = () => {
        try {
          wv.reload();
        } catch {
        }
      };
      wv.addEventListener("dom-ready", onReady);
      wv.addEventListener("ipc-message", onMsg);
      wv.addEventListener("did-navigate", onNav);
      wv.addEventListener("crashed", onCrash);
      wv.addEventListener("render-process-gone", onCrash);
      return () => {
        wv.removeEventListener("dom-ready", onReady);
        wv.removeEventListener("ipc-message", onMsg);
        wv.removeEventListener("did-navigate", onNav);
        wv.removeEventListener("crashed", onCrash);
        wv.removeEventListener("render-process-gone", onCrash);
      };
    }, [embedded]);
    const openMenu = (track) => (e) => {
      e.preventDefault();
      setCtx({ x: Math.min(e.clientX, innerWidth - 220), y: Math.min(e.clientY, innerHeight - 240), track });
    };
    useEffect(() => {
      const close = () => {
        setCtx(null);
        setPlMenuOpen(false);
      };
      addEventListener("click", close);
      return () => removeEventListener("click", close);
    }, []);
    const toggleSel = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : s.concat(id));
    const downloadSel = async () => {
      const r = await api.downloadTracks(selected);
      if (r.canceled) return;
      flash(r.ok ? "Downloaded " + r.count + " song" + (r.count > 1 ? "s" : "") + " \u{1F4BE}" : r.message || "Download failed.", !r.ok);
    };
    const removeSel = () => {
      selected.forEach((id) => api.removeTrack(id));
      flash("Removed " + selected.length + " from library");
      setSelected([]);
    };
    const moveSel = (pid, name) => {
      selected.forEach((id) => api.addToPlaylist(pid, id));
      flash("Moved " + selected.length + " to " + name + " \u{1F49C}");
      setSelected([]);
      setPlMenuOpen(false);
    };
    const newPlaylist = async () => {
      const p = await api.createPlaylist("Playlist " + (playlists.length + 1));
      if (p) {
        setTab("playlists");
        setSelPl(p.id);
      }
    };
    const list = activeList();
    const pct = duration ? progress / duration * 100 : 0;
    const repeatOn = repeat !== "off";
    const curPl = playlists.find((p) => p.id === selPl);
    const importedIds = new Set(tracks.map((t) => t.id));
    const importedTitles = new Set(tracks.map((t) => (t.title || "").toLowerCase()));
    let pageView = pageTracks.filter((t) => !importedIds.has(t.id) && !importedTitles.has((t.title || "").toLowerCase()));
    const seenTitle = /* @__PURE__ */ new Set();
    pageView = pageView.filter((t) => {
      const k = (t.title || "").toLowerCase();
      if (seenTitle.has(k)) return false;
      seenTitle.add(k);
      return true;
    });
    if (onlyPlayed) pageView = pageView.filter((t) => played[t.id]);
    const selectable = tab === "library" || tab === "playlists" && curPl;
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(TitleBar, { collapsed, onToggle: () => setCollapsed((c) => !c) }), /* @__PURE__ */ React.createElement("div", { className: "workspace" + (collapsed ? " collapsed" : "") }, /* @__PURE__ */ React.createElement("aside", { className: "sidebar" }, /* @__PURE__ */ React.createElement("div", { className: "tabs" }, /* @__PURE__ */ React.createElement("div", { className: "tab" + (tab === "library" ? " active" : ""), onClick: () => setTab("library") }, "\u{1F3B5} Library"), /* @__PURE__ */ React.createElement("div", { className: "tab" + (tab === "playlists" ? " active" : ""), onClick: () => setTab("playlists") }, "\u{1F4C3} Playlists"), /* @__PURE__ */ React.createElement("div", { className: "tab" + (tab === "explore" ? " active" : ""), onClick: () => {
      setTab("explore");
      setEmbedded(true);
    } }, "\u{1F31F} Explore")), tab === "library" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "side-head" }, /* @__PURE__ */ React.createElement("div", { className: "side-title" }, "Your songs ", /* @__PURE__ */ React.createElement("small", null, tracks.length)), tracks.length > 0 && /* @__PURE__ */ React.createElement("button", { className: "pill-btn", onClick: () => setSelected(selected.length === tracks.length ? [] : tracks.map((t) => t.id)) }, selected.length === tracks.length && tracks.length ? "\u2713 none" : "\u2713 all")), /* @__PURE__ */ React.createElement("button", { className: "connect-btn", onClick: importSunoPlaylist }, "\u2B07 Import from my Suno playlists"), /* @__PURE__ */ React.createElement("div", { className: "sub-actions" }, /* @__PURE__ */ React.createElement("button", { className: "ghost-btn", onClick: connect }, "\u{1F511} Connect Suno"), /* @__PURE__ */ React.createElement("button", { className: "ghost-btn", onClick: chromeLogin, disabled: busy }, "\u{1F310} Use Chrome login")), /* @__PURE__ */ React.createElement("div", { className: "sub-actions" }, /* @__PURE__ */ React.createElement("button", { className: "ghost-btn", onClick: async () => {
      const ok = await api.exportLibrary();
      if (ok) flash("Library backed up \u{1F4BE}");
    } }, "\u{1F4BE} Backup"), /* @__PURE__ */ React.createElement("button", { className: "ghost-btn", onClick: async () => {
      const ok = await api.importLibrary();
      flash(ok ? "Library restored \u{1F49C}" : "Nothing restored.", !ok);
    } }, "\u{1F4C2} Restore"))), tab === "playlists" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "side-head" }, /* @__PURE__ */ React.createElement("div", { className: "side-title" }, curPl ? curPl.name : "Playlists", " ", /* @__PURE__ */ React.createElement("small", null, curPl ? curPl.trackIds.length : playlists.length)), curPl ? /* @__PURE__ */ React.createElement("button", { className: "pill-btn", onClick: () => setSelPl(null) }, "\u2190 all") : /* @__PURE__ */ React.createElement("button", { className: "pill-btn", onClick: () => {
      setCreating((c) => !c);
      setNewName("");
    } }, "\uFF0B New")), !curPl && creating && /* @__PURE__ */ React.createElement("div", { className: "suno-box" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        autoFocus: true,
        value: newName,
        placeholder: "Playlist name\u2026",
        onChange: (e) => setNewName(e.target.value),
        onKeyDown: async (e) => {
          if (e.key === "Enter") {
            const nm = newName.trim() || "Playlist " + (playlists.length + 1);
            const p = await api.createPlaylist(nm);
            setCreating(false);
            setNewName("");
            if (p) setSelPl(p.id);
          }
          if (e.key === "Escape") setCreating(false);
        }
      }
    ), /* @__PURE__ */ React.createElement("button", { className: "pill-btn", onClick: async () => {
      const nm = newName.trim() || "Playlist " + (playlists.length + 1);
      const p = await api.createPlaylist(nm);
      setCreating(false);
      setNewName("");
      if (p) setSelPl(p.id);
    } }, "Make")), !curPl && /* @__PURE__ */ React.createElement("div", { className: "pl-grid" }, playlists.length === 0 && !creating && /* @__PURE__ */ React.createElement("div", { className: "empty-note" }, "No playlists yet \u{1F338}", /* @__PURE__ */ React.createElement("br", null), "Make one, then right-click songs to add them."), playlists.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.id, className: "pl-card", onClick: () => setSelPl(p.id) }, /* @__PURE__ */ React.createElement("div", { className: "pl-emoji" }, GLYPHS[p.name.length % GLYPHS.length]), /* @__PURE__ */ React.createElement("div", { className: "pl-name" }, p.name), /* @__PURE__ */ React.createElement("div", { className: "pl-count" }, p.trackIds.length, " songs"), /* @__PURE__ */ React.createElement("button", { className: "pl-del", title: "Delete", onClick: (e) => {
      e.stopPropagation();
      api.deletePlaylist(p.id);
    } }, "\u2715"))))), tab === "explore" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "side-head" }, /* @__PURE__ */ React.createElement("div", { className: "side-title" }, "To import ", /* @__PURE__ */ React.createElement("small", null, pageView.length)), /* @__PURE__ */ React.createElement("button", { className: "pill-btn" + (onlyPlayed ? " hot" : ""), onClick: () => setOnlyPlayed((v) => !v) }, onlyPlayed ? "\u25B6 played" : "all")), pageView.length > 0 && /* @__PURE__ */ React.createElement("button", { className: "connect-btn", onClick: () => {
      pageView.forEach((t) => api.importTrack(t));
      flash("Imported " + pageView.length + " song" + (pageView.length > 1 ? "s" : "") + " \u{1F49C}");
    } }, "\uFF0B Import these ", pageView.length), /* @__PURE__ */ React.createElement("div", { className: "tracklist" }, pageView.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "empty-note" }, onlyPlayed ? /* @__PURE__ */ React.createElement(React.Fragment, null, "Play the songs you want on the right \u25B6", /* @__PURE__ */ React.createElement("br", null), "Only ones you play show here (toggle \u201Cplayed\u201D off to see all).") : /* @__PURE__ */ React.createElement(React.Fragment, null, "Browse Suno on the right \u{1F338}", /* @__PURE__ */ React.createElement("br", null), "New songs appear here \u2014 tap \uFF0B to import.")), pageView.map((t, i) => /* @__PURE__ */ React.createElement("div", { key: t.id + ":" + i, className: "track", style: { animationDelay: Math.min(i * 0.03, 0.4) + "s" } }, !played[t.id] && /* @__PURE__ */ React.createElement("span", { className: "newdot", title: "not played yet" }), t.cover ? /* @__PURE__ */ React.createElement("img", { className: "thumb", src: t.cover, alt: "", onError: (e) => {
      e.target.style.display = "none";
    } }) : /* @__PURE__ */ React.createElement("div", { className: "tnum" }, GLYPHS[i % GLYPHS.length]), /* @__PURE__ */ React.createElement("div", { className: "tmeta" }, /* @__PURE__ */ React.createElement("div", { className: "tname" }, t.title), /* @__PURE__ */ React.createElement("div", { className: "tsrc" }, played[t.id] ? "\u25B6 played" : "\u{1F49C} Suno")), /* @__PURE__ */ React.createElement("button", { className: "imp-btn", title: "Import", onClick: () => {
      api.importTrack(t);
      flash('Imported "' + String(t.title).slice(0, 24) + '" \u{1F49C}');
    } }, "\uFF0B"))))), selectable && selected.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "selbar" }, /* @__PURE__ */ React.createElement("span", { className: "selcount" }, selected.length, " selected"), /* @__PURE__ */ React.createElement("button", { className: "sel-act", onClick: downloadSel }, "\u2B07 Download"), /* @__PURE__ */ React.createElement("div", { className: "movewrap", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("button", { className: "sel-act", onClick: () => setPlMenuOpen((o) => !o) }, "\u{1F4C3} Move \u25BE"), plMenuOpen && /* @__PURE__ */ React.createElement("div", { className: "movemenu" }, playlists.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "ctx-empty" }, "No playlists"), playlists.map((p) => /* @__PURE__ */ React.createElement("button", { key: p.id, className: "ctx-item", onClick: () => moveSel(p.id, p.name) }, GLYPHS[p.name.length % GLYPHS.length], " ", p.name)), /* @__PURE__ */ React.createElement("button", { className: "ctx-item", onClick: async () => {
      const p = await api.createPlaylist("Playlist " + (playlists.length + 1));
      if (p) moveSel(p.id, p.name);
    } }, "\uFF0B New playlist"))), /* @__PURE__ */ React.createElement("button", { className: "sel-act danger", onClick: removeSel }, "\u{1F5D1}"), /* @__PURE__ */ React.createElement("button", { className: "sel-act", onClick: () => setSelected([]) }, "\u2715")), (tab === "library" || tab === "playlists" && curPl) && /* @__PURE__ */ React.createElement("div", { className: "tracklist" }, list.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "empty-note" }, tab === "playlists" ? /* @__PURE__ */ React.createElement(React.Fragment, null, "Empty playlist \u{1F338}", /* @__PURE__ */ React.createElement("br", null), "Select songs in Library \u2192 Move here.") : /* @__PURE__ */ React.createElement(React.Fragment, null, "No songs yet \u{1F338}", /* @__PURE__ */ React.createElement("br", null), "Import from your Suno playlists or Explore.")), list.map((t, i) => /* @__PURE__ */ React.createElement(
      TrackRow,
      {
        key: t.id + ":" + i,
        track: t,
        index: i,
        active: t.id === curId,
        playing,
        onPlay: () => playFrom(list, i),
        onMenu: openMenu(t),
        selectable: true,
        selected: selected.includes(t.id),
        onToggle: () => toggleSel(t.id)
      }
    )))), /* @__PURE__ */ React.createElement("main", { className: "stage" }, /* @__PURE__ */ React.createElement("div", { className: "stage-inner" }, /* @__PURE__ */ React.createElement("div", { className: "now-view", style: { display: tab === "explore" ? "none" : "flex" } }, /* @__PURE__ */ React.createElement("section", { className: "now" }, /* @__PURE__ */ React.createElement("div", { className: "art-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "art-ring" + (playing ? " live" : "") }), /* @__PURE__ */ React.createElement("div", { className: "art" }, current && current.cover ? /* @__PURE__ */ React.createElement("img", { src: current.cover, alt: "" }) : /* @__PURE__ */ React.createElement("div", { className: "art-glyph" }, current ? "\u{1F3B5}" : "\u{1F3A7}"))), /* @__PURE__ */ React.createElement("div", { className: "now-meta" }, /* @__PURE__ */ React.createElement("div", { className: "now-kicker" }, playing ? "Now Playing" : current ? "Paused" : "Ready"), /* @__PURE__ */ React.createElement("div", { className: "now-title glow" }, current ? current.title : "Pick a song to begin"), /* @__PURE__ */ React.createElement("div", { className: "now-sub" }, current ? "Suno AI track" : "Your kawaii music corner \u{1F380}"), /* @__PURE__ */ React.createElement("div", { className: "viz", ref: vizRef }, Array.from({ length: 28 }).map((_, i) => /* @__PURE__ */ React.createElement("span", { key: i }))))), lyricLines.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "lyrics", ref: lyricsRef }, lyricLines.map((l, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "lyric-line" }, l)))), embedded && /* @__PURE__ */ React.createElement("div", { className: "suno-embed", style: { display: tab === "explore" ? "flex" : "none" } }, /* @__PURE__ */ React.createElement("div", { className: "embed-nav" }, /* @__PURE__ */ React.createElement("button", { className: "pill-btn", onClick: () => navSuno("https://suno.com/explore") }, "\u{1F31F} Explore"), /* @__PURE__ */ React.createElement("button", { className: "pill-btn", onClick: () => navSuno("https://suno.com/me") }, "\u{1F511} My songs"), /* @__PURE__ */ React.createElement("button", { className: "pill-btn", onClick: () => {
      const w = webviewRef.current;
      if (w && w.canGoBack && w.canGoBack()) w.goBack();
    } }, "\u2190"), /* @__PURE__ */ React.createElement("button", { className: "pill-btn", onClick: () => {
      const w = webviewRef.current;
      if (w && w.reload) w.reload();
    } }, "\u27F3"), /* @__PURE__ */ React.createElement("span", { className: "embed-hint" }, "songs show in the list \u2190 tap \uFF0B to import \u{1F49C}")), /* @__PURE__ */ React.createElement(
      "webview",
      {
        ref: webviewRef,
        className: "suno-webview",
        src: sunoStart,
        partition: "persist:suno",
        preload: api.sunoPreloadPath,
        webpreferences: "contextIsolation=no,sandbox=no,nodeIntegration=no"
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "transport" }, /* @__PURE__ */ React.createElement("div", { className: "seek" }, /* @__PURE__ */ React.createElement("div", { className: "time" }, fmt(progress)), /* @__PURE__ */ React.createElement("div", { className: "bar", onClick: seek }, /* @__PURE__ */ React.createElement("div", { className: "fill", style: { width: pct + "%" } }), /* @__PURE__ */ React.createElement("div", { className: "knob", style: { left: pct + "%" } })), /* @__PURE__ */ React.createElement("div", { className: "time" }, fmt(duration))), /* @__PURE__ */ React.createElement("div", { className: "controls" }, /* @__PURE__ */ React.createElement("button", { className: "ctl" + (shuffle ? " on" : ""), title: "Shuffle: " + (shuffle ? "on" : "off"), onClick: () => setShuffle((s) => !s) }, "\u{1F500}"), /* @__PURE__ */ React.createElement("button", { className: "ctl", title: "Previous", onClick: playPrev }, "\u23EE"), /* @__PURE__ */ React.createElement("button", { className: "ctl play", title: "Play / Pause", onClick: togglePlay }, playing ? "\u275A\u275A" : "\u25BA"), /* @__PURE__ */ React.createElement("button", { className: "ctl", title: "Next", onClick: playNext }, "\u23ED"), /* @__PURE__ */ React.createElement("button", { className: "ctl" + (repeatOn ? " on" : ""), title: "Repeat: " + repeat, onClick: () => setRepeat((r) => REPEAT_MODES[(REPEAT_MODES.indexOf(r) + 1) % 3]) }, "\u{1F501}", repeat === "one" && /* @__PURE__ */ React.createElement("span", { className: "badge" }, "1")), /* @__PURE__ */ React.createElement("div", { className: "volwrap" }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15 } }, volume === 0 ? "\u{1F507}" : volume < 0.5 ? "\u{1F509}" : "\u{1F50A}"), /* @__PURE__ */ React.createElement("div", { className: "vol", onClick: setVol }, /* @__PURE__ */ React.createElement("div", { className: "vfill", style: { width: volume * 100 + "%" } }))))))), ctx && /* @__PURE__ */ React.createElement("div", { className: "ctx", style: { left: ctx.x, top: ctx.y }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "ctx-head" }, "Add to playlist"), playlists.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "ctx-empty" }, "No playlists yet"), playlists.map((p) => /* @__PURE__ */ React.createElement("button", { key: p.id, className: "ctx-item", onClick: () => {
      api.addToPlaylist(p.id, ctx.track.id);
      flash("Added to " + p.name + " \u{1F49C}");
      setCtx(null);
    } }, GLYPHS[p.name.length % GLYPHS.length], " ", p.name)), /* @__PURE__ */ React.createElement("button", { className: "ctx-item", onClick: async () => {
      const p = await api.createPlaylist("Playlist " + (playlists.length + 1));
      if (p) {
        api.addToPlaylist(p.id, ctx.track.id);
        flash("Added to new playlist \u{1F49C}");
      }
      setCtx(null);
    } }, "\uFF0B New playlist\u2026"), /* @__PURE__ */ React.createElement("div", { className: "ctx-sep" }), tab === "playlists" && curPl && /* @__PURE__ */ React.createElement("button", { className: "ctx-item", onClick: () => {
      api.removeFromPlaylist(curPl.id, ctx.track.id);
      setCtx(null);
    } }, "\u2796 Remove from this list"), /* @__PURE__ */ React.createElement("button", { className: "ctx-item danger", onClick: () => {
      api.removeTrack(ctx.track.id);
      setCtx(null);
    } }, "\u{1F5D1} Remove from library")), toast && /* @__PURE__ */ React.createElement("div", { className: "toast" + (toast.err ? " err" : "") }, busy && /* @__PURE__ */ React.createElement("div", { className: "spinner" }), /* @__PURE__ */ React.createElement("span", null, toast.msg)));
  }
  function buildIdMap(tracks) {
    const map = {};
    for (const t of tracks) map[t.id] = t;
    return map;
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));
})();
