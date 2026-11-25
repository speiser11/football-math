# Football Math — handoff & working notes

A kids' football game where every play is a math problem. Built for Scott's 1st grader (great at + and −, ahead on ×, starting ÷), shared with a few friends. Live at **https://speiser11.github.io/football-math/** (GitHub Pages, deploys from `main`, root folder).

Read this first, then the file in `js/` for whatever you're changing (map in §2). Keep this file updated when anything below changes.

---

## 1. How it's built

- **Static site, no build step.** `index.html` is a ~30-line shell: it loads `css/style.css` and ten plain scripts from `js/` **in order** (`teams → core → audio → math → players → field → screens → game → coach → main`). They are classic scripts, not ES modules: they share globals, and a file may only *run* code at load time that uses things from files above it (calling later files from inside functions is fine). Every `<link>`/`<script>` has the same `?v=` number — **bump it on all of them when releasing** so phones don't mix cached old and new files. `snd/` holds recorded audio clips. `archive/` holds parked features that are **not loaded** by the page (currently player cards + locker room; see the header of `archive/player-cards.js` for how to restore). `manifest.json` + `icon-*.png` make "Add to Home Screen" work.
- **No backend, no accounts, no analytics.** Everything lives in `localStorage` under key `footballMath1`: device settings at the top level, and one entry per kid in `saved.players` (see `js/core.js` for the shape). Progress survives a wipe only through the **backup code** (§3). Keep it this way unless Scott decides otherwise — kids under 13 play this (COPPA).
- **Rendering:** the field is a `<canvas>` drawn every frame (`draw()` / `drawPlayer()`) with a perspective "broadcast" camera. All UI around it is DOM.
- **Fonts:** Google Fonts (Saira Condensed, Saira, DotGothic16 for the halftime LED board).
- **Audio:** Web Audio API. Recorded clips for stadium sounds; synthesized 8-bit for jingles/UI. Built-in speech (speechSynthesis) was removed — it never played in the Claude iOS app and is unreliable on iPhone. Do not reintroduce TTS; if voice is wanted, use recorded clips (Scott has floated recording his own "Hike!", "Touchdown!").

### Running locally
```bash
python3 -m http.server 8765        # from repo root, then open http://localhost:8765
python3 tests/smoke_test.py        # plays a full automated game in headless Chrome (needs playwright)
```
`file://` won't load the sound clips (fetch is blocked) — always use a local server.

---

## 2. Code map

