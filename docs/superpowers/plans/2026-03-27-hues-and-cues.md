# Hues and Cues Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully playable browser-based Hues and Cues game with local hot-seat multiplayer, responsive layout, and two visual themes.

**Architecture:** React 18 + Vite SPA with a `useReducer` game state machine. All game logic (color grid generation, scoring, turn order) lives in pure TypeScript modules tested with Vitest. Components are thin — they dispatch actions and render state. No backend.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, plain CSS with CSS variables for theming, GitHub Pages deployment.

---

## File Map

```
src/
  types.ts                      — All TypeScript types (ColorCell, Player, Marker, Phase, GameState, GameAction)
  colors.ts                     — 480-color grid generation (buildColorGrid, hslToHex, colLabel)
  scoring.ts                    — Round scoring logic (computeRoundScores)
  gameReducer.ts                — useReducer state machine (initialState, gameReducer)
  App.tsx                       — Root: holds state, renders PhaseManager + ThemeToggle
  App.css                       — Layout shell styles
  index.css                     — CSS reset + CSS variables (light + dark themes)
  test-setup.ts                 — Vitest global setup
  __tests__/
    colors.test.ts
    scoring.test.ts
    gameReducer.test.ts
  components/
    HomeScreen.tsx + .css
    PlayerSetup.tsx + .css
    ColorGrid.tsx + .css        — 480-cell interactive grid with marker overlays
    PassDevice.tsx + .css       — Full-screen "pass the phone" overlay
    ClueScreen.tsx + .css       — Shared screen for clue1 and clue2 phases
    GuessScreen.tsx + .css      — Shared screen for guess1 and guess2 phases
    RevealScreen.tsx + .css     — Scoring frame + animated score reveal
    FinalScores.tsx + .css      — Ranked leaderboard + play again
    Scoreboard.tsx + .css       — Reusable running score list
    ThemeToggle.tsx             — Sun/moon toggle button (no separate CSS needed)
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/test-setup.ts`

- [ ] **Step 1: Scaffold Vite project**

```bash
cd /Users/winston/Dev/hues_and_cues
npm create vite@latest . -- --template react-ts
```
When prompted about non-empty directory, choose to ignore/proceed.

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Configure Vitest in vite.config.ts**

Replace the entire contents of `vite.config.ts` with:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/hues-and-cues/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 4: Create test setup file**

Create `src/test-setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test + deploy scripts to package.json**

Edit `package.json` — update the `scripts` section to:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "deploy": "npm run build && npx gh-pages -d dist"
}
```

- [ ] **Step 6: Wipe boilerplate**

Delete the default Vite content:
```bash
rm -f src/App.css src/App.tsx src/index.css src/assets/react.svg public/vite.svg
```

- [ ] **Step 7: Verify scaffold works**

```bash
npm run dev
```
Expected: Vite dev server starts on http://localhost:5173 (may show blank page or error — that's fine, we haven't written the app yet).

Press Ctrl+C to stop.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + Vitest project"
```

---

## Task 2: Types + Color Grid

**Files:**
- Create: `src/types.ts`, `src/colors.ts`, `src/__tests__/colors.test.ts`

- [ ] **Step 1: Write failing color grid tests**

Create `src/__tests__/colors.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { buildColorGrid, colLabel, COLS, ROWS } from '../colors'

describe('colLabel', () => {
  it('returns A for column 0', () => expect(colLabel(0)).toBe('A'))
  it('returns Z for column 25', () => expect(colLabel(25)).toBe('Z'))
  it('returns AA for column 26', () => expect(colLabel(26)).toBe('AA'))
  it('returns AD for column 29', () => expect(colLabel(29)).toBe('AD'))
})

describe('buildColorGrid', () => {
  it('produces correct dimensions', () => {
    const grid = buildColorGrid()
    expect(grid.length).toBe(ROWS)
    grid.forEach(row => expect(row.length).toBe(COLS))
  })

  it('every cell has a valid hex color', () => {
    const grid = buildColorGrid()
    const hexRe = /^#[0-9a-f]{6}$/
    grid.forEach(row =>
      row.forEach(cell => expect(cell.hex).toMatch(hexRe))
    )
  })

  it('cell at (0,0) has label A1', () => {
    const grid = buildColorGrid()
    expect(grid[0][0].label).toBe('A1')
  })

  it('cell at (29,15) has label AD16', () => {
    const grid = buildColorGrid()
    expect(grid[15][29].label).toBe('AD16')
  })

  it('all cells have correct col/row coordinates', () => {
    const grid = buildColorGrid()
    grid.forEach((row, r) =>
      row.forEach((cell, c) => {
        expect(cell.col).toBe(c)
        expect(cell.row).toBe(r)
      })
    )
  })
})
```

- [ ] **Step 2: Run to verify tests fail**

```bash
npm test
```
Expected: FAIL — `colors` module not found.

- [ ] **Step 3: Create types.ts**

Create `src/types.ts`:
```typescript
export type ColorCell = {
  col: number
  row: number
  hex: string
  label: string  // e.g. "A1", "AA7"
}

export type Player = {
  name: string
  markerColor: string  // hex, auto-assigned
  score: number
}

export type Marker = {
  playerIndex: number
  col: number
  row: number
  markerNumber: 1 | 2
}

export type Phase =
  | 'setup'
  | 'clue1'
  | 'guess1'
  | 'clue2'
  | 'guess2'
  | 'reveal'
  | 'end'

export type GameState = {
  players: Player[]
  currentClueGiverIndex: number
  clueGiverTurnCounts: number[]   // how many times each player has been clue giver
  phase: Phase
  targetColor: ColorCell | null
  clue1: string
  clue2: string
  markers: Marker[]
  guessOrder: number[]            // player indices in current guess order
  currentGuessOrderIndex: number  // position in guessOrder for current guesser
}
```

- [ ] **Step 4: Create colors.ts**

Create `src/colors.ts`:
```typescript
import type { ColorCell } from './types'

export const COLS = 30
export const ROWS = 16

// Column label: 0→A, 25→Z, 26→AA, 29→AD
export function colLabel(col: number): string {
  if (col < 26) return String.fromCharCode(65 + col)
  return 'A' + String.fromCharCode(65 + col - 26)
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number): string => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function getColor(col: number, row: number): string {
  const hue = Math.round((col / COLS) * 360)

  // Row bands: [saturation%, lightness%]
  const bands: [number, number][] = [
    [90, 30],  // row  0: dark vivid
    [90, 40],  // row  1
    [90, 50],  // row  2: vivid
    [85, 55],  // row  3
    [80, 60],  // row  4
    [70, 65],  // row  5
    [60, 70],  // row  6
    [50, 75],  // row  7
    [40, 80],  // row  8
    [30, 84],  // row  9: very pastel
    [85, 25],  // row 10: very dark vivid
    [80, 18],  // row 11: darkest vivid
    [0, 50],   // row 12: medium gray
    [0, 30],   // row 13: dark gray
    [0, 12],   // row 14: near black
    [0, 93],   // row 15: near white
  ]

  const [s, l] = bands[row]
  return hslToHex(hue, s, l)
}

export function buildColorGrid(): ColorCell[][] {
  const grid: ColorCell[][] = []
  for (let row = 0; row < ROWS; row++) {
    const cells: ColorCell[] = []
    for (let col = 0; col < COLS; col++) {
      cells.push({
        col,
        row,
        hex: getColor(col, row),
        label: `${colLabel(col)}${row + 1}`,
      })
    }
    grid.push(cells)
  }
  return grid
}
```

- [ ] **Step 5: Run tests and verify they pass**

```bash
npm test
```
Expected: All 7 color tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/colors.ts src/__tests__/colors.test.ts src/test-setup.ts
git commit -m "feat: add types, color grid generation, and tests"
```

---

## Task 3: Scoring Logic (TDD)

**Files:**
- Create: `src/scoring.ts`, `src/__tests__/scoring.test.ts`

- [ ] **Step 1: Write failing scoring tests**

