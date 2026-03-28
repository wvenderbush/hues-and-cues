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
