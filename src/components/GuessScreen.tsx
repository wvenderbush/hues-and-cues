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
