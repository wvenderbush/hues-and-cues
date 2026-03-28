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
