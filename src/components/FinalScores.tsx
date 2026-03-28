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
