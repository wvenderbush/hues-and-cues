import { describe, it, expect } from 'vitest'
import { gameReducer, createInitialState } from '../gameReducer'

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
