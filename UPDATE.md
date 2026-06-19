# Update Log — Suno Kawaii Player

Newest first, grouped by day. Short notes only.

## 2026-06-19 — v1.3.12
- Fixed: **the ⚙ settings gear is clickable now** — it sat in the titlebar's
  drag region, so the OS swallowed the clicks. Moved into the no-drag button group.
- Fixed: **sort by Newest / Oldest / Recently played works.** Songs imported
  before "date added" was tracked had no timestamp, so date sorts had nothing to
  order by; they're now backfilled (keeping their order) on launch.
- Changed: **removed the "Import from my Suno songs" tools dropdown** from the
  sidebar (adding songs lives in Explore → 🎯 Pick songs) and **moved Backup /
  Restore into Settings**.

## 2026-06-19 — v1.3.11
- Added: **in-app update check** — on launch the app reads the latest version from
  UPDATE.md in the repo and, if it's newer than the running build, shows an
  "Update available — View / Dismiss" banner. Dismiss is remembered per version.

## 2026-06-19 — v1.3.10
- Added: **Offline cache** (Settings) — toggle to save songs to disk as you play
  them, plus "Cache all" to download your whole library for offline play, and
  Clear. Plays from disk when cached.
- Fixed: the **Download button now reports why it failed** instead of a silent
  "Download failed" (usually: log into Suno via Explore so private songs can be
  fetched).

## 2026-06-19 — v1.3.9
- Added: **3-band Equalizer + presets** in Settings (Bass/Mid/Treble, -12..+12 dB;
  Flat, Bass boost, Vocal, Treble, Warm, Lo-fi). The visualizer reflects it since
  the analyser sits after the EQ in the audio graph.

## 2026-06-19 — v1.3.8
- Fixed: the **seek bar and volume now support click *and* drag** (drag-to-scrub),
  not just click.
- Added: a **⚙ Settings panel** (gear in the titlebar) with **Effects intensity**
  (scales particles, trails & the audio pulse — down to off for low-end PCs) and
  **Remember settings** (restores volume / shuffle / repeat / tab on launch).
- Added: **Sort the library** — Newest / Oldest / Title A–Z / Recently played.
- Added: **Favorites ❤️** — heart any song; filter the library to favorites only.
- (Coming next: EQ, full offline library + download fix, Discord presence, an
  in-app "update available" check.)
- Added: a **tiny search box above "Your songs"** that filters the library in
  realtime as you type (count shows matches / total; ✕ clears).
- Added: **"🔗 feris socials"** next to the app name in the titlebar → opens
  mez.ink/ferisooo in your browser.
