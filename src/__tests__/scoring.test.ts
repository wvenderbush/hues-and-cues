import { describe, it, expect } from 'vitest'
import { computeRoundScores } from '../scoring'
import type { Marker } from '../types'

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
