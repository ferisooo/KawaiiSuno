/* creation.jsx — "Suno Lyric Forge" ported into KawaiiSuno as the Creation tab.
   DeepSeek-powered title / style / lyric generator. Uses the global React (like
   app.jsx) and routes the DeepSeek call through main.js over IPC (api.deepseek)
   so there are no CORS errors. The API key is stored locally via a settings field
   (api.getDsKey / api.setDsKey) — nothing is hardcoded or committed. */
const { useState, useEffect, useMemo, useCallback } = React;
const api = window.kawaii;

const STYLE_TAGS = {
  Genres: ["pop", "rock", "hip-hop", "electronic", "indie", "lofi", "edm", "trap",
    "r&b", "metal", "punk", "jazz", "country", "k-pop", "j-pop", "anime",
    "synthwave", "ambient"],
  Mood: ["melancholic", "upbeat", "dreamy", "aggressive", "romantic", "sad", "happy",
    "dark", "energetic", "chill", "emotional", "nostalgic", "hopeful", "haunting"],
  Vocals: ["female vocal", "male vocal", "soft vocals", "powerful vocals",
    "ethereal vocals", "raspy vocals"],
  Instruments: ["acoustic guitar", "electric guitar", "piano", "synth", "strings",
    "drums", "bass", "808s", "violin", "saxophone"],
  Style: ["cinematic", "anthemic", "lo-fi", "experimental", "minimalist",
    "lush production", "raw"],
  Tempo: ["slow", "mid-tempo", "fast", "ballad", "danceable"],
};

const LYRIC_TAGS = {
  Production: ["Build Up", "Drop", "Breakdown", "Beat Switch", "Drum Break",
    "Bass Drop", "Beat Drop"],
  "Vocal Style": ["Whispered", "Shouted", "Spoken", "Ad-lib", "Falsetto",
    "Harmonies", "Vocal Run", "Belted"],
  Solos: ["Guitar Solo", "Piano Solo", "Sax Solo", "Synth Solo", "Drum Solo",
    "Bass Solo"],
  Effects: ["Echo", "Reverb", "Acapella", "Fade Out", "Fade In", "Silence",
    "Distorted"],
};

const PLACEHOLDER =
  "e.g. i feel kinda lost lately, like i'm waiting for someone who isn't coming back...";

/* ---------- mood idea bank (random description filler) ---------- */
const MOOD_IDEAS = {
  "💖 happy": [
    "a bright summer day where everything finally feels okay, dancing in the kitchen with someone you love",
    "the rush of falling for someone new, butterflies and stupid grins you can't hide",
    "celebrating with your friends like nothing can touch you, the whole night belongs to you",
    "waking up feeling light for the first time in forever, sun on your face, ready to start over",
  ],
  "💔 sad": [
    "missing someone who isn't coming back, replaying old voice messages just to hear them again",
    "the quiet ache of a love that slowly faded, neither of you said goodbye it just stopped",
    "crying in your car at 2am because everything feels too heavy to carry alone",
    "watching them move on while you're still stuck on the memory of how things used to be",
  ],
  "🔥 angry": [
    "burning with rage at someone who used you and never looked back, you're done being quiet",
    "screaming into the void about a world that keeps taking and never gives back",
    "the moment you finally snap and stop letting people walk all over you",
  ],
  "🌙 chill": [
    "a slow lazy evening, lo-fi vibes, rain on the window and nowhere to be",
    "driving alone at night with the city lights blurring past, calm and floaty",
    "lying in bed half-asleep, soft and warm, letting the world go quiet",
  ],
  "💕 romantic": [
    "slow dancing with someone in a dim room, foreheads touching, time standing still",
    "the kind of love that feels like home, safe and soft and forever",
    "writing a love letter you're too scared to send, every word soaked in longing",
  ],
  "⚡ hype": [
    "an unstoppable anthem for going all in, no fear, lights flashing, bass pounding",
    "the main character moment, walking in slow-mo like you own the whole world",
    "pure adrenaline, fast and loud, the kind of song you blast before you take on everything",
  ],
  "👻 dark": [
    "a haunting whisper of obsession, beautiful and a little bit dangerous",
    "lost in your own head at midnight, shadows and secrets you can't shake",
    "a villain origin story, embracing the parts of you that scare other people",
  ],
};
const MOOD_KEYS = Object.keys(MOOD_IDEAS);

const SPARKLE_CHARS = ["✦", "✧", "⋆", "·", "｡", "♡", "✿", "❀", "˖", "✩", "⭒", "˚"];

/* ---------- storage (localStorage w/ in-memory fallback) ---------- */
const _mem = {};
const store = {
  get(k) {
    try { const v = localStorage.getItem(k); return v == null ? null : JSON.parse(v); }
    catch { return k in _mem ? _mem[k] : null; }
  },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); }
    catch { _mem[k] = v; }
  },
};

/* ---------- response parser (matches the markers) ---------- */
function parseResponse(content) {
  let title = "", titleEn = "", style = "", lyrics = "";
  const has = (m) => content.includes(m);
  try {
    if (has("===TITLE===") && has("===TITLE_EN===") && has("===STYLE===") && has("===LYRICS===")) {
      const [, a1] = content.split("===TITLE===");
      const [tp, a2] = a1.split("===TITLE_EN===");
      const [tep, a3] = a2.split("===STYLE===");
      const [sp, lp] = a3.split("===LYRICS===");
      title = tp.trim(); titleEn = tep.trim(); style = sp.trim(); lyrics = lp.trim();
    } else if (has("===TITLE===") && has("===STYLE===") && has("===LYRICS===")) {
      const [, a1] = content.split("===TITLE===");
      const [tp, a2] = a1.split("===STYLE===");
      const [sp, lp] = a2.split("===LYRICS===");
      title = tp.trim(); style = sp.trim(); lyrics = lp.trim();
    } else {
      lyrics = content;
    }
  } catch {
    lyrics = content;
  }
  const strip = (s, chars) => {
    let out = s, changed = true;
    while (changed && out.length) {
      changed = false;
      if (chars.includes(out[0])) { out = out.slice(1); changed = true; }
      if (out.length && chars.includes(out[out.length - 1])) { out = out.slice(0, -1); changed = true; }
    }
    return out;
  };
  title = strip(title, "[]\"'`* \n");
  titleEn = strip(titleEn, "[]\"'`* \n");
  style = strip(style, "[]` \n");
  return { title, titleEn, style, lyrics };
}

