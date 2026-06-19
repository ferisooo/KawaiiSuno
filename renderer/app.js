(() => {
  // renderer/creation.jsx
  var { useState, useEffect, useMemo, useCallback } = React;
  var api = window.kawaii;
  var STYLE_TAGS = {
    Genres: [
      "pop",
      "rock",
      "hip-hop",
      "electronic",
      "indie",
      "lofi",
      "edm",
      "trap",
      "r&b",
      "metal",
      "punk",
      "jazz",
      "country",
      "k-pop",
      "j-pop",
      "anime",
      "synthwave",
      "ambient"
    ],
    Mood: [
      "melancholic",
      "upbeat",
      "dreamy",
      "aggressive",
      "romantic",
      "sad",
      "happy",
      "dark",
      "energetic",
      "chill",
      "emotional",
      "nostalgic",
      "hopeful",
      "haunting"
    ],
    Vocals: [
      "female vocal",
      "male vocal",
      "soft vocals",
      "powerful vocals",
      "ethereal vocals",
      "raspy vocals"
    ],
    Instruments: [
      "acoustic guitar",
      "electric guitar",
      "piano",
      "synth",
      "strings",
      "drums",
      "bass",
      "808s",
      "violin",
      "saxophone"
    ],
    Style: [
      "cinematic",
      "anthemic",
      "lo-fi",
      "experimental",
      "minimalist",
      "lush production",
      "raw"
    ],
    Tempo: ["slow", "mid-tempo", "fast", "ballad", "danceable"]
  };
  var LYRIC_TAGS = {
    Production: [
      "Build Up",
      "Drop",
      "Breakdown",
      "Beat Switch",
      "Drum Break",
      "Bass Drop",
      "Beat Drop"
    ],
    "Vocal Style": [
      "Whispered",
      "Shouted",
      "Spoken",
      "Ad-lib",
      "Falsetto",
      "Harmonies",
      "Vocal Run",
      "Belted"
    ],
    Solos: [
      "Guitar Solo",
      "Piano Solo",
      "Sax Solo",
      "Synth Solo",
      "Drum Solo",
      "Bass Solo"
    ],
    Effects: [
      "Echo",
      "Reverb",
      "Acapella",
      "Fade Out",
      "Fade In",
      "Silence",
      "Distorted"
    ]
  };
  var PLACEHOLDER = "e.g. i feel kinda lost lately, like i'm waiting for someone who isn't coming back...";
  var MOOD_IDEAS = {
    "\u{1F496} happy": [
      "a bright summer day where everything finally feels okay, dancing in the kitchen with someone you love",
      "the rush of falling for someone new, butterflies and stupid grins you can't hide",
      "celebrating with your friends like nothing can touch you, the whole night belongs to you",
      "waking up feeling light for the first time in forever, sun on your face, ready to start over"
    ],
    "\u{1F494} sad": [
      "missing someone who isn't coming back, replaying old voice messages just to hear them again",
      "the quiet ache of a love that slowly faded, neither of you said goodbye it just stopped",
      "crying in your car at 2am because everything feels too heavy to carry alone",
      "watching them move on while you're still stuck on the memory of how things used to be"
    ],
    "\u{1F525} angry": [
      "burning with rage at someone who used you and never looked back, you're done being quiet",
      "screaming into the void about a world that keeps taking and never gives back",
      "the moment you finally snap and stop letting people walk all over you"
    ],
    "\u{1F319} chill": [
      "a slow lazy evening, lo-fi vibes, rain on the window and nowhere to be",
      "driving alone at night with the city lights blurring past, calm and floaty",
      "lying in bed half-asleep, soft and warm, letting the world go quiet"
    ],
    "\u{1F495} romantic": [
      "slow dancing with someone in a dim room, foreheads touching, time standing still",
      "the kind of love that feels like home, safe and soft and forever",
      "writing a love letter you're too scared to send, every word soaked in longing"
    ],
    "\u26A1 hype": [
      "an unstoppable anthem for going all in, no fear, lights flashing, bass pounding",
      "the main character moment, walking in slow-mo like you own the whole world",
      "pure adrenaline, fast and loud, the kind of song you blast before you take on everything"
    ],
    "\u{1F47B} dark": [
      "a haunting whisper of obsession, beautiful and a little bit dangerous",
      "lost in your own head at midnight, shadows and secrets you can't shake",
      "a villain origin story, embracing the parts of you that scare other people"
    ]
  };
  var MOOD_KEYS = Object.keys(MOOD_IDEAS);
  var SPARKLE_CHARS = ["\u2726", "\u2727", "\u22C6", "\xB7", "\uFF61", "\u2661", "\u273F", "\u2740", "\u02D6", "\u2729", "\u2B52", "\u02DA"];
  var _mem = {};
  var store = {
    get(k) {
      try {
        const v = localStorage.getItem(k);
        return v == null ? null : JSON.parse(v);
      } catch {
        return k in _mem ? _mem[k] : null;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {
        _mem[k] = v;
      }
    }
  };
  function parseResponse(content) {
    let title = "", titleEn = "", style = "", lyrics = "";
    const has = (m) => content.includes(m);
    try {
      if (has("===TITLE===") && has("===TITLE_EN===") && has("===STYLE===") && has("===LYRICS===")) {
        const [, a1] = content.split("===TITLE===");
        const [tp, a2] = a1.split("===TITLE_EN===");
        const [tep, a3] = a2.split("===STYLE===");
        const [sp, lp] = a3.split("===LYRICS===");
        title = tp.trim();
        titleEn = tep.trim();
        style = sp.trim();
        lyrics = lp.trim();
      } else if (has("===TITLE===") && has("===STYLE===") && has("===LYRICS===")) {
        const [, a1] = content.split("===TITLE===");
        const [tp, a2] = a1.split("===STYLE===");
        const [sp, lp] = a2.split("===LYRICS===");
        title = tp.trim();
        style = sp.trim();
        lyrics = lp.trim();
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
        if (chars.includes(out[0])) {
          out = out.slice(1);
          changed = true;
        }
        if (out.length && chars.includes(out[out.length - 1])) {
          out = out.slice(0, -1);
          changed = true;
        }
      }
      return out;
    };
    title = strip(title, "[]\"'`* \n");
    titleEn = strip(titleEn, "[]\"'`* \n");
    style = strip(style, "[]` \n");
    return { title, titleEn, style, lyrics };
  }
  async function callDeepSeek(messages, temperature, maxTokens) {
    const r = await api.deepseek({ messages, temperature, maxTokens });
    if (!r || !r.ok) throw new Error(r && r.error || "DeepSeek request failed");
    return r.content;
  }
  function CreationTab() {
    const [desc, setDesc] = useState("");
    const [language, setLanguage] = useState("English");
    const [moodBusy, setMoodBusy] = useState("");
    const [enhancing, setEnhancing] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [keySaved, setKeySaved] = useState(false);
    useEffect(() => {
      (async () => {
        try {
          const k = await api.getDsKey();
          if (k) {
            setApiKey(k);
            setKeySaved(true);
          }
        } catch {
        }
      })();
    }, []);
    const saveKey = async () => {
      try {
        await api.setDsKey(apiKey.trim());
        setKeySaved(true);
        setStatus(apiKey.trim() ? "api key saved \u266A" : "api key cleared");
      } catch {
        setStatus("couldn't save key");
      }
    };
    async function enhanceDesc() {
      const current = desc.trim();
      if (!current || enhancing) return;
      setEnhancing(true);
      try {
        const sys = "You enrich a short song idea that describes how a PERSON feels. Keep it about the person \u2014 their emotions, what they're going through, their headspace and vibe. Add a little depth and context to the FEELING (why it hurts, what they're holding onto, how it sits with them) while keeping their original meaning. Add to it, don't just reword it. Do NOT turn it into scenery or a list of objects in a room \u2014 no 'empty chairs / curled photographs / cold coffee' style. It should read like a real person describing their own mood. Good example: 'crying in the car on the drive home, replaying everything you should've said, missing someone who already moved on.' Rules: 1-2 sentences, lowercase, no quotes, no emojis, no hashtags, under ~35 words. Output only the text.";
        const out = await callDeepSeek(
          [
            { role: "system", content: sys },
            { role: "user", content: `enrich this, keep it about the person's feeling:

${current}` }
          ],
          0.85,
          140
        );
        const clean = (out || "").replace(/^["'\s]+|["'\s]+$/g, "").trim();
        if (clean) setDesc(clean);
      } catch (e) {
        setStatus(`enhance failed: ${e.message}`);
      } finally {
        setEnhancing(false);
      }
    }
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
        const sys = "You write short song descriptions about how a PERSON feels, for an AI music generator. Given a mood, describe what someone going through that feeling is actually experiencing \u2014 their emotions, thoughts, and headspace. It should read like a real person putting their vibe into words. Do NOT write empty scenery or lists of objects (no 'rain on the window, a curled photograph, cold coffee, an empty chair' style) \u2014 there must be a PERSON and a real feeling at the center. Good examples by mood \u2014 sad: 'missing someone who isn't coming back, replaying old messages just to feel close to them again.' happy: 'so in love it feels stupid, grinning at your phone, wanting to tell the whole world about them.' angry: 'done being walked over, finally finding your voice and refusing to shrink for anyone.' Rules: 1-2 sentences, lowercase, no quotes, no hashtags, no emojis, max ~30 words. Output only the text.";
        const out = await callDeepSeek(
          [
            { role: "system", content: sys },
            { role: "user", content: `mood: ${moodWord}. write a fresh song description about a person feeling this way.` }
          ],
          1.3,
          120
        );
        const clean = (out || "").replace(/^["'\s]+|["'\s]+$/g, "").trim();
        if (clean) setDesc(clean);
        else fallback();
      } catch (e) {
        fallback();
      } finally {
        setMoodBusy("");
      }
    }
    const [customStyle, setCustomStyle] = useState("");
    const [customLyric, setCustomLyric] = useState("");
    const [styleSel, setStyleSel] = useState(() => /* @__PURE__ */ new Set());
    const [stylePin, setStylePin] = useState(() => /* @__PURE__ */ new Set());
    const [styleEx, setStyleEx] = useState(() => /* @__PURE__ */ new Set());
    const [lyricSel, setLyricSel] = useState(() => /* @__PURE__ */ new Set());
    const [lyricPin, setLyricPin] = useState(() => /* @__PURE__ */ new Set());
    const [lyricEx, setLyricEx] = useState(() => /* @__PURE__ */ new Set());
    const [outTitle, setOutTitle] = useState("");
    const [outTitleEn, setOutTitleEn] = useState("");
    const [outStyle, setOutStyle] = useState("");
    const [outLyrics, setOutLyrics] = useState("");
    const [history, setHistory] = useState([]);
    const [status, setStatus] = useState("ready \u266A");
    const [busy, setBusy] = useState(false);
    const [suggesting, setSuggesting] = useState(false);
    const [reasoning, setReasoning] = useState("");
    const [tagTab, setTagTab] = useState("style");
    const [outTab, setOutTab] = useState("output");
    const [loaded, setLoaded] = useState(false);
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
    useEffect(() => {
      if (!loaded) return;
      store.set("suno_prefs", {
        language,
        description: desc,
        custom_style_tags: customStyle,
        custom_lyric_tags: customLyric,
        style_tags: [...styleSel],
        pinned_style_tags: [...stylePin],
        excluded_style_tags: [...styleEx],
        lyric_tags: [...lyricSel],
        pinned_lyric_tags: [...lyricPin],
        excluded_lyric_tags: [...lyricEx]
      });
    }, [loaded, language, desc, customStyle, customLyric, styleSel, stylePin, styleEx, lyricSel, lyricPin, lyricEx]);
    useEffect(() => {
      if (loaded) store.set("suno_history", history);
    }, [history, loaded]);
    const sets = {
      style: { sel: styleSel, setSel: setStyleSel, pin: stylePin, setPin: setStylePin, ex: styleEx, setEx: setStyleEx },
      lyric: { sel: lyricSel, setSel: setLyricSel, pin: lyricPin, setPin: setLyricPin, ex: lyricEx, setEx: setLyricEx }
    };
    const toggleTag = useCallback((kind, tag) => {
      const s = sets[kind];
      if (s.ex.has(tag)) return;
      s.setSel((prev) => {
        const n = new Set(prev);
        n.has(tag) ? n.delete(tag) : n.add(tag);
        return n;
      });
    }, [styleSel, styleEx, lyricSel, lyricEx]);
    const cycleTag = useCallback((kind, tag, e) => {
      e.preventDefault();
      const s = sets[kind];
      if (s.pin.has(tag)) {
        s.setPin((p) => {
          const n = new Set(p);
          n.delete(tag);
          return n;
        });
        s.setEx((p) => {
          const n = new Set(p);
          n.add(tag);
          return n;
        });
        s.setSel((p) => {
          const n = new Set(p);
          n.delete(tag);
          return n;
        });
        setStatus(`\u{1F6AB} excluded: ${tag}  (deepseek won't pick it)`);
      } else if (s.ex.has(tag)) {
        s.setEx((p) => {
          const n = new Set(p);
          n.delete(tag);
          return n;
        });
        setStatus(`cleared: ${tag}`);
      } else {
        s.setPin((p) => {
          const n = new Set(p);
          n.add(tag);
          return n;
        });
        s.setSel((p) => {
          const n = new Set(p);
          n.add(tag);
          return n;
        });
        setStatus(`\u{1F4CC} pinned: ${tag}  (kept through suggest & clear)`);
      }
    }, [stylePin, styleEx, lyricPin, lyricEx]);
    const clearTags = () => {
      setStyleSel(/* @__PURE__ */ new Set([...stylePin]));
      setLyricSel(/* @__PURE__ */ new Set([...lyricPin]));
      setCustomStyle("");
      setCustomLyric("");
      const kept = stylePin.size + lyricPin.size;
      setStatus(kept ? `tags cleared (${kept} pinned kept)` : "all tags cleared");
    };
    const collect = (sel, ex, custom) => {
      const tags = [...sel].filter((t) => !ex.has(t));
      const c = custom.trim();
      if (c) tags.push(...c.split(",").map((x) => x.trim()).filter(Boolean));
      return tags;
    };
    const onSuggest = async () => {
      if (!desc.trim()) {
        setStatus("tell me how you feel first <3");
        return;
      }
      setSuggesting(true);
      setBusy(true);
      setReasoning("");
      setStatus("asking deepseek which tags fit the mood...");
      const excluded = [...styleEx, ...lyricEx];
      const ban = excluded.length ? `

NEVER choose any of these tags \u2014 the user has excluded them: ${excluded.join(", ")}` : "";
      const sys = `You are a music tagging assistant for the Suno AI music generator.
Given a song description or mood, decide which tags best fit it. THINK about the mood, energy, pacing, and story before choosing \u2014 don't just grab everything. Be selective.

Choose ONLY from these exact tags (copy verbatim):
STYLE TAGS by category: ${JSON.stringify(STYLE_TAGS)}
LYRIC TAGS by category: ${JSON.stringify(LYRIC_TAGS)}

Return ONLY raw JSON \u2014 no markdown \u2014 in exactly this shape:
{"reasoning":"<one short sentence>","style_tags":["..."],"lyric_tags":["..."]}` + ban;
      try {
        const content = await callDeepSeek(
          [{ role: "system", content: sys }, { role: "user", content: `Song description / mood:

${desc}` }],
          0.4,
          500
        );
        const start = content.indexOf("{"), end = content.lastIndexOf("}") + 1;
        const data = JSON.parse(content.slice(start, end));
        const styleLookup = {}, lyricLookup = {};
        Object.values(STYLE_TAGS).flat().forEach((t) => styleLookup[t.toLowerCase()] = t);
        Object.values(LYRIC_TAGS).flat().forEach((t) => lyricLookup[t.toLowerCase()] = t);
        const ns = /* @__PURE__ */ new Set([...stylePin]), nl = /* @__PURE__ */ new Set([...lyricPin]);
        let n = 0;
        (data.style_tags || []).forEach((t) => {
          const k = styleLookup[String(t).trim().toLowerCase()];
          if (k && !styleEx.has(k)) {
            ns.add(k);
            n++;
          }
        });
        (data.lyric_tags || []).forEach((t) => {
          const k = lyricLookup[String(t).trim().toLowerCase()];
          if (k && !lyricEx.has(k)) {
            nl.add(k);
            n++;
          }
        });
        setStyleSel(ns);
        setLyricSel(nl);
        setReasoning((data.reasoning || "").trim());
        setStatus(`set ${n} tags \u266A  tick/untick what you want, then generate`);
      } catch (err) {
        setStatus(`suggest failed: ${err.message}`);
      } finally {
        setSuggesting(false);
        setBusy(false);
      }
    };
    const onGenerate = async () => {
      if (!desc.trim()) {
        setStatus("tell me how you feel first <3");
        return;
      }
      setBusy(true);
      setStatus("contacting deepseek...");
      setOutTitle("");
      setOutTitleEn("");
      setOutStyle("");
      setOutLyrics("");
      const styleTags = collect(styleSel, styleEx, customStyle);
      const lyricTags = collect(lyricSel, lyricEx, customLyric);
      const excluded = [...styleEx, ...lyricEx];
      const lang = language.trim() || "English";
      const styleStr = styleTags.length ? styleTags.join(", ") : "(none specified \u2014 pick fitting ones)";
      const lyricStr = lyricTags.length ? lyricTags.join(", ") : "(none \u2014 only use standard section labels)";
      const sys = `You are a songwriter who writes lyrics for the Suno AI music generator.

LANGUAGE: Write the TITLE and LYRICS in ${lang}. Style tags stay in English. Section labels and inline directives stay in English.

OUTPUT FORMAT \u2014 use these EXACT markers:
===TITLE===
<short title 2-6 words>
===TITLE_EN===
<English translation, repeat if already English>
===STYLE===
<comma-separated style tags, no brackets>
===LYRICS===
[Verse 1]
<lyrics>
[Chorus]
<lyrics>

STYLE TAGS go ONLY in ===STYLE=== as a comma-separated list. Keep every user tag, then ADD 3-7 fitting ones (genre, mood, tempo, vocals, instruments, production).
LYRIC TAGS go ONLY inside ===LYRICS=== as inline [square bracket] directives at the right moment, each on its own line.
Write each section header exactly once. Never place two headers back-to-back.

STYLE RULES (strict): simple everyday words a real person says out loud. NO poetic language, metaphors, similes, or fancy imagery. Avoid: porcelain, shattered, whispers, cascade, echoes, symphony, solace, fragile, lullaby, scars, hollow, ghost, spotlight, mirror. Be direct and plain. Short clear singable lines. Sound human not AI \u2014 concrete specific details, slightly messy. Don't force rhymes. Banned clich\xE9s: 'nothing's ever what it seems', 'chasing the stars', 'through the storm', 'spread my wings', 'tears fall like rain', 'set me free', 'hold on tight', 'never let go'. Contractions and plain talk are good.

MOST IMPORTANT: write about how the PERSON FEELS, not the scenery around them. Don't just paint a picture of the moon, water, rooms, or objects \u2014 say the actual emotion and what they're thinking out loud (e.g. 'I miss you and I hate that I still do', not 'the moon hangs low over dark water'). The listener should know exactly what the person is feeling, in their own plain words. Scene-setting is fine only as a tiny backdrop \u2014 the feeling must be front and center in most lines.`;
      let user = `Write Suno-ready output based on this feeling/description:

${desc}

STYLE TAGS chosen by user (keep all, then ADD 3-7 more): ${styleStr}
LYRIC TAGS (place inline as [Tag]): ${lyricStr}

`;
      if (excluded.length)
        user += `BANNED TAGS \u2014 never use these anywhere: ${excluded.join(", ")}

`;
      user += "Output the title, style, and lyrics using the exact ===MARKERS=== format.";
      try {
        const content = await callDeepSeek(
          [{ role: "system", content: sys }, { role: "user", content: user }],
          0.9,
          1500
        );
        const { title, titleEn, style, lyrics } = parseResponse(content);
        setOutTitle(title);
        setOutTitleEn(titleEn && titleEn.toLowerCase() !== title.toLowerCase() ? titleEn : "");
        setOutStyle(style);
        setOutLyrics(lyrics);
        setStatus("done \u266A  paste each box into suno");
        if (title || lyrics) {
          setHistory((h) => [{ title: title || "(untitled)", titleEn, style, lyrics, ts: (/* @__PURE__ */ new Date()).toLocaleString() }, ...h].slice(0, 50));
        }
      } catch (err) {
        setOutLyrics(`[error]

${err.message}

Make sure your DeepSeek API key is set above (\u{1F511}).`);
        setStatus("error :(");
      } finally {
        setBusy(false);
      }
    };
    const loadEntry = (e) => {
      setOutTitle(e.title === "(untitled)" ? "" : e.title);
      setOutTitleEn(e.titleEn || "");
      setOutStyle(e.style || "");
      setOutLyrics(e.lyrics || "");
      setOutTab("output");
      setStatus("loaded from history \u266A");
    };
    const delEntry = (i) => setHistory((h) => h.filter((_, idx) => idx !== i));
    const clearHistory = () => {
      setHistory([]);
      setStatus("history cleared");
    };
    const sparkles = useMemo(
      () => Array.from({ length: 22 }, () => ({
        ch: SPARKLE_CHARS[Math.floor(Math.random() * SPARKLE_CHARS.length)],
        left: Math.random() * 100,
        size: 9 + Math.random() * 14,
        dur: 9 + Math.random() * 12,
        delay: -Math.random() * 20,
        drift: (Math.random() * 60 - 30).toFixed(0)
      })),
      []
    );
    return /* @__PURE__ */ React.createElement("div", { className: "slf-root" }, /* @__PURE__ */ React.createElement("style", null, CSS), /* @__PURE__ */ React.createElement("div", { className: "slf-bg", "aria-hidden": true }, /* @__PURE__ */ React.createElement("div", { className: "orb orb-a" }), /* @__PURE__ */ React.createElement("div", { className: "orb orb-b" }), /* @__PURE__ */ React.createElement("div", { className: "orb orb-c" }), /* @__PURE__ */ React.createElement("div", { className: "grid-lines" }), sparkles.map((s, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "spark", style: {
      left: `${s.left}%`,
      fontSize: `${s.size}px`,
      animationDuration: `${s.dur}s`,
      animationDelay: `${s.delay}s`,
      "--drift": `${s.drift}px`
    } }, s.ch))), /* @__PURE__ */ React.createElement("div", { className: "slf-wrap" }, /* @__PURE__ */ React.createElement("header", { className: "hdr" }, /* @__PURE__ */ React.createElement("h1", { className: "title" }, /* @__PURE__ */ React.createElement("span", { className: "title-spark" }, "\u2726"), /* @__PURE__ */ React.createElement("span", { className: "title-text" }, "SUNO LYRIC FORGE"), /* @__PURE__ */ React.createElement("span", { className: "title-spark" }, "\u2726")), /* @__PURE__ */ React.createElement("p", { className: "tagline" }, "\u22C6\u02D9\u27E1 tell deepseek how you feel \u2014 get suno-ready title, style & lyrics \u27E1\u02D9\u22C6"), /* @__PURE__ */ React.createElement("div", { className: "key-row" }, /* @__PURE__ */ React.createElement("span", { className: "key-lbl" }, "\u{1F511} DeepSeek key"), /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "field sm key-input",
        type: "password",
        placeholder: "sk-\u2026  (stored locally on this PC)",
        value: apiKey,
        onChange: (e) => {
          setApiKey(e.target.value);
          setKeySaved(false);
        }
      }
    ), /* @__PURE__ */ React.createElement("button", { className: `mini-btn accent ${keySaved ? "" : "pulse"}`, onClick: saveKey }, keySaved ? "\u2713 saved" : "save key"))), /* @__PURE__ */ React.createElement("div", { className: "grid" }, /* @__PURE__ */ React.createElement("section", { className: "col" }, /* @__PURE__ */ React.createElement(Card, { delay: 0.05 }, /* @__PURE__ */ React.createElement(Label, { icon: "\u273F" }, "your song description"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        className: "field area",
        rows: 3,
        value: desc,
        placeholder: PLACEHOLDER,
        onChange: (e) => setDesc(e.target.value)
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "mood-row" }, MOOD_KEYS.map((m) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: m,
        className: `mini-btn mood-btn ${moodBusy === m ? "pulse" : ""}`,
        disabled: !!moodBusy || enhancing,
        onClick: () => pickMood(m)
      },
      moodBusy === m ? "\u2726 thinking\u2026" : m
    )), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "mini-btn accent",
        title: "surprise me!",
        disabled: !!moodBusy || enhancing,
        onClick: () => pickMood(MOOD_KEYS[Math.floor(Math.random() * MOOD_KEYS.length)])
      },
      "\u{1F3B2} random"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: `mini-btn accent ${enhancing ? "pulse" : ""}`,
        title: "polish what you typed a little",
        disabled: !desc.trim() || !!moodBusy || enhancing,
        onClick: enhanceDesc
      },
      enhancing ? "\u2726 polishing\u2026" : "\u2728 enhance"
    )), /* @__PURE__ */ React.createElement("div", { className: "lang-row" }, /* @__PURE__ */ React.createElement("span", { className: "lang-lbl" }, "language"), /* @__PURE__ */ React.createElement("input", { className: "field", value: language, onChange: (e) => setLanguage(e.target.value) })), /* @__PURE__ */ React.createElement("button", { className: `gen-btn ${busy ? "working" : ""}`, disabled: busy, onClick: onGenerate }, busy ? /* @__PURE__ */ React.createElement("span", { className: "gen-dots" }, "GENERATING", /* @__PURE__ */ React.createElement("i", null, "."), /* @__PURE__ */ React.createElement("i", null, "."), /* @__PURE__ */ React.createElement("i", null, ".")) : /* @__PURE__ */ React.createElement(React.Fragment, null, "\u2726\xA0\xA0GENERATE LYRICS\xA0\xA0\u2726"))), /* @__PURE__ */ React.createElement(Card, { delay: 0.12 }, /* @__PURE__ */ React.createElement("div", { className: "tags-head" }, /* @__PURE__ */ React.createElement(Label, { icon: "\u2740", inline: true }, "tags"), /* @__PURE__ */ React.createElement("div", { className: "tag-actions" }, /* @__PURE__ */ React.createElement("button", { className: "mini-btn", onClick: clearTags }, "\u2715 clear"), /* @__PURE__ */ React.createElement("button", { className: `mini-btn accent ${suggesting ? "pulse" : ""}`, disabled: suggesting, onClick: onSuggest }, suggesting ? "\u{1F4AD} thinking\u2026" : "\u{1F4AD} suggest from mood"))), reasoning && /* @__PURE__ */ React.createElement("div", { className: "reasoning" }, "\u{1F4AD} ", reasoning), /* @__PURE__ */ React.createElement("p", { className: "hint" }, "tip: ", /* @__PURE__ */ React.createElement("b", null, "click"), " to pick \xB7 ", /* @__PURE__ */ React.createElement("b", null, "right-click"), " to cycle \u{1F4CC} pin \u2192 \u{1F6AB} exclude \u2192 off"), /* @__PURE__ */ React.createElement("div", { className: "tabs" }, /* @__PURE__ */ React.createElement("button", { className: `tab ${tagTab === "style" ? "on" : ""}`, onClick: () => setTagTab("style") }, "\u2727 Style Tags"), /* @__PURE__ */ React.createElement("button", { className: `tab ${tagTab === "lyric" ? "on" : ""}`, onClick: () => setTagTab("lyric") }, "\u266A Lyric Tags")), /* @__PURE__ */ React.createElement("div", { className: "tag-scroll" }, /* @__PURE__ */ React.createElement("p", { className: "sub-hint" }, tagTab === "style" ? "\u2192 go into Suno's Styles box" : "\u2192 placed INSIDE lyrics as [Drop], [Whispered]\u2026"), Object.entries(tagTab === "style" ? STYLE_TAGS : LYRIC_TAGS).map(([cat, tags]) => /* @__PURE__ */ React.createElement("div", { key: cat, className: "cat" }, /* @__PURE__ */ React.createElement("div", { className: "cat-name" }, cat), /* @__PURE__ */ React.createElement("div", { className: "chips" }, tags.map((tag) => {
      const s = sets[tagTab];
      const pinned = s.pin.has(tag), excluded = s.ex.has(tag), selected = s.sel.has(tag);
      const cls = ["chip"];
      if (excluded) cls.push("ex");
      else if (pinned) cls.push("pin");
      else if (selected) cls.push("sel");
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: tag,
          className: cls.join(" "),
          onClick: () => toggleTag(tagTab, tag),
          onContextMenu: (e) => cycleTag(tagTab, tag, e)
        },
        /* @__PURE__ */ React.createElement("span", { className: "chip-ic" }, excluded ? "\u{1F6AB}" : pinned ? "\u{1F4CC}" : selected ? "\u2665" : "\u2661"),
        tag
      );
    }))))), /* @__PURE__ */ React.createElement("div", { className: "custom" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "field sm",
        placeholder: "custom style tags (comma-separated)",
        value: customStyle,
        onChange: (e) => setCustomStyle(e.target.value)
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "field sm",
        placeholder: "custom lyric tags (e.g. drop, build up)",
        value: customLyric,
        onChange: (e) => setCustomLyric(e.target.value)
      }
    )))), /* @__PURE__ */ React.createElement("section", { className: "col" }, /* @__PURE__ */ React.createElement(Card, { delay: 0.18, className: "grow" }, /* @__PURE__ */ React.createElement("div", { className: "tabs out-tabs" }, /* @__PURE__ */ React.createElement("button", { className: `tab ${outTab === "output" ? "on" : ""}`, onClick: () => setOutTab("output") }, "\u2726 Output"), /* @__PURE__ */ React.createElement("button", { className: `tab ${outTab === "history" ? "on" : ""}`, onClick: () => setOutTab("history") }, "\u273F History")), outTab === "output" ? /* @__PURE__ */ React.createElement("div", { className: "out-scroll" }, /* @__PURE__ */ React.createElement(OutputBox, { label: "TITLE", hint: "(paste into Suno's title field)", value: outTitle, setStatus, single: true }), outTitleEn && /* @__PURE__ */ React.createElement(OutputBox, { label: "TITLE (EN)", hint: "(English translation)", value: outTitleEn, setStatus, single: true }), /* @__PURE__ */ React.createElement(OutputBox, { label: "STYLE", hint: "(paste into Suno's Styles box)", value: outStyle, setStatus, cap: 200, rows: 3 }), /* @__PURE__ */ React.createElement(OutputBox, { label: "LYRICS", hint: "(paste into Suno's Lyrics box)", value: outLyrics, setStatus, rows: 14, grow: true })) : /* @__PURE__ */ React.createElement("div", { className: "out-scroll" }, /* @__PURE__ */ React.createElement("div", { className: "hist-head" }, /* @__PURE__ */ React.createElement("span", { className: "hint" }, "past generations \u2014 click one to load it back"), history.length > 0 && /* @__PURE__ */ React.createElement("button", { className: "mini-btn", onClick: clearHistory }, "clear history")), history.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "empty" }, "no history yet \u2014 generate something \u266A") : history.map((e, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "hist-row" }, /* @__PURE__ */ React.createElement("button", { className: "hist-load", onClick: () => loadEntry(e) }, "\u266A ", e.title), /* @__PURE__ */ React.createElement("button", { className: "hist-del", onClick: () => delEntry(i) }, "\u2715"), /* @__PURE__ */ React.createElement("div", { className: "hist-meta" }, e.ts, e.style ? `   \xB7   ${e.style.replace(/\n/g, " ").slice(0, 60)}` : ""))))))), /* @__PURE__ */ React.createElement("footer", { className: "status" }, /* @__PURE__ */ React.createElement("span", { className: `spin ${busy ? "busy" : ""}` }, busy ? "\u273F" : "\u2726"), /* @__PURE__ */ React.createElement("span", null, status))));
  }
  function Card({ children, delay = 0, className = "" }) {
    return /* @__PURE__ */ React.createElement("div", { className: `card ${className}`, style: { animationDelay: `${delay}s` } }, children);
  }
  function Label({ children, icon, inline }) {
    return /* @__PURE__ */ React.createElement("div", { className: `lbl ${inline ? "inline" : ""}` }, /* @__PURE__ */ React.createElement("span", { className: "lbl-ic" }, icon), children);
  }
  function OutputBox({ label, hint, value, cap, rows = 1, single, grow, setStatus }) {
    const [copied, setCopied] = useState(false);
    const n = value.length;
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = value;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
        } catch {
        }
        document.body.removeChild(ta);
      }
      setCopied(true);
      setStatus && setStatus("copied to clipboard \u266A");
      setTimeout(() => setCopied(false), 1200);
    };
    return /* @__PURE__ */ React.createElement("div", { className: `obox ${grow ? "grow" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "obox-head" }, /* @__PURE__ */ React.createElement("span", { className: "obox-lbl" }, label, " ", /* @__PURE__ */ React.createElement("i", null, hint)), /* @__PURE__ */ React.createElement("div", { className: "obox-right" }, cap != null && /* @__PURE__ */ React.createElement("span", { className: `counter ${n > cap ? "over" : ""}` }, n, " / ", cap), /* @__PURE__ */ React.createElement("button", { className: `copy-btn ${copied ? "ok" : ""}`, onClick: copy }, copied ? "\u2713 copied" : "copy"))), single ? /* @__PURE__ */ React.createElement("input", { className: "obox-field single", readOnly: true, value, placeholder: "\u2026" }) : /* @__PURE__ */ React.createElement("textarea", { className: `obox-field ${grow ? "grow" : ""}`, readOnly: true, rows, value, placeholder: "\u2026" }));
  }
  var CSS = `
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

  // renderer/app.jsx
  var { useState: useState2, useEffect: useEffect2, useRef, useCallback: useCallback2, useMemo: useMemo2 } = React;
  var api2 = window.kawaii;
  var fmt = (s) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60).toString().padStart(2, "0");
    return m + ":" + ss;
  };
  var GLYPHS = ["\u{1F380}", "\u{1F338}", "\u2B50", "\u{1F49C}", "\u{1F353}", "\u{1F43E}", "\u{1F319}", "\u{1F370}"];
  function useCosmetics() {
    useEffect2(() => {
      const pcv = document.getElementById("bg-particles"), tcv = document.getElementById("cursor-trail");
      const pctx = pcv.getContext("2d"), tctx = tcv.getContext("2d");
      let raf;
      const COLORS = ["#ff5d8f", "#ffce47", "#ff86b3", "#e6ad1f"];
      function size() {
        for (const c of [pcv, tcv]) {
          c.width = innerWidth;
          c.height = innerHeight;
        }
      }
      size();
      addEventListener("resize", size);
      const COUNT = Math.max(24, Math.min(46, Math.round(innerWidth * innerHeight / 26e3)));
      const parts = Array.from({ length: COUNT }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: 1 + Math.random() * 3, vx: (Math.random() - 0.5) * 0.35, vy: -0.2 - Math.random() * 0.5, a: 0.25 + Math.random() * 0.55, c: COLORS[Math.random() * COLORS.length | 0] }));
      let trail = [], trailDirty = false;
      const onMove = (e) => {
        trail.push({ x: e.clientX, y: e.clientY, life: 1 });
        if (trail.length > 26) trail.shift();
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
      const FRAME = 1e3 / 60;
      let last = 0;
      function loop(now) {
        raf = requestAnimationFrame(loop);
        if (document.hidden) return;
        if (now - last < FRAME - 1) return;
        last = now;
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
        if (trail.length) {
          for (const t of trail) t.life *= 0.9;
          trail = trail.filter((t) => t.life > 0.06);
          tctx.clearRect(0, 0, tcv.width, tcv.height);
          for (let i = 0; i < trail.length; i++) {
            const t = trail[i];
            const rr = i / trail.length * 7 + 1;
            tctx.globalAlpha = t.life * 0.6;
            tctx.fillStyle = i % 2 ? "#ffce47" : "#ff5d8f";
            tctx.beginPath();
            tctx.arc(t.x, t.y, rr, 0, 7);
            tctx.fill();
          }
          tctx.globalAlpha = 1;
          trailDirty = true;
        } else if (trailDirty) {
          tctx.clearRect(0, 0, tcv.width, tcv.height);
          trailDirty = false;
        }
      }
      raf = requestAnimationFrame(loop);
      return () => {
        cancelAnimationFrame(raf);
        removeEventListener("resize", size);
        removeEventListener("mousemove", onMove);
        removeEventListener("click", onClick);
      };
    }, []);
  }
  function TitleBar({ onSettings }) {
    const [max, setMax] = useState2(false);
    useEffect2(() => {
      api2.onMaximizeState && api2.onMaximizeState(setMax);
    }, []);
    return /* @__PURE__ */ React.createElement("div", { className: "titlebar" }, /* @__PURE__ */ React.createElement("div", { className: "brand" }, /* @__PURE__ */ React.createElement("span", { className: "heart" }, "\u2665"), " Suno Kawaii Player"), /* @__PURE__ */ React.createElement("button", { className: "social-link", title: "Feris socials \u2014 mez.ink/ferisooo", onClick: () => api2.openExternal("https://mez.ink/ferisooo") }, "\u{1F517} feris socials"), /* @__PURE__ */ React.createElement("div", { className: "spacer" }), /* @__PURE__ */ React.createElement("div", { className: "win-btns" }, /* @__PURE__ */ React.createElement("button", { className: "win-btn", title: "Settings", onClick: onSettings }, "\u2699"), /* @__PURE__ */ React.createElement("button", { className: "win-btn", title: "Minimize", onClick: () => api2.minimize() }, "\u2014"), /* @__PURE__ */ React.createElement("button", { className: "win-btn", title: "Maximize", onClick: () => api2.maximize() }, max ? "\u2750" : "\u25A2"), /* @__PURE__ */ React.createElement("button", { className: "win-btn close", title: "Close", onClick: () => api2.close() }, "\u2715")));
  }
  function TrackRow({ track, index, active, playing, onPlay, onMenu, selectable, checked, onToggle, fav, onFav }) {
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "track" + (active ? " active" : "") + (checked ? " picked" : ""),
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
      /* @__PURE__ */ React.createElement("div", { className: "tmeta" }, /* @__PURE__ */ React.createElement("div", { className: "tname" }, track.title), /* @__PURE__ */ React.createElement("div", { className: "tsrc" }, "\u{1F339} Suno")),
      active && playing && track.cover && /* @__PURE__ */ React.createElement("div", { className: "eqbars" }, /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("span", null)),
      /* @__PURE__ */ React.createElement("button", { className: "fav-btn" + (fav ? " on" : ""), title: fav ? "Unfavorite" : "Favorite", onClick: (e) => {
        e.stopPropagation();
        onFav();
      } }, fav ? "\u2764" : "\u2661")
    );
  }
  var REPEAT_MODES = ["off", "all", "one"];
  var EQ_PRESETS = {
    Flat: { low: 0, mid: 0, high: 0 },
    "Bass boost": { low: 7, mid: 0, high: 1 },
    Vocal: { low: -2, mid: 5, high: 1 },
    Treble: { low: 0, mid: 0, high: 7 },
    Warm: { low: 4, mid: 1, high: -3 },
    "Lo-fi": { low: 3, mid: -2, high: -6 }
  };
  var EQ_BANDS = [["low", "Bass"], ["mid", "Mid"], ["high", "Treble"]];
  function App() {
    useCosmetics();
    const [tab, setTab] = useState2("library");
    const [tracks, setTracks] = useState2([]);
    const [playlists, setPlaylists] = useState2([]);
    const [selPl, setSelPl] = useState2(null);
    const [collapsed, setCollapsed] = useState2(false);
    const [curId, setCurId] = useState2(null);
    const [current, setCurrent] = useState2(null);
    const [playing, setPlaying] = useState2(false);
    const [progress, setProgress] = useState2(0);
    const [duration, setDuration] = useState2(0);
    const [volume, setVolume] = useState2(0.85);
    const [shuffle, setShuffle] = useState2(false);
    const [repeat, setRepeat] = useState2("off");
    const [sunoInput, setSunoInput] = useState2("");
    const [busy, setBusy] = useState2(false);
    const [toast, setToast] = useState2(null);
    const [embedded, setEmbedded] = useState2(false);
    const [sunoStart, setSunoStart] = useState2("https://suno.com/me");
    const [ctx, setCtx] = useState2(null);
    const [creating, setCreating] = useState2(false);
    const [newName, setNewName] = useState2("");
    const [selected, setSelected] = useState2([]);
    const [plMenuOpen, setPlMenuOpen] = useState2(false);
    const [picking, setPicking] = useState2(false);
    const [creationMounted, setCreationMounted] = useState2(false);
    const [bigViz, setBigViz] = useState2(false);
    const [search, setSearch] = useState2("");
    const [settings, setSettings] = useState2({ effects: 1, remember: true, sort: "added-desc", favorites: [], playStats: {}, eq: { low: 0, mid: 0, high: 0 }, offline: false });
    const [showSettings, setShowSettings] = useState2(false);
    const [favOnly, setFavOnly] = useState2(false);
    const [offlineCount, setOfflineCount] = useState2(0);
    const [caching, setCaching] = useState2(false);
    const [updateInfo, setUpdateInfo] = useState2(null);
    const audioRef = useRef(null), sunoRef = useRef(null), webviewRef = useRef(null);
    const urlCache = useRef(/* @__PURE__ */ new Map()), vizRef = useRef(null), seekRef = useRef(null), volRef = useRef(null);
    const audioCtxRef = useRef(null), analyserRef = useRef(null), eqRef = useRef(null);
    const queueRef = useRef([]), idxRef = useRef(-1);
    const repeatRef = useRef("off"), shuffleRef = useRef(false);
    useEffect2(() => {
      repeatRef.current = repeat;
    }, [repeat]);
    useEffect2(() => {
      shuffleRef.current = shuffle;
    }, [shuffle]);
    const flash = (msg, err) => {
      setToast({ msg, err });
      setTimeout(() => setToast(null), err ? 4800 : 2600);
    };
    const tracksById = buildIdMap(tracks);
    const settingsRef = useRef(settings), saveTimer = useRef(null), settingsLoaded = useRef(false);
    const updateSettings = (patch) => {
      const next = { ...settingsRef.current, ...patch };
      settingsRef.current = next;
      setSettings(next);
      if (typeof patch.effects === "number") document.documentElement.style.setProperty("--fx", String(patch.effects));
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        try {
          api2.setSettings && api2.setSettings(next);
        } catch {
        }
      }, 250);
    };
    const toggleFav = (id) => {
      const s = new Set(settingsRef.current.favorites || []);
      s.has(id) ? s.delete(id) : s.add(id);
      updateSettings({ favorites: [...s] });
    };
    const favSet = new Set(settings.favorites || []);
    const refreshOffline = async () => {
      try {
        const l = api2.offlineList && await api2.offlineList();
        setOfflineCount(Array.isArray(l) ? l.length : 0);
      } catch {
      }
    };
    useEffect2(() => {
      refreshOffline();
    }, []);
    useEffect2(() => {
      const t = setTimeout(async () => {
        try {
          const u = api2.checkUpdate && await api2.checkUpdate();
          if (u && u.newer && u.latest !== settingsRef.current.dismissedVersion) setUpdateInfo(u);
        } catch {
        }
      }, 2500);
      return () => clearTimeout(t);
    }, []);
    const dismissUpdate = () => {
      if (updateInfo) updateSettings({ dismissedVersion: updateInfo.latest });
      setUpdateInfo(null);
    };
    const cacheAll = async () => {
      if (caching) return;
      setCaching(true);
      const items = tracks.filter((t) => t.audioUrl);
      let ok = 0, fail = 0;
      for (let i = 0; i < items.length; i++) {
        flash("Caching " + (i + 1) + "/" + items.length + "\u2026");
        try {
          const r = await api2.offlineSaveUrl(items[i].id, items[i].audioUrl);
          r && r.ok ? ok++ : fail++;
        } catch {
          fail++;
        }
      }
      setCaching(false);
      refreshOffline();
      flash(fail ? "Cached " + ok + ", " + fail + " failed \u2014 log into Suno via Explore for private songs." : "All " + ok + " songs cached offline \u{1F4BE}", fail && ok === 0);
    };
    const clearCache = async () => {
      try {
        await api2.offlineClear();
        urlCache.current.clear();
        refreshOffline();
        flash("Offline cache cleared");
      } catch {
      }
    };
    useEffect2(() => {
      (async () => {
        try {
          const s = api2.getSettings && await api2.getSettings() || {};
          const merged = { effects: 1, remember: true, sort: "added-desc", favorites: [], playStats: {}, eq: { low: 0, mid: 0, high: 0 }, offline: false, ...s };
          settingsRef.current = merged;
          setSettings(merged);
          document.documentElement.style.setProperty("--fx", String(merged.effects));
          if (merged.remember && merged.session) {
            const ss = merged.session;
            if (typeof ss.volume === "number") setVolume(ss.volume);
            if (typeof ss.shuffle === "boolean") setShuffle(ss.shuffle);
            if (ss.repeat) setRepeat(ss.repeat);
            if (ss.tab === "library" || ss.tab === "playlists") setTab(ss.tab);
          }
        } catch {
        }
        settingsLoaded.current = true;
      })();
    }, []);
    useEffect2(() => {
      if (!settingsLoaded.current || !settingsRef.current.remember) return;
      updateSettings({ session: { volume, shuffle, repeat, tab } });
    }, [volume, shuffle, repeat, tab]);
    useEffect2(() => {
      (async () => {
        try {
          const s = await api2.getState();
          setTracks(s.tracks || []);
          setPlaylists(s.playlists || []);
        } catch {
        }
      })();
      api2.onState && api2.onState((s) => {
        setTracks(s.tracks || []);
        setPlaylists(s.playlists || []);
      });
      api2.onToast && api2.onToast(({ msg, err }) => flash(msg, err));
    }, []);
    useEffect2(() => {
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
        an.fftSize = 1024;
        an.smoothingTimeConstant = 0.82;
        const eq = settingsRef.current.eq || { low: 0, mid: 0, high: 0 };
        const low = ctx2.createBiquadFilter();
        low.type = "lowshelf";
        low.frequency.value = 250;
        low.gain.value = eq.low || 0;
        const mid = ctx2.createBiquadFilter();
        mid.type = "peaking";
        mid.frequency.value = 1100;
        mid.Q.value = 0.9;
        mid.gain.value = eq.mid || 0;
        const high = ctx2.createBiquadFilter();
        high.type = "highshelf";
        high.frequency.value = 4500;
        high.gain.value = eq.high || 0;
        src.connect(low);
        low.connect(mid);
        mid.connect(high);
        high.connect(an);
        an.connect(ctx2.destination);
        audioCtxRef.current = ctx2;
        analyserRef.current = an;
        eqRef.current = { low, mid, high };
      } catch {
      }
    }
    useEffect2(() => {
      const e = eqRef.current;
      if (!e) return;
      const eq = settings.eq || {};
      try {
        e.low.gain.value = eq.low || 0;
        e.mid.gain.value = eq.mid || 0;
        e.high.gain.value = eq.high || 0;
      } catch {
      }
    }, [settings.eq]);
    useEffect2(() => {
      const root = document.documentElement;
      const bars = vizRef.current ? vizRef.current.children : [];
      if (!playing) {
        for (let i = 0; i < bars.length; i++) bars[i].style.height = "8px";
        root.style.setProperty("--beat", "0");
        return;
      }
      let raf, data = null;
      const FRAME = 1e3 / 60;
      let last = 0;
      const draw = (now) => {
        raf = requestAnimationFrame(draw);
        if (document.hidden || now - last < FRAME - 1) return;
        last = now;
        const an = analyserRef.current;
        if (!an) return;
        if (!data || data.length !== an.frequencyBinCount) data = new Uint8Array(an.frequencyBinCount);
        an.getByteFrequencyData(data);
        const span = bigViz ? 260 : 130;
        const n = bars.length, bins = data.length;
        const minB = 2, maxB = Math.max(minB + 1, Math.floor(bins * 0.66));
        const ratio = maxB / minB;
        for (let i = 0; i < n; i++) {
          const lo = Math.floor(minB * Math.pow(ratio, i / n));
          let hi = Math.floor(minB * Math.pow(ratio, (i + 1) / n));
          if (hi <= lo) hi = lo + 1;
          let peak = 0;
          for (let j = lo; j < hi && j < bins; j++) if (data[j] > peak) peak = data[j];
          const v = Math.min(1, peak / 255 * (1 + i / n * 0.65));
          bars[i].style.height = 10 + v * span + "px";
        }
        const beatLim = Math.floor(bins * 0.32);
        let sum = 0;
        for (let j = 2; j < beatLim; j++) sum += data[j];
        const beat = Math.min(1, sum / Math.max(1, beatLim - 2) / 165);
        root.style.setProperty("--beat", beat.toFixed(3));
      };
      raf = requestAnimationFrame(draw);
      return () => {
        cancelAnimationFrame(raf);
        root.style.setProperty("--beat", "0");
      };
    }, [playing, bigViz]);
    const resolveUrl = useCallback2(async (track) => {
      if (urlCache.current.has(track.id)) return urlCache.current.get(track.id);
      let bytes;
      if (track.bytes) bytes = track.bytes;
      else {
        try {
          const off = api2.offlineGet && await api2.offlineGet(track.id);
          if (off && off.bytes) bytes = off.bytes;
        } catch {
        }
        if (!bytes) {
          if (!track.audioUrl) throw new Error("No audio source for this track.");
          bytes = (await api2.fetchSunoUrl(track.audioUrl)).bytes;
          if (settingsRef.current.offline && api2.offlineSave) {
            try {
              await api2.offlineSave(track.id, bytes);
              refreshOffline();
            } catch {
            }
          }
        }
      }
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      urlCache.current.set(track.id, url);
      return url;
    }, []);
    const playFrom = useCallback2(async (list2, idx) => {
      if (idx < 0 || idx >= list2.length) return;
      queueRef.current = list2;
      idxRef.current = idx;
      const track = list2[idx];
      setCurrent(track);
      setCurId(track.id);
      updateSettings({ playStats: { ...settingsRef.current.playStats, [track.id]: Date.now() } });
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
    const activeList = useCallback2(() => {
      if (tab === "playlists" && selPl) {
        const p = playlists.find((p2) => p2.id === selPl);
        return p ? p.trackIds.map((id) => tracksById[id]).filter(Boolean) : [];
      }
      return tracks;
    }, [tab, selPl, playlists, tracks, tracksById]);
    const togglePlay = useCallback2(async () => {
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
    const computeNext = useCallback2(() => {
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
    const playNext = useCallback2(() => {
      const n = computeNext();
      if (n >= 0) playFrom(queueRef.current, n);
    }, [computeNext, playFrom]);
    const playPrev = useCallback2(() => {
      const a = audioRef.current;
      if (a.currentTime > 4) {
        a.currentTime = 0;
        return;
      }
      const l = queueRef.current;
      if (!l.length) return;
      playFrom(l, (idxRef.current - 1 + l.length) % l.length);
    }, [playFrom]);
    const onEnded = useCallback2(() => {
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
    useEffect2(() => {
      endedRef.current = onEnded;
    }, [onEnded]);
    useEffect2(() => {
      if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);
    const fracAt = (el, clientX) => {
      const r = el.getBoundingClientRect();
      return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    };
    const dragBar = (ref, apply) => (e) => {
      e.preventDefault();
      const el = ref.current;
      if (!el) return;
      apply(fracAt(el, e.clientX));
      const move = (ev) => apply(fracAt(el, ev.clientX));
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };
    const onSeekDown = dragBar(seekRef, (p) => {
      if (audioRef.current && duration) {
        audioRef.current.currentTime = p * duration;
        setProgress(p * duration);
      }
    });
    const onVolDown = dragBar(volRef, (p) => setVolume(p));
    const loadSuno = async () => {
      const v = (sunoRef.current && sunoRef.current.value || sunoInput || "").trim();
      if (!v) {
        flash("Paste a Suno song link or id first.", true);
        return;
      }
      setBusy(true);
      try {
        const r = await api2.loadSuno(v);
        await api2.importTrack(r);
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
    const togglePick = () => {
      const next = !picking;
      setPicking(next);
      const w = webviewRef.current;
      if (w && w.send) {
        try {
          w.send("kw-pick-mode", next);
        } catch {
        }
      }
      flash(next ? "Pick mode on \u2014 click any song in the page to add it \u{1F3AF}" : "Pick mode off");
    };
    useEffect2(() => {
      if (!embedded) return;
      const wv = webviewRef.current;
      if (!wv) return;
      const onReady = () => {
        try {
          api2.attachSuno(wv.getWebContentsId());
        } catch {
        }
      };
      const onMsg = (e) => {
        if (e.channel === "suno-ready") {
          flash("Connected to Suno \u{1F380}");
        } else if (e.channel === "suno-pick") {
          const t = e.args[0];
          if (t && t.id) {
            api2.importTrack(t);
            flash('Added "' + String(t.title || "song").slice(0, 28) + '" \u{1F49C}');
          }
        }
      };
      const onNav = () => {
        setPicking(false);
      };
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
    useEffect2(() => {
      const close = () => {
        setCtx(null);
        setPlMenuOpen(false);
      };
      addEventListener("click", close);
      return () => removeEventListener("click", close);
    }, []);
    const toggleSel = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : s.concat(id));
    const downloadSel = async () => {
      const r = await api2.downloadTracks(selected);
      if (r.canceled) return;
      flash(r.message || (r.ok ? "Downloaded " + r.count + " song" + (r.count > 1 ? "s" : "") + " \u{1F4BE}" : "Download failed."), !r.ok);
    };
    const removeSel = () => {
      selected.forEach((id) => api2.removeTrack(id));
      flash("Removed " + selected.length + " from library");
      setSelected([]);
    };
    const moveSel = (pid, name) => {
      selected.forEach((id) => api2.addToPlaylist(pid, id));
      flash("Moved " + selected.length + " to " + name + " \u{1F49C}");
      setSelected([]);
      setPlMenuOpen(false);
    };
    const newPlaylist = async () => {
      const p = await api2.createPlaylist("Playlist " + (playlists.length + 1));
      if (p) {
        setTab("playlists");
        setSelPl(p.id);
      }
    };
    const list = activeList();
    const pct = duration ? progress / duration * 100 : 0;
    const repeatOn = repeat !== "off";
    const curPl = playlists.find((p) => p.id === selPl);
    const selectable = tab === "library" || tab === "playlists" && curPl;
    const q = search.trim().toLowerCase();
    const libSorted = useMemo2(() => {
      if (tab !== "library") return list;
      const ps = settings.playStats || {}, s = settings.sort, a = list.slice();
      if (s === "title") a.sort((x, y) => (x.title || "").localeCompare(y.title || ""));
      else if (s === "played") a.sort((x, y) => (ps[y.id] || 0) - (ps[x.id] || 0));
      else if (s === "added-asc") a.sort((x, y) => (x.addedAt || 0) - (y.addedAt || 0));
      else a.sort((x, y) => (y.addedAt || 0) - (x.addedAt || 0));
      return a;
    }, [tab, list, settings.sort, settings.playStats]);
    const shownList = useMemo2(() => {
      let r = libSorted;
      if (tab === "library" && favOnly) r = r.filter((t) => favSet.has(t.id));
      if (tab === "library" && q) r = r.filter((t) => (t.title || "").toLowerCase().includes(q));
      return r;
    }, [libSorted, tab, favOnly, q, settings.favorites]);
    const listRows = useMemo2(() => shownList.map((t, i) => /* @__PURE__ */ React.createElement(
      TrackRow,
      {
        key: t.id,
        track: t,
        index: i,
        active: t.id === curId,
        playing,
        onPlay: () => playFrom(shownList, i),
        onMenu: openMenu(t),
        fav: favSet.has(t.id),
        onFav: () => toggleFav(t.id),
        selectable: true,
        checked: selected.includes(t.id),
        onToggle: () => toggleSel(t.id)
      }
    )), [shownList, curId, playing, selected, playFrom, settings.favorites]);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(TitleBar, { onSettings: () => setShowSettings(true) }), /* @__PURE__ */ React.createElement("button", { className: "collapse-handle" + (collapsed ? " collapsed" : ""), title: collapsed ? "Show list" : "Hide list", onClick: () => setCollapsed((c) => !c) }, collapsed ? "\u25B6" : "\u25C0"), /* @__PURE__ */ React.createElement("div", { className: "workspace" + (collapsed ? " collapsed" : "") + (playing ? " audio-live" : "") }, /* @__PURE__ */ React.createElement("aside", { className: "sidebar" }, /* @__PURE__ */ React.createElement("div", { className: "tabs" }, /* @__PURE__ */ React.createElement("div", { className: "tab" + (tab === "library" ? " active" : ""), onClick: () => setTab("library") }, "\u{1F3B5} Library"), /* @__PURE__ */ React.createElement("div", { className: "tab" + (tab === "playlists" ? " active" : ""), onClick: () => setTab("playlists") }, "\u{1F4C3} Playlists"), /* @__PURE__ */ React.createElement("div", { className: "tab" + (tab === "explore" ? " active" : ""), onClick: () => {
      setTab("explore");
      setEmbedded(true);
    } }, "\u{1F31F} Explore"), /* @__PURE__ */ React.createElement("div", { className: "tab" + (tab === "creation" ? " active" : ""), onClick: () => {
      setTab("creation");
      setCreationMounted(true);
    } }, "\u{1F3A8} Create")), tab === "library" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "search-box" }, /* @__PURE__ */ React.createElement("span", { className: "search-ic" }, "\u{1F50D}"), /* @__PURE__ */ React.createElement("input", { className: "search-input", value: search, placeholder: "Search your songs\u2026", onChange: (e) => setSearch(e.target.value) }), search && /* @__PURE__ */ React.createElement("button", { className: "search-clear", title: "Clear", onClick: () => setSearch("") }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "lib-controls" }, /* @__PURE__ */ React.createElement("button", { className: "fav-filter" + (favOnly ? " on" : ""), title: "Show favorites only", onClick: () => setFavOnly((v) => !v) }, favOnly ? "\u2764 favorites" : "\u2661 favorites"), /* @__PURE__ */ React.createElement("select", { className: "sort-select", title: "Sort", value: settings.sort, onChange: (e) => updateSettings({ sort: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "added-desc" }, "Newest first"), /* @__PURE__ */ React.createElement("option", { value: "added-asc" }, "Oldest first"), /* @__PURE__ */ React.createElement("option", { value: "title" }, "Title A\u2013Z"), /* @__PURE__ */ React.createElement("option", { value: "played" }, "Recently played"))), /* @__PURE__ */ React.createElement("div", { className: "side-head" }, /* @__PURE__ */ React.createElement("div", { className: "side-title" }, "Your songs ", /* @__PURE__ */ React.createElement("small", null, q ? shownList.length + " / " + tracks.length : tracks.length)))), tab === "playlists" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "side-head" }, /* @__PURE__ */ React.createElement("div", { className: "side-title" }, curPl ? curPl.name : "Playlists", " ", /* @__PURE__ */ React.createElement("small", null, curPl ? curPl.trackIds.length : playlists.length)), curPl ? /* @__PURE__ */ React.createElement("button", { className: "pill-btn", onClick: () => setSelPl(null) }, "\u2190 all") : /* @__PURE__ */ React.createElement("button", { className: "pill-btn", onClick: () => {
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
            const p = await api2.createPlaylist(nm);
            setCreating(false);
            setNewName("");
            if (p) setSelPl(p.id);
          }
          if (e.key === "Escape") setCreating(false);
        }
      }
    ), /* @__PURE__ */ React.createElement("button", { className: "pill-btn", onClick: async () => {
      const nm = newName.trim() || "Playlist " + (playlists.length + 1);
      const p = await api2.createPlaylist(nm);
      setCreating(false);
      setNewName("");
      if (p) setSelPl(p.id);
    } }, "Make")), !curPl && /* @__PURE__ */ React.createElement("div", { className: "pl-grid" }, playlists.length === 0 && !creating && /* @__PURE__ */ React.createElement("div", { className: "empty-note" }, "No playlists yet \u{1F338}", /* @__PURE__ */ React.createElement("br", null), "Make one, then right-click songs to add them."), playlists.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.id, className: "pl-card", onClick: () => setSelPl(p.id) }, /* @__PURE__ */ React.createElement("div", { className: "pl-emoji" }, GLYPHS[p.name.length % GLYPHS.length]), /* @__PURE__ */ React.createElement("div", { className: "pl-name" }, p.name), /* @__PURE__ */ React.createElement("div", { className: "pl-count" }, p.trackIds.length, " songs"), /* @__PURE__ */ React.createElement("button", { className: "pl-del", title: "Delete", onClick: (e) => {
      e.stopPropagation();
      api2.deletePlaylist(p.id);
    } }, "\u2715"))))), tab === "creation" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "side-head" }, /* @__PURE__ */ React.createElement("div", { className: "side-title" }, "Create")), /* @__PURE__ */ React.createElement("div", { className: "empty-note" }, "\u2728 ", /* @__PURE__ */ React.createElement("b", null, "Suno Lyric Forge"), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("br", null), "Describe a feeling and DeepSeek writes you a Suno-ready ", /* @__PURE__ */ React.createElement("b", null, "title"), ", ", /* @__PURE__ */ React.createElement("b", null, "style tags"), " and ", /* @__PURE__ */ React.createElement("b", null, "lyrics"), " \u2014 copy each into Suno.", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("br", null), "Set your DeepSeek key (\u{1F511}) at the top of the panel first.")), tab === "explore" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "side-head" }, /* @__PURE__ */ React.createElement("div", { className: "side-title" }, "Explore Suno")), /* @__PURE__ */ React.createElement("div", { className: "empty-note" }, "Browse Suno on the right \u{1F339}", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("br", null), "Log in once if asked \u2014 it's remembered.", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("br", null), "Hit ", /* @__PURE__ */ React.createElement("b", null, "\u{1F3AF} Pick songs"), " above the page, then click any song to add it to your library.")), selectable && selected.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "selbar" }, /* @__PURE__ */ React.createElement("span", { className: "selcount" }, selected.length, " selected"), /* @__PURE__ */ React.createElement("button", { className: "sel-act", title: "Select all / none", onClick: () => {
      const ids = list.map((t) => t.id);
      const allSel = ids.length && ids.every((id) => selected.includes(id));
      setSelected(allSel ? [] : ids);
    } }, list.length && list.every((t) => selected.includes(t.id)) ? "\u2713 none" : "\u2713 all"), /* @__PURE__ */ React.createElement("button", { className: "sel-act", onClick: downloadSel }, "\u2B07 Download"), /* @__PURE__ */ React.createElement("div", { className: "movewrap", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("button", { className: "sel-act", onClick: () => setPlMenuOpen((o) => !o) }, "\u{1F4C3} Move \u25BE"), plMenuOpen && /* @__PURE__ */ React.createElement("div", { className: "movemenu" }, playlists.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "ctx-empty" }, "No playlists"), playlists.map((p) => /* @__PURE__ */ React.createElement("button", { key: p.id, className: "ctx-item", onClick: () => moveSel(p.id, p.name) }, GLYPHS[p.name.length % GLYPHS.length], " ", p.name)), /* @__PURE__ */ React.createElement("button", { className: "ctx-item", onClick: async () => {
      const p = await api2.createPlaylist("Playlist " + (playlists.length + 1));
      if (p) moveSel(p.id, p.name);
    } }, "\uFF0B New playlist"))), /* @__PURE__ */ React.createElement("button", { className: "sel-act danger", onClick: removeSel }, "\u{1F5D1}"), /* @__PURE__ */ React.createElement("button", { className: "sel-act", onClick: () => setSelected([]) }, "\u2715")), (tab === "library" || tab === "playlists" && curPl) && /* @__PURE__ */ React.createElement("div", { className: "tracklist" }, shownList.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "empty-note" }, q ? /* @__PURE__ */ React.createElement(React.Fragment, null, "No songs match \u201C", search, "\u201D \u{1F50D}") : tab === "playlists" ? /* @__PURE__ */ React.createElement(React.Fragment, null, "Empty playlist \u{1F338}", /* @__PURE__ */ React.createElement("br", null), "Select songs in Library \u2192 Move here.") : /* @__PURE__ */ React.createElement(React.Fragment, null, "No songs yet \u{1F338}", /* @__PURE__ */ React.createElement("br", null), "Import from your Suno playlists or Explore.")), listRows)), /* @__PURE__ */ React.createElement("main", { className: "stage" }, /* @__PURE__ */ React.createElement("div", { className: "stage-inner" }, /* @__PURE__ */ React.createElement("div", { className: "now-view", style: { display: tab === "explore" || tab === "creation" ? "none" : "flex" } }, /* @__PURE__ */ React.createElement("button", { className: "viz-toggle" + (bigViz ? " on" : ""), title: bigViz ? "Show album art" : "Enlarge visualizer", onClick: () => setBigViz((v) => !v) }, bigViz ? "\u{1F5BC}" : "\u{1F4CA}"), /* @__PURE__ */ React.createElement("section", { className: "now" + (bigViz ? " big-viz" : "") }, /* @__PURE__ */ React.createElement("div", { className: "art-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "art-ring" + (playing ? " live" : "") }), /* @__PURE__ */ React.createElement("div", { className: "art" }, current && current.cover ? /* @__PURE__ */ React.createElement("img", { src: current.cover, alt: "" }) : /* @__PURE__ */ React.createElement("div", { className: "art-glyph" }, current ? "\u{1F3B5}" : "\u{1F3A7}"))), /* @__PURE__ */ React.createElement("div", { className: "now-meta" }, /* @__PURE__ */ React.createElement("div", { className: "now-kicker" }, playing ? "Now Playing" : current ? "Paused" : "Ready"), /* @__PURE__ */ React.createElement("div", { className: "now-title glow" }, current ? current.title : "Pick a song to begin"), /* @__PURE__ */ React.createElement("div", { className: "now-sub" }, current ? "Suno AI track" : "Your kawaii music corner \u{1F380}"), /* @__PURE__ */ React.createElement("div", { className: "viz", ref: vizRef }, Array.from({ length: bigViz ? 56 : 28 }).map((_, i) => /* @__PURE__ */ React.createElement("span", { key: i })))))), embedded && /* @__PURE__ */ React.createElement("div", { className: "suno-embed", style: { display: tab === "explore" ? "flex" : "none" } }, /* @__PURE__ */ React.createElement("div", { className: "embed-nav" }, /* @__PURE__ */ React.createElement("button", { className: "pill-btn", onClick: () => navSuno("https://suno.com/explore") }, "\u{1F31F} Explore"), /* @__PURE__ */ React.createElement("button", { className: "pill-btn", onClick: () => navSuno("https://suno.com/me") }, "\u{1F511} My songs"), /* @__PURE__ */ React.createElement("button", { className: "pill-btn", onClick: () => {
      const w = webviewRef.current;
      if (w && w.canGoBack && w.canGoBack()) w.goBack();
    } }, "\u2190"), /* @__PURE__ */ React.createElement("button", { className: "pill-btn", onClick: () => {
      const w = webviewRef.current;
      if (w && w.reload) w.reload();
    } }, "\u27F3"), /* @__PURE__ */ React.createElement("button", { className: "pill-btn" + (picking ? " hot" : ""), title: "Click songs in the page to add them", onClick: togglePick }, picking ? "\u{1F3AF} Click a song\u2026" : "\u{1F3AF} Pick songs"), /* @__PURE__ */ React.createElement("span", { className: "embed-hint" }, picking ? "click any song in the page to add it \u{1F3AF}" : "hit \u{1F3AF} Pick songs, then click songs to add them \u{1F49C}")), /* @__PURE__ */ React.createElement(
      "webview",
      {
        ref: webviewRef,
        className: "suno-webview",
        src: sunoStart,
        partition: "persist:suno",
        preload: api2.sunoPreloadPath,
        webpreferences: "contextIsolation=no,sandbox=no,nodeIntegration=no"
      }
    )), creationMounted && /* @__PURE__ */ React.createElement("div", { className: "creation-pane", style: { display: tab === "creation" ? "flex" : "none" } }, /* @__PURE__ */ React.createElement(CreationTab, null))), tab !== "explore" && tab !== "creation" && /* @__PURE__ */ React.createElement("div", { className: "transport" }, /* @__PURE__ */ React.createElement("div", { className: "seek" }, /* @__PURE__ */ React.createElement("div", { className: "time" }, fmt(progress)), /* @__PURE__ */ React.createElement("div", { className: "bar", ref: seekRef, onPointerDown: onSeekDown }, /* @__PURE__ */ React.createElement("div", { className: "fill", style: { width: pct + "%" } }), /* @__PURE__ */ React.createElement("div", { className: "knob", style: { left: pct + "%" } })), /* @__PURE__ */ React.createElement("div", { className: "time" }, fmt(duration))), /* @__PURE__ */ React.createElement("div", { className: "controls" }, /* @__PURE__ */ React.createElement("button", { className: "ctl" + (shuffle ? " on" : ""), title: "Shuffle: " + (shuffle ? "on" : "off"), onClick: () => setShuffle((s) => !s) }, "\u{1F500}"), /* @__PURE__ */ React.createElement("button", { className: "ctl", title: "Previous", onClick: playPrev }, "\u23EE"), /* @__PURE__ */ React.createElement("button", { className: "ctl play", title: "Play / Pause", onClick: togglePlay }, playing ? "\u275A\u275A" : "\u25BA"), /* @__PURE__ */ React.createElement("button", { className: "ctl", title: "Next", onClick: playNext }, "\u23ED"), /* @__PURE__ */ React.createElement("button", { className: "ctl" + (repeatOn ? " on" : ""), title: "Repeat: " + repeat, onClick: () => setRepeat((r) => REPEAT_MODES[(REPEAT_MODES.indexOf(r) + 1) % 3]) }, "\u{1F501}", repeat === "one" && /* @__PURE__ */ React.createElement("span", { className: "badge" }, "1")), /* @__PURE__ */ React.createElement("div", { className: "volwrap" }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15 } }, volume === 0 ? "\u{1F507}" : volume < 0.5 ? "\u{1F509}" : "\u{1F50A}"), /* @__PURE__ */ React.createElement("div", { className: "vol", ref: volRef, onPointerDown: onVolDown }, /* @__PURE__ */ React.createElement("div", { className: "vfill", style: { width: volume * 100 + "%" } }))))))), ctx && /* @__PURE__ */ React.createElement("div", { className: "ctx", style: { left: ctx.x, top: ctx.y }, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "ctx-head" }, "Add to playlist"), playlists.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "ctx-empty" }, "No playlists yet"), playlists.map((p) => /* @__PURE__ */ React.createElement("button", { key: p.id, className: "ctx-item", onClick: () => {
      api2.addToPlaylist(p.id, ctx.track.id);
      flash("Added to " + p.name + " \u{1F49C}");
      setCtx(null);
    } }, GLYPHS[p.name.length % GLYPHS.length], " ", p.name)), /* @__PURE__ */ React.createElement("button", { className: "ctx-item", onClick: async () => {
      const p = await api2.createPlaylist("Playlist " + (playlists.length + 1));
      if (p) {
        api2.addToPlaylist(p.id, ctx.track.id);
        flash("Added to new playlist \u{1F49C}");
      }
      setCtx(null);
    } }, "\uFF0B New playlist\u2026"), /* @__PURE__ */ React.createElement("div", { className: "ctx-sep" }), tab === "playlists" && curPl && /* @__PURE__ */ React.createElement("button", { className: "ctx-item", onClick: () => {
      api2.removeFromPlaylist(curPl.id, ctx.track.id);
      setCtx(null);
    } }, "\u2796 Remove from this list"), /* @__PURE__ */ React.createElement("button", { className: "ctx-item danger", onClick: () => {
      api2.removeTrack(ctx.track.id);
      setCtx(null);
    } }, "\u{1F5D1} Remove from library")), showSettings && /* @__PURE__ */ React.createElement("div", { className: "modal-bg", onClick: () => setShowSettings(false) }, /* @__PURE__ */ React.createElement("div", { className: "modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("span", null, "\u2699 Settings"), /* @__PURE__ */ React.createElement("button", { className: "modal-x", title: "Close", onClick: () => setShowSettings(false) }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "set-row" }, /* @__PURE__ */ React.createElement("div", { className: "set-label" }, /* @__PURE__ */ React.createElement("div", { className: "set-title" }, "Effects intensity"), /* @__PURE__ */ React.createElement("div", { className: "set-sub" }, "particles, trails & the audio pulse")), /* @__PURE__ */ React.createElement("input", { className: "set-range", type: "range", min: "0", max: "1", step: "0.05", value: settings.effects, onChange: (e) => updateSettings({ effects: parseFloat(e.target.value) }) }), /* @__PURE__ */ React.createElement("span", { className: "set-val" }, Math.round(settings.effects * 100), "%")), /* @__PURE__ */ React.createElement("div", { className: "set-row" }, /* @__PURE__ */ React.createElement("div", { className: "set-label" }, /* @__PURE__ */ React.createElement("div", { className: "set-title" }, "Remember settings"), /* @__PURE__ */ React.createElement("div", { className: "set-sub" }, "restore volume, shuffle, repeat & tab on launch")), /* @__PURE__ */ React.createElement("button", { className: "toggle" + (settings.remember ? " on" : ""), onClick: () => updateSettings({ remember: !settings.remember }) }, settings.remember ? "On" : "Off")), /* @__PURE__ */ React.createElement("div", { className: "set-row" }, /* @__PURE__ */ React.createElement("div", { className: "set-label" }, /* @__PURE__ */ React.createElement("div", { className: "set-title" }, "Offline cache"), /* @__PURE__ */ React.createElement("div", { className: "set-sub" }, "save songs to disk as you play them \u2014 ", offlineCount, " cached")), /* @__PURE__ */ React.createElement("button", { className: "toggle" + (settings.offline ? " on" : ""), onClick: () => updateSettings({ offline: !settings.offline }) }, settings.offline ? "On" : "Off")), /* @__PURE__ */ React.createElement("div", { className: "set-row" }, /* @__PURE__ */ React.createElement("div", { className: "set-label" }, /* @__PURE__ */ React.createElement("div", { className: "set-title" }, "Offline library"), /* @__PURE__ */ React.createElement("div", { className: "set-sub" }, "download every song so it plays with no internet")), /* @__PURE__ */ React.createElement("button", { className: "set-btn", disabled: caching || !tracks.length, onClick: cacheAll }, caching ? "Caching\u2026" : "Cache all"), /* @__PURE__ */ React.createElement("button", { className: "set-btn danger", disabled: caching || !offlineCount, onClick: clearCache }, "Clear")), /* @__PURE__ */ React.createElement("div", { className: "set-row" }, /* @__PURE__ */ React.createElement("div", { className: "set-label" }, /* @__PURE__ */ React.createElement("div", { className: "set-title" }, "Backup & restore"), /* @__PURE__ */ React.createElement("div", { className: "set-sub" }, "save your songs + playlists to a .json, or merge one back")), /* @__PURE__ */ React.createElement("button", { className: "set-btn", title: "Save all your songs + playlists to a .json file you pick", onClick: async () => {
      const ok = await api2.exportLibrary();
      if (ok) flash("Library backed up \u{1F4BE}");
    } }, "\u{1F4BE} Backup"), /* @__PURE__ */ React.createElement("button", { className: "set-btn", title: "Load songs + playlists from a backup .json (merges \u2014 no duplicates)", onClick: async () => {
      const ok = await api2.importLibrary();
      flash(ok ? "Library restored \u{1F49C}" : "Nothing restored.", !ok);
    } }, "\u{1F4C2} Restore")), /* @__PURE__ */ React.createElement("div", { className: "set-eq" }, /* @__PURE__ */ React.createElement("div", { className: "set-label" }, /* @__PURE__ */ React.createElement("div", { className: "set-title" }, "Equalizer"), /* @__PURE__ */ React.createElement("div", { className: "set-sub" }, "shapes the sound (and the visualizer follows it)")), /* @__PURE__ */ React.createElement("div", { className: "eq-presets" }, Object.keys(EQ_PRESETS).map((name) => /* @__PURE__ */ React.createElement("button", { key: name, className: "eq-preset", onClick: () => updateSettings({ eq: EQ_PRESETS[name] }) }, name))), /* @__PURE__ */ React.createElement("div", { className: "eq-bands" }, EQ_BANDS.map(([k, label]) => {
      const val = (settings.eq || {})[k] || 0;
      return /* @__PURE__ */ React.createElement("div", { key: k, className: "eq-band" }, /* @__PURE__ */ React.createElement("span", { className: "eq-band-label" }, label), /* @__PURE__ */ React.createElement(
        "input",
        {
          className: "set-range",
          type: "range",
          min: "-12",
          max: "12",
          step: "1",
          value: val,
          onChange: (e) => updateSettings({ eq: { ...settingsRef.current.eq || { low: 0, mid: 0, high: 0 }, [k]: parseInt(e.target.value, 10) } })
        }
      ), /* @__PURE__ */ React.createElement("span", { className: "eq-band-val" }, val > 0 ? "+" : "", val, " dB"));
    }))))), updateInfo && /* @__PURE__ */ React.createElement("div", { className: "update-banner" }, /* @__PURE__ */ React.createElement("span", { className: "upd-spark" }, "\u2728"), /* @__PURE__ */ React.createElement("span", { className: "upd-msg" }, "Update available \u2014 ", /* @__PURE__ */ React.createElement("b", null, "v", updateInfo.latest), " ", /* @__PURE__ */ React.createElement("small", null, "(you have v", updateInfo.current, ")")), /* @__PURE__ */ React.createElement("button", { className: "upd-btn", onClick: () => api2.openExternal(updateInfo.url) }, "View"), /* @__PURE__ */ React.createElement("button", { className: "upd-btn ghost", onClick: dismissUpdate }, "Dismiss")), toast && /* @__PURE__ */ React.createElement("div", { className: "toast" + (toast.err ? " err" : "") }, busy && /* @__PURE__ */ React.createElement("div", { className: "spinner" }), /* @__PURE__ */ React.createElement("span", null, toast.msg)));
  }
  function buildIdMap(tracks) {
    const map = {};
    for (const t of tracks) map[t.id] = t;
    return map;
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));
})();
