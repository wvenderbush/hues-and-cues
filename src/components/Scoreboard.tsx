import type { Player } from '../types'
import './Scoreboard.css'

type Props = { players: Player[] }

export function Scoreboard({ players }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score)
  return (
    <div className="scoreboard">
      <div className="scoreboard-title">Scores</div>
      {sorted.map((player, i) => (
        <div key={player.name} className="scoreboard-row">
          <span className="scoreboard-rank">#{i + 1}</span>
          <div className="scoreboard-dot" style={{ background: player.markerColor }} />
          <span className="scoreboard-name">{player.name}</span>
          <span className="scoreboard-score">{player.score}</span>
        </div>
      ))}
    </div>
  )
}