Create `src/__tests__/scoring.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { computeRoundScores } from '../scoring'
import type { Marker, Player } from '../types'

const makePlayer = (name: string, markerColor: string): Player => ({
  name, markerColor, score: 0,
})

describe('computeRoundScores — guesser scoring', () => {
  it('exact match gives guesser 3 points', () => {
    const markers: Marker[] = [
      { playerIndex: 1, col: 5, row: 5, markerNumber: 1 },
    ]
    const scores = computeRoundScores(markers, { col: 5, row: 5 }, 2)
    expect(scores.guesserPoints[1]).toBe(3)
  })

  it('distance 1 gives guesser 2 points', () => {
    const markers: Marker[] = [
      { playerIndex: 1, col: 6, row: 5, markerNumber: 1 },
    ]
    const scores = computeRoundScores(markers, { col: 5, row: 5 }, 2)
    expect(scores.guesserPoints[1]).toBe(2)
  })

  it('distance 2 gives guesser 1 point', () => {
    const markers: Marker[] = [
      { playerIndex: 1, col: 7, row: 5, markerNumber: 1 },
    ]
    const scores = computeRoundScores(markers, { col: 5, row: 5 }, 2)
    expect(scores.guesserPoints[1]).toBe(1)
  })

  it('distance 3 gives guesser 0 points', () => {
    const markers: Marker[] = [
      { playerIndex: 1, col: 8, row: 5, markerNumber: 1 },
    ]
    const scores = computeRoundScores(markers, { col: 5, row: 5 }, 2)
    expect(scores.guesserPoints[1]).toBe(0)
  })

  it('takes best of 2 markers for guesser (not additive)', () => {
    const markers: Marker[] = [
      { playerIndex: 1, col: 8, row: 5, markerNumber: 1 },  // distance 3 → 0
      { playerIndex: 1, col: 5, row: 5, markerNumber: 2 },  // distance 0 → 3
    ]
    const scores = computeRoundScores(markers, { col: 5, row: 5 }, 2)
    expect(scores.guesserPoints[1]).toBe(3)
  })

  it('diagonal distance uses Chebyshev (max of |dx|, |dy|)', () => {
    const markers: Marker[] = [
      { playerIndex: 1, col: 6, row: 6, markerNumber: 1 }, // |dx|=1, |dy|=1 → distance 1 → 2pts
    ]
    const scores = computeRoundScores(markers, { col: 5, row: 5 }, 2)
    expect(scores.guesserPoints[1]).toBe(2)
  })
})

describe('computeRoundScores — clue giver scoring', () => {
  it('clue giver gets 1 point per marker within distance 1', () => {
    const markers: Marker[] = [
      { playerIndex: 1, col: 5, row: 5, markerNumber: 1 }, // distance 0 → counts
      { playerIndex: 1, col: 6, row: 5, markerNumber: 2 }, // distance 1 → counts
      { playerIndex: 2, col: 7, row: 5, markerNumber: 1 }, // distance 2 → doesn't count
    ]
    const scores = computeRoundScores(markers, { col: 5, row: 5 }, 3)
    expect(scores.clueGiverPoints).toBe(2)
  })

  it('clue giver gets 0 if no markers near target', () => {
    const markers: Marker[] = [
      { playerIndex: 1, col: 10, row: 10, markerNumber: 1 },
    ]
    const scores = computeRoundScores(markers, { col: 0, row: 0 }, 2)
    expect(scores.clueGiverPoints).toBe(0)
  })
})
```

- [ ] **Step 2: Run to verify tests fail**

```bash
npm test
```
Expected: FAIL — `scoring` module not found.

- [ ] **Step 3: Implement scoring.ts**

Create `src/scoring.ts`:
```typescript
import type { Marker } from './types'

type RoundScores = {
  guesserPoints: Record<number, number>  // playerIndex → points
  clueGiverPoints: number
}

function chebyshev(
  col1: number, row1: number,
  col2: number, row2: number
): number {
  return Math.max(Math.abs(col1 - col2), Math.abs(row1 - row2))
}

function markerPoints(distance: number): number {
  if (distance === 0) return 3
  if (distance === 1) return 2
  if (distance === 2) return 1
  return 0
}

export function computeRoundScores(
  markers: Marker[],
  target: { col: number; row: number },
  playerCount: number
): RoundScores {
  const guesserPoints: Record<number, number> = {}

  // Init all players to 0
  for (let i = 0; i < playerCount; i++) {
    guesserPoints[i] = 0
  }

  // For each guesser, take best of their markers
  for (let i = 0; i < playerCount; i++) {
    const playerMarkers = markers.filter(m => m.playerIndex === i)
    const best = playerMarkers.reduce((max, m) => {
      const pts = markerPoints(chebyshev(m.col, m.row, target.col, target.row))
      return Math.max(max, pts)
    }, 0)
    guesserPoints[i] = best
  }

  // Clue giver: count all markers within distance 1
  const clueGiverPoints = markers.filter(m =>
    chebyshev(m.col, m.row, target.col, target.row) <= 1
  ).length

  return { guesserPoints, clueGiverPoints }
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npm test
```
Expected: All scoring tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scoring.ts src/__tests__/scoring.test.ts
git commit -m "feat: add scoring logic with TDD"
```

---

## Task 4: Game Reducer (TDD)

**Files:**
- Create: `src/gameReducer.ts`, `src/__tests__/gameReducer.test.ts`

- [ ] **Step 1: Write failing reducer tests**

Create `src/__tests__/gameReducer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { gameReducer, createInitialState } from '../gameReducer'
import type { GameState } from '../types'

const twoPlayers = ['Alice', 'Bob', 'Carol']

describe('createInitialState', () => {
  it('creates players with names and scores of 0', () => {
    const state = createInitialState(twoPlayers)
    expect(state.players.map(p => p.name)).toEqual(twoPlayers)
    state.players.forEach(p => expect(p.score).toBe(0))
  })

  it('starts in clue1 phase', () => {
    const state = createInitialState(twoPlayers)
    expect(state.phase).toBe('clue1')
  })

  it('sets clueGiverTurnCounts to all zeros', () => {
    const state = createInitialState(twoPlayers)
    expect(state.clueGiverTurnCounts).toEqual([0, 0, 0])
  })
})

describe('SUBMIT_CLUE1', () => {
  it('stores clue1 and transitions to guess1', () => {
    const state = createInitialState(twoPlayers)
    const next = gameReducer(state, { type: 'SUBMIT_CLUE1', clue: 'ocean' })
    expect(next.clue1).toBe('ocean')
    expect(next.phase).toBe('guess1')
  })

  it('sets guessOrder clockwise from clue giver', () => {
    const state = createInitialState(twoPlayers) // clue giver = 0
    const next = gameReducer(state, { type: 'SUBMIT_CLUE1', clue: 'ocean' })
    expect(next.guessOrder).toEqual([1, 2]) // clockwise from 0 in 3-player game
  })

  it('starts at first guesser', () => {
    const state = createInitialState(twoPlayers)
    const next = gameReducer(state, { type: 'SUBMIT_CLUE1', clue: 'ocean' })
    expect(next.currentGuessOrderIndex).toBe(0)
  })
})

describe('PLACE_MARKER', () => {
  it('adds a marker for the current guesser', () => {
    let state = createInitialState(twoPlayers)
    state = gameReducer(state, { type: 'SUBMIT_CLUE1', clue: 'ocean' })
    state = gameReducer(state, { type: 'PLACE_MARKER', col: 5, row: 3 })
    expect(state.markers).toHaveLength(1)
    expect(state.markers[0]).toMatchObject({
      playerIndex: 1, col: 5, row: 3, markerNumber: 1,
    })
  })

  it('replaces existing marker if same player places again in same phase', () => {
    let state = createInitialState(twoPlayers)
    state = gameReducer(state, { type: 'SUBMIT_CLUE1', clue: 'ocean' })
    state = gameReducer(state, { type: 'PLACE_MARKER', col: 5, row: 3 })
    state = gameReducer(state, { type: 'PLACE_MARKER', col: 7, row: 2 })
    const p1Markers = state.markers.filter(m => m.playerIndex === 1 && m.markerNumber === 1)
    expect(p1Markers).toHaveLength(1)
    expect(p1Markers[0]).toMatchObject({ col: 7, row: 2 })
  })
})

