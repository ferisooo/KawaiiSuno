# 🎀 Suno Kawaii Player

A cute black / pink / yellow **desktop music player built just for [Suno AI](https://suno.com) songs.**
Browse Suno, pick the songs you love, and they drop straight into your own offline-capable
library — wrapped in a soft, animated, kawaii interface.

> Windows desktop app · runs entirely on your own PC · open source.
> **The app has no account of its own and never sends anything to the developer.**
> *(In the Explore tab you sign into **your own** Suno account — that part is strictly between you and Suno, exactly like using suno.com in a browser.)*

---

## ✨ Features — the "okay, I need this" list

- **🌹 Built-in Suno browser ("Explore").** Suno opens *inside* the app. Log in once and it's
  remembered. Hit **🎯 Pick songs**, then click any song right in the page to add it to your library.
  No copy-pasting, no scraping — you pick exactly what you want. *(You log in with **your own**
  Suno account, and the session is remembered — just like signing into suno.com normally.)*
- **🎧 A real music player.** Play / pause, next / prev, **shuffle**, **repeat (all / one)**,
  draggable seek + volume, and a glowing **audio-reactive visualizer** that dances to the music.
- **🎚️ 3-band Equalizer** with presets (Bass boost, Vocal, Treble, Warm, Lo-fi…). The visualizer
  follows your EQ.
- **❤️ Playlists, favorites, realtime search & sorting.** Organize a big library fast.
- **📥 Download songs to disk** as `.mp3`, or flip on **Offline cache / "Cache all"** so your whole
  library plays with **no internet at all**.
- **✨ AI songwriting helper ("Create" tab — Suno Lyric Forge).** Describe a mood and get a
  Suno-ready **title**, **style tags**, and **lyrics** to paste into Suno. *(Optional — uses your own
  DeepSeek API key, only if you choose to use this tab.)*
- **🟩 OBS stream overlay.** A built-in green-screen "Now Playing" overlay for streamers — add it as a
  Browser source in OBS, chroma-key the green, and your current song shows on stream automatically.
- **💾 Backup & restore** your whole library + playlists to a single `.json` file.
- **⬆️ One-click in-place updates.** The app can update itself over HTTPS and restart — no reinstalling.
- **🌸 Just lovely to use.** Floating particles, a sparkly cursor trail, click ripples, and a custom
  kawaii theme throughout.

---

## 💡 How it's different from other music apps

| | Suno Kawaii Player | Typical player / Suno's website |
|---|---|---|
| **Made for Suno** | Purpose-built for Suno AI tracks | General-purpose, or web-only |
| **Picking songs** | Visual click-to-add from Suno *inside the app* | Manual links / downloads |
| **Offline** | Cache your whole library, play with zero internet | Usually needs to be online |
| **Songwriting** | Built-in AI lyric / style / title generator | Not included |
| **Streamers** | OBS now-playing overlay out of the box | Not included |
| **Your data** | Stored only on your PC; the app has no account & no telemetry; open source | Often cloud / account-based |
| **Respectful** | No background scraping — you manually pick songs | — |

It's basically a **cozy personal Suno jukebox** that also helps you *make* songs and *stream* them —
all in one little window, with nothing phoning home.

---

## 🚀 Setup — for someone who has never touched code

You do **not** need to know any programming. On **Windows**, two steps:

### 1. Install Node.js (one time)
- Go to **https://nodejs.org** and click the big green **LTS** button to download.
- Run the installer and click **Next → Next → Finish** (the defaults are fine).

### 2. Get the app and run it
- On this project's GitHub page, click the green **`< > Code`** button → **Download ZIP**.
- **Unzip** it anywhere (e.g. your Desktop). *(Right-click the ZIP → "Extract All".)*
- Open the unzipped folder and **double-click `start.bat`**.

That's it. The first run downloads what it needs (this needs internet and takes a minute), then the
player opens. **After that, just double-click `start.bat` whenever you want to listen.** 🎶

> **Mac / Linux?** Open a terminal in the folder and run `npm install` once, then `npm start`.
>
> **Want a proper installer instead?** Double-click **`build-exe.bat`** to build a standard Windows
> `.exe` installer into the `dist\` folder.

---

## 🛡️ "Is this a virus?" — read these files and judge for yourself

Totally fair question for any app you download. This project is **plain, readable source code with no
obfuscation, no minified mystery blobs (React is the only vendored library), and zero runtime
dependencies** (see `package.json`). If you're cautious, here's exactly what to inspect — these are
the *only* files that can touch your computer or the network:

- **`main.js`** — the heart of the app. **Everything** it can do to your PC lives here: what files it
  reads/writes (only in the app's own data folder), and every network request it makes. Start here.
- **`preload.js`** — the *single* bridge between the interface and your system. It's a short list of
  exactly which actions the UI is allowed to ask for — nothing else is exposed.
- **`renderer/suno-preload.js`** — the tiny script that runs inside the embedded Suno page. Its only
  job is the "Pick" click handler; it does no scraping and no network hooks (read the comment at the top).
- **`index.html`** — contains the **Content-Security-Policy**, i.e. the strict list of what the app is
  even allowed to load.
- **`start.bat`** / **`build-exe.bat`** — the launcher/build scripts; read them to see they just
  install dependencies and start the app.
- **`package.json`** — the dependency list (only `electron` + `esbuild`, both well-known dev tools).

**Where it connects (and nowhere else):**
- `suno.com` / `cdn*.suno.ai` — to load Suno and fetch the songs you pick.
- `raw.githubusercontent.com` / `api.github.com` — only to check for and download app updates.
- `api.deepseek.com` — **only** if you open the "Create" tab and add your own key.
- Google Fonts — for the cute fonts (with system-font fallback, so it works offline too).

There's **no analytics, no telemetry, and no app account** — the developer receives nothing. Your
Suno login stays inside the app's own session and is never sent anywhere except Suno itself. (See the
project's security history for the hardening that enforces this.) Prefer to verify before trusting?
Read `main.js` top to bottom — it's commented throughout.

See **[`PRIVACY.md`](PRIVACY.md)** for the full privacy policy and **[`TERMS.md`](TERMS.md)** for the
terms of use.

---

## 💜 Credits

- **Idea, concept & design — [Feris](https://mez.ink/ferisooo)** ([@ferisooo](https://github.com/ferisooo)).
  The whole vision of a kawaii, Suno-first desktop player is Feris's.
- **Engineering & code — built with [Claude](https://claude.ai) (Anthropic).** The implementation,
  features, and security hardening were written collaboratively with Claude.

If you enjoy it, say hi to Feris: **https://mez.ink/ferisooo** 🌸

---

## 📄 License, Terms & Privacy

Released under the **MIT License** — see [`LICENSE`](LICENSE).

**Forks & modified versions are welcome and explicitly allowed** — you may freely fork, change, and
redistribute this app, **as long as you keep the MIT license notice and credit the original idea &
design to Feris ([@ferisooo](https://github.com/ferisooo)) and the engineering work to Claude
(Anthropic)** in your project's README / About / credits. See [`TERMS.md`](TERMS.md) for details.

- 📃 **Terms of use:** [`TERMS.md`](TERMS.md)
- 🔒 **Privacy policy:** [`PRIVACY.md`](PRIVACY.md)

> Not affiliated with, sponsored by, or endorsed by Suno, Anthropic, DeepSeek, Google, GitHub, or OBS.
> "Suno" and all other names/logos belong to their respective owners. This is an independent, fan-made
> player for songs you have the right to access. **Use it in accordance with Suno's Terms of Service.**
</content>
