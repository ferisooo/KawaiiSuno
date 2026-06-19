# Update Log — Suno Kawaii Player

Newest first. Short notes only.

## v1.3.2 — 2026-06-19
- Perf: targeted optimizations for a steady 60fps.
  - Visualizer now only animates **while a song plays** (it used to run a loop
    forever, writing to 28 bars every frame even when idle).
  - Particle + cursor-trail canvases are **capped to 60fps** (was uncapped, so it
    over-rendered on 120/144Hz screens), **pause when the window is hidden**, scale
    the particle count to the screen, and the trail stops drawing once the mouse
    rests instead of redrawing faded dots forever.
  - Lighter **backdrop blur** on the panels/titlebar and the Create-tab cards, and
    the animated background + glow orbs are promoted to their own GPU layer so the
    heavy blur is rasterized once instead of every frame.
  - Fewer Create-tab sparkles.

## v1.3.1 — 2026-06-19
- Fixed: **tab labels getting cut off** — with four tabs they now wrap to a tidy
  2×2 grid so each has room (no clipping on the active tab).
- Removed: **setup.zip** from the repo. Its features are already ported into the
  Create tab, and the zip contained a hardcoded DeepSeek API key — **rotate that
  key**, it's still recoverable from git history.
- Added .gitignore rules so personal audio in `music/`, `config.json`, and any
  `setup.zip` can't be committed by accident. (No imported music was ever tracked.)

## v1.3.0 — 2026-06-19
- Added: **🎨 Create tab — "Suno Lyric Forge"** (ported from setup.zip). Describe a
  feeling and DeepSeek writes a Suno-ready **title + style tags + lyrics**: mood
  idea bank, "enhance", language, style/lyric tag chips (click to pick · right-click
  to pin/exclude), "suggest from mood", history, and copy buttons.
- The DeepSeek call is **proxied through the main process** (no CORS), and the
  **API key is entered in-app** (🔑 field at the top of the tab) and saved locally
  in config — nothing hardcoded or committed. (The key shipped inside setup.zip is
  public; rotate it.)
- Re-themed the Forge to KawaiiSuno's black / gold / rose palette and made it fill
  the Create tab (player bar hides there, like Explore).

## v1.2.9 — 2026-06-19
- Removed: **auto song detection** in Explore (the "To import" list) and the
  **all / played** filter. Adding songs is now just **🎯 Pick songs** — click the
  ones you want. (Also stripped the page-scraping/network hooks from the embed.)
- Removed: **🔑 Connect Suno** button in Library (logging in already lives in the
  Explore pane) and the **🌐 Use Chrome login** feature entirely (Chrome's
  app-bound encryption made it a dead end; dropped the sql.js dependency too).
- Fixed: **lyrics now auto-scroll** with the song — the panel needed
  `position: relative` so each line's position is measured correctly.
- Fixed: **select / select-all moved into the selection bar** and only shows once
  at least one song is picked (next to Download / Move / Trash / ✕). Tick a song's
  box to start a selection.
- Changed: **bigger song rows** in the sidebar (larger covers, titles, art).
- Changed: **the playing song is now clearly highlighted** in the list (rose glow,
  bright title, glowing accent bar).
- Backup / Restore: added hover tooltips explaining them — **Backup** saves your
  songs + playlists to a `.json` file you choose; **Restore** loads them back from
  one (merges, no duplicates).

## v1.2.8 — 2026-06-19
- Fixed: **select / select-all now shows the checkmark** (the row's checkbox was
  wired to the wrong prop, so it never lit up or highlighted the row).
- Fixed: **visualizer no longer dances when nothing's playing** — it rests flat
  and only reacts to actual audio.
- Changed: **visualizer is much bigger** (tall bars with a gold/rose glow).
- Changed: **Chrome login** now scans *every* Chrome profile (not just Default /
  Profile 1) and gives an accurate reason when it can't import — "close Chrome and
  retry", "app-bound encryption", or "not signed in" — instead of always claiming
  you're not logged in.
- Removed: **"Find all my songs"** (the auto-scroll scan) — it was buggy. Use
  **🎯 Pick songs** to click the ones you want; the list still fills as you browse.
- Theme: retuned to **black · gold · rose-pink** — darker near-black panels,
  rose/gold particles, trails, ripples and background, and stronger glowing
  titles, kicker, brand and lyrics.

## v1.2.7 — 2026-06-19
- Added: **🎯 Pick songs** in the Explore bar — a manual alternative to
  auto-detection. Toggle it on, then click any song right in the Suno page to add
  exactly that one (the row highlights pink on hover, flashes green when added,
  and the click no longer navigates/plays). Toggle off to browse normally. Turns
  off by itself when the page reloads.

## v1.2.6 — 2026-06-19
- Fixed: **playlist / library songs weren't detected** — those rows aren't
  `/song/` links (the title navigates via JS), so anchor-only scraping missed
  them and only the playing song slipped through. Now the scraper also reads the
  song id from **cover thumbnails** (their URL embeds the id) and **data-clip
  attributes**, and pulls each title from its row. Avatars/profile pics are
  skipped so they don't show up as phantom songs.
- Fixed: songs whose name couldn't be read no longer collapse into a single
  "Suno song" entry in the import list — placeholders are kept distinct.

