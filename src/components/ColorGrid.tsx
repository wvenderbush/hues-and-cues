import React from 'react'
import { buildColorGrid, colLabel, COLS } from '../colors'
import type { Marker, Player } from '../types'
import './ColorGrid.css'

const GRID = buildColorGrid()

type Props = {
  markers: Marker[]
  players?: Player[]
  onCellClick?: (col: number, row: number) => void
  targetCol?: number
  targetRow?: number
  showFrame?: boolean       // show scoring frame on reveal
  disabled?: boolean
}

function chebyshev(c1: number, r1: number, c2: number, r2: number) {
  return Math.max(Math.abs(c1 - c2), Math.abs(r1 - r2))
}

export function ColorGrid({
  markers,
  players,
  onCellClick,
  targetCol,
  targetRow,
  showFrame = false,
  disabled = false,
}: Props) {
  const markerMap = new Map<string, Marker[]>()
  for (const m of markers) {
    const key = `${m.col},${m.row}`
    if (!markerMap.has(key)) markerMap.set(key, [])
    markerMap.get(key)!.push(m)
  }

  function cellClass(col: number, row: number): string {
    const classes = ['grid-cell']
    const hasMarker = markerMap.has(`${col},${row}`)
    if (hasMarker) classes.push('occupied')
    if (targetCol !== undefined && targetRow !== undefined) {
      if (col === targetCol && row === targetRow) classes.push('target')
      if (showFrame) {
        const d = chebyshev(col, row, targetCol, targetRow)
        if (d === 1) classes.push('in-frame')
        if (d === 2) classes.push('frame-edge')
      }
    }
    return classes.join(' ')
  }

  function handleClick(col: number, row: number) {
    if (disabled) return
    if (markerMap.has(`${col},${row}`)) return
    onCellClick?.(col, row)
  }

  return (
    <div className="grid-wrapper">
      <div className="grid-container">
        {/* Top-left corner */}
        <div className="grid-col-header corner" />
        {/* Column headers */}
        {Array.from({ length: COLS }, (_, c) => (
          <div key={c} className="grid-col-header">{colLabel(c)}</div>
        ))}

        {/* Rows */}
        {GRID.map((rowCells, r) => (
          <React.Fragment key={r}>
            {/* Row label */}
            <div className="grid-row-label">{r + 1}</div>
            {/* Color cells */}
            {rowCells.map(cell => {
              const cellMarkers = markerMap.get(`${cell.col},${cell.row}`) ?? []
              return (
                <div
                  key={cell.label}
                  className={cellClass(cell.col, cell.row)}
                  style={{ background: cell.hex }}
                  onClick={() => handleClick(cell.col, cell.row)}
                  title={cell.label}
                >
                  {cellMarkers.map(m => {
                    const color = players?.[m.playerIndex]?.markerColor ?? '#ffffff'
                    return (
                      <div key={`${m.playerIndex}-${m.markerNumber}`} className="marker">
                        <div
                          className={`marker-dot${m.markerNumber === 2 ? ' marker-2' : ''}`}
                          style={{ background: color, color }}
                        />
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