- Added: **buttons pulse with the music** — while a song plays, the controls,
  tabs and sidebar buttons brighten/darken in time with the beat (driven by the
  visualizer's audio level). Steady when nothing's playing.
- Fixed: **visualizer now uses all its bars.** It mapped frequency bins 1:1, so the
  low end hogged the left bars and the right ones stayed flat. Now the analyser has
  more resolution and bars are spread across the spectrum on a log scale (peak per
  band, with a gentle lift on the highs), so every bar reacts to the music.
- Removed the **lyrics panel** under the player to free up vertical space (and its
  dead code/styles). The now-playing area + visualizer get the room.
- Added: a **📊 toggle on the Now Playing view that hides the album art and
  enlarges the visualizer** (taller bars, more of them, full width). Tap 🖼 to
  bring the art back.
- Perf: **big song lists (400+) scroll smoothly now.** Off-screen rows skip
  layout/paint (`content-visibility`), the list is memoized so it doesn't
  re-render on every playback tick, and the per-row entrance animation (which
  re-fired while scrolling) is gone.
- Library: **Import / Backup / Restore tucked behind a one-click "▾ tools"
  dropdown**, so the song list gets the space.
- Moved the **show/hide-list toggle off the top-left corner** to a floating handle
  on the left edge (vertically centered), next to the panel it collapses.
- Perf: targeted optimizations for a steady 60fps —
  - visualizer only animates **while a song plays** (it used to loop forever);
  - particle + cursor-trail canvases are **capped to 60fps**, **pause when the
    window is hidden**, scale the particle count to the screen, and stop drawing
    the trail once the mouse rests;
  - lighter **backdrop blur** on panels/titlebar/cards, and the animated
    background + glow orbs are promoted to their own GPU layer so big blurs are
    rasterized once instead of every frame;
  - fewer Create-tab sparkles.
- Fixed: **tab labels getting cut off** — with four tabs they now wrap to a tidy
  2×2 grid so each has room (no clipping on the active tab).
- Removed: **setup.zip** from the repo. Its features are already ported into the
  Create tab, and the zip contained a hardcoded DeepSeek API key — **rotate that
  key**, it's still recoverable from git history.
- Added .gitignore rules so personal audio in `music/`, `config.json`, and any
  `setup.zip` can't be committed by accident. (No imported music was ever tracked.)
- Added: **🎨 Create tab — "Suno Lyric Forge"** (ported from setup.zip). Describe a
  feeling and DeepSeek writes a Suno-ready **title + style tags + lyrics**: mood
  idea bank, "enhance", language, style/lyric tag chips (click to pick · right-click
  to pin/exclude), "suggest from mood", history, and copy buttons. The DeepSeek call
  is **proxied through the main process** (no CORS) and the **API key is entered
  in-app** (🔑 field) and saved locally — nothing hardcoded. Themed to the app's
  black / gold / rose palette; player bar hides on this tab like Explore.
- Removed: **auto song detection** in Explore (the "To import" list) and the
  **all / played** filter. Adding songs is now just **🎯 Pick songs** — click the
  ones you want. (Also stripped the page-scraping/network hooks from the embed.)
- Removed: **🔑 Connect Suno** button in Library (logging in already lives in the
  Explore pane) and the **🌐 Use Chrome login** feature entirely (Chrome's
  app-bound encryption made it a dead end; dropped the sql.js dependency too).
- Fixed: **select / select-all moved into the selection bar** and only shows once
  at least one song is picked (next to Download / Move / Trash / ✕).
- Changed: **bigger song rows** in the sidebar, and **the playing song is now
  clearly highlighted** (rose glow, bright title, glowing accent bar).
- Backup / Restore: added hover tooltips — **Backup** saves your songs + playlists
  to a `.json` you choose; **Restore** loads them back (merges, no duplicates).
- Fixed: **select / select-all now shows the checkmark** (the checkbox was wired to
  the wrong prop, so it never lit up).
- Fixed: **visualizer no longer dances when nothing's playing** — it rests flat and
  only reacts to actual audio; also made it much bigger.
- Changed: **Chrome login** scanned *every* Chrome profile and gave an accurate
  reason when it couldn't import — before the feature was removed later in the day.
- Removed: **"Find all my songs"** (the auto-scroll scan) — it was buggy. Use
  **🎯 Pick songs** instead.
- Theme: retuned to **black · gold · rose-pink** — darker near-black panels,
  rose/gold particles, trails, ripples and background, stronger glowing titles.
- Added: **🎯 Pick songs** in the Explore bar — toggle it on, then click any song
  in the Suno page to add exactly that one (highlights on hover, flashes when added,
  click no longer navigates). Off by itself on reload.
- Fixed: **playlist / library songs weren't detected** — those rows aren't `/song/`
  links, so the scraper now also reads the id from **cover thumbnails** and
  **data-clip attributes** and pulls the title from the row; avatars are skipped.
  Songs whose name couldn't be read no longer collapse into one "Suno song" entry.
- Changed: **the player bar hides while you're in Explore** so the embedded Suno
  page fills the stage (comes back on Library/Playlists; playback keeps going).
- Fixed: **import list refreshes when you move between pages inside Suno**, and
  **played-detection** counts a song when you click its card. The Suno pane opens to
  your library ("My songs") instead of Discover.
- Fixed: **songs not showing in the import list** — scrapes straight from the Suno
  page's DOM on top of the network hooks; shows all songs by default. Added a
  "Connected to Suno 🎀" ping.
- Fixed: **renderer crash (NOTREACHED) + gray Suno pane** when playing — removed the
  DevTools debugger and replaced it with an in-page script that hooks the page's own
  network calls. The Suno pane auto-reloads if it ever crashes.

## 2026-06-18 — v1.2.1
- Fixed: **HTTP 403 when playing/downloading Suno songs** — the CDN was rejecting
  the request. Now sends a `Referer`/`Origin`, retries without the auth header, and
  falls back to the plain public CDN url. Clearer message if it still can't fetch.
- Added: **multi-select in Library** — checkbox on each song + "✓ all", with an
  action bar to **Download** (mp3s to a folder you pick), **Move to a playlist**, or
  remove.
- Added: **played detection** — the import list could show **only songs you actually
  played** in the Suno pane; unplayed songs showed a pink dot.
- Changed: **import list hides songs already in your Library** and collapses
  duplicate versions of the same title. Removed the **"Paste a Suno link"** box.
- Fixed: **importing from the Suno pane** — Suno hijacks right-click, so import
  became **visible ＋ buttons** in the Explore sidebar (plus "＋ All").
- Changed: **"Lists" tab renamed to "Playlists"**, and you can **name a playlist**
  when you create it.
- Added: **Backup / Restore** buttons — save your library + playlists to a file and
  load it back, so an update can't lose them.
- Note: imported songs are saved to your Windows profile (`%APPDATA%`), not the app
  folder — so replacing the app folder keeps your songs.

## Earlier releases (pre-dated log)

**v1.1.0**
- Added: **Playlists** tab — make your own lists, right-click songs to add/remove.
- Added: **import is opt-in** — right-click a song in the Suno pane to import it, or
  "⬇ Import all here" for the whole page.
- Added: **Live lyrics** panel (auto-scrolls with the song).
- Added: **Collapse arrow** to hide the sidebar so the player fills the screen.
- Added: **Use Chrome login** (experimental) — tries to import suno.com cookies.
- Changed: **+Folder removed**, replaced with **Import from my Suno playlists**.
- Changed: **album art no longer spins** — gentle float + glowing ring instead.
- Changed: **more glow & motion** everywhere.
- Persisted: imported songs + playlists now survive restarts.

**v1.0.x**
- Embedded Suno browser inside the player (no popup windows).
- Silenced harmless WebRTC/STUN console errors.
- Brighter shuffle/repeat buttons; repeat is 3-way (off / all / one, with a "1" badge).
- Suno paste-link hardened (browser User-Agent, og:audio scraping, better errors).
- Self-healing launcher fixed (generates a .ps1 instead of inline PowerShell).

**v1.0.0**
- First build: kawaii player, frameless window, particles, cursor trail, ripples,
  local + paste-a-Suno-link playback, self-healing start.bat, packaging scripts.