| File | Lines | Sections inside |
|---|---|---|
| `css/style.css` | ~170 | all styles |
| `js/teams.js` | ~85 | `LEAGUE`, `ROSTERS` |
| `js/core.js` | ~25 | `saved` (device settings), `newPlayer()` (shape of one kid's data), `me()` (current player), `helpers` |
| `js/audio.js` | ~130 | `sound`, `stadium sound engine`, `REAL STADIUM AUDIO`, jingles, theme, `unlockAudio` |
| `js/math.js` | ~150 | `PROBLEMS` (ladder, adaptive, hints, tap choices) |
| `js/players.js` | ~160 | `SAVE MIGRATION` (`migrateSave()`, `fixPlayer()` — runs at load, call stays at the bottom), `PLAYER PROFILES` (`playersModal()`), `BACKUP CODE` (`backupCode()`, `readCode()`, Settings rows) |
| `js/field.js` | ~330 | `GAME STATE`, `FIELD + PLAYERS`, `BROADCAST CAMERA`, `PLAY ANIMATIONS` |
| `js/screens.js` | ~110 | `SCREENS`, `game screen` |
| `js/game.js` | ~365 | `THE SNAP`, `FLOW`, `defensive looks`, `defense`, `HALFTIME STAT ATTACK`, `end` |
| `js/coach.js` | ~110 | Coach's Corner (`coachCorner(tab)`): read-only parent view of `me()` |
| `js/main.js` | 2 | `startScreen()` |

Details by section (search for the banner comment):

| Section | What's there |
|---|---|
| `LEAGUE` | `TEAMS` — all 32 NFL teams: city, name, colors (`c1` main, `c2` accent, `h` helmet), stadium |
| `ROSTERS` | QB / RB / 3 WR / K per team as `[number, name]`, from Ourlads depth charts on 2026-11-22. Will go stale — refresh each season |
| `saved settings` | `store` + `saved` defaults: `grade, stepId, win, ansMode, music, qLen, pclock, sound, opp, homeT, awayT, record, facts`, plus `v` (save version). `SAVE_VERSION` lives here; old data is upgraded only in `migrateSave()` |
| `sound` / `stadium sound engine` | Synth primitives `osc()`, `nz()`, legacy synth sounds (`*_syn` fallbacks) |
| `REAL STADIUM AUDIO` | `SND` map → `snd/*.mp3`, `loadSamples()`, `playS()`, wrappers `roar() aww() hit() boot() whistle() horn() claps() crowdBed()` that fall back to synth if a clip is missing |
| `8-bit jingles` / `menu theme` | `chip()` sequencer, `fanfare()` (TD), `winJingle()`, `loseJingle()`, `ding()`, `bonk()`, looping menu theme `musicStart()/musicStop()` (original composition — don't swap in a real copyrighted theme) |
| `musicStart/musicStop` | Menu theme plays through its own gain bus (`MUSBUS`); `musicStop()` fades and drops it so already-queued notes stop too. `musicStart()` does nothing unless `musicOn()` (Sound on **and** `saved.music`). The title screen's 🎵 button (`#tsnd`, top right) toggles **only** the title theme (`saved.music`); Settings → Sound and the in-game 🔊 still control all sound |
| `unlockAudio` | iPhone audio unlock: runs on every tap; sets `navigator.audioSession.type='playback'`, resumes AudioContext, keeps a silent looping `<audio>` playing. **That silent track is what makes sounds play on Scott's iPhone — don't remove it.** |
| `PROBLEMS` | Generators (`pAdd pTens pAddRe pAddDD p3 pMul pMulBig pDivR …`), the **`STEPS` ladder** (21 skills K→4th, each `{id, g, tag, f}`), `SI` (id → position), `GRADES` (start step **id** per grade), `curStep()/setStep()/resetLadder()`, `mathBand()` (size of extra-point / field-goal questions), `migrateSave()`, `stepFor(diff)` (which step Run/Pass/Bomb draw from), `playTag()`, `adaptRecord()` (step up/down), `gen()` with repeat-avoidance (`norm()`, last 12 facts) and missed-fact replay (after ≥4 other problems), `choicesFor()` (tap-mode distractors), `hintHTML()` hint pictures |
| `GAME STATE` | `G` (per-game state), `newGame()`, `spotText()`, `ord()`, `factLog()` |
| `FIELD + PLAYERS` / `BROADCAST CAMERA` | Formations (`OFF_POS`, `DEF_POS`, kick/punt variants), `setFormation()`, animation engine (`runAnim`, keyframes `kf`, `BALL.segs`), `draw()`, `drawPlayer()`, jersey numbers from rosters |
| `PLAY ANIMATIONS` | `animPlay(side, losPos, spec)` — kinds `run pass bomb inc int sack fg punt`; `celebrate()`; `confetti()` |
| `SCREENS` | `startScreen()` (two main dials only: Grade + Opponent, with ladder status `ladderText()`; Quarter length, Play clock, Sound, Answers and ladder reset live in Settings; 🎵 top right mutes just the title music), `teamPicker()`, `gameScreen()`, `updateBoard()`, `lower()` ticker |
| `THE SNAP` | `ask(problem, opts)` → Promise `{ok, fast}`. Keypad (up to 4 digits) or 4 tap buttons (`useTap()`), optional play clock (`opts.clock`), "Film room" hint, feedback screen. Records stats, missed facts, `factLog()`. **`recordAnswer(p, ok)`** is the one place an answer is scored (stats, missed-fact replay, fact log, ladder); Stat Attack uses it too |
| `FLOW` | `goTo()`, `quarterBreak()` (halftime → Stat Attack, OT), `startDrive()` |
| `defensive looks` | `LOOKS` (blitz / box / deep), `chooseLook()`, `LOOK_POS` (defenders visibly line up differently), `callPlay()`, `runPlay()` — outcome table: right answer + right call = big play |
| `defense` | `OPP` difficulty table, `defense()` — opponent drives play-by-play with real downs; each snap is one problem |
| `HALFTIME STAT ATTACK` | `statAttack()` — retro LED "match the team to the yards" puzzle, reward = better starting field position |
| `end` | `endGame()` — score, accuracy, practice list of missed facts |

Problem objects look like `{text, answer, key, vis, diff, story?}`. `key` is the fact id (`"7x6"`, `"12/3"`, `"8+5"`); `vis` drives the hint (`add sub up sub2 tens col mul mtens split div divr ldiv`). `gen()` also sets `step` and `adapt:true` (only `adapt` problems move the ladder — extra point / field goal don't).

---

## 3. Gameplay as it stands (v6.5)

- **Offense:** before each snap the defense shows a look (Blitz / Stacked box / Deep coverage) with a coaching tip. Player picks Run (easy math) / Pass (medium) / Deep Bomb (hard). Right answer + right call = big gain; right answer + OK call = small gain; Deep Bomb vs Blitz risks a sack; a **wrong** Deep Bomb can be intercepted. 4th down: go for it, punt, or field goal (in range).
- **Defense:** opponent drives one play at a time; each snap = one problem. Right answer usually stops the play; the `OPP` setting (Easy/Normal/Tough) sets how often they make a play anyway (`luck` 0.03 / 0.25 / 0.30). Tuned by simulation so a ~95%-accurate kid on Normal gives up roughly one score a game.
- **Math ladder (v6):** one continuous ladder of 21 steps, K → 4th (`STEPS`). The **Grade** setting (K/1st/2nd/3rd/4th) only picks the starting step (K=3, 1st=7, 2nd=11, 3rd=15, 4th=19, 1-based). Pass = current step (sometimes 1–2 below), Run = 4–5 steps below (review), Deep Bomb = always one step above. Defense draws Run/Pass problems. At grade starts this reproduces the review / on-grade / stretch table that used to be in the roadmap.
- **Adaptive:** rolling window of the last 10 ladder answers (`saved.win`, all play types together). 9+ of 10 right → step up (ding + "LEVEL UP!" on the feedback card and ticker). 4 misses in the window (≤60%) → quiet step down. The window clears after every change. `saved.stepId` persists, so the next game starts where he left off; the start screen shows "Math step N of 21: <skill>". Picking a different grade restarts the ladder at that grade; Settings → "Restart at … grade start" does the same for the current grade.
- **Answers:** Settings → Answers: Auto (Tap for K–1st, Type for 2nd+), Tap (4 big buttons, keys 1–4 on a keyboard), Type (keypad). Tap distractors come from `choicesFor()`: ±1/±2, ±10, swapped digits, neighbor facts (7×6 → 7×7, 6×6), wrong-operation answers; remainders only offer values below the divisor. Never negative, never duplicated.
- **Players (v6.3):** "Who's playing?" button on the start screen (helmet + name). Up to 6 kids per device, each with their own grade, ladder step, answer mode, opponent level, teams, record and fact stats. Sound, music, quarter length and play clock are shared by the device. Rename/remove are under "Parents" in that dialog. Old saves become "Player 1". Code reads the current kid with `me()`; never put per-kid data at the top level of `saved`.
- **Backup code ("game password"):** Settings → "<Name>'s backup code", e.g. `HBMM-RV3H-WYDT-82V7`, plus Copy and "Enter a code" (shows what the code holds and asks before replacing the current player's progress). Holds grade, ladder step, both teams, opponent level, answer mode and W-L-T record; **not** the name or fact stats. 64 data bits (scrambled) + CRC-16 in Crockford base-32; any single mistyped character is rejected (tested over 99,200 typos), and O/I/L, lowercase and spaces are accepted. **`CODE_STEP_IDS` and `CODE_TEAMS` are append-only** — reordering them breaks every code already written down. New data goes in the 9 `spare` bits, or bump `CODE_FORMAT` and keep reading old formats.
- **Coach's Corner (v6.4):** "📋 Coach's Corner" button on the start screen (no parent gate; it's read-only). For the current player: stat tiles (math step, % right in the last 5 games, record), the ladder with recent moves up/down, **How it's going** (per-skill accuracy bars with ✓ going well = 85%+ over 8+ answers / ! working on = under 70% over 6+), **Practice these** (most-missed facts, 2+ tries, under 80%), a **fact map** (× 2–10 and + 1–10; − and ÷ fold into their fact family; ✓ mastered = 3+ right & 80%+, ! needs practice = 2+ misses & under 60%, • learning; tap a square for its numbers), and the last 10 games. Status colors always come with an icon and a word. Data it reads: `facts` (now all four operations, numbers ≤ 12), `skills`, `games`, `ladderLog` — the last three started being recorded in save v4, so older games don't show there.
- **Practice facts (v6.5):** `troubleFacts()` (math.js) = the kid's most-missed facts (2+ tries, under 80%), shown in Coach's Corner → "Practice these". Two ways they get used:
  - **In games** (per-kid switch `focus`, on by default): `gen()` serves one on `FOCUS_RATE` = 25% of Run/Pass/defense problems (never Deep Bomb), built by `factProblem(key)`, with a "⭐ Practice fact" badge. They have `focus:true, adapt:false`: counted in `facts` and game stats, **never in the ladder window**, so working on weak facts can't drop his step.
  - **Practice drill** (`practiceDrill()` in coach.js): "⭐ Practice drill" button → "Practice Field": 10 questions from the list, no football, a missed fact comes back later in the same drill, 🏈 per right answer. Uses `ask(p,{noStat:true})` and logs only `facts` (no game stats, no ladder, no record).
- **Title music** is on by default. Phones play no sound until the first tap, so the 🎵 button says "Tap for music" until then and a tap starts it rather than switching it off (that was why it seemed off by default). Save v4 turned music back on once for everyone.
- **Clock:** 2/3/5-minute quarters, halftime Stat Attack, overtime if tied.
- **Play clock:** optional, **off by default** — Scott's son may know an answer but type slowly. When on, beating it = +5 yards (offense) / sack (defense). Never a penalty.
- **Removed on purpose** (Scott found them clutter for a 6-year-old): player cards / locker room / ratings (**parked in `archive/`, planned to return**; card progress was never live, so nothing was lost), Coach's Bonus field-math questions, Momentum + Boost meter, win-probability bar, announcer voice, frequent whistles.

---

## 4. Roadmap

**A, B and C below shipped in v6** (see §3 for how they ended up). Kept for the reasoning; tune from here.

### A. Grade-level math (replace Rookie / Pro / All-Pro) — done
Settings pick a **grade** instead of a generic level. Each grade maps the three play types to *review / on-grade / stretch*, loosely following Common Core:

| Grade | Run (review) | Pass (on grade) | Deep Bomb (stretch) |
|---|---|---|---|
| K | count on, + within 5 | + − within 10 | + within 20 |
| 1st | + − within 10 | + − within 20, +10s, 2-digit + 1-digit | ×2, ×5, ×10 as groups/arrays |
| 2nd | + − within 20 | 2-digit + − with regrouping (within 100) | × tables 2–5, ÷ by 2, 5, 10 |
| 3rd | 2-digit + − | × / ÷ within 100 (all tables) | 3-digit + −, ×6–9, ÷ with bigger facts |
| 4th (stretch) | × / ÷ facts | multi-digit × 1-digit | ÷ with remainders |

- **Grade is a starting point, not a ceiling.** Adaptive steps (B) keep climbing past the selected grade into the next grade's skills (and drop below it if needed). Deep Bomb always stays one notch above the current step. Reason: Scott's son is in 1st grade but already does harder multiplication — a 1st-grade cap would hide ×6–9 from him.
- Defense problems: mix of review + on-grade (no stretch).
- Halftime Stat Attack numbers should scale with grade too.
- Scott's son: probably **1st grade with stretch**, or 2nd.

### B. Adaptive difficulty ("progressively harder or easier") — done (one shared window, not per play type)
- Split each grade into ~5 sub-steps (e.g. 1st: +within 10 → +within 20 → +10s → 2-digit+1-digit → ×2/5/10 intro), chained into one continuous ladder K → 4th so a kid can climb across grade lines.
- No manual difficulty setting inside a grade (decided with Scott): the start screen has just **Grade** (the math) and **Opponent** (the football). Optional parent-only "start step" at most.
- Track a rolling window (last ~10 answers per play type). ≥90% right → step up; ≤60% → step down. Keep it quiet — a small "Level up!" moment at most, never a "too hard" message.
- Persist per-device in `saved` so the next game starts where he left off. Show the current step on the start screen for the parent.

### C. Answer mode: **Tap cards vs Typing** — done
- Setting: *Tap* (4 big answer buttons) / *Type* (current keypad). Default Tap for K–1st, Type for 2nd+.
- Distractors must be plausible, not random: answer ±1, ±2, ±10, swapped digits (e.g. 42 ↔ 24), neighbor fact in the same table (7×6 → 7×7=49, 6×6=36). No duplicates, no negatives.
- Still log right/wrong the same way; play clock still optional.

### Possible follow-ups to v6
- Watch how fast the ladder moves for Scott's son. If it's too slow/fast, change the window (10) or thresholds in `adaptRecord()`.
- Halftime Stat Attack only has 3 sizes (keyed off the step); could scale more finely.
- "Coach's report" could show the step history.

### Next up candidates (Scott, 2026-11-25)
- **Backup code ("game password")** — DONE in v6.3 (see §3). Original notes: Like old console passwords: a short code a parent writes down that restores a kid's progress on any device if storage gets wiped (Safari clears it, new phone, etc.). Ideas: encode the essentials only (grade, ladder `stepId`, W-L-T record, answer mode, team; later season + cards) into ~10–14 characters from an unambiguous alphabet (no 0/O/1/I/L), with a checksum so a typo is caught instead of loading garbage. Restore from Settings ("Enter code"). No server needed. Fact stats are too big for a short code — leave them out or offer a separate long "full backup" text.
- **Player profiles** — DONE in v6.3.
- **Coach's Corner** — DONE in v6.4. Original idea: times-table mastery map from `saved.facts` (green mastered / yellow learning / red needs practice), ladder step history. The old map drawing is in `archive/player-cards.js` (`factState()` + the grid in `lockerRoom()`).

### Coach's Corner ideas not built yet (2026-11-25)
- **Parent start-step override** (pick an exact ladder step, not just a grade start).
- ~~"Practice the 7s" mode~~ — DONE in v6.5 (drill + practice facts in games).
- **Weekly summary:** time played, answers per day, streak of days played.
- **Share/print the report** (e.g. for a teacher) — render the Corner to a printable page.
- **Speed per fact** (seconds to answer); mastery = right *and* quick.
- **A parent gate** if anything editable is ever added here (e.g. "hold for 2 seconds"; a math question won't stop these kids).

### Later: player cards + season mode (Scott wants both eventually)
- **Player cards** are parked in `archive/player-cards.js` / `.css` (working; checked against v6). Bring back as a reward layer once the core math loop feels right.
- **Season mode** (a set number of games, standings, a playoff/championship, then a fresh season). **Can be fully local** — same `localStorage` as today, no server needed. A server is only needed for: the same season on several devices, several kids' profiles synced across devices, or friends' leagues.
  - Recommended path: (1) local seasons; (2) a parent-only **"Backup code / Restore"** (export `saved` as text or a QR code, import on another device) — moves progress without accounts; (3) only if really wanted, a backend (e.g. Supabase/Firebase) behind a **parent** login. Step 3 means accounts for kids under 13 → COPPA (verifiable parental consent, privacy policy, data deletion), so avoid it unless sync is essential.
  - Also worth adding with seasons: **player profiles on one device** (pick "who's playing"), since today one device = one ladder step + one record.

### Also worth doing (lower priority)
- **Resume a game** after the app is closed/backgrounded (save `G` + current phase to `localStorage`).
- **Works offline** — add a small service worker caching `index.html`, `css/`, `js/`, `snd/`, icons, fonts.
- **Coach's Corner** — built in v6.4 (see §3). Original note: `saved.facts` still records right/wrong per × fact (`{"6x7":[right,wrong]}`) but nothing shows it. A simple "Coach's report" (the old times-table map idea, without player cards) could read it. The old drawing code (`factState()`, `lockerRoom()`) was deleted in the v6 cleanup; it's in git history (commit `ae9d1df`).
- **Dad vs kid / sibling mode** — two players, one device, each at their own grade.
- **Recorded voice clips** (Scott's own) for "Hike!", "Touchdown!", "First down!".
- Code health: done in v6 (dead code removed, `index.html` split into `css/` + `js/`).

---

## 5. Things to keep in mind

**Rules that keep the code from drifting (added in the v6 cleanup):**
- **Releasing? Bump `?v=`** on every `<link>`/`<script>` in `index.html` (all the same number). Otherwise a phone can run a cached old `js/` file with a new one and break.
- **New file in `js/`?** Add it to `index.html` in the right spot of the load order, and list it in §2.
- **Ladder skills are referred to by `id`, never by position.** To add a skill, insert `{id, g, tag, f}` anywhere in `STEPS`; saved progress, grade starts and `mathBand()` all key off ids, so nothing shifts. Never write `curStep() < 7`; write `curStep() < SI.mul2510`. Don't rename or delete an id without a `migrateSave()` step for it.
- **Changing what's saved?** Bump `SAVE_VERSION` (core.js) and add one `if(v < N){…}` block to `migrateSave()` (players.js); per-kid fields also go in `newPlayer()` and get validated in `fixPlayer()`. Don't patch old saved data anywhere else.
- **Every scored question goes through `recordAnswer()`** (via `ask()`, or directly like Stat Attack). Only problems from `gen()` (`adapt:true`) move the ladder.
- **Removing a feature?** Don't leave it switched off in the live code. If it may come back, move it to `archive/` with a how-to-restore note; otherwise delete it (git history keeps it). Clean up its saved keys in `migrateSave()`.


- **Audience is a 6–7 year old.** Big tap targets, no harsh failure (wrong answers show a dot-picture hint and the play still runs), short text, no reading-heavy screens, nothing that punishes slow typing.
- **Real NFL teams and player names** are used knowingly for a small friends-and-family game: free, no ads, shared by link only. If it ever goes broader or makes money, switch to fictional teams/players first (team names are trademarks; player names in a game that depicts them playing are a right-of-publicity issue — see the EA/Keller line of cases).
- **Sounds:** `snd/` clips are from Mixkit (free license), trimmed and loudness-matched with ffmpeg. Two source clips were unused. Keep clips short (crowd reactions ≤ 2s except the TD roar).
- **iPhone audio is fragile** — test any audio change on a real iPhone (silent switch on and off).
- **Testing:** `tests/smoke_test.py [w h tag secs grade auto|tap|type]` plays a whole game (picks the right call ~80% of the time, answers ~92% right, in either answer mode) and reports score, accuracy, start/end ladder step and JS errors. Run it after gameplay changes. If Playwright's own browser isn't installed, set `CHROMIUM_PATH` to an existing Chromium binary. For balance changes, simulate drives in Python first (that's how the `OPP` numbers were tuned).
- **Deploy:** push to `main` → GitHub Pages updates in ~1 minute. There is also an older copy as a Claude artifact; GitHub is now the source of truth.
