import { useState } from 'react'
import './PlayerSetup.css'

const MARKER_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22', '#e91e63',
  '#00bcd4', '#8bc34a',
]

type Props = { onStart: (playerNames: string[]) => void }

export function PlayerSetup({ onStart }: Props) {
  const [names, setNames] = useState(['', ''])
  const [error, setError] = useState('')

  function updateName(index: number, value: string) {
    setNames(prev => prev.map((n, i) => (i === index ? value : n)))
    setError('')
  }

  function addPlayer() {
    if (names.length < 10) setNames(prev => [...prev, ''])
  }

  function removePlayer(index: number) {
    if (names.length > 2) setNames(prev => prev.filter((_, i) => i !== index))
  }

  function handleStart() {
    const filled = names.map(n => n.trim()).filter(Boolean)
    if (filled.length < 2) {
      setError('At least 2 players are required.')
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
      <p className="setup-subtitle">Enter 2–10 player names to get started.</p>

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
            {names.length > 2 && (
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
