# Hues & Cues

A browser-based implementation of the Hues and Cues color-guessing party game. Play it at **https://wvenderbush.github.io/hues-and-cues/**

## How to Play

### Setup
Enter 2–10 player names. Players take turns being the **clue giver** — everyone else is a **guesser**.

### Each Round

1. **Clue 1** — The clue giver sees a secret target color on the 30×16 grid. They give a single-word clue describing it (e.g. *lavender*).

2. **Guess 1** — Each guesser (in clockwise order) places a marker on the cell they think matches the clue.

3. **Clue 2** — The clue giver sees where everyone guessed relative to the target, then gives a second clue of up to 2 words (e.g. *dusty sky*).

4. **Guess 2** — Guessers place a second marker (in counterclockwise order).

5. **Reveal** — The target is shown. Scores are calculated and the next player becomes clue giver.

### Restrictions
Clues may **not** include:
- Color names (red, blue, purple, etc.)
- Relative terms (lighter, darker)
- Pointing at objects in the room
- Board positions (e.g. "top left")

### Scoring

Scoring uses **Chebyshev distance** (the maximum of the row and column difference — like king moves in chess).

| Distance from target | Guesser points |
|---|---|
| 0 (exact) | 3 |
| 1 (adjacent) | 2 |
| 2 | 1 |
| 3+ | 0 |

Each guesser scores based on their **best** marker (whichever of their two guesses is closer).

The **clue giver** earns 1 point for every marker (across both rounds) that lands within distance 1 of the target.

### Game Length
- 2–6 players: each player gives clues **twice**
- 7–10 players: each player gives clues **once**

The player with the most points at the end wins. Ties are broken by... arguing.

---

## The Color Grid

The grid is 30 columns (A–AD) × 16 rows, generated from HSL values:

| Rows | Contents |
|---|---|
| 1 | Greyscale gradient (near-white → dark grey) |
| 2 | Near-black gradient |
| 3–6 | Very dark chromatic colors |
| 7–9 | Dark vivid colors |
| 10–12 | Full vivid colors |
| 13–15 | Mid-saturation colors |
| 16 | Very pastel colors |

Columns sweep through all 360° of hue (red → orange → yellow → green → cyan → blue → purple → pink → red).

---

## Project Structure

```
src/
  colors.ts          # Grid generation — HSL → hex for all 480 cells
  scoring.ts         # Chebyshev distance scoring logic
  gameReducer.ts     # useReducer state machine — all game phases and transitions
  types.ts           # Shared TypeScript types
  App.tsx            # Top-level: phase routing, pass-device flow, theme toggle
  components/
    HomeScreen.tsx   # Title screen with color preview and New Game button
    PlayerSetup.tsx  # Player name entry
    ClueScreen.tsx   # Clue giver input (clue1 and clue2 phases)
    GuessScreen.tsx  # Full-grid guesser view with marker placement
    RevealScreen.tsx # Target reveal, scoring frame, per-player round scores
    FinalScores.tsx  # End-of-game leaderboard
    ColorGrid.tsx    # Reusable grid component used in guess, reveal, and clue2 preview
    PassDevice.tsx   # "Pass the device to X" screen between turns
    Scoreboard.tsx   # Running score display
    ThemeToggle.tsx  # Light/dark mode toggle
```

### Game State Machine

Phases (managed in `gameReducer.ts`):

```
setup → clue1 → guess1 → clue2 → guess2 → reveal → clue1 → ... → end
```

- `clue1` / `clue2`: clue giver's turn to type a clue
- `guess1` / `guess2`: guessers take turns in order (pass-device flow handled in App.tsx)
- `reveal`: scores shown, clue giver advances
- `end`: final scores, play again option

### Pass-Device Flow

Since this is a single-device party game, `App.tsx` intercepts certain actions (submitting a clue, confirming a guess) to show a "pass to [name]" interstitial before the next player's screen appears.

---

## Development

```bash
npm install
npm run dev        # local dev server at localhost:5173
npm run test       # run tests with Vitest
npm run build      # TypeScript + Vite production build
npm run deploy     # build + push to GitHub Pages (gh-pages branch)
```

**Stack:** React 18 · TypeScript · Vite · Vitest · gh-pages
