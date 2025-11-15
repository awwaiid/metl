/**
 * Unit tests for Game of Life
 */

import {
  createEmptyGrid,
  parsePattern,
  gridToString,
  countLiveNeighbors,
  nextGeneration,
  simulate,
  countLiveCells,
  type Grid,
} from '../src/game.js';

// Simple test runner
interface Test {
  name: string;
  fn: () => void | Promise<void>;
}

const tests: Test[] = [];
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  tests.push({ name, fn });
}

function assert(condition: boolean, message: string = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEquals(actual: any, expected: any, message?: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(
      message || `Expected ${expectedStr} but got ${actualStr}`
    );
  }
}

// Test: createEmptyGrid
test('createEmptyGrid creates correct dimensions', () => {
  const grid = createEmptyGrid(3, 2);
  assertEquals(grid.length, 2, 'Height should be 2');
  assertEquals(grid[0].length, 3, 'Width should be 3');
  assertEquals(grid.every(row => row.every(cell => !cell)), true, 'All cells should be dead');
});

test('createEmptyGrid throws on invalid dimensions', () => {
  try {
    createEmptyGrid(0, 5);
    throw new Error('Should have thrown');
  } catch (e) {
    assert(e instanceof Error && e.message.includes('positive'));
  }
});

// Test: parsePattern
test('parsePattern parses simple pattern', () => {
  const pattern = parsePattern(`
    .O.
    ..O
    OOO
  `);
  assertEquals(pattern.width, 3);
  assertEquals(pattern.height, 3);
  assertEquals(pattern.cells[0], [false, true, false]);
  assertEquals(pattern.cells[1], [false, false, true]);
  assertEquals(pattern.cells[2], [true, true, true]);
});

test('parsePattern handles empty cells as dead', () => {
  const pattern = parsePattern('O.');
  assertEquals(pattern.cells[0], [true, false]);
});

// Test: gridToString
test('gridToString converts grid to string', () => {
  const grid: Grid = [
    [false, true, false],
    [true, false, true],
  ];
  const str = gridToString(grid);
  assertEquals(str, '.O.\nO.O');
});

// Test: countLiveNeighbors
test('countLiveNeighbors counts correctly for center cell', () => {
  const grid: Grid = [
    [true, true, true],
    [true, false, true],
    [true, true, true],
  ];
  const count = countLiveNeighbors(grid, 1, 1);
  assertEquals(count, 8);
});

test('countLiveNeighbors handles edge cells', () => {
  const grid: Grid = [
    [true, true, false],
    [false, false, false],
    [false, false, false],
  ];
  const count = countLiveNeighbors(grid, 0, 0);
  assertEquals(count, 1, 'Top-left corner should have 1 neighbor');
});

test('countLiveNeighbors handles corner cells', () => {
  const grid: Grid = [
    [false, false, true],
    [false, false, true],
    [false, false, true],
  ];
  const count = countLiveNeighbors(grid, 2, 1);
  assertEquals(count, 2, 'Right edge should count neighbors correctly');
});

// Test: nextGeneration - Blinker pattern
test('nextGeneration handles blinker pattern', () => {
  // Horizontal blinker
  const grid: Grid = [
    [false, false, false],
    [true, true, true],
    [false, false, false],
  ];

  const next = nextGeneration(grid);

  // Should become vertical blinker
  const expected: Grid = [
    [false, true, false],
    [false, true, false],
    [false, true, false],
  ];

  assertEquals(next, expected);
});

// Test: nextGeneration - Block pattern (still life)
test('nextGeneration preserves block pattern', () => {
  const grid: Grid = [
    [false, false, false, false],
    [false, true, true, false],
    [false, true, true, false],
    [false, false, false, false],
  ];

  const next = nextGeneration(grid);
  assertEquals(next, grid, 'Block should remain unchanged');
});

// Test: nextGeneration - Dies from underpopulation
test('nextGeneration kills underpopulated cells', () => {
  const grid: Grid = [
    [true, false, false],
    [false, false, false],
    [false, false, false],
  ];

  const next = nextGeneration(grid);
  const allDead = next.every(row => row.every(cell => !cell));
  assert(allDead, 'All cells should die from underpopulation');
});

// Test: nextGeneration - Birth from reproduction
test('nextGeneration creates new cells from reproduction', () => {
  const grid: Grid = [
    [true, true, true],
    [false, false, false],
    [false, false, false],
  ];

  const next = nextGeneration(grid);
  // Middle top cell has exactly 3 neighbors, should be born
  assert(next[1][1], 'Cell at center should be born from 3 neighbors');
});

// Test: simulate
test('simulate runs multiple generations', () => {
  const grid: Grid = [
    [false, false, false],
    [true, true, true],
    [false, false, false],
  ];

  // Blinker oscillates with period 2
  const result = simulate(grid, 2);
  assertEquals(result, grid, 'Blinker should return to original after 2 generations');
});

test('simulate with 0 generations returns same grid', () => {
  const grid: Grid = [
    [true, true],
    [false, false],
  ];

  const result = simulate(grid, 0);
  assertEquals(result, grid);
});

test('simulate throws on negative generations', () => {
  const grid = createEmptyGrid(3, 3);
  try {
    simulate(grid, -1);
    throw new Error('Should have thrown');
  } catch (e) {
    assert(e instanceof Error && e.message.includes('non-negative'));
  }
});

// Test: countLiveCells
test('countLiveCells counts correctly', () => {
  const grid: Grid = [
    [true, false, true],
    [false, true, false],
    [true, true, true],
  ];
  const count = countLiveCells(grid);
  assertEquals(count, 6);
});

test('countLiveCells returns 0 for empty grid', () => {
  const grid = createEmptyGrid(5, 5);
  const count = countLiveCells(grid);
  assertEquals(count, 0);
});

// Test: Glider pattern has correct initial state
test('glider pattern has correct initial state', () => {
  const glider = parsePattern(`
    .O.
    ..O
    OOO
  `);

  const liveCount = countLiveCells(glider.cells);
  // Glider starts with 5 live cells
  assertEquals(liveCount, 5, 'Glider should start with 5 live cells');

  // After 1 generation, glider should still have cells (not die)
  const gen1 = nextGeneration(glider.cells);
  const gen1Count = countLiveCells(gen1);
  assert(gen1Count > 0, 'Glider should survive at least one generation');
});

// Run all tests
async function runTests() {
  console.log('Running Game of Life tests...\n');

  for (const t of tests) {
    try {
      await t.fn();
      console.log(`✓ ${t.name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${t.name}`);
      console.log(`  ${error instanceof Error ? error.message : error}`);
      failed++;
    }
  }

  console.log(`\n${passed + failed} tests, ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);