## v1.2.5 — 2026-06-19
- Changed: **the player bar now hides while you're in Explore**, so the embedded
  Suno page fills the whole stage and is much bigger to browse. It comes back the
  moment you switch to Library/Playlists (playback keeps going in the background).
- Added: **"🔎 Find all my songs"** in Explore. Suno's lists are virtualized — only
  the rows on screen exist in the page — so the old scrape only caught the first
  screenful. This auto-scrolls your whole library so every song loads and gets
  harvested (titles/covers/lyrics from the page's own feed calls). It also runs
  automatically when you land on your "My songs" page.

## v1.2.4 — 2026-06-19
- Fixed: **import list now refreshes when you move between pages inside Suno**
  (Explore ↔ Library). Detects Suno's in-app route changes and resets + rescans.
- Fixed: **played-detection** — Suno streams audio as a blob (no id), so now a song
  counts as "played" when you click its card in the pane.
- Changed: the Suno pane now **opens to your library** ("My songs") instead of Discover.

## v1.2.3 — 2026-06-19
- Fixed: **songs not showing in the import list**. Now scrapes songs straight from
  the Suno page's DOM (reliable for their Next.js app), on top of the network hooks.
- Changed: the import filter now **shows all songs by default** (the "▶ played"
  toggle hid everything before). Toggle it on to narrow to ones you've played.
- Added: a "Connected to Suno 🎀" ping so you know the page bridge is working.

## v1.2.2 — 2026-06-19
- Fixed: **renderer crash (NOTREACHED) + gray Suno pane** when playing. Removed the
  DevTools debugger that read the Suno page (a known `<webview>` crash source) and
  replaced it with an in-page script (`renderer/suno-preload.js`) that hooks the
  page's own network calls — same song harvesting + played-detection, no crash.
- Added: the Suno pane now auto-reloads itself if it ever crashes.

## v1.2.1 — 2026-06-18
- Fixed: **HTTP 403 when playing/downloading Suno songs** — the CDN was rejecting
  the request. Now sends a `Referer`/`Origin`, retries without the auth header, and
  falls back to the plain public CDN url. Clearer message if it still can't fetch.

## v1.2.0 — 2026-06-18
- Added: **multi-select in Library** — checkbox on each song + "✓ all", with an
  action bar to **Download** (saves the mp3s to a folder you pick) or **Move to a
  playlist**, or remove.
- Added: **played detection** — the import list can show **only songs you actually
  played** in the Suno pane (toggle "▶ played"). Unplayed songs show a pink dot.
- Changed: **import list hides songs already in your Library** and collapses
  duplicate versions of the same title, so it stays clean.
- Removed: the **"Paste a Suno link"** box (account import covers it).
- Note: the pink dots that floated over the Suno pane were just decorative
  particles — the dot is now a real "not played yet" marker in the import list.

## v1.1.1 — 2026-06-18
- Fixed: **Importing from the Suno pane** — Suno hijacks right-click with its own
  menu, so import is now **visible buttons**: each song on the page shows in the
  Explore sidebar with a ＋, plus "＋ All". (In-app library right-click still works
  for adding to playlists.)
- Changed: **"Lists" tab renamed to "Playlists"**, and you can now **name a playlist**
  when you create it (typed in-app, no more auto-numbered names).
- Added: **Backup / Restore** buttons — save your library + playlists to a file and
  load it back, so an update can never lose them.
- Note: imported songs are saved to your Windows profile (`%APPDATA%`), not the app
  folder — so from v1.1 on, replacing the app folder keeps your songs. (Older builds
  didn't save at all, which is why earlier imports vanished.)

## v1.1.0
- Added: **Playlists** tab — make your own lists, right-click songs to add/remove.
- Added: **Import is now opt-in** — right-click a song in the Suno pane to import it,
  or "⬇ Import all here" for the whole page. No more auto-grabbing everything.
- Added: **Live lyrics** panel (for Suno tracks that carry lyrics), auto-scrolls
  with the song and glows the current line.
- Added: **Collapse arrow** (◀/▶ in the title bar) hides the sidebar so the player
  fills the screen.
- Added: **Use Chrome login** (experimental) — tries to import your suno.com cookies
  from Chrome so you skip typing. Falls back to manual login if Chrome locks them.
- Changed: **+Folder removed**, replaced with **Import from my Suno playlists**.
- Changed: **Album art no longer spins** — gentle float + glowing ring instead.
- Changed: **More glow & motion** — glowing title, shimmering active tab, pulsing
  ring, brighter everything.
- Persisted: imported songs + playlists now survive restarts.

## v1.0.x
- Embedded Suno browser inside the player (no popup windows).
- Silenced harmless WebRTC/STUN console errors.
- Brighter shuffle/repeat buttons; repeat is 3-way (off / all / one, with a "1" badge).
- Suno paste-link hardened (browser User-Agent, og:audio scraping, better errors).
- Self-healing launcher fixed (generates a .ps1 instead of inline PowerShell).

## v1.0.0
- First build: kawaii player, frameless window, particles, cursor trail, ripples,
  local + paste-a-Suno-link playback, self-healing start.bat, packaging scripts.
