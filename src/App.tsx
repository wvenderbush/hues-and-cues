import { useReducer, useState } from 'react'
import { gameReducer, createInitialState, clockwiseOrder } from './gameReducer'
import type { GameAction } from './gameReducer'
import { ThemeToggle } from './components/ThemeToggle'
import { HomeScreen } from './components/HomeScreen'
import { PlayerSetup } from './components/PlayerSetup'
import { ClueScreen } from './components/ClueScreen'
import { GuessScreen } from './components/GuessScreen'
import { PassDevice } from './components/PassDevice'
import { RevealScreen } from './components/RevealScreen'
import { FinalScores } from './components/FinalScores'
import './App.css'

type AppPhase = 'home' | 'setup' | 'game'

type PendingPass = { toName: string; context: string } | null

export default function App() {
  const [appPhase, setAppPhase] = useState<AppPhase>('home')
  const [gameState, dispatch] = useReducer(
    gameReducer,
    ['Player 1', 'Player 2', 'Player 3'],
    createInitialState
  )
  const [pendingPass, setPendingPass] = useState<PendingPass>(null)

  function handleStartGame(playerNames: string[]) {
    dispatch({ type: 'START_GAME', playerNames })
    setAppPhase('game')
  }

  // All dispatches that need a pass-device screen go through here
  function smartDispatch(action: GameAction) {
    switch (action.type) {
      case 'SUBMIT_CLUE1': {
        dispatch(action)
        const order = clockwiseOrder(gameState.currentClueGiverIndex, gameState.players.length)
        setPendingPass({
          toName: gameState.players[order[0]].name,
          context: 'place your first guess',
        })
        return
      }
      case 'CONFIRM_GUESS': {
        const isLast = gameState.currentGuessOrderIndex >= gameState.guessOrder.length - 1
        // Read pre-dispatch state intentionally: pass-target computed from current snapshot
        dispatch(action)
        if (!isLast) {
          // Pass to next guesser
          const nextIdx = gameState.guessOrder[gameState.currentGuessOrderIndex + 1]
          setPendingPass({
            toName: gameState.players[nextIdx].name,
            context: gameState.phase === 'guess1' ? 'place your first guess' : 'place your second guess',
          })
        } else if (gameState.phase === 'guess1') {
          // Last guess1 guesser done → pass to clue giver for clue2
          setPendingPass({
            toName: gameState.players[gameState.currentClueGiverIndex].name,
            context: 'give your second clue',
          })
        }
        // Last guess2 guesser → no pass, goes to reveal (everyone watches)
        return
      }
      case 'SUBMIT_CLUE2': {
        dispatch(action)
        const order = clockwiseOrder(gameState.currentClueGiverIndex, gameState.players.length).reverse()
        setPendingPass({
          toName: gameState.players[order[0]].name,
          context: 'place your second guess',
        })
        return
      }
      default:
        dispatch(action)
    }
  }

  if (pendingPass) {
    return (
      <div className="app">
        <header className="app-header"><ThemeToggle /></header>
        <PassDevice
          toName={pendingPass.toName}
          context={pendingPass.context}
          onReady={() => setPendingPass(null)}
        />
      </div>
    )
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
          <>
            {(gameState.phase === 'clue1' || gameState.phase === 'clue2') && (
              <ClueScreen state={gameState} dispatch={smartDispatch} />
            )}
            {(gameState.phase === 'guess1' || gameState.phase === 'guess2') && (
              <GuessScreen state={gameState} dispatch={smartDispatch} />
            )}
            {gameState.phase === 'reveal' && (
              <RevealScreen state={gameState} dispatch={dispatch} />
            )}
            {gameState.phase === 'end' && (
              <FinalScores
                state={gameState}
                dispatch={dispatch}
                onNewGame={() => setAppPhase('setup')}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