describe('CONFIRM_GUESS', () => {
  it('advances to next guesser when more guessers remain', () => {
    let state = createInitialState(['Alice', 'Bob', 'Carol', 'Dave']) // 4 players, 3 guessers
    state = gameReducer(state, { type: 'SUBMIT_CLUE1', clue: 'sky' })
    state = gameReducer(state, { type: 'PLACE_MARKER', col: 1, row: 1 })
    state = gameReducer(state, { type: 'CONFIRM_GUESS' })
    expect(state.currentGuessOrderIndex).toBe(1)
    expect(state.phase).toBe('guess1')
  })

  it('transitions to clue2 after last guesser in guess1', () => {
    let state = createInitialState(twoPlayers) // 3 players, 2 guessers
    state = gameReducer(state, { type: 'SUBMIT_CLUE1', clue: 'sky' })
    // First guesser (index 1)
    state = gameReducer(state, { type: 'PLACE_MARKER', col: 1, row: 1 })
    state = gameReducer(state, { type: 'CONFIRM_GUESS' })
    // Second guesser (index 2)
    state = gameReducer(state, { type: 'PLACE_MARKER', col: 2, row: 2 })
    state = gameReducer(state, { type: 'CONFIRM_GUESS' })
    expect(state.phase).toBe('clue2')
  })

  it('transitions to reveal after last guesser in guess2', () => {
    let state = createInitialState(twoPlayers)
    state = gameReducer(state, { type: 'SUBMIT_CLUE1', clue: 'sky' })
    state = gameReducer(state, { type: 'PLACE_MARKER', col: 1, row: 1 })
    state = gameReducer(state, { type: 'CONFIRM_GUESS' })
    state = gameReducer(state, { type: 'PLACE_MARKER', col: 2, row: 2 })
    state = gameReducer(state, { type: 'CONFIRM_GUESS' })
    state = gameReducer(state, { type: 'SUBMIT_CLUE2', clue: 'deep blue' })
    state = gameReducer(state, { type: 'PLACE_MARKER', col: 3, row: 3 })
    state = gameReducer(state, { type: 'CONFIRM_GUESS' })
    state = gameReducer(state, { type: 'PLACE_MARKER', col: 4, row: 4 })
    state = gameReducer(state, { type: 'CONFIRM_GUESS' })
    expect(state.phase).toBe('reveal')
  })
})

describe('NEXT_ROUND', () => {
  it('increments clue giver turn count and moves to next clue giver', () => {
    let state = createInitialState(twoPlayers)
    // Get to reveal
    state = gameReducer(state, { type: 'SUBMIT_CLUE1', clue: 'sky' })
    state = gameReducer(state, { type: 'PLACE_MARKER', col: 1, row: 1 })
    state = gameReducer(state, { type: 'CONFIRM_GUESS' })
    state = gameReducer(state, { type: 'PLACE_MARKER', col: 2, row: 2 })
    state = gameReducer(state, { type: 'CONFIRM_GUESS' })
    state = gameReducer(state, { type: 'SUBMIT_CLUE2', clue: 'deep' })
    state = gameReducer(state, { type: 'PLACE_MARKER', col: 3, row: 3 })
    state = gameReducer(state, { type: 'CONFIRM_GUESS' })
    state = gameReducer(state, { type: 'PLACE_MARKER', col: 4, row: 4 })
    state = gameReducer(state, { type: 'CONFIRM_GUESS' })
    // Now reveal → next round
    state = gameReducer(state, { type: 'NEXT_ROUND' })
    expect(state.clueGiverTurnCounts[0]).toBe(1)
    expect(state.currentClueGiverIndex).toBe(1)
    expect(state.phase).toBe('clue1')
    expect(state.markers).toHaveLength(0)
  })
})

describe('SUBMIT_CLUE2', () => {
  it('sets guessOrder counterclockwise (reverse of clue1 order)', () => {
    let state = createInitialState(['Alice', 'Bob', 'Carol', 'Dave']) // 4 players
    state = gameReducer(state, { type: 'SUBMIT_CLUE1', clue: 'sky' })
    // guess1 order: [1, 2, 3]
    for (let i = 0; i < 3; i++) {
      state = gameReducer(state, { type: 'PLACE_MARKER', col: i, row: i })
      state = gameReducer(state, { type: 'CONFIRM_GUESS' })
    }
    state = gameReducer(state, { type: 'SUBMIT_CLUE2', clue: 'pale sky' })
    expect(state.guessOrder).toEqual([3, 2, 1]) // reverse of [1, 2, 3]
    expect(state.phase).toBe('guess2')
  })
})
```

- [ ] **Step 2: Run to verify tests fail**

```bash
npm test
```
Expected: FAIL — `gameReducer` module not found.

- [ ] **Step 3: Implement gameReducer.ts**

Create `src/gameReducer.ts`:
```typescript
import type { GameState, Player, Marker, Phase } from './types'
import { buildColorGrid, COLS, ROWS } from './colors'
import { computeRoundScores } from './scoring'

// Pre-build the grid once
const COLOR_GRID = buildColorGrid()

const MARKER_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22', '#e91e63',
  '#00bcd4', '#8bc34a',
]

export type GameAction =
  | { type: 'START_GAME'; playerNames: string[] }
  | { type: 'SUBMIT_CLUE1'; clue: string }
  | { type: 'PLACE_MARKER'; col: number; row: number }
  | { type: 'CONFIRM_GUESS' }
  | { type: 'SUBMIT_CLUE2'; clue: string }
  | { type: 'NEXT_ROUND' }
  | { type: 'PLAY_AGAIN' }

function randomTargetColor() {
  const col = Math.floor(Math.random() * COLS)
  const row = Math.floor(Math.random() * ROWS)
  return COLOR_GRID[row][col]
}

function clockwiseOrder(clueGiverIndex: number, playerCount: number): number[] {
  const order: number[] = []
  for (let i = 1; i < playerCount; i++) {
    order.push((clueGiverIndex + i) % playerCount)
  }
  return order
}

function isGameOver(clueGiverTurnCounts: number[], playerCount: number): boolean {
  const maxTurns = playerCount <= 6 ? 2 : 1
  return clueGiverTurnCounts.every(count => count >= maxTurns)
}

export function createInitialState(playerNames: string[]): GameState {
  return {
    players: playerNames.map((name, i) => ({
      name,
      markerColor: MARKER_COLORS[i % MARKER_COLORS.length],
      score: 0,
    })),
    currentClueGiverIndex: 0,
    clueGiverTurnCounts: new Array(playerNames.length).fill(0),
    phase: 'clue1',
    targetColor: randomTargetColor(),
    clue1: '',
    clue2: '',
    markers: [],
    guessOrder: [],
    currentGuessOrderIndex: 0,
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return createInitialState(action.playerNames)

    case 'SUBMIT_CLUE1': {
      const guessOrder = clockwiseOrder(
        state.currentClueGiverIndex,
        state.players.length
      )
      return {
        ...state,
        clue1: action.clue,
        phase: 'guess1',
        guessOrder,
        currentGuessOrderIndex: 0,
      }
    }

    case 'PLACE_MARKER': {
      const markerNumber: 1 | 2 = state.phase === 'guess1' ? 1 : 2
      const currentPlayerIndex = state.guessOrder[state.currentGuessOrderIndex]
      // Remove existing marker for this player+markerNumber combo, then add new one
      const filtered = state.markers.filter(
        m => !(m.playerIndex === currentPlayerIndex && m.markerNumber === markerNumber)
      )
      const newMarker: Marker = {
        playerIndex: currentPlayerIndex,
        col: action.col,
        row: action.row,
        markerNumber,
      }
      return { ...state, markers: [...filtered, newMarker] }
    }

    case 'CONFIRM_GUESS': {
      const isLastGuesser =
        state.currentGuessOrderIndex >= state.guessOrder.length - 1

      if (!isLastGuesser) {
        return { ...state, currentGuessOrderIndex: state.currentGuessOrderIndex + 1 }
      }

      if (state.phase === 'guess1') {
        return { ...state, phase: 'clue2' }
      }

      // End of guess2 → reveal
      return { ...state, phase: 'reveal' }
    }

    case 'SUBMIT_CLUE2': {
      // Counterclockwise = reverse of clockwise order
      const guessOrder = clockwiseOrder(
        state.currentClueGiverIndex,
        state.players.length
      ).reverse()
      return {
        ...state,
        clue2: action.clue,
        phase: 'guess2',
        guessOrder,
        currentGuessOrderIndex: 0,
      }
    }

    case 'NEXT_ROUND': {
      if (!state.targetColor) return state

      // Apply scores
      const scores = computeRoundScores(
        state.markers,
        state.targetColor,
        state.players.length
      )

      const updatedPlayers = state.players.map((p, i) => {
        if (i === state.currentClueGiverIndex) {
          return { ...p, score: p.score + scores.clueGiverPoints }
        }
        return { ...p, score: p.score + (scores.guesserPoints[i] ?? 0) }
      })

      const updatedTurnCounts = [...state.clueGiverTurnCounts]
      updatedTurnCounts[state.currentClueGiverIndex]++

      const nextClueGiverIndex =
        (state.currentClueGiverIndex + 1) % state.players.length

      const gameOver = isGameOver(updatedTurnCounts, state.players.length)

      return {
        ...state,
        players: updatedPlayers,
        clueGiverTurnCounts: updatedTurnCounts,
        currentClueGiverIndex: nextClueGiverIndex,
        phase: gameOver ? 'end' : 'clue1',
        targetColor: randomTargetColor(),
        clue1: '',
        clue2: '',
        markers: [],
        guessOrder: [],
        currentGuessOrderIndex: 0,
      }
    }

    case 'PLAY_AGAIN':
      return {
        ...state,
        players: state.players.map(p => ({ ...p, score: 0 })),
        currentClueGiverIndex: 0,
        clueGiverTurnCounts: new Array(state.players.length).fill(0),
        phase: 'setup',
        targetColor: randomTargetColor(),
        clue1: '',
        clue2: '',
        markers: [],
        guessOrder: [],
        currentGuessOrderIndex: 0,
      }

    default:
      return state
  }
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npm test
```
Expected: All tests PASS (colors + scoring + gameReducer).

- [ ] **Step 5: Commit**

```bash
git add src/gameReducer.ts src/__tests__/gameReducer.test.ts
git commit -m "feat: add game reducer state machine with TDD"
```

---

## Task 5: App Shell + CSS Themes + ThemeToggle

**Files:**
- Create: `src/index.css`, `src/App.css`, `src/App.tsx`, `src/main.tsx`, `src/components/ThemeToggle.tsx`

- [ ] **Step 1: Create index.css with CSS reset and theme variables**

Create `src/index.css`:
```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  /* Playful light theme */
  --bg: #fff9f0;
  --surface: #ffffff;
  --surface-2: #fef0f5;
  --border: #ffd6e0;
  --text: #2d1b2e;
  --text-muted: #8a6a8a;
  --accent: #e91e63;
  --accent-2: #f06292;
  --accent-hover: #c2185b;
  --button-bg: #e91e63;
  --button-text: #ffffff;
  --input-bg: #ffffff;
  --input-border: #f48fb1;
  --radius: 14px;
  --radius-sm: 8px;
  --shadow: 0 2px 12px rgba(233,30,99,0.10);
  --shadow-lg: 0 4px 24px rgba(233,30,99,0.15);
  --pass-bg: #fff3e0;
  --pass-accent: #ff9800;
}

