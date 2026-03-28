import type { GameState, Marker } from './types'
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

export function clockwiseOrder(clueGiverIndex: number, playerCount: number): number[] {
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
