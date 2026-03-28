import { useReducer, useState } from 'react'
import { gameReducer, createInitialState } from './gameReducer'
import { ThemeToggle } from './components/ThemeToggle'
import { HomeScreen } from './components/HomeScreen'
import { PlayerSetup } from './components/PlayerSetup'
import './App.css'

function PlaceholderScreen({ phase }: { phase: string }) {
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h2>Phase: {phase}</h2>
      <p style={{ color: 'var(--text-muted)' }}>Screen coming soon…</p>
    </div>
  )
}

type AppPhase = 'home' | 'setup' | 'game'

export default function App() {
  const [appPhase, setAppPhase] = useState<AppPhase>('home')
  const [gameState, dispatch] = useReducer(
    gameReducer,
    ['Player 1', 'Player 2', 'Player 3'],
    createInitialState
  )

  function handleStartGame(playerNames: string[]) {
    dispatch({ type: 'START_GAME', playerNames })
    setAppPhase('game')
  }

  return (
    <div className="app">
      <header className="app-header">
        <ThemeToggle />
      </header>
      <main className="app-body">
        {appPhase === 'home' && (
          <HomeScreen onStart={() => setAppPhase('setup')} />
        )}
        {appPhase === 'setup' && (
          <PlayerSetup onStart={handleStartGame} />
        )}
        {appPhase === 'game' && (
          <PlaceholderScreen phase={gameState.phase} />
        )}
      </main>
    </div>
  )
}