[data-theme="dark"] {
  --bg: #0f0f1a;
  --surface: #1a1a2e;
  --surface-2: #16213e;
  --border: #2a2a4a;
  --text: #f0f0ff;
  --text-muted: #9090bb;
  --accent: #e91e63;
  --accent-2: #f06292;
  --accent-hover: #ff4081;
  --button-bg: #e91e63;
  --button-text: #ffffff;
  --input-bg: #1a1a2e;
  --input-border: #3a3a6a;
  --radius: 14px;
  --radius-sm: 8px;
  --shadow: 0 2px 12px rgba(0,0,0,0.40);
  --shadow-lg: 0 4px 24px rgba(0,0,0,0.50);
  --pass-bg: #1a1a2e;
  --pass-accent: #ff9800;
}

html, body, #root {
  height: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg);
  color: var(--text);
  transition: background 0.2s, color 0.2s;
  -webkit-tap-highlight-color: transparent;
}

button {
  cursor: pointer;
  font-family: inherit;
  border: none;
  outline: none;
}

input {
  font-family: inherit;
  outline: none;
}
```

- [ ] **Step 2: Create App.css**

Create `src/App.css`:
```css
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}

.app-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 3: Create ThemeToggle.tsx**

Create `src/components/ThemeToggle.tsx`:
```typescript
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <button
      onClick={() => setDark(d => !d)}
      aria-label="Toggle theme"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '6px 10px',
        fontSize: '18px',
        lineHeight: 1,
        color: 'var(--text)',
      }}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
```

- [ ] **Step 4: Create App.tsx**

Create `src/App.tsx`:
```typescript
import { useReducer, useState } from 'react'
import { gameReducer, createInitialState, GameAction } from './gameReducer'
import { ThemeToggle } from './components/ThemeToggle'
import { HomeScreen } from './components/HomeScreen'
import { PlayerSetup } from './components/PlayerSetup'
import './App.css'

// Placeholder — screens will be wired in Task 12
function PlaceholderScreen({ phase }: { phase: string }) {
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h2>Phase: {phase}</h2>
      <p style={{ color: 'var(--text-muted)' }}>Screen coming soon…</p>
    </div>
  )
}

type AppPhase = 'home' | 'setup' | 'game'

export default function App() {
  const [appPhase, setAppPhase] = useState<AppPhase>('home')
  const [gameState, dispatch] = useReducer(
    gameReducer,
    ['Player 1', 'Player 2', 'Player 3'],
    createInitialState
  )

  function handleStartSetup() {
    setAppPhase('setup')
  }

  function handleStartGame(playerNames: string[]) {
    dispatch({ type: 'START_GAME', playerNames })
    setAppPhase('game')
  }

  return (
    <div className="app">
      <header className="app-header">
        <ThemeToggle />
      </header>
      <main className="app-body">
        {appPhase === 'home' && (
          <HomeScreen onStart={handleStartSetup} />
        )}
        {appPhase === 'setup' && (
          <PlayerSetup onStart={handleStartGame} />
        )}
        {appPhase === 'game' && (
          <PlaceholderScreen phase={gameState.phase} />
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 5: Update main.tsx**

Replace `src/main.tsx` with:
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 6: Verify dev server runs**

```bash
npm run dev
```
Expected: App loads with a home screen placeholder and theme toggle works. Dark mode persists on refresh.

- [ ] **Step 7: Commit**

```bash
git add src/index.css src/App.css src/App.tsx src/main.tsx src/components/ThemeToggle.tsx
git commit -m "feat: add app shell, CSS themes, and theme toggle"
```

---

## Task 6: HomeScreen + PlayerSetup

**Files:**
- Create: `src/components/HomeScreen.tsx`, `src/components/HomeScreen.css`, `src/components/PlayerSetup.tsx`, `src/components/PlayerSetup.css`

- [ ] **Step 1: Create HomeScreen.css**

Create `src/components/HomeScreen.css`:
```css
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 32px 16px;
  text-align: center;
  gap: 24px;
}

.home-title {
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: 900;
  letter-spacing: -1px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2), #ff9800);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
}

.home-subtitle {
  font-size: 1.1rem;
  color: var(--text-muted);
  max-width: 320px;
}

.home-grid-preview {
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  gap: 3px;
  border-radius: var(--radius);
  overflow: hidden;
  width: min(360px, 90vw);
  box-shadow: var(--shadow-lg);
}

.home-grid-preview div {
  aspect-ratio: 1;
}

.btn-primary {
  background: var(--button-bg);
  color: var(--button-text);
  border-radius: var(--radius);
  padding: 16px 48px;
  font-size: 1.2rem;
  font-weight: 700;
  box-shadow: var(--shadow);
  transition: background 0.15s, transform 0.1s;
}

.btn-primary:active {
  transform: scale(0.97);
}

.btn-primary:hover {
  background: var(--accent-hover);
}
```

- [ ] **Step 2: Create HomeScreen.tsx**

Create `src/components/HomeScreen.tsx`:
```typescript
import { buildColorGrid } from '../colors'
import './HomeScreen.css'

const PREVIEW_COLORS = buildColorGrid()
  .flatMap(row => row)
  .filter((_, i) => i % 2 === 0)  // every other cell for a 240-cell preview
  .slice(0, 60)

type Props = { onStart: () => void }

