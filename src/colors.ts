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

  // Row bands: [saturation%, lightness%]
  const bands: [number, number][] = [
    [90, 30],  // row  0: dark vivid
    [90, 40],  // row  1
    [90, 50],  // row  2: vivid
    [85, 55],  // row  3
    [80, 60],  // row  4
    [70, 65],  // row  5
    [60, 70],  // row  6
    [50, 75],  // row  7
    [40, 80],  // row  8
    [30, 84],  // row  9: very pastel
    [85, 25],  // row 10: very dark vivid
    [80, 18],  // row 11: darkest vivid
    [0, 50],   // row 12: medium gray
    [0, 30],   // row 13: dark gray
    [0, 12],   // row 14: near black
    [0, 93],   // row 15: near white
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