/* DeepSeek call — routed through main.js (no CORS, key stays in the app config) */
async function callDeepSeek(messages, temperature, maxTokens) {
  const r = await api.deepseek({ messages, temperature, maxTokens });
  if (!r || !r.ok) throw new Error((r && r.error) || "DeepSeek request failed");
  return r.content;
}

/* =============================== UI =============================== */
export function CreationTab() {
  /* ----- inputs ----- */
  const [desc, setDesc] = useState("");
  const [language, setLanguage] = useState("English");
  const [moodBusy, setMoodBusy] = useState("");
  const [enhancing, setEnhancing] = useState(false);

  /* ----- api key (stored locally via main config) ----- */
  const [apiKey, setApiKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  useEffect(() => { (async () => { try { const k = await api.getDsKey(); if (k) { setApiKey(k); setKeySaved(true); } } catch {} })(); }, []);
  const saveKey = async () => { try { await api.setDsKey(apiKey.trim()); setKeySaved(true); setStatus(apiKey.trim() ? "api key saved ♪" : "api key cleared"); } catch { setStatus("couldn't save key"); } };

  /* lightly polish whatever's already in the box */
  async function enhanceDesc() {
    const current = desc.trim();
    if (!current || enhancing) return;
    setEnhancing(true);
    try {
      const sys =
        "You enrich a short song idea that describes how a PERSON feels. " +
        "Keep it about the person — their emotions, what they're going through, their headspace and vibe. " +
        "Add a little depth and context to the FEELING (why it hurts, what they're holding onto, how it sits with them) " +
        "while keeping their original meaning. Add to it, don't just reword it. " +
        "Do NOT turn it into scenery or a list of objects in a room — no 'empty chairs / curled photographs / cold coffee' style. " +
        "It should read like a real person describing their own mood. " +
        "Good example: 'crying in the car on the drive home, replaying everything you should've said, missing someone who already moved on.' " +
        "Rules: 1-2 sentences, lowercase, no quotes, no emojis, no hashtags, under ~35 words. Output only the text.";
      const out = await callDeepSeek(
        [{ role: "system", content: sys },
         { role: "user", content: `enrich this, keep it about the person's feeling:\n\n${current}` }],
        0.85, 140);
      const clean = (out || "").replace(/^["'\s]+|["'\s]+$/g, "").trim();
      if (clean) setDesc(clean);
    } catch (e) { setStatus(`enhance failed: ${e.message}`); }
    finally { setEnhancing(false); }
  }

  /* fetch a fresh AI-generated description for a mood (falls back to local list) */
  async function pickMood(mood) {
    const moodWord = mood.replace(/[^a-zA-Z]/g, "").trim();
    const fallback = () => {
      const ideas = MOOD_IDEAS[mood];
      let p = ideas[Math.floor(Math.random() * ideas.length)];
      if (ideas.length > 1) while (p === desc) p = ideas[Math.floor(Math.random() * ideas.length)];
      setDesc(p);
    };
    setMoodBusy(mood);
    try {
      const sys =
        "You write short song descriptions about how a PERSON feels, for an AI music generator. " +
        "Given a mood, describe what someone going through that feeling is actually experiencing — " +
        "their emotions, thoughts, and headspace. It should read like a real person putting their vibe into words. " +
        "Do NOT write empty scenery or lists of objects (no 'rain on the window, a curled photograph, cold coffee, an empty chair' style) — " +
        "there must be a PERSON and a real feeling at the center. " +
        "Good examples by mood — sad: 'missing someone who isn't coming back, replaying old messages just to feel close to them again.' " +
        "happy: 'so in love it feels stupid, grinning at your phone, wanting to tell the whole world about them.' " +
        "angry: 'done being walked over, finally finding your voice and refusing to shrink for anyone.' " +
        "Rules: 1-2 sentences, lowercase, no quotes, no hashtags, no emojis, max ~30 words. Output only the text.";
      const out = await callDeepSeek(
        [{ role: "system", content: sys },
         { role: "user", content: `mood: ${moodWord}. write a fresh song description about a person feeling this way.` }],
        1.3, 120);
      const clean = (out || "").replace(/^["'\s]+|["'\s]+$/g, "").trim();
      if (clean) setDesc(clean); else fallback();
    } catch (e) { fallback(); }
    finally { setMoodBusy(""); }
  }

  const [customStyle, setCustomStyle] = useState("");
  const [customLyric, setCustomLyric] = useState("");

  /* ----- tag state ----- */
  const [styleSel, setStyleSel] = useState(() => new Set());
  const [stylePin, setStylePin] = useState(() => new Set());
  const [styleEx, setStyleEx] = useState(() => new Set());
  const [lyricSel, setLyricSel] = useState(() => new Set());
  const [lyricPin, setLyricPin] = useState(() => new Set());
  const [lyricEx, setLyricEx] = useState(() => new Set());

  /* ----- outputs ----- */
  const [outTitle, setOutTitle] = useState("");
  const [outTitleEn, setOutTitleEn] = useState("");
  const [outStyle, setOutStyle] = useState("");
  const [outLyrics, setOutLyrics] = useState("");

  /* ----- meta ----- */
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("ready ♪");
  const [busy, setBusy] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [reasoning, setReasoning] = useState("");
  const [tagTab, setTagTab] = useState("style");
  const [outTab, setOutTab] = useState("output");
  const [loaded, setLoaded] = useState(false);

  /* ---------------- load prefs once ---------------- */
  useEffect(() => {
    const p = store.get("suno_prefs");
    if (p) {
      setLanguage(p.language || "English");
      setDesc(p.description || "");
      setCustomStyle(p.custom_style_tags || "");
      setCustomLyric(p.custom_lyric_tags || "");
      setStyleSel(new Set(p.style_tags || []));
      setStylePin(new Set(p.pinned_style_tags || []));
      setStyleEx(new Set(p.excluded_style_tags || []));
      setLyricSel(new Set(p.lyric_tags || []));
      setLyricPin(new Set(p.pinned_lyric_tags || []));
      setLyricEx(new Set(p.excluded_lyric_tags || []));
    }
    const h = store.get("suno_history");
    if (Array.isArray(h)) setHistory(h);
    setLoaded(true);
  }, []);

  /* ---------------- autosave prefs ---------------- */
  useEffect(() => {
    if (!loaded) return;
    store.set("suno_prefs", {
      language, description: desc,
      custom_style_tags: customStyle, custom_lyric_tags: customLyric,
      style_tags: [...styleSel], pinned_style_tags: [...stylePin], excluded_style_tags: [...styleEx],
      lyric_tags: [...lyricSel], pinned_lyric_tags: [...lyricPin], excluded_lyric_tags: [...lyricEx],
    });
  }, [loaded, language, desc, customStyle, customLyric, styleSel, stylePin, styleEx, lyricSel, lyricPin, lyricEx]);

  useEffect(() => { if (loaded) store.set("suno_history", history); }, [history, loaded]);

  /* ---------------- tag helpers ---------------- */
  const sets = {
    style: { sel: styleSel, setSel: setStyleSel, pin: stylePin, setPin: setStylePin, ex: styleEx, setEx: setStyleEx },
    lyric: { sel: lyricSel, setSel: setLyricSel, pin: lyricPin, setPin: setLyricPin, ex: lyricEx, setEx: setLyricEx },
  };

  const toggleTag = useCallback((kind, tag) => {
    const s = sets[kind];
    if (s.ex.has(tag)) return;
    s.setSel((prev) => { const n = new Set(prev); n.has(tag) ? n.delete(tag) : n.add(tag); return n; });
  }, [styleSel, styleEx, lyricSel, lyricEx]);

  const cycleTag = useCallback((kind, tag, e) => {
    e.preventDefault();
    const s = sets[kind];
    if (s.pin.has(tag)) {
      s.setPin((p) => { const n = new Set(p); n.delete(tag); return n; });
      s.setEx((p) => { const n = new Set(p); n.add(tag); return n; });
      s.setSel((p) => { const n = new Set(p); n.delete(tag); return n; });
      setStatus(`🚫 excluded: ${tag}  (deepseek won't pick it)`);
    } else if (s.ex.has(tag)) {
      s.setEx((p) => { const n = new Set(p); n.delete(tag); return n; });
      setStatus(`cleared: ${tag}`);
    } else {
      s.setPin((p) => { const n = new Set(p); n.add(tag); return n; });
      s.setSel((p) => { const n = new Set(p); n.add(tag); return n; });
      setStatus(`📌 pinned: ${tag}  (kept through suggest & clear)`);
    }
  }, [stylePin, styleEx, lyricPin, lyricEx]);

  const clearTags = () => {
    setStyleSel(new Set([...stylePin]));
    setLyricSel(new Set([...lyricPin]));
    setCustomStyle(""); setCustomLyric("");
    const kept = stylePin.size + lyricPin.size;
    setStatus(kept ? `tags cleared (${kept} pinned kept)` : "all tags cleared");
  };

  const collect = (sel, ex, custom) => {
    const tags = [...sel].filter((t) => !ex.has(t));
    const c = custom.trim();
    if (c) tags.push(...c.split(",").map((x) => x.trim()).filter(Boolean));
    return tags;
  };

  /* ---------------- suggest from mood ---------------- */
  const onSuggest = async () => {
    if (!desc.trim()) { setStatus("tell me how you feel first <3"); return; }
    setSuggesting(true); setBusy(true); setReasoning("");
    setStatus("asking deepseek which tags fit the mood...");
    const excluded = [...styleEx, ...lyricEx];
    const ban = excluded.length
      ? `\n\nNEVER choose any of these tags — the user has excluded them: ${excluded.join(", ")}`
      : "";
    const sys =
      "You are a music tagging assistant for the Suno AI music generator.\n" +
      "Given a song description or mood, decide which tags best fit it. THINK about the mood, energy, pacing, and story before choosing — don't just grab everything. Be selective.\n\n" +
      "Choose ONLY from these exact tags (copy verbatim):\n" +
      `STYLE TAGS by category: ${JSON.stringify(STYLE_TAGS)}\n` +
      `LYRIC TAGS by category: ${JSON.stringify(LYRIC_TAGS)}\n\n` +
      'Return ONLY raw JSON — no markdown — in exactly this shape:\n' +
      '{"reasoning":"<one short sentence>","style_tags":["..."],"lyric_tags":["..."]}' + ban;
    try {
      const content = await callDeepSeek(
        [{ role: "system", content: sys }, { role: "user", content: `Song description / mood:\n\n${desc}` }],
        0.4, 500);
      const start = content.indexOf("{"), end = content.lastIndexOf("}") + 1;
      const data = JSON.parse(content.slice(start, end));
      const styleLookup = {}, lyricLookup = {};
      Object.values(STYLE_TAGS).flat().forEach((t) => (styleLookup[t.toLowerCase()] = t));
      Object.values(LYRIC_TAGS).flat().forEach((t) => (lyricLookup[t.toLowerCase()] = t));
      const ns = new Set([...stylePin]), nl = new Set([...lyricPin]);
      let n = 0;
      (data.style_tags || []).forEach((t) => { const k = styleLookup[String(t).trim().toLowerCase()]; if (k && !styleEx.has(k)) { ns.add(k); n++; } });
      (data.lyric_tags || []).forEach((t) => { const k = lyricLookup[String(t).trim().toLowerCase()]; if (k && !lyricEx.has(k)) { nl.add(k); n++; } });
      setStyleSel(ns); setLyricSel(nl);
      setReasoning((data.reasoning || "").trim());
      setStatus(`set ${n} tags ♪  tick/untick what you want, then generate`);
    } catch (err) {
      setStatus(`suggest failed: ${err.message}`);
    } finally {
      setSuggesting(false); setBusy(false);
    }
  };

  /* ---------------- generate ---------------- */
  const onGenerate = async () => {
    if (!desc.trim()) { setStatus("tell me how you feel first <3"); return; }
    setBusy(true);
    setStatus("contacting deepseek...");
    setOutTitle(""); setOutTitleEn(""); setOutStyle(""); setOutLyrics("");
    const styleTags = collect(styleSel, styleEx, customStyle);
    const lyricTags = collect(lyricSel, lyricEx, customLyric);
    const excluded = [...styleEx, ...lyricEx];
    const lang = language.trim() || "English";
    const styleStr = styleTags.length ? styleTags.join(", ") : "(none specified — pick fitting ones)";
    const lyricStr = lyricTags.length ? lyricTags.join(", ") : "(none — only use standard section labels)";

    const sys =
      "You are a songwriter who writes lyrics for the Suno AI music generator.\n\n" +
      `LANGUAGE: Write the TITLE and LYRICS in ${lang}. Style tags stay in English. Section labels and inline directives stay in English.\n\n` +
      "OUTPUT FORMAT — use these EXACT markers:\n===TITLE===\n<short title 2-6 words>\n===TITLE_EN===\n<English translation, repeat if already English>\n===STYLE===\n<comma-separated style tags, no brackets>\n===LYRICS===\n[Verse 1]\n<lyrics>\n[Chorus]\n<lyrics>\n\n" +
      "STYLE TAGS go ONLY in ===STYLE=== as a comma-separated list. Keep every user tag, then ADD 3-7 fitting ones (genre, mood, tempo, vocals, instruments, production).\n" +
      "LYRIC TAGS go ONLY inside ===LYRICS=== as inline [square bracket] directives at the right moment, each on its own line.\n" +
      "Write each section header exactly once. Never place two headers back-to-back.\n\n" +
      "STYLE RULES (strict): simple everyday words a real person says out loud. NO poetic language, metaphors, similes, or fancy imagery. Avoid: porcelain, shattered, whispers, cascade, echoes, symphony, solace, fragile, lullaby, scars, hollow, ghost, spotlight, mirror. Be direct and plain. Short clear singable lines. Sound human not AI — concrete specific details, slightly messy. Don't force rhymes. Banned clichés: 'nothing's ever what it seems', 'chasing the stars', 'through the storm', 'spread my wings', 'tears fall like rain', 'set me free', 'hold on tight', 'never let go'. Contractions and plain talk are good.\n\n" +
      "MOST IMPORTANT: write about how the PERSON FEELS, not the scenery around them. Don't just paint a picture of the moon, water, rooms, or objects — say the actual emotion and what they're thinking out loud (e.g. 'I miss you and I hate that I still do', not 'the moon hangs low over dark water'). The listener should know exactly what the person is feeling, in their own plain words. Scene-setting is fine only as a tiny backdrop — the feeling must be front and center in most lines.";
    let user =
      `Write Suno-ready output based on this feeling/description:\n\n${desc}\n\n` +
      `STYLE TAGS chosen by user (keep all, then ADD 3-7 more): ${styleStr}\n` +
      `LYRIC TAGS (place inline as [Tag]): ${lyricStr}\n\n`;
    if (excluded.length)
      user += `BANNED TAGS — never use these anywhere: ${excluded.join(", ")}\n\n`;
    user += "Output the title, style, and lyrics using the exact ===MARKERS=== format.";

    try {
      const content = await callDeepSeek(
        [{ role: "system", content: sys }, { role: "user", content: user }],
        0.9, 1500);
      const { title, titleEn, style, lyrics } = parseResponse(content);
      setOutTitle(title);
      setOutTitleEn(titleEn && titleEn.toLowerCase() !== title.toLowerCase() ? titleEn : "");
      setOutStyle(style); setOutLyrics(lyrics);
      setStatus("done ♪  paste each box into suno");
      if (title || lyrics) {
        setHistory((h) => [{ title: title || "(untitled)", titleEn, style, lyrics, ts: new Date().toLocaleString() }, ...h].slice(0, 50));
      }
    } catch (err) {
      setOutLyrics(`[error]\n\n${err.message}\n\nMake sure your DeepSeek API key is set above (🔑).`);
      setStatus("error :(");
    } finally {
      setBusy(false);
    }
  };

  /* ---------------- history ---------------- */
  const loadEntry = (e) => {
    setOutTitle(e.title === "(untitled)" ? "" : e.title);
    setOutTitleEn(e.titleEn || "");
    setOutStyle(e.style || "");
    setOutLyrics(e.lyrics || "");
    setOutTab("output");
    setStatus("loaded from history ♪");
  };
  const delEntry = (i) => setHistory((h) => h.filter((_, idx) => idx !== i));
  const clearHistory = () => { setHistory([]); setStatus("history cleared"); };

  /* ---------------- sparkles (memoised) ---------------- */
  const sparkles = useMemo(
    () => Array.from({ length: 22 }, () => ({
      ch: SPARKLE_CHARS[Math.floor(Math.random() * SPARKLE_CHARS.length)],
      left: Math.random() * 100,
      size: 9 + Math.random() * 14,
      dur: 9 + Math.random() * 12,
      delay: -Math.random() * 20,
      drift: (Math.random() * 60 - 30).toFixed(0),
    })),
    []
  );

  return (
    <div className="slf-root">
      <style>{CSS}</style>

      {/* animated nebula + sparkle layer */}
      <div className="slf-bg" aria-hidden>
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
        <div className="grid-lines" />
        {sparkles.map((s, i) => (
          <span key={i} className="spark" style={{
            left: `${s.left}%`, fontSize: `${s.size}px`,
            animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s`, "--drift": `${s.drift}px`,
          }}>{s.ch}</span>
        ))}
      </div>

      <div className="slf-wrap">
        {/* ── header ── */}
        <header className="hdr">
          <h1 className="title">
            <span className="title-spark">✦</span>
            <span className="title-text">SUNO LYRIC FORGE</span>
            <span className="title-spark">✦</span>
          </h1>
          <p className="tagline">⋆˙⟡ tell deepseek how you feel — get suno-ready title, style &amp; lyrics ⟡˙⋆</p>
          <div className="key-row">
            <span className="key-lbl">🔑 DeepSeek key</span>
            <input className="field sm key-input" type="password" placeholder="sk-…  (stored locally on this PC)"
              value={apiKey} onChange={(e) => { setApiKey(e.target.value); setKeySaved(false); }} />
            <button className={`mini-btn accent ${keySaved ? "" : "pulse"}`} onClick={saveKey}>{keySaved ? "✓ saved" : "save key"}</button>
          </div>
        </header>

        <div className="grid">
          {/* ════════ LEFT ════════ */}
          <section className="col">
            <Card delay={0.05}>
              <Label icon="✿">your song description</Label>
              <textarea className="field area" rows={3} value={desc} placeholder={PLACEHOLDER}
                onChange={(e) => setDesc(e.target.value)} />
              <div className="mood-row">
                {MOOD_KEYS.map((m) => (
                  <button key={m} className={`mini-btn mood-btn ${moodBusy === m ? "pulse" : ""}`}
                    disabled={!!moodBusy || enhancing} onClick={() => pickMood(m)}>
                    {moodBusy === m ? "✦ thinking…" : m}
                  </button>
                ))}
                <button className="mini-btn accent" title="surprise me!" disabled={!!moodBusy || enhancing}
                  onClick={() => pickMood(MOOD_KEYS[Math.floor(Math.random() * MOOD_KEYS.length)])}>🎲 random</button>
                <button className={`mini-btn accent ${enhancing ? "pulse" : ""}`} title="polish what you typed a little"
                  disabled={!desc.trim() || !!moodBusy || enhancing} onClick={enhanceDesc}>
                  {enhancing ? "✦ polishing…" : "✨ enhance"}
                </button>
              </div>
              <div className="lang-row">
                <span className="lang-lbl">language</span>
                <input className="field" value={language} onChange={(e) => setLanguage(e.target.value)} />
              </div>
              <button className={`gen-btn ${busy ? "working" : ""}`} disabled={busy} onClick={onGenerate}>
                {busy ? <span className="gen-dots">GENERATING<i>.</i><i>.</i><i>.</i></span>
                  : <>✦&nbsp;&nbsp;GENERATE LYRICS&nbsp;&nbsp;✦</>}
              </button>
            </Card>

            <Card delay={0.12}>
              <div className="tags-head">
                <Label icon="❀" inline>tags</Label>
                <div className="tag-actions">
                  <button className="mini-btn" onClick={clearTags}>✕ clear</button>
                  <button className={`mini-btn accent ${suggesting ? "pulse" : ""}`} disabled={suggesting} onClick={onSuggest}>
                    {suggesting ? "💭 thinking…" : "💭 suggest from mood"}
                  </button>
                </div>
              </div>
              {reasoning && <div className="reasoning">💭 {reasoning}</div>}
              <p className="hint">tip: <b>click</b> to pick · <b>right-click</b> to cycle 📌 pin → 🚫 exclude → off</p>
              <div className="tabs">
                <button className={`tab ${tagTab === "style" ? "on" : ""}`} onClick={() => setTagTab("style")}>✧ Style Tags</button>
                <button className={`tab ${tagTab === "lyric" ? "on" : ""}`} onClick={() => setTagTab("lyric")}>♪ Lyric Tags</button>
              </div>
              <div className="tag-scroll">
                <p className="sub-hint">{tagTab === "style" ? "→ go into Suno's Styles box" : "→ placed INSIDE lyrics as [Drop], [Whispered]…"}</p>
                {Object.entries(tagTab === "style" ? STYLE_TAGS : LYRIC_TAGS).map(([cat, tags]) => (
                  <div key={cat} className="cat">
                    <div className="cat-name">{cat}</div>
                    <div className="chips">
                      {tags.map((tag) => {
                        const s = sets[tagTab];
                        const pinned = s.pin.has(tag), excluded = s.ex.has(tag), selected = s.sel.has(tag);
                        const cls = ["chip"];
                        if (excluded) cls.push("ex"); else if (pinned) cls.push("pin"); else if (selected) cls.push("sel");
                        return (
                          <button key={tag} className={cls.join(" ")} onClick={() => toggleTag(tagTab, tag)}
                            onContextMenu={(e) => cycleTag(tagTab, tag, e)}>
                            <span className="chip-ic">{excluded ? "🚫" : pinned ? "📌" : selected ? "♥" : "♡"}</span>
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="custom">
                <input className="field sm" placeholder="custom style tags (comma-separated)"
                  value={customStyle} onChange={(e) => setCustomStyle(e.target.value)} />
                <input className="field sm" placeholder="custom lyric tags (e.g. drop, build up)"
                  value={customLyric} onChange={(e) => setCustomLyric(e.target.value)} />
              </div>
            </Card>
          </section>

          {/* ════════ RIGHT ════════ */}
          <section className="col">
            <Card delay={0.18} className="grow">
              <div className="tabs out-tabs">
                <button className={`tab ${outTab === "output" ? "on" : ""}`} onClick={() => setOutTab("output")}>✦ Output</button>
                <button className={`tab ${outTab === "history" ? "on" : ""}`} onClick={() => setOutTab("history")}>✿ History</button>
              </div>
              {outTab === "output" ? (
                <div className="out-scroll">
                  <OutputBox label="TITLE" hint="(paste into Suno's title field)" value={outTitle} setStatus={setStatus} single />
                  {outTitleEn && <OutputBox label="TITLE (EN)" hint="(English translation)" value={outTitleEn} setStatus={setStatus} single />}
                  <OutputBox label="STYLE" hint="(paste into Suno's Styles box)" value={outStyle} setStatus={setStatus} cap={200} rows={3} />
                  <OutputBox label="LYRICS" hint="(paste into Suno's Lyrics box)" value={outLyrics} setStatus={setStatus} rows={14} grow />
                </div>
              ) : (
                <div className="out-scroll">
                  <div className="hist-head">
                    <span className="hint">past generations — click one to load it back</span>
                    {history.length > 0 && <button className="mini-btn" onClick={clearHistory}>clear history</button>}
                  </div>
                  {history.length === 0 ? (
                    <p className="empty">no history yet — generate something ♪</p>
                  ) : history.map((e, i) => (
                    <div key={i} className="hist-row">
                      <button className="hist-load" onClick={() => loadEntry(e)}>♪ {e.title}</button>
                      <button className="hist-del" onClick={() => delEntry(i)}>✕</button>
                      <div className="hist-meta">{e.ts}{e.style ? `   ·   ${e.style.replace(/\n/g, " ").slice(0, 60)}` : ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>
        </div>

        {/* ── status bar ── */}
        <footer className="status">
          <span className={`spin ${busy ? "busy" : ""}`}>{busy ? "✿" : "✦"}</span>
          <span>{status}</span>
        </footer>
      </div>
    </div>
  );
}

/* ---------------- small components ---------------- */
function Card({ children, delay = 0, className = "" }) {
  return <div className={`card ${className}`} style={{ animationDelay: `${delay}s` }}>{children}</div>;
}
function Label({ children, icon, inline }) {
  return <div className={`lbl ${inline ? "inline" : ""}`}><span className="lbl-ic">{icon}</span>{children}</div>;
}
function OutputBox({ label, hint, value, cap, rows = 1, single, grow, setStatus }) {
  const [copied, setCopied] = useState(false);
  const n = value.length;
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = value; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setStatus && setStatus("copied to clipboard ♪");
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className={`obox ${grow ? "grow" : ""}`}>
      <div className="obox-head">
        <span className="obox-lbl">{label} <i>{hint}</i></span>
        <div className="obox-right">
          {cap != null && <span className={`counter ${n > cap ? "over" : ""}`}>{n} / {cap}</span>}
          <button className={`copy-btn ${copied ? "ok" : ""}`} onClick={copy}>{copied ? "✓ copied" : "copy"}</button>
        </div>
      </div>
      {single
        ? <input className="obox-field single" readOnly value={value} placeholder="…" />
        : <textarea className={`obox-field ${grow ? "grow" : ""}`} readOnly rows={rows} value={value} placeholder="…" />}
    </div>
  );
}

/* =============================== CSS =============================== */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

.slf-root{
  --bg:#0b0710; --panel:rgba(30,18,28,0.55); --border:rgba(255,93,143,0.22);
  --purple:#ffce47; --pink:#ff5d8f; --text:#fdeef4; --dim:#cda7b6;
  --gold:#ffce47; --glow:#ff5d8f;
  --mono:'JetBrains Mono',ui-monospace,Consolas,monospace;
  --display:'Baloo 2','Quicksand',system-ui,sans-serif;
  position:relative; flex:1; min-height:0; width:100%;
  background:var(--bg); color:var(--text);
  font-family:var(--mono); overflow:hidden;
  display:flex; flex-direction:column;
  -webkit-font-smoothing:antialiased; border-radius:16px;
}
.slf-root *{box-sizing:border-box;}

/* ---- nebula background ---- */
.slf-bg{position:absolute; inset:0; z-index:0; overflow:hidden;
  background:
    radial-gradient(1200px 700px at 15% -10%, #3a1030 0%, transparent 55%),
    radial-gradient(1000px 800px at 110% 10%, #4d1a2a 0%, transparent 50%),
    linear-gradient(160deg, #1a0c16 0%, #120810 45%, #0a0610 100%);
}
.orb{position:absolute; border-radius:50%; filter:blur(70px); opacity:.5;
  will-change:transform; animation:slf-drift 18s ease-in-out infinite;}
.orb-a{width:420px;height:420px;background:#9e2c66;top:-120px;left:-80px;}
.orb-b{width:380px;height:380px;background:#b58334;bottom:-100px;right:-60px;animation-delay:-6s;}
.orb-c{width:300px;height:300px;background:#ae2f6a;top:40%;left:55%;animation-delay:-11s;opacity:.35;}
@keyframes slf-drift{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(40px,-30px) scale(1.12);}}
.grid-lines{position:absolute; inset:0; opacity:.05;
  background-image:linear-gradient(var(--pink) 1px,transparent 1px),linear-gradient(90deg,var(--pink) 1px,transparent 1px);
  background-size:44px 44px; mask-image:radial-gradient(circle at 50% 30%,#000,transparent 80%);}
.spark{position:absolute; bottom:-30px; color:var(--pink); opacity:0;
  text-shadow:0 0 8px currentColor; animation:slf-floatup linear infinite; pointer-events:none;}
.spark:nth-child(3n){color:var(--gold);}
.spark:nth-child(4n){color:#ffd6f3;}
@keyframes slf-floatup{
  0%{transform:translate(0,0) rotate(0deg) scale(.7);opacity:0;}
  12%{opacity:.85;} 88%{opacity:.5;}
  100%{transform:translate(var(--drift),-104vh) rotate(360deg) scale(1.1);opacity:0;}
}

/* ---- layout ---- */
.slf-wrap{position:relative; z-index:1; width:100%; max-width:1340px; margin:0 auto;
  padding:24px 26px 16px; display:flex; flex-direction:column; flex:1; min-height:0; overflow-y:auto;}
.hdr{margin-bottom:16px; animation:slf-rise .7s cubic-bezier(.2,.9,.3,1) both;}
.title{display:flex; align-items:center; gap:16px; margin:0; font-family:var(--display);
  font-weight:800; font-size:clamp(24px,3.4vw,40px); letter-spacing:.02em;}
.title-text{
  background:linear-gradient(100deg,#ff5d8f,#ffce47,#ff86b3,#ff5d8f);
  background-size:300% 100%; -webkit-background-clip:text; background-clip:text;
  -webkit-text-fill-color:transparent; color:transparent;
  filter:drop-shadow(0 0 22px rgba(255,93,143,.45));
  animation:slf-shimmer 6s linear infinite;}
@keyframes slf-shimmer{to{background-position:300% 0;}}
.title-spark{color:var(--pink); text-shadow:0 0 16px var(--pink); animation:slf-twinkle 2.4s ease-in-out infinite;}
.title-spark:last-child{animation-delay:1.2s;}
@keyframes slf-twinkle{0%,100%{opacity:1;transform:scale(1) rotate(0);}50%{opacity:.4;transform:scale(.8) rotate(40deg);}}
.tagline{margin:8px 0 0; color:var(--dim); font-size:13.5px; letter-spacing:.02em;}

.key-row{display:flex; align-items:center; gap:10px; margin-top:12px; flex-wrap:wrap;}
.key-lbl{color:var(--gold); font-size:13px; font-weight:600; white-space:nowrap;}
.key-input{flex:1; min-width:200px; margin-top:0 !important;}

.grid{display:grid; grid-template-columns:1fr 1.05fr; gap:18px; flex:1; min-height:0;}
.col{display:flex; flex-direction:column; gap:18px; min-height:0;}
@media(max-width:920px){.grid{grid-template-columns:1fr;}}

/* ---- glass cards ---- */
.card{position:relative; background:var(--panel);
  border:1px solid var(--border); border-radius:20px; padding:18px;
  backdrop-filter:blur(10px) saturate(1.3); -webkit-backdrop-filter:blur(10px) saturate(1.3);
  box-shadow:0 10px 40px rgba(8,3,12,.5), inset 0 1px 0 rgba(255,255,255,.06),
    0 0 0 1px rgba(255,93,143,.04);
  animation:slf-rise .7s cubic-bezier(.2,.9,.3,1) both;}
.card::before{content:""; position:absolute; inset:0; border-radius:20px; padding:1px;
  background:linear-gradient(140deg,rgba(255,93,143,.5),transparent 40%,transparent 60%,rgba(255,206,71,.45));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor; mask-composite:exclude; pointer-events:none; opacity:.7;}
.card.grow{flex:1; min-height:0; display:flex; flex-direction:column;}
@keyframes slf-rise{from{opacity:0;transform:translateY(22px) scale(.98);}to{opacity:1;transform:none;}}

/* ---- labels ---- */
.lbl{display:flex; align-items:center; gap:8px; font-family:var(--display);
  font-weight:700; font-size:15px; letter-spacing:.06em; text-transform:uppercase;
  color:var(--pink); margin-bottom:10px;}
.lbl.inline{margin-bottom:0;}
.lbl-ic{font-size:15px; filter:drop-shadow(0 0 6px var(--pink));}

/* ---- fields ---- */
.field{width:100%; background:rgba(11,7,16,.6); color:var(--text);
  border:1px solid var(--border); border-radius:12px; padding:11px 14px;
  font-family:var(--mono); font-size:15px; outline:none; resize:none; user-select:text;
  transition:border-color .25s, box-shadow .25s, background .25s;}
.field::placeholder{color:#8a6f7e;}
.field:focus{border-color:var(--pink); background:rgba(11,7,16,.85);
  box-shadow:0 0 0 3px rgba(255,93,143,.18), 0 0 22px rgba(255,93,143,.22);}
.field.area{line-height:1.5;}
.mood-row{display:flex; flex-wrap:wrap; gap:7px; margin-top:9px;}
.mood-btn{font-size:12px; padding:5px 11px;}
.field.sm{padding:9px 12px; font-size:13.5px; margin-top:8px;}
.lang-row{display:flex; align-items:center; gap:12px; margin:12px 0;}
.lang-lbl{color:var(--dim); font-size:14px; white-space:nowrap;}

/* ---- generate button ---- */
.gen-btn{width:100%; margin-top:4px; border:none; cursor:pointer;
  font-family:var(--display); font-weight:800; font-size:17px; letter-spacing:.04em;
  color:#24060f; border-radius:14px; padding:15px;
  background:linear-gradient(100deg,#ff5d8f,#ffce47,#ff5d8f);
  background-size:200% 100%;
  box-shadow:0 8px 28px rgba(255,93,143,.35), inset 0 1px 0 rgba(255,255,255,.4);
  animation:slf-btnglow 3.5s ease-in-out infinite, slf-bgmove 5s linear infinite;
  transition:transform .15s, box-shadow .25s;}
.gen-btn:hover{transform:translateY(-2px) scale(1.012);
  box-shadow:0 14px 40px rgba(255,93,143,.55), inset 0 1px 0 rgba(255,255,255,.5);}
.gen-btn:active{transform:translateY(0) scale(.985);}
.gen-btn:disabled{cursor:wait; filter:saturate(.85) brightness(.95);}
@keyframes slf-btnglow{0%,100%{box-shadow:0 8px 28px rgba(255,93,143,.3),inset 0 1px 0 rgba(255,255,255,.4);}
  50%{box-shadow:0 8px 40px rgba(255,93,143,.6),inset 0 1px 0 rgba(255,255,255,.5);}}
@keyframes slf-bgmove{to{background-position:200% 0;}}
.gen-dots i{opacity:0; animation:slf-dots 1.2s infinite; font-style:normal;}
.gen-dots i:nth-child(2){animation-delay:.2s;} .gen-dots i:nth-child(3){animation-delay:.4s;}
@keyframes slf-dots{0%,100%{opacity:0;}50%{opacity:1;}}

/* ---- tag header / mini buttons ---- */
.tags-head{display:flex; align-items:center; justify-content:space-between; gap:10px;}
.tag-actions{display:flex; gap:8px;}
.mini-btn{cursor:pointer; font-family:var(--mono); font-size:12.5px; font-weight:600;
  color:var(--gold); background:rgba(255,206,71,.08);
  border:1px solid var(--border); border-radius:999px; padding:6px 13px;
  transition:all .22s;}
.mini-btn:hover{color:#fff; background:rgba(255,93,143,.22); border-color:var(--pink);
  box-shadow:0 0 16px rgba(255,93,143,.3); transform:translateY(-1px);}
.mini-btn:active{transform:scale(.95);}
.mini-btn.accent{color:var(--pink);}
.mini-btn.pulse{animation:slf-btnpulse 1s ease-in-out infinite;}
@keyframes slf-btnpulse{0%,100%{box-shadow:0 0 0 rgba(255,93,143,0);}50%{box-shadow:0 0 18px rgba(255,93,143,.5);}}
.reasoning{margin-top:10px; font-size:13px; color:var(--gold);
  background:rgba(255,206,71,.08); border-left:2px solid var(--gold);
  border-radius:8px; padding:8px 12px; animation:slf-rise .4s both;}
.hint{margin:10px 0; font-size:12px; color:var(--dim);}
.hint b{color:var(--pink);}
.sub-hint{font-size:12px; color:var(--dim); margin:0 0 10px;}

/* ---- tabs ---- */
.tabs{display:flex; gap:6px; margin:12px 0 0;}
.out-tabs{margin-top:0; margin-bottom:14px;}
.tab{cursor:pointer; font-family:var(--display); font-weight:700; font-size:13.5px;
  letter-spacing:.03em; color:var(--dim); background:transparent;
  border:1px solid transparent; border-radius:11px 11px 0 0; padding:9px 16px;
  transition:all .22s; position:relative;}
.tab:hover{color:var(--text);}
.tab.on{color:var(--pink); background:rgba(255,93,143,.1);
  border-color:var(--border); border-bottom-color:transparent;}
.tab.on::after{content:""; position:absolute; left:14px; right:14px; bottom:-1px; height:2px;
  background:linear-gradient(90deg,var(--pink),var(--gold)); border-radius:2px;
  box-shadow:0 0 10px var(--pink);}

/* ---- tag scroll + chips ---- */
.tag-scroll{margin-top:0; padding:14px 6px 6px; max-height:360px; overflow-y:auto;
  border:1px solid var(--border); border-top:none; border-radius:0 12px 12px 12px;
  background:rgba(11,7,16,.35);}
.cat{margin-bottom:12px;}
.cat-name{font-family:var(--display); font-weight:700; font-size:13px; color:var(--gold);
  letter-spacing:.04em; margin:0 0 8px 2px;}
.chips{display:flex; flex-wrap:wrap; gap:7px;}
.chip{cursor:pointer; display:inline-flex; align-items:center; gap:6px;
  font-family:var(--mono); font-size:13px; font-weight:500; color:var(--dim);
  background:rgba(30,18,28,.6); border:1px solid var(--border);
  border-radius:999px; padding:6px 13px; transition:all .2s cubic-bezier(.34,1.56,.64,1);
  user-select:none; white-space:nowrap;}
.chip-ic{font-size:12px; transition:transform .2s;}
.chip:hover{transform:translateY(-2px); border-color:var(--pink); color:var(--text);
  box-shadow:0 4px 14px rgba(255,93,143,.25);}
.chip:hover .chip-ic{transform:scale(1.25);}
.chip:active{transform:scale(.93);}
.chip.sel{color:#24060f; font-weight:700; border-color:transparent;
  background:linear-gradient(120deg,#ff5d8f,#ff86b3);
  box-shadow:0 4px 18px rgba(255,93,143,.45), inset 0 1px 0 rgba(255,255,255,.4);}
.chip.pin{color:#24060f; font-weight:700;
  background:linear-gradient(120deg,#ffce47,#ff9ad8);
  border-color:var(--gold);
  box-shadow:0 0 16px rgba(255,206,71,.5), inset 0 1px 0 rgba(255,255,255,.5);}
.chip.ex{color:#8a6f7e; text-decoration:line-through; opacity:.6;
  background:rgba(11,7,16,.4); border-style:dashed;}

/* ---- custom ---- */
.custom{margin-top:14px;}

/* ---- output ---- */
.out-scroll{flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column;
  gap:14px; padding-right:4px;}
.obox{display:flex; flex-direction:column;}
.obox.grow{flex:1; min-height:160px;}
.obox-head{display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:6px;}
.obox-lbl{font-family:var(--display); font-weight:700; font-size:14px; letter-spacing:.05em;
  color:var(--pink); text-transform:uppercase;}
.obox-lbl i{color:var(--dim); font-weight:400; font-style:normal; font-size:11.5px;
  text-transform:none; letter-spacing:0;}
.obox-right{display:flex; align-items:center; gap:10px;}
.counter{font-size:12px; color:var(--dim);}
.counter.over{color:var(--pink); font-weight:700;}
.copy-btn{cursor:pointer; font-family:var(--mono); font-size:12px; font-weight:600;
  color:var(--gold); background:rgba(255,206,71,.1); border:1px solid var(--border);
  border-radius:8px; padding:5px 13px; transition:all .2s;}
.copy-btn:hover{color:#fff; background:rgba(255,93,143,.25); border-color:var(--pink);
  box-shadow:0 0 14px rgba(255,93,143,.3);}
.copy-btn:active{transform:scale(.92);}
.copy-btn.ok{color:#24060f; background:linear-gradient(120deg,#ff5d8f,#ffce47); border-color:transparent;}
.obox-field{width:100%; background:rgba(11,7,16,.6); color:var(--text);
  border:1px solid var(--border); border-radius:12px; padding:12px 14px;
  font-family:var(--mono); font-size:14.5px; line-height:1.55; resize:none; outline:none; user-select:text;
  transition:border-color .25s, box-shadow .25s;}
.obox-field.single{font-family:var(--display); font-weight:700; font-size:18px; color:var(--text);}
.obox-field.grow{flex:1; min-height:160px;}
.obox-field:focus{border-color:var(--gold); box-shadow:0 0 0 3px rgba(255,206,71,.15);}
.obox-field::placeholder{color:#7a6173;}

/* ---- history ---- */
.hist-head{display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;}
.empty{color:var(--dim); font-size:14px; padding:14px;}
.hist-row{position:relative; background:rgba(30,18,28,.5); border:1px solid var(--border);
  border-radius:14px; padding:12px 14px; transition:all .22s; animation:slf-rise .4s both; margin-bottom:10px;}
.hist-row:hover{border-color:var(--pink); box-shadow:0 6px 20px rgba(255,93,143,.18); transform:translateY(-2px);}
.hist-load{cursor:pointer; font-family:var(--display); font-weight:700; font-size:15px;
  color:var(--gold); background:none; border:none; padding:0; text-align:left;
  transition:color .2s; width:calc(100% - 30px);}
.hist-load:hover{color:var(--pink);}
.hist-del{position:absolute; top:10px; right:12px; cursor:pointer; color:var(--dim);
  background:none; border:none; font-size:14px; transition:all .2s;}
.hist-del:hover{color:var(--pink); transform:scale(1.3) rotate(90deg);}
.hist-meta{color:var(--dim); font-size:12px; margin-top:5px;}

/* ---- status ---- */
.status{display:flex; align-items:center; gap:10px; margin-top:14px; font-size:13px; color:var(--dim);}
.spin{color:var(--pink); text-shadow:0 0 10px var(--pink); animation:slf-spinpulse 1.6s ease-in-out infinite;}
.spin.busy{animation:slf-spinpulse .7s ease-in-out infinite;}
@keyframes slf-spinpulse{0%,100%{transform:scale(1) rotate(0);opacity:1;}50%{transform:scale(1.3) rotate(180deg);opacity:.55;}}

/* ---- scrollbars ---- */
.slf-wrap::-webkit-scrollbar,.tag-scroll::-webkit-scrollbar,.out-scroll::-webkit-scrollbar{width:8px;}
.slf-wrap::-webkit-scrollbar-thumb,.tag-scroll::-webkit-scrollbar-thumb,.out-scroll::-webkit-scrollbar-thumb{
  background:linear-gradient(var(--gold),var(--pink)); border-radius:8px;}
.slf-wrap::-webkit-scrollbar-track,.tag-scroll::-webkit-scrollbar-track,.out-scroll::-webkit-scrollbar-track{background:transparent;}
`;