export function HomeScreen({ onStart }: Props) {
  return (
    <div className="home">
      <h1 className="home-title">Hues &amp; Cues</h1>
      <p className="home-subtitle">
        Describe a color. Find it on the grid. Score points for getting close.
      </p>
      <div className="home-grid-preview">
        {PREVIEW_COLORS.map(cell => (
          <div key={cell.label} style={{ background: cell.hex }} />
        ))}
      </div>
      <button className="btn-primary" onClick={onStart}>
        New Game
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create PlayerSetup.css**

Create `src/components/PlayerSetup.css`:
```css
.setup {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  gap: 24px;
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
}

.setup h2 {
  font-size: 1.8rem;
  font-weight: 800;
}

.setup-subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.player-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.player-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.player-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}

.player-input {
  flex: 1;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text);
  font-size: 1rem;
  transition: border-color 0.15s;
}

.player-input:focus {
  border-color: var(--accent);
}

.btn-remove {
  background: transparent;
  color: var(--text-muted);
  font-size: 1.3rem;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: color 0.15s;
  line-height: 1;
}

.btn-remove:hover {
  color: var(--accent);
}

.btn-add {
  background: var(--surface-2);
  color: var(--accent);
  border: 1.5px dashed var(--accent-2);
  border-radius: var(--radius-sm);
  padding: 10px;
  width: 100%;
  font-size: 0.95rem;
  font-weight: 600;
  transition: background 0.15s;
}

.btn-add:hover {
  background: var(--border);
}

.setup-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.setup-error {
  color: var(--accent);
  font-size: 0.9rem;
  text-align: center;
}
```

- [ ] **Step 4: Create PlayerSetup.tsx**

Create `src/components/PlayerSetup.tsx`:
```typescript
import { useState } from 'react'
import './PlayerSetup.css'

const MARKER_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22', '#e91e63',
  '#00bcd4', '#8bc34a',
]

type Props = { onStart: (playerNames: string[]) => void }

export function PlayerSetup({ onStart }: Props) {
  const [names, setNames] = useState(['', '', ''])
  const [error, setError] = useState('')

  function updateName(index: number, value: string) {
    setNames(prev => prev.map((n, i) => (i === index ? value : n)))
    setError('')
  }

  function addPlayer() {
    if (names.length < 10) setNames(prev => [...prev, ''])
  }

  function removePlayer(index: number) {
    if (names.length > 3) setNames(prev => prev.filter((_, i) => i !== index))
  }

  function handleStart() {
    const filled = names.map(n => n.trim()).filter(Boolean)
    if (filled.length < 3) {
      setError('At least 3 players are required.')
      return
    }
    if (new Set(filled).size !== filled.length) {
      setError('Player names must be unique.')
      return
    }
    onStart(filled)
  }

  return (
    <div className="setup">
      <h2>Who's playing?</h2>
      <p className="setup-subtitle">Enter 3–10 player names to get started.</p>

      <div className="player-list">
        {names.map((name, i) => (
          <div className="player-row" key={i}>
            <div
              className="player-dot"
              style={{ background: MARKER_COLORS[i % MARKER_COLORS.length] }}
            />
            <input
              className="player-input"
              type="text"
              placeholder={`Player ${i + 1}`}
              value={name}
              onChange={e => updateName(i, e.target.value)}
              maxLength={20}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
            />
            {names.length > 3 && (
              <button className="btn-remove" onClick={() => removePlayer(i)} aria-label="Remove player">
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {names.length < 10 && (
        <button className="btn-add" onClick={addPlayer}>
          + Add player
        </button>
      )}

      {error && <p className="setup-error">{error}</p>}

      <div className="setup-actions">
        <button className="btn-primary" onClick={handleStart}>
          Start Game
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify in browser**

```bash
npm run dev
```
Navigate through Home → Player Setup. Add/remove players, try starting with < 3 players (should show error), try duplicate names (should show error), then start successfully.

- [ ] **Step 6: Commit**

```bash
git add src/components/HomeScreen.tsx src/components/HomeScreen.css src/components/PlayerSetup.tsx src/components/PlayerSetup.css
git commit -m "feat: add HomeScreen and PlayerSetup components"
```

---

## Task 7: ColorGrid Component

**Files:**
- Create: `src/components/ColorGrid.tsx`, `src/components/ColorGrid.css`

- [ ] **Step 1: Create ColorGrid.css**

Create `src/components/ColorGrid.css`:
```css
.grid-wrapper {
  width: 100%;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  border: 2px solid var(--border);
  background: var(--surface);
}

.grid-container {
  display: inline-grid;
  /* 30 cols + 1 label col on left */
  grid-template-columns: 24px repeat(30, 1fr);
  grid-template-rows: 24px repeat(16, 1fr);
  min-width: 640px; /* desktop minimum */
}

/* Column header row */
.grid-col-header {
  font-size: 9px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  user-select: none;
}

.grid-col-header.corner {
  border-right: 1px solid var(--border);
}

/* Row label cells */
.grid-row-label {
  font-size: 9px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  background: var(--surface);
  border-right: 1px solid var(--border);
  user-select: none;
}

/* Color cells */
.grid-cell {
  position: relative;
  aspect-ratio: 1;
  cursor: pointer;
  transition: transform 0.05s, z-index 0s;
  min-width: 20px;
  min-height: 20px;
}

.grid-cell:hover {
  transform: scale(1.15);
  z-index: 10;
  box-shadow: 0 0 0 2px #fff, 0 0 0 3px var(--text);
}

.grid-cell.occupied {
  cursor: default;
}

.grid-cell.occupied:hover {
  transform: none;
}

/* Marker overlay */
.marker {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.marker-dot {
  width: 55%;
  height: 55%;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.9);
  box-shadow: 0 1px 4px rgba(0,0,0,0.5);
}

.marker-dot.marker-2 {
  border-style: dashed;
  opacity: 0.85;
}

/* Target highlight (reveal phase) */
.grid-cell.target {
  z-index: 5;
  box-shadow: 0 0 0 3px #fff, 0 0 0 5px #000;
}

/* Scoring frame */
.grid-cell.in-frame {
  box-shadow: inset 0 0 0 2px rgba(255,255,255,0.7);
}

.grid-cell.frame-edge {
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.4);
}

/* Mobile grid */
@media (max-width: 700px) {
  .grid-container {
    grid-template-columns: 18px repeat(30, 1fr);
    grid-template-rows: 18px repeat(16, 1fr);
    min-width: 420px;
  }

  .grid-col-header,
  .grid-row-label {
    font-size: 7px;
  }
}
```

- [ ] **Step 2: Create ColorGrid.tsx**

Create `src/components/ColorGrid.tsx`:
```typescript
import { buildColorGrid, colLabel, COLS, ROWS } from '../colors'
import type { Marker } from '../types'
import './ColorGrid.css'

const GRID = buildColorGrid()

type Props = {
  markers: Marker[]
  onCellClick?: (col: number, row: number) => void
  targetCol?: number
  targetRow?: number
  showFrame?: boolean       // show scoring frame on reveal
  disabled?: boolean
}

function chebyshev(c1: number, r1: number, c2: number, r2: number) {
  return Math.max(Math.abs(c1 - c2), Math.abs(r1 - r2))
}

export function ColorGrid({
  markers,
  onCellClick,
  targetCol,
  targetRow,
  showFrame = false,
  disabled = false,
}: Props) {
  const markerMap = new Map<string, Marker[]>()
  for (const m of markers) {
    const key = `${m.col},${m.row}`
    if (!markerMap.has(key)) markerMap.set(key, [])
    markerMap.get(key)!.push(m)
  }

  function cellClass(col: number, row: number): string {
    const classes = ['grid-cell']
    const hasMarker = markerMap.has(`${col},${row}`)
    if (hasMarker) classes.push('occupied')
    if (targetCol !== undefined && targetRow !== undefined) {
      if (col === targetCol && row === targetRow) classes.push('target')
      if (showFrame) {
        const d = chebyshev(col, row, targetCol, targetRow)
        if (d === 1) classes.push('in-frame')
        if (d === 2) classes.push('frame-edge')
      }
    }
    return classes.join(' ')
  }

  function handleClick(col: number, row: number) {
    if (disabled) return
    if (markerMap.has(`${col},${row}`)) return
    onCellClick?.(col, row)
  }

  return (
    <div className="grid-wrapper">
      <div className="grid-container">
        {/* Top-left corner */}
        <div className="grid-col-header corner" />
        {/* Column headers */}
        {Array.from({ length: COLS }, (_, c) => (
          <div key={c} className="grid-col-header">{colLabel(c)}</div>
        ))}

        {/* Rows */}
        {GRID.map((rowCells, r) => (
          <>
            {/* Row label */}
            <div key={`label-${r}`} className="grid-row-label">{r + 1}</div>
            {/* Color cells */}
            {rowCells.map(cell => {
              const cellMarkers = markerMap.get(`${cell.col},${cell.row}`) ?? []
              return (
                <div
                  key={cell.label}
                  className={cellClass(cell.col, cell.row)}
                  style={{ background: cell.hex }}
                  onClick={() => handleClick(cell.col, cell.row)}
                  title={cell.label}
                >
                  {cellMarkers.map(m => (
                    <div key={`${m.playerIndex}-${m.markerNumber}`} className="marker">
                      <div
                        className={`marker-dot${m.markerNumber === 2 ? ' marker-2' : ''}`}
                        style={{ background: 'currentColor' }}
                      />
                    </div>
                  ))}
                </div>
              )
            })}
          </>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add a quick smoke test — verify grid renders in browser**

Temporarily add `<ColorGrid markers={[]} />` to `App.tsx` inside the game placeholder. Run `npm run dev`, navigate to game phase, verify the full 480-color grid appears with coordinate labels.

- [ ] **Step 4: Fix marker colors — update ColorGrid to use player marker colors**

The markers need to render in the correct player color. Update the marker rendering in ColorGrid.tsx to accept a `players` prop:

```typescript
// Add to Props type:
players?: import('../types').Player[]

// Update the marker render inside cellMarkers.map:
{cellMarkers.map(m => {
  const color = players?.[m.playerIndex]?.markerColor ?? '#ffffff'
  return (
    <div key={`${m.playerIndex}-${m.markerNumber}`} className="marker">
      <div
        className={`marker-dot${m.markerNumber === 2 ? ' marker-2' : ''}`}
        style={{ background: color, color }}
      />
    </div>
  )
})}
```

- [ ] **Step 5: Revert the smoke test addition from App.tsx**

Remove the temporary `<ColorGrid markers={[]} />` from App.tsx.

- [ ] **Step 6: Commit**

```bash
git add src/components/ColorGrid.tsx src/components/ColorGrid.css
git commit -m "feat: add ColorGrid component with marker overlay and scoring frame"
```

---

## Task 8: PassDevice + ClueScreen

**Files:**
- Create: `src/components/PassDevice.tsx`, `src/components/PassDevice.css`, `src/components/ClueScreen.tsx`, `src/components/ClueScreen.css`

- [ ] **Step 1: Create PassDevice.css**

Create `src/components/PassDevice.css`:
```css
.pass-device {
  position: fixed;
  inset: 0;
  background: var(--pass-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 32px;
  text-align: center;
  z-index: 200;
}

.pass-icon {
  font-size: 4rem;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.pass-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--pass-accent);
}

.pass-subtitle {
  font-size: 1.1rem;
  color: var(--text-muted);
  max-width: 300px;
}

.pass-name {
  font-size: 2rem;
  font-weight: 900;
  color: var(--text);
}

.pass-btn {
  background: var(--pass-accent);
  color: #fff;
  border-radius: var(--radius);
  padding: 16px 40px;
  font-size: 1.1rem;
  font-weight: 700;
  box-shadow: var(--shadow);
  transition: opacity 0.15s, transform 0.1s;
  margin-top: 8px;
}

.pass-btn:active {
  transform: scale(0.97);
}
```

- [ ] **Step 2: Create PassDevice.tsx**

Create `src/components/PassDevice.tsx`:
```typescript
import './PassDevice.css'

type Props = {
  toName: string
  context: string   // e.g. "place your first guess"
  onReady: () => void
}

export function PassDevice({ toName, context, onReady }: Props) {
  return (
    <div className="pass-device">
      <div className="pass-icon">📱</div>
      <p className="pass-title">Pass the device!</p>
      <p className="pass-subtitle">Hand it to</p>
      <p className="pass-name">{toName}</p>
      <p className="pass-subtitle">{context}</p>
      <button className="pass-btn" onClick={onReady}>
        I'm ready
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create ClueScreen.css**

Create `src/components/ClueScreen.css`:
```css
.clue-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  gap: 24px;
  max-width: 560px;
  margin: 0 auto;
  width: 100%;
}

.clue-screen h2 {
  font-size: 1.5rem;
  font-weight: 800;
}

.clue-phase-label {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--accent);
}

.target-color-card {
  width: min(260px, 80vw);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  border: 2px solid var(--border);
}

.target-color-swatch {
  height: 120px;
  width: 100%;
}

.target-color-label {
  background: var(--surface);
  padding: 10px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted);
  text-align: center;
}

.clue-restriction {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: center;
  max-width: 380px;
}

.clue-restriction strong {
  color: var(--text);
}

.clue-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 380px;
}

.clue-input-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.clue-text-input {
  width: 100%;
  padding: 14px 16px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text);
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
  transition: border-color 0.15s;
}

.clue-text-input:focus {
  border-color: var(--accent);
}

.clue-error {
  color: var(--accent);
  font-size: 0.85rem;
  text-align: center;
}
```

- [ ] **Step 4: Create ClueScreen.tsx**

Create `src/components/ClueScreen.tsx`:
```typescript
import { useState, useRef, useEffect } from 'react'
import type { GameState } from '../types'
import type { GameAction } from '../gameReducer'
import './ClueScreen.css'

type Props = {
  state: GameState
  dispatch: (action: GameAction) => void
}

function validateClue(value: string, maxWords: number): string | null {
  const words = value.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'Enter a clue.'
  if (words.length > maxWords)
    return maxWords === 1 ? 'Only 1 word allowed for the first clue.' : 'Max 2 words for the second clue.'
  return null
}

export function ClueScreen({ state, dispatch }: Props) {
  const isClue1 = state.phase === 'clue1'
  const maxWords = isClue1 ? 1 : 2
  const clueGiver = state.players[state.currentClueGiverIndex]
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    setValue('')
    setError('')
  }, [state.phase])

  function handleSubmit() {
    const err = validateClue(value, maxWords)
    if (err) { setError(err); return }
    if (isClue1) {
      dispatch({ type: 'SUBMIT_CLUE1', clue: value.trim() })
    } else {
      dispatch({ type: 'SUBMIT_CLUE2', clue: value.trim() })
    }
  }

  return (
    <div className="clue-screen">
      <p className="clue-phase-label">
        {isClue1 ? 'Clue 1 of 2' : 'Clue 2 of 2'}
      </p>
      <h2>{clueGiver.name}'s turn to give a clue</h2>

      {state.targetColor && (
        <div className="target-color-card">
          <div
            className="target-color-swatch"
            style={{ background: state.targetColor.hex }}
          />
          <div className="target-color-label">
            Your target color — {state.targetColor.label}
          </div>
        </div>
      )}

      <div className="clue-restriction">
        <strong>Restrictions:</strong> No color names (red, blue, etc.), no
        lighter/darker, no pointing at objects in the room, no board positions.
      </div>

      <div className="clue-input-group">
        <label className="clue-input-label">
          {isClue1 ? 'Your 1-word clue' : 'Your 2-word clue'}
          {!isClue1 && state.clue1 && (
            <span style={{ fontWeight: 400, marginLeft: 8, color: 'var(--accent-2)' }}>
              (first clue: "{state.clue1}")
            </span>
          )}
        </label>
        <input
          ref={inputRef}
          className="clue-text-input"
          type="text"
          placeholder={isClue1 ? 'e.g. "lavender"' : 'e.g. "dusty sky"'}
          value={value}
          onChange={e => { setValue(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          maxLength={40}
        />
        {error && <p className="clue-error">{error}</p>}
      </div>

      <button className="btn-primary" onClick={handleSubmit}>
        Submit clue →
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/PassDevice.tsx src/components/PassDevice.css src/components/ClueScreen.tsx src/components/ClueScreen.css
git commit -m "feat: add PassDevice overlay and ClueScreen"
```

---

## Task 9: GuessScreen

**Files:**
- Create: `src/components/GuessScreen.tsx`, `src/components/GuessScreen.css`

- [ ] **Step 1: Create GuessScreen.css**

Create `src/components/GuessScreen.css`:
```css
.guess-screen {
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 16px;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.guess-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.guess-phase-label {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--accent);
}

.guess-header h2 {
  font-size: 1.3rem;
  font-weight: 800;
}

.clue-display {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
}

.clue-display-row {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.clue-display-row strong {
  color: var(--text);
  font-size: 1.05rem;
}

.guess-selected-label {
  font-size: 0.9rem;
  color: var(--text-muted);
  min-height: 1.5em;
}

.guess-selected-label.has-selection {
  color: var(--accent);
  font-weight: 600;
}

.guess-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-confirm {
  background: var(--button-bg);
  color: #fff;
  border-radius: var(--radius);
  padding: 12px 28px;
  font-size: 1rem;
  font-weight: 700;
  box-shadow: var(--shadow);
  transition: background 0.15s, transform 0.1s;
}

.btn-confirm:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.btn-confirm:not(:disabled):active {
  transform: scale(0.97);
}
```

- [ ] **Step 2: Create GuessScreen.tsx**

Create `src/components/GuessScreen.tsx`:
```typescript
import { useState } from 'react'
import type { GameState } from '../types'
import type { GameAction } from '../gameReducer'
import { ColorGrid } from './ColorGrid'
import './GuessScreen.css'

type Props = {
  state: GameState
  dispatch: (action: GameAction) => void
}

export function GuessScreen({ state, dispatch }: Props) {
  const isGuess1 = state.phase === 'guess1'
  const currentPlayerIndex = state.guessOrder[state.currentGuessOrderIndex]
  const currentPlayer = state.players[currentPlayerIndex]
  const [pendingCol, setPendingCol] = useState<number | null>(null)
  const [pendingRow, setPendingRow] = useState<number | null>(null)

  // Markers already confirmed (not pending)
  const confirmedMarkers = state.markers

  // Build markers to display: confirmed + pending
  const displayMarkers = pendingCol !== null && pendingRow !== null
    ? [
        ...confirmedMarkers.filter(
          m => !(m.playerIndex === currentPlayerIndex && m.markerNumber === (isGuess1 ? 1 : 2))
        ),
        {
          playerIndex: currentPlayerIndex,
          col: pendingCol,
          row: pendingRow,
          markerNumber: (isGuess1 ? 1 : 2) as 1 | 2,
        },
      ]
    : confirmedMarkers

  function handleCellClick(col: number, row: number) {
    setPendingCol(col)
    setPendingRow(row)
    dispatch({ type: 'PLACE_MARKER', col, row })
  }

  function handleConfirm() {
    if (pendingCol === null) return
    dispatch({ type: 'CONFIRM_GUESS' })
    setPendingCol(null)
    setPendingRow(null)
  }

  const hasPlaced = pendingCol !== null

  return (
    <div className="guess-screen">
      <div className="guess-header">
        <p className="guess-phase-label">
          {isGuess1 ? 'Round 1 guessing' : 'Round 2 guessing'}
        </p>
        <h2>{currentPlayer.name}, tap a color on the grid</h2>
      </div>

      <div className="clue-display">
        <div className="clue-display-row">
          Clue 1: <strong>{state.clue1}</strong>
        </div>
        {!isGuess1 && state.clue2 && (
          <div className="clue-display-row">
            Clue 2: <strong>{state.clue2}</strong>
          </div>
        )}
      </div>

      <p className={`guess-selected-label${hasPlaced ? ' has-selection' : ''}`}>
        {hasPlaced
          ? `Selected — tap a different cell to move your marker`
          : 'Tap a color to place your marker'}
      </p>

      <ColorGrid
        markers={displayMarkers}
        players={state.players}
        onCellClick={handleCellClick}
      />

      <div className="guess-actions">
        <button
          className="btn-confirm"
          onClick={handleConfirm}
          disabled={!hasPlaced}
        >
          Confirm guess →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/GuessScreen.tsx src/components/GuessScreen.css
git commit -m "feat: add GuessScreen with interactive color grid"
```

---

## Task 10: RevealScreen

**Files:**
- Create: `src/components/RevealScreen.tsx`, `src/components/RevealScreen.css`

- [ ] **Step 1: Create RevealScreen.css**

Create `src/components/RevealScreen.css`:
```css
.reveal-screen {
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 20px;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.reveal-screen h2 {
  font-size: 1.5rem;
  font-weight: 800;
  text-align: center;
}

.reveal-target-info {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
}

.reveal-swatch {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--border);
  flex-shrink: 0;
}

.reveal-clues {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reveal-clue-line {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.reveal-clue-line strong {
  color: var(--text);
}

.round-scores {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.round-scores h3 {
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
}

.score-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
}

.score-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.score-name {
  flex: 1;
  font-weight: 600;
}

.score-delta {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--accent);
  min-width: 40px;
  text-align: right;
}

.score-delta.clue-giver {
  color: #ff9800;
}

.score-total {
  font-size: 0.9rem;
  color: var(--text-muted);
  min-width: 60px;
  text-align: right;
}

.reveal-actions {
  display: flex;
  justify-content: center;
  padding-bottom: 16px;
}
```

- [ ] **Step 2: Create RevealScreen.tsx**

Create `src/components/RevealScreen.tsx`:
```typescript
import type { GameState } from '../types'
import type { GameAction } from '../gameReducer'
import { ColorGrid } from './ColorGrid'
import { computeRoundScores } from '../scoring'
import './RevealScreen.css'

type Props = {
  state: GameState
  dispatch: (action: GameAction) => void
}

export function RevealScreen({ state, dispatch }: Props) {
  if (!state.targetColor) return null

  const scores = computeRoundScores(
    state.markers,
    state.targetColor,
    state.players.length
  )
  const clueGiver = state.players[state.currentClueGiverIndex]

  return (
    <div className="reveal-screen">
      <h2>Reveal! 🎨</h2>

      <div className="reveal-target-info">
        <div
          className="reveal-swatch"
          style={{ background: state.targetColor.hex }}
        />
        <div className="reveal-clues">
          <div className="reveal-clue-line">
            Clue 1: <strong>{state.clue1}</strong>
          </div>
          <div className="reveal-clue-line">
            Clue 2: <strong>{state.clue2}</strong>
          </div>
          <div className="reveal-clue-line">
            Target: <strong>{state.targetColor.label}</strong>
          </div>
        </div>
      </div>

      <ColorGrid
        markers={state.markers}
        players={state.players}
        targetCol={state.targetColor.col}
        targetRow={state.targetColor.row}
        showFrame
        disabled
      />

      <div className="round-scores">
        <h3>This round</h3>
        {/* Clue giver row */}
        <div className="score-row">
          <div
            className="score-dot"
            style={{ background: clueGiver.markerColor }}
          />
          <span className="score-name">
            {clueGiver.name} <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>(clue giver)</span>
          </span>
          <span className="score-delta clue-giver">
            +{scores.clueGiverPoints}
          </span>
          <span className="score-total">
            → {clueGiver.score + scores.clueGiverPoints} pts
          </span>
        </div>
        {/* Guessers */}
        {state.players.map((player, i) => {
          if (i === state.currentClueGiverIndex) return null
          const delta = scores.guesserPoints[i] ?? 0
          return (
            <div key={i} className="score-row">
              <div className="score-dot" style={{ background: player.markerColor }} />
              <span className="score-name">{player.name}</span>
              <span className="score-delta">+{delta}</span>
              <span className="score-total">→ {player.score + delta} pts</span>
            </div>
          )
        })}
      </div>

      <div className="reveal-actions">
        <button className="btn-primary" onClick={() => dispatch({ type: 'NEXT_ROUND' })}>
          Next round →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/RevealScreen.tsx src/components/RevealScreen.css
git commit -m "feat: add RevealScreen with scoring frame and round scores"
```

---

## Task 11: FinalScores + Scoreboard

**Files:**
- Create: `src/components/FinalScores.tsx`, `src/components/FinalScores.css`, `src/components/Scoreboard.tsx`, `src/components/Scoreboard.css`

- [ ] **Step 1: Create Scoreboard.css**

Create `src/components/Scoreboard.css`:
```css
.scoreboard {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.scoreboard-title {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.scoreboard-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.scoreboard-rank {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
  min-width: 20px;
}

.scoreboard-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}

.scoreboard-name {
  flex: 1;
  font-weight: 600;
  font-size: 0.95rem;
}

.scoreboard-score {
  font-weight: 800;
  font-size: 1rem;
  color: var(--accent);
}
```

- [ ] **Step 2: Create Scoreboard.tsx**

Create `src/components/Scoreboard.tsx`:
```typescript
import type { Player } from '../types'
import './Scoreboard.css'

type Props = { players: Player[] }

export function Scoreboard({ players }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score)
  return (
    <div className="scoreboard">
      <div className="scoreboard-title">Scores</div>
      {sorted.map((player, i) => (
        <div key={player.name} className="scoreboard-row">
          <span className="scoreboard-rank">#{i + 1}</span>
          <div className="scoreboard-dot" style={{ background: player.markerColor }} />
          <span className="scoreboard-name">{player.name}</span>
          <span className="scoreboard-score">{player.score}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create FinalScores.css**

Create `src/components/FinalScores.css`:
```css
.final-scores {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  gap: 24px;
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
  text-align: center;
}

.final-scores-trophy {
  font-size: 4rem;
}

.final-scores h2 {
  font-size: 2rem;
  font-weight: 900;
}

.winner-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--accent);
}

.final-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.btn-secondary {
  background: var(--surface-2);
  color: var(--text);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  transition: background 0.15s;
}

.btn-secondary:hover {
  background: var(--border);
}
```

- [ ] **Step 4: Create FinalScores.tsx**

Create `src/components/FinalScores.tsx`:
```typescript
import type { GameState } from '../types'
import type { GameAction } from '../gameReducer'
import { Scoreboard } from './Scoreboard'
import './FinalScores.css'

type Props = {
  state: GameState
  dispatch: (action: GameAction) => void
  onNewGame: () => void
}

export function FinalScores({ state, dispatch, onNewGame }: Props) {
  const sorted = [...state.players].sort((a, b) => b.score - a.score)
  const winner = sorted[0]

  return (
    <div className="final-scores">
      <div className="final-scores-trophy">🏆</div>
      <h2>Game over!</h2>
      <p>Winner:</p>
      <p className="winner-name">{winner.name}</p>

      <Scoreboard players={state.players} />

      <div className="final-actions">
        <button
          className="btn-primary"
          onClick={() => { dispatch({ type: 'PLAY_AGAIN' }); onNewGame() }}
        >
          Play again (same players)
        </button>
        <button className="btn-secondary" onClick={onNewGame}>
          New game (change players)
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Scoreboard.tsx src/components/Scoreboard.css src/components/FinalScores.tsx src/components/FinalScores.css
git commit -m "feat: add Scoreboard and FinalScores components"
```

---

## Task 12: Wire Full Game Flow in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace App.tsx with the fully wired version**

Replace the entire contents of `src/App.tsx`:
```typescript
import { useReducer, useState } from 'react'
import { gameReducer, createInitialState } from './gameReducer'
import type { GameAction } from './gameReducer'
import { ThemeToggle } from './components/ThemeToggle'
import { HomeScreen } from './components/HomeScreen'
import { PlayerSetup } from './components/PlayerSetup'
import { ClueScreen } from './components/ClueScreen'
import { GuessScreen } from './components/GuessScreen'
import { PassDevice } from './components/PassDevice'
import { RevealScreen } from './components/RevealScreen'
import { FinalScores } from './components/FinalScores'
import './App.css'

type AppPhase = 'home' | 'setup' | 'game'

type PendingPass = { toName: string; context: string } | null

function clockwiseGuessers(clueGiverIndex: number, playerCount: number): number[] {
  const order: number[] = []
  for (let i = 1; i < playerCount; i++) {
    order.push((clueGiverIndex + i) % playerCount)
  }
  return order
}

export default function App() {
  const [appPhase, setAppPhase] = useState<AppPhase>('home')
  const [gameState, dispatch] = useReducer(
    gameReducer,
    ['Player 1', 'Player 2', 'Player 3'],
    createInitialState
  )
  const [pendingPass, setPendingPass] = useState<PendingPass>(null)

  function handleStartGame(playerNames: string[]) {
    dispatch({ type: 'START_GAME', playerNames })
    setAppPhase('game')
  }

  // All dispatches that need a pass-device screen go through here
  function smartDispatch(action: GameAction) {
    switch (action.type) {
      case 'SUBMIT_CLUE1': {
        dispatch(action)
        const order = clockwiseGuessers(gameState.currentClueGiverIndex, gameState.players.length)
        setPendingPass({
          toName: gameState.players[order[0]].name,
          context: 'place your first guess',
        })
        return
      }
      case 'CONFIRM_GUESS': {
        const isLast = gameState.currentGuessOrderIndex >= gameState.guessOrder.length - 1
        dispatch(action)
        if (!isLast) {
          // Pass to next guesser
          const nextIdx = gameState.guessOrder[gameState.currentGuessOrderIndex + 1]
          setPendingPass({
            toName: gameState.players[nextIdx].name,
            context: gameState.phase === 'guess1' ? 'place your first guess' : 'place your second guess',
          })
        } else if (gameState.phase === 'guess1') {
          // Last guess1 guesser done → pass to clue giver for clue2
          setPendingPass({
            toName: gameState.players[gameState.currentClueGiverIndex].name,
            context: 'give your second clue',
          })
        }
        // Last guess2 guesser → no pass, goes to reveal (everyone watches)
        return
      }
      case 'SUBMIT_CLUE2': {
        dispatch(action)
        const order = clockwiseGuessers(gameState.currentClueGiverIndex, gameState.players.length).reverse()
        setPendingPass({
          toName: gameState.players[order[0]].name,
          context: 'place your second guess',
        })
        return
      }
      default:
        dispatch(action)
    }
  }

  if (pendingPass) {
    return (
      <div className="app">
        <header className="app-header"><ThemeToggle /></header>
        <PassDevice
          toName={pendingPass.toName}
          context={pendingPass.context}
          onReady={() => setPendingPass(null)}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <ThemeToggle />
      </header>
      <main className="app-body">
        {appPhase === 'home' && (
          <HomeScreen onStart={() => setAppPhase('setup')} />
        )}
        {appPhase === 'setup' && (
          <PlayerSetup onStart={handleStartGame} />
        )}
        {appPhase === 'game' && (
          <>
            {(gameState.phase === 'clue1' || gameState.phase === 'clue2') && (
              <ClueScreen state={gameState} dispatch={smartDispatch} />
            )}
            {(gameState.phase === 'guess1' || gameState.phase === 'guess2') && (
              <GuessScreen state={gameState} dispatch={smartDispatch} />
            )}
            {gameState.phase === 'reveal' && (
              <RevealScreen state={gameState} dispatch={dispatch} />
            )}
            {gameState.phase === 'end' && (
              <FinalScores
                state={gameState}
                dispatch={dispatch}
                onNewGame={() => setAppPhase('setup')}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Run the full app and play through a round manually**

```bash
npm run dev
```

Play through manually: New Game → enter 3 names → Start → give clue1 → each guesser places marker → give clue2 → each guesser moves marker → check reveal screen → check scoring frame → Next round → eventually reach Final Scores.

Expected: Full game loop works. Pass-device screens appear between phases.

- [ ] **Step 3: Run all tests to confirm nothing regressed**

```bash
npm test
```
Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire full game flow with pass-device transitions"
```

---

## Task 13: Mobile Responsive CSS

**Files:**
- Modify: `src/index.css`, `src/components/GuessScreen.css`, `src/components/ClueScreen.css`

- [ ] **Step 1: Add mobile viewport meta to index.html**

Edit `index.html` — add inside `<head>`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#e91e63">
```

- [ ] **Step 2: Add mobile overrides to index.css**

Append to `src/index.css`:
```css
/* Mobile touch improvements */
@media (max-width: 600px) {
  .btn-primary, .btn-confirm, .pass-btn {
    width: 100%;
    padding: 18px;
    font-size: 1.1rem;
    min-height: 56px;
  }

  .player-input {
    font-size: 16px; /* prevents iOS zoom on focus */
  }

  .clue-text-input {
    font-size: 16px;
  }
}

/* Ensure grid is always scrollable on small screens */
.grid-wrapper {
  touch-action: pan-x pan-y;
}
```

- [ ] **Step 3: Add mobile layout for GuessScreen**

Append to `src/components/GuessScreen.css`:
```css
@media (max-width: 600px) {
  .guess-screen {
    padding: 12px;
    gap: 12px;
  }

  .guess-header h2 {
    font-size: 1.1rem;
  }

  .guess-actions {
    position: sticky;
    bottom: 0;
    background: var(--bg);
    padding: 12px 0;
    border-top: 1px solid var(--border);
    margin: 0 -12px;
    padding: 12px;
  }

  .btn-confirm {
    width: 100%;
  }
}
```

- [ ] **Step 4: Add mobile layout for ClueScreen**

Append to `src/components/ClueScreen.css`:
```css
@media (max-width: 600px) {
  .clue-screen {
    padding: 20px 16px;
    gap: 16px;
  }

  .target-color-swatch {
    height: 90px;
  }

  .clue-restriction {
    font-size: 0.8rem;
    padding: 10px 12px;
  }
}
```

- [ ] **Step 5: Test on mobile viewport in browser**

In Chrome DevTools, toggle device toolbar (Ctrl+Shift+M) and set to iPhone 12 (390×844). Play through a full round. Verify:
- Grid scrolls horizontally with touch
- Buttons are large enough to tap
- Text inputs don't zoom on focus
- Confirm button is sticky at bottom on guess screen

- [ ] **Step 6: Commit**

```bash
git add src/index.css src/components/GuessScreen.css src/components/ClueScreen.css index.html
git commit -m "feat: add mobile responsive layout and touch improvements"
```

---

## Task 14: GitHub Pages Deployment

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install gh-pages**

```bash
npm install -D gh-pages
```

- [ ] **Step 2: Verify base path in vite.config.ts**

`vite.config.ts` already has `base: '/hues-and-cues/'` from Task 1. No change needed.

- [ ] **Step 3: Build and verify**

```bash
npm run build
```
Expected: `dist/` folder created with no errors. Output should show files under `/hues-and-cues/` base path.

- [ ] **Step 4: Deploy to GitHub Pages**

```bash
npm run deploy
```
Expected: Pushes `dist/` to `gh-pages` branch on `origin`. Visit `https://wvenderbush.github.io/hues-and-cues/` after a minute to confirm it's live.

- [ ] **Step 5: Run all tests one final time**

```bash
npm test
```
Expected: All tests PASS.

- [ ] **Step 6: Final commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add GitHub Pages deployment"
git push origin main
```
