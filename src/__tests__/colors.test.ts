import { describe, it, expect } from 'vitest'
import { buildColorGrid, colLabel, COLS, ROWS } from '../colors'

describe('colLabel', () => {
  it('returns A for column 0', () => expect(colLabel(0)).toBe('A'))
  it('returns Z for column 25', () => expect(colLabel(25)).toBe('Z'))
  it('returns AA for column 26', () => expect(colLabel(26)).toBe('AA'))
  it('returns AD for column 29', () => expect(colLabel(29)).toBe('AD'))
})

describe('buildColorGrid', () => {
  it('produces correct dimensions', () => {
    const grid = buildColorGrid()
    expect(grid.length).toBe(ROWS)
    grid.forEach(row => expect(row.length).toBe(COLS))
  })

  it('every cell has a valid hex color', () => {
    const grid = buildColorGrid()
    const hexRe = /^#[0-9a-f]{6}$/
    grid.forEach(row =>
      row.forEach(cell => expect(cell.hex).toMatch(hexRe))
    )
  })

  it('cell at (0,0) has label A1', () => {
    const grid = buildColorGrid()
    expect(grid[0][0].label).toBe('A1')
  })

  it('cell at (29,15) has label AD16', () => {
    const grid = buildColorGrid()
    expect(grid[15][29].label).toBe('AD16')
  })

  it('all cells have correct col/row coordinates', () => {
    const grid = buildColorGrid()
    grid.forEach((row, r) =>
      row.forEach((cell, c) => {
        expect(cell.col).toBe(c)
        expect(cell.row).toBe(r)
      })
    )
  })
})
