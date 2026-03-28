import { buildColorGrid } from '../colors'
import './HomeScreen.css'

const PREVIEW_COLORS = buildColorGrid()
  .flatMap(row => row)
  .filter((_, i) => i % 2 === 0)  // every other cell for a 240-cell preview
  .slice(0, 60)

type Props = { onStart: () => void }

export function HomeScreen({ onStart }: Props) {
  return (
    <div className="home">
      <h1 className="home-title">Hues &amp; Cues</h1>
      <p className="home-subtitle">
        Describe a color. Find it on the grid. Score points for getting close.
      </p>
      <div className="home-grid-preview">
        {PREVIEW_COLORS.map(cell => (
          <div key={cell.label} style={{ background: cell.hex }} />
        ))}
      </div>
      <button className="btn-primary" onClick={onStart}>
        New Game
      </button>
    </div>
  )
}
