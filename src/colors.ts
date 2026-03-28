import type { ColorCell } from './types'

export const COLS = 30
export const ROWS = 16

// Column label: 0→A, 25→Z, 26→AA, 29→AD
export function colLabel(col: number): string {
  if (col < 26) return String.fromCharCode(65 + col)
  return 'A' + String.fromCharCode(65 + col - 26)
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number): string => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function getColor(col: number, row: number): string {
  const hue = Math.round((col / COLS) * 360)

  // Neutral gradient rows: lightness varies across columns, no hue
  if (row === 0) {
    // Grey row: near-white (left) → dark grey (right)
    const l = Math.round(88 - (col / (COLS - 1)) * 55)  // 88 → 33
    return hslToHex(0, 0, l)
  }
  if (row === 1) {
    // Black row: dark grey (left) → near-black (right)
    const l = Math.round(25 - (col / (COLS - 1)) * 22)  // 25 → 3
    return hslToHex(0, 0, l)
  }

  // Row bands: [saturation%, lightness%]
  const bands: [number, number][] = [
    [0, 0],    // row  0: handled above (grey gradient reversed)
    [0, 0],    // row  1: handled above (black gradient)
    [65, 10],  // row  2: near-black chromatic
    [75, 15],  // row  3: deep dark chromatic
    [80, 18],  // row  4: darkest vivid
    [85, 25],  // row  5: very dark vivid
    [90, 30],  // row  6: dark vivid
    [90, 40],  // row  7
    [90, 50],  // row  8: vivid
    [85, 55],  // row  9
    [80, 60],  // row 10
    [70, 65],  // row 11
    [60, 70],  // row 12
    [50, 75],  // row 13
    [40, 80],  // row 14
    [30, 84],  // row 15: very pastel
  ]

  const [s, l] = bands[row]
  return hslToHex(hue, s, l)
}

export function buildColorGrid(): ColorCell[][] {
  const grid: ColorCell[][] = []
  for (let row = 0; row < ROWS; row++) {
    const cells: ColorCell[] = []
    for (let col = 0; col < COLS; col++) {
      cells.push({
        col,
        row,
        hex: getColor(col, row),
        label: `${colLabel(col)}${row + 1}`,
      })
    }
    grid.push(cells)
  }
  return grid
}
