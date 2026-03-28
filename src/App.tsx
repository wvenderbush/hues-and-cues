import { useReducer } from 'react'
import { gameReducer, createInitialState } from './gameReducer'
import { ThemeToggle } from './components/ThemeToggle'
import './App.css'

function PlaceholderScreen({ phase }: { phase: string }) {
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h2>Phase: {phase}</h2>
      <p style={{ color: 'var(--text-muted)' }}>Screen coming soon…</p>
    </div>
  )
}

export default function App() {
  const [gameState] = useReducer(
    gameReducer,
    ['Player 1', 'Player 2', 'Player 3'],
    createInitialState
  )

  return (
    <div className="app">
      <header className="app-header">
        <ThemeToggle />
      </header>
      <main className="app-body">
        <PlaceholderScreen phase={gameState.phase} />
      </main>
    </div>
  )
}
