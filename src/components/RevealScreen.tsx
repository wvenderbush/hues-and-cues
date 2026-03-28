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
        <div className="score-row">
          <div className="score-dot" style={{ background: clueGiver.markerColor }} />
          <span className="score-name">
            {clueGiver.name} <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>(clue giver)</span>
          </span>
          <span className="score-delta clue-giver">+{scores.clueGiverPoints}</span>
          <span className="score-total">→ {clueGiver.score + scores.clueGiverPoints} pts</span>
        </div>
        {state.players.map((player, i) => {
          if (i === state.currentClueGiverIndex) return null
          const delta = scores.guesserPoints[i] ?? 0
          return (
            <div key={player.name} className="score-row">
              <div className="score-dot" style={{ background: player.markerColor }} />
              <span className="score-name">{player.name}</span>
              <span className="score-delta">+{delta}</span>
              {/* player.score is pre-round; NEXT_ROUND applies the delta */}
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
