# Football Math — handoff & working notes

A kids' football game where every play is a math problem. Built for Scott's 1st grader (great at + and −, ahead on ×, starting ÷), shared with a few friends. Live at **https://speiser11.github.io/football-math/** (GitHub Pages, deploys from `main`, root folder).

Read this first, then `index.html`. Keep this file updated when anything below changes.

---

## 1. How it's built

- **One static page, no build step.** `index.html` holds all CSS + JS (~1,300 lines). `snd/` holds recorded audio clips. `manifest.json` + `icon-*.png` make "Add to Home Screen" work.
- **No backend, no accounts, no analytics.** Settings, season record and fact stats live in `localStorage` under key `footballMath1`. Keep it this way unless Scott decides otherwise — kids under 13 play this (COPPA).
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

## 2. Code map (`index.html`, top to bottom)

| Section (search for the banner comment) | What's there |
|---|---|
| `LEAGUE` | `TEAMS` — all 32 NFL teams: city, name, colors (`c1` main, `c2` accent, `h` helmet), stadium |
| `ROSTERS` | QB / RB / 3 WR / K per team as `[number, name]`, from Ourlads depth charts on 2026-11-22. Will go stale — refresh each season |
| `saved settings` | `store` + `saved` defaults: `grade, step, win, ansMode, qLen, pclock, sound, opp, homeT, awayT, record, facts`. Old `level` is deleted on load; `step` defaults to the grade's start |
| `sound` / `stadium sound engine` | Synth primitives `osc()`, `nz()`, legacy synth sounds (`*_syn` fallbacks) |
| `REAL STADIUM AUDIO` | `SND` map → `snd/*.mp3`, `loadSamples()`, `playS()`, wrappers `roar() aww() hit() boot() whistle() horn() claps() crowdBed()` that fall back to synth if a clip is missing |
| `8-bit jingles` / `menu theme` | `chip()` sequencer, `fanfare()` (TD), `winJingle()`, `loseJingle()`, `ding()`, `bonk()`, looping menu theme `musicStart()/musicStop()` (original composition — don't swap in a real copyrighted theme) |
| `unlockAudio` | iPhone audio unlock: runs on every tap; sets `navigator.audioSession.type='playback'`, resumes AudioContext, keeps a silent looping `<audio>` playing. **That silent track is what makes sounds play on Scott's iPhone — don't remove it.** |
| `PROBLEMS` | Generators (`pAdd pTens pAddRe pAddDD p3 pMul pMulBig pDivR …`), the **`STEPS` ladder** (21 skills K→4th, each `{g, tag, f}`), `GRADES` (start step per grade), `stepFor(diff)` (which step Run/Pass/Bomb draw from), `playTag()`, `adaptRecord()` (step up/down), `gen()` with repeat-avoidance (`norm()`, last 12 facts) and missed-fact replay (after ≥4 other problems), `choicesFor()` (tap-mode distractors), `hintHTML()` hint pictures |
| `GAME STATE` | `G` (per-game state), `newGame()`, `spotText()`, `ord()`. Also unused leftovers: player cards (`CARD_SLOTS`, `cardXP` is a no-op), `winProb()` |
| `FIELD + PLAYERS` / `BROADCAST CAMERA` | Formations (`OFF_POS`, `DEF_POS`, kick/punt variants), `setFormation()`, animation engine (`runAnim`, keyframes `kf`, `BALL.segs`), `draw()`, `drawPlayer()`, jersey numbers from rosters |
| `PLAY ANIMATIONS` | `animPlay(side, losPos, spec)` — kinds `run pass bomb inc int sack fg punt`; `celebrate()`; `confetti()` |
| `SCREENS` | `startScreen()` (two main dials only: Grade + Opponent, with ladder status `ladderText()`; Quarter length, Play clock, Answers, ladder reset and Sound live in Settings), `teamPicker()`, `lockerRoom()` (**unused now** — kept for a possible return), `gameScreen()`, `updateBoard()`, `lower()` ticker |
| `THE SNAP` | `ask(problem, opts)` → Promise `{ok, fast}`. Keypad (up to 4 digits) or 4 tap buttons (`useTap()`), optional play clock (`opts.clock`), "Film room" hint, feedback screen. Records stats, missed facts, `factLog()` |
| `FLOW` | `goTo()`, `quarterBreak()` (halftime → Stat Attack, OT), `startDrive()` |
| `defensive looks` | `LOOKS` (blitz / box / deep), `chooseLook()`, `LOOK_POS` (defenders visibly line up differently), `callPlay()`, `runPlay()` — outcome table: right answer + right call = big play |
| `defense` | `OPP` difficulty table, `defense()` — opponent drives play-by-play with real downs; each snap is one problem |
| `HALFTIME STAT ATTACK` | `statAttack()` — retro LED "match the team to the yards" puzzle, reward = better starting field position |
| `end` | `endGame()` — score, accuracy, practice list of missed facts |

Problem objects look like `{text, answer, key, vis, diff, story?}`. `key` is the fact id (`"7x6"`, `"12/3"`, `"8+5"`); `vis` drives the hint (`add sub up sub2 tens col mul mtens split div divr ldiv`). `gen()` also sets `step` and `adapt:true` (only `adapt` problems move the ladder — extra point / field goal don't).

---

## 3. Gameplay as it stands (v6)

- **Offense:** before each snap the defense shows a look (Blitz / Stacked box / Deep coverage) with a coaching tip. Player picks Run (easy math) / Pass (medium) / Deep Bomb (hard). Right answer + right call = big gain; right answer + OK call = small gain; Deep Bomb vs Blitz risks a sack; a **wrong** Deep Bomb can be intercepted. 4th down: go for it, punt, or field goal (in range).
- **Defense:** opponent drives one play at a time; each snap = one problem. Right answer usually stops the play; the `OPP` setting (Easy/Normal/Tough) sets how often they make a play anyway (`luck` 0.03 / 0.25 / 0.30). Tuned by simulation so a ~95%-accurate kid on Normal gives up roughly one score a game.
- **Math ladder (v6):** one continuous ladder of 21 steps, K → 4th (`STEPS`). The **Grade** setting (K/1st/2nd/3rd/4th) only picks the starting step (K=3, 1st=7, 2nd=11, 3rd=15, 4th=19, 1-based). Pass = current step (sometimes 1–2 below), Run = 4–5 steps below (review), Deep Bomb = always one step above. Defense draws Run/Pass problems. At grade starts this reproduces the review / on-grade / stretch table that used to be in the roadmap.
- **Adaptive:** rolling window of the last 10 ladder answers (`saved.win`, all play types together). 9+ of 10 right → step up (ding + "LEVEL UP!" on the feedback card and ticker). 4 misses in the window (≤60%) → quiet step down. The window clears after every change. `saved.step` persists, so the next game starts where he left off; the start screen shows "Math step N of 21: <skill>". Picking a different grade restarts the ladder at that grade; Settings → "Restart at … grade start" does the same for the current grade.
- **Answers:** Settings → Answers: Auto (Tap for K–1st, Type for 2nd+), Tap (4 big buttons, keys 1–4 on a keyboard), Type (keypad). Tap distractors come from `choicesFor()`: ±1/±2, ±10, swapped digits, neighbor facts (7×6 → 7×7, 6×6), wrong-operation answers; remainders only offer values below the divisor. Never negative, never duplicated.
- **Clock:** 2/3/5-minute quarters, halftime Stat Attack, overtime if tied.
- **Play clock:** optional, **off by default** — Scott's son may know an answer but type slowly. When on, beating it = +5 yards (offense) / sack (defense). Never a penalty.
- **Removed on purpose** (Scott found them clutter for a 6-year-old): player cards / locker room / ratings, Coach's Bonus field-math questions, Momentum + Boost meter, win-probability bar, announcer voice, frequent whistles.

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

### Also worth doing (lower priority)
- **Resume a game** after the app is closed/backgrounded (save `G` + current phase to `localStorage`).
- **Works offline** — add a small service worker caching `index.html`, `snd/`, icons, fonts.
- **Parent progress view** — the old times-table map (`factState()` + `saved.facts`) could return as a simple "Coach's report" without the player cards.
- **Dad vs kid / sibling mode** — two players, one device, each at their own grade.
- **Recorded voice clips** (Scott's own) for "Hike!", "Touchdown!", "First down!".
- Code health: split `index.html` into `css/`, `js/` modules (still no build step), and delete the unused player-card / locker-room / win-prob code.

---

## 5. Things to keep in mind

- **Audience is a 6–7 year old.** Big tap targets, no harsh failure (wrong answers show a dot-picture hint and the play still runs), short text, no reading-heavy screens, nothing that punishes slow typing.
- **Real NFL teams and player names** are used knowingly for a small friends-and-family game: free, no ads, shared by link only. If it ever goes broader or makes money, switch to fictional teams/players first (team names are trademarks; player names in a game that depicts them playing are a right-of-publicity issue — see the EA/Keller line of cases).
- **Sounds:** `snd/` clips are from Mixkit (free license), trimmed and loudness-matched with ffmpeg. Two source clips were unused. Keep clips short (crowd reactions ≤ 2s except the TD roar).
- **iPhone audio is fragile** — test any audio change on a real iPhone (silent switch on and off).
- **Testing:** `tests/smoke_test.py [w h tag secs grade auto|tap|type]` plays a whole game (picks the right call ~80% of the time, answers ~92% right, in either answer mode) and reports score, accuracy, start/end ladder step and JS errors. Run it after gameplay changes. If Playwright's own browser isn't installed, set `CHROMIUM_PATH` to an existing Chromium binary. For balance changes, simulate drives in Python first (that's how the `OPP` numbers were tuned).
- **Deploy:** push to `main` → GitHub Pages updates in ~1 minute. There is also an older copy as a Claude artifact; GitHub is now the source of truth.
