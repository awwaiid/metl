/**
 * Conway's Game of Life - Core Logic
 *
 * Rules:
 * 1. Any live cell with 2-3 live neighbors survives
 * 2. Any dead cell with exactly 3 live neighbors becomes alive
 * 3. All other cells die or stay dead
 */

export type Cell = boolean;
export type Grid = Cell[][];

export interface Pattern {
  width: number;
  height: number;
  cells: Grid;
}

/**
 * Creates an empty grid of specified dimensions
 */
export function createEmptyGrid(width: number, height: number): Grid {
  if (width <= 0 || height <= 0) {
    throw new Error('Grid dimensions must be positive');
  }
  return Array(height).fill(null).map(() => Array(width).fill(false));
}

/**
 * Creates a pattern from a string representation
 * '.' = dead cell, 'O' = live cell
 */
export function parsePattern(pattern: string): Pattern {
  const lines = pattern.trim().split('\n').map(line => line.trim());
  if (lines.length === 0) {
    throw new Error('Pattern cannot be empty');
  }

  const height = lines.length;
  const width = Math.max(...lines.map(line => line.length));

  const cells: Grid = lines.map(line => {
    const row: Cell[] = [];
    for (let i = 0; i < width; i++) {
      row.push(line[i] === 'O');
    }
    return row;
  });

  return { width, height, cells };
}

/**
 * Converts a grid to string representation
 */
export function gridToString(grid: Grid): string {
  return grid.map(row =>
    row.map(cell => cell ? 'O' : '.').join('')
  ).join('\n');
}

/**
 * Counts live neighbors for a cell at position (x, y)
 */
export function countLiveNeighbors(grid: Grid, x: number, y: number): number {
  const height = grid.length;
  const width = grid[0].length;
  let count = 0;

  // Check all 8 neighbors
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      // Skip the cell itself
      if (dx === 0 && dy === 0) continue;

      const ny = y + dy;
      const nx = x + dx;

      // Check if neighbor is within bounds
      if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
        if (grid[ny][nx]) count++;
      }
    }
  }

  return count;
}

/**
 * Computes the next generation of the game
 */
export function nextGeneration(grid: Grid): Grid {
  if (grid.length === 0 || grid[0].length === 0) {
    throw new Error('Grid cannot be empty');
  }

  const height = grid.length;
  const width = grid[0].length;
  const newGrid = createEmptyGrid(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const liveNeighbors = countLiveNeighbors(grid, x, y);
      const isAlive = grid[y][x];

      // Apply Game of Life rules
      if (isAlive) {
        // Live cell survives with 2-3 neighbors
        newGrid[y][x] = liveNeighbors === 2 || liveNeighbors === 3;
      } else {
        // Dead cell becomes alive with exactly 3 neighbors
        newGrid[y][x] = liveNeighbors === 3;
      }
    }
  }

  return newGrid;
}

/**
 * Runs the simulation for a specified number of generations
 */
export function simulate(initialGrid: Grid, generations: number): Grid {
  if (generations < 0) {
    throw new Error('Number of generations must be non-negative');
  }

  let grid = initialGrid;
  for (let i = 0; i < generations; i++) {
    grid = nextGeneration(grid);
  }
  return grid;
}

/**
 * Counts total number of live cells in the grid
 */
export function countLiveCells(grid: Grid): number {
  return grid.reduce((total, row) =>
    total + row.filter(cell => cell).length, 0
  );
}
