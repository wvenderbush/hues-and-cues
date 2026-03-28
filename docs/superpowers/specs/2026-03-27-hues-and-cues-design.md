# Hues and Cues — Web App Design Spec
**Date:** 2026-03-27

---

## Overview

A browser-based implementation of the board game Hues and Cues. Players take turns being the "clue giver" who describes a target color using one-word then two-word clues, while other players place markers on a color grid to guess the target. Points are awarded based on proximity to the target color.

---

## Game Rules Summary

- **Players:** 3–10, local hot-seat (one device passed around)
- **Board:** 480-color grid (30 columns × 16 rows), each color identified by coordinates (A–AD, 1–16)
- **Turn structure:**
  1. Clue giver draws a target color (from a virtual card showing 4 colors, picks one)
  2. Clue giver gives a **1-word clue**
  3. All other players place their **first marker** (clockwise order)
  4. Clue giver gives a **2-word clue**
  5. All other players place/move their **second marker** (counterclockwise order)
  6. Target revealed, scoring frame applied, points awarded
- **Scoring:**
  - Guesser exact match: 3 pts
  - Guesser within scoring frame (1 cell radius): 2 pts
  - Guesser on frame edge (2 cell radius): 1 pt
  - Clue giver: 1 pt per marker within the scoring frame (all players)
- **Game length:**
  - 3–6 players: each player gives clues twice
  - 7–10 players: each player gives clues once
- **Clue restrictions:** No primary color names (red, blue, green, yellow), no darker/lighter, no board positions, no room object comparisons

---

## Tech Stack

- **Framework:** React 18 + Vite
- **Styling:** CSS Modules or plain CSS with CSS variables for theming
- **State:** React `useReducer` for game state machine
- **Persistence:** `localStorage` for dark mode preference
- **Deployment:** GitHub Pages via `vite build` + `gh-pages`
- **No backend required** — fully client-side

---

## Screen Flow

```
Home → Player Setup → [Game Loop] → Final Scores
```

### Game Loop (repeats per clue giver turn):
```
Clue1Screen → PassDevice → Guess1Screen (per guesser) → PassDevice →
Clue2Screen → PassDevice → Guess2Screen (per guesser) → RevealScreen →
(next clue giver or end)
```

### Screens:

| Screen | Who holds device | Key actions |
|---|---|---|
| Home | Anyone | "New Game" |
| Player Setup | Anyone | Enter 3–10 player names, "Start Game" |
| Clue1 | Clue giver | See target color, enter 1-word clue, submit |
| PassDevice | — | Full-screen "Pass to [Guesser Name]" prompt |
| Guess1 | Each guesser in turn | Tap cell on grid to place first marker, confirm |
| Clue2 | Clue giver | See target color again, enter 2-word clue, submit |
| Guess2 | Each guesser in turn | Tap cell to place/move second marker, confirm |
| Reveal | All | Target highlighted, scoring frame shown, points animated, "Next Round" |
| Final Scores | All | Ranked leaderboard, "Play Again" |

---

## Color Grid

- **Desktop:** Full 30×16 grid, coordinate labels (columns A–AD along top/bottom, rows 1–16 along sides). ~70% of screen width, sidebar for phase info and clue input.
- **Mobile:** Same 480 colors, smaller cells, pinch-to-zoom + scroll. Minimum tap target 20×20px. Phase info stacked above grid.
- **Implementation:** Colors generated programmatically from HSL color space — no images. Each cell maps to a unique `{ x, y, hex }` coordinate.
- **Marker overlay:** Each player assigned a distinct vivid marker color (auto-assigned from a palette of 10). Markers rendered as colored circles on top of grid cells.

---

## Data Model

```ts
type Player = {
  name: string;
  markerColor: string;  // hex, auto-assigned
  score: number;
};

type Marker = {
  playerIndex: number;
  x: number;           // grid column (0-indexed)
  y: number;           // grid row (0-indexed)
  markerNumber: 1 | 2;
};

type Phase =
  | 'setup'
  | 'clue1'
  | 'guess1'
  | 'clue2'
  | 'guess2'
  | 'reveal'
  | 'end';

type GameState = {
  players: Player[];
  currentClueGiverIndex: number;
  clueGiverTurnCount: number[];  // how many times each player has been clue giver
  phase: Phase;
  targetColor: { x: number; y: number; hex: string };
  clue1: string;
  clue2: string;
  markers: Marker[];
  currentGuesserIndex: number;   // which guesser is placing right now
  roundScores: Record<number, number>;  // playerIndex → points this round
};
```

---

## Components

| Component | Purpose |
|---|---|
| `App` | Root, holds game state via `useReducer`, renders active screen |
| `HomeScreen` | Title + New Game button |
| `PlayerSetup` | Name entry form, add/remove players, start game |
| `ColorGrid` | 480-cell grid, renders markers, handles tap/click |
| `PhaseManager` | Routes to correct screen based on `phase` |
| `ClueInput` | Text field with word-count enforcement (1 or 2 words) |
| `PassDevice` | Full-screen overlay between phases |
| `ScoreReveal` | Animates scoring frame, tallies and displays round points |
| `Scoreboard` | Player score list, shown on reveal and final screens |
| `FinalScores` | Ranked leaderboard, play again |
| `ThemeToggle` | Sun/moon icon, toggles dark mode class on `<body>` |

---

## Theming

Two themes, toggled via a button, persisted in `localStorage`:

- **Default (Playful):** Soft pastels, warm whites, rounded corners, pink/coral accents
- **Dark mode (Bold):** Deep navy/charcoal background, vibrant neon accents, high contrast

All colors defined as CSS variables on `:root` and `[data-theme="dark"]`. Switching theme = toggling `data-theme` attribute on `<html>`.

---

## Scoring Logic (ScoreReveal)

```
For each guesser's markers:
  distance = Chebyshev distance from marker to target (max of |dx|, |dy|)
  if distance == 0: +3 pts
  if distance == 1: +2 pts  (within scoring frame)
  if distance == 2: +1 pt   (on frame edge)

  take best score from player's 2 markers (not additive)

For clue giver:
  count all markers (from all players, both marker slots) where distance <= 1
  clue giver gets 1 pt per such marker
```

---

## Constraints & Rules Enforcement

- **Clue1:** Input enforces exactly 1 word (no spaces allowed)
- **Clue2:** Input enforces max 2 words
- **No clue validation** for content (can't auto-detect "darker" etc.) — honor system
- **Marker placement:** Can't place on an already-occupied cell (show visual feedback)
- **Turn order:** Guess1 = clockwise from clue giver, Guess2 = counterclockwise

---

## Out of Scope

- Online/networked multiplayer
- Sound effects or music
- AI opponents
- Card deck persistence (virtual cards are randomly generated each turn)
- User accounts or game history
