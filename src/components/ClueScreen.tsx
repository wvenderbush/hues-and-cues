import { useState, useRef, useEffect } from 'react'
import type { GameState } from '../types'
import type { GameAction } from '../gameReducer'
import { ColorGrid } from './ColorGrid'
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

      {!isClue1 && state.markers.length > 0 && (
        <div className="clue-markers-preview">
          <p className="clue-markers-label">Where players guessed so far:</p>
          <ColorGrid
            markers={state.markers}
            players={state.players}
            disabled
          />
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
