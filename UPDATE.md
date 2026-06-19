# Update Log — Suno Kawaii Player

Newest first. Short notes only.

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
