#!/usr/bin/env node
/**
 * Game of Life CLI
 *
 * Usage: game-of-life <pattern-file> <generations>
 */

import * as fs from 'fs';
import { parsePattern, simulate, gridToString, countLiveCells } from './game.js';

function printHelp() {
  console.log(`
Game of Life Simulator

Usage:
  game-of-life <pattern-file> <generations>

Arguments:
  pattern-file    Path to file containing the initial pattern
  generations     Number of generations to simulate

Pattern Format:
  Use '.' for dead cells and 'O' for live cells
  Example:
    ...
    .O.
    ..O
    OOO

Examples:
  game-of-life patterns/glider.txt 10
  game-of-life patterns/blinker.txt 5
`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    process.exit(0);
  }

  if (args.length !== 2) {
    console.error('Error: Expected exactly 2 arguments');
    printHelp();
    process.exit(1);
  }

  const [patternFile, generationsStr] = args;
  const generations = parseInt(generationsStr, 10);

  if (isNaN(generations) || generations < 0) {
    console.error('Error: Generations must be a non-negative number');
    process.exit(1);
  }

  // Read pattern file
  if (!fs.existsSync(patternFile)) {
    console.error(`Error: Pattern file '${patternFile}' not found`);
    process.exit(1);
  }

  const patternText = fs.readFileSync(patternFile, 'utf-8');

  try {
    // Parse and simulate
    const pattern = parsePattern(patternText);
    console.log('Initial pattern:');
    console.log(gridToString(pattern.cells));
    console.log(`Live cells: ${countLiveCells(pattern.cells)}`);
    console.log(`\nSimulating ${generations} generation(s)...\n`);

    const result = simulate(pattern.cells, generations);

    console.log(`Final pattern (generation ${generations}):`);
    console.log(gridToString(result));
    console.log(`Live cells: ${countLiveCells(result)}`);

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
