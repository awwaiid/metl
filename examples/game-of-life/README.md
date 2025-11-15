# Conway's Game of Life - METL Demo Application

This is a simple, well-structured implementation of Conway's Game of Life designed to demonstrate METL's model extraction capabilities.

## Overview

The Game of Life is a cellular automaton where cells evolve based on simple rules:

1. Any live cell with 2-3 live neighbors survives
2. Any dead cell with exactly 3 live neighbors becomes alive
3. All other cells die or stay dead

## Project Structure

```
game-of-life/
├── src/
│   ├── game.ts          # Core game logic and rules
│   └── cli.ts           # Command-line interface
├── test/
│   └── game.test.ts     # Comprehensive unit tests
├── patterns/
│   ├── glider.txt       # Classic glider pattern
│   ├── blinker.txt      # Oscillating pattern
│   └── block.txt        # Still life pattern
├── package.json
└── tsconfig.json
```

## Installation

```bash
npm install
npm run build
```

## Usage

### Run Simulations

```bash
npm run cli patterns/glider.txt 10
```

This runs the glider pattern for 10 generations.

### Run Tests

```bash
npm test
```

All 18 unit tests should pass, covering:
- Grid creation and manipulation
- Pattern parsing
- Neighbor counting
- Rule application
- Multi-generation simulation

## Using with METL

This example is specifically designed for testing METL's formal model extraction.

### Extract Alloy Models

From the METL root directory:

```bash
node dist/cli.js extract --dir alloy-models --path examples/game-of-life
```

METL will:
1. Analyze the codebase structure
2. Identify core domain concepts (Grid, Cell, Pattern, etc.)
3. Extract relationships and constraints
4. Generate Alloy formal models
5. Save models to the `alloy-models/` directory

### Expected Models

METL should extract models for:

- **Cell**: Boolean state (alive/dead)
- **Grid**: 2D array of cells with dimensions
- **Pattern**: Named starting configuration
- **Rules**: Formal constraints for cell evolution
  - Survival rule (2-3 neighbors)
  - Birth rule (exactly 3 neighbors)
  - Death rule (all other cases)
- **Generation**: State transition from one grid to the next

### Explore Models

After extraction, explore the models for edge cases:

```bash
node dist/cli.js explore --dir alloy-models --path examples/game-of-life
```

METL will:
1. Run the Alloy models to generate scenarios
2. Find edge cases and boundary conditions
3. Generate test scenarios
4. Validate that constraints are enforced

## Key Features for Model Extraction

This codebase demonstrates several features that make formal modeling valuable:

1. **Clear Domain Concepts**: Cell, Grid, Pattern are well-defined types
2. **Explicit Constraints**: Neighbor counting, boundary conditions
3. **State Transitions**: Clear rules for evolution
4. **Invariants**: Grid dimensions, cell count conservation patterns
5. **Test Coverage**: Comprehensive unit tests validate behavior

## Expected Insights from METL

After extraction and exploration, you should discover:

1. **Edge Cases**:
   - Single cell (dies from underpopulation)
   - Corner and edge cells (fewer neighbors)
   - Empty grids (stay empty)

2. **Oscillators**:
   - Blinker (period 2)
   - Patterns that repeat

3. **Still Lifes**:
   - Block (2x2 square)
   - Configurations that never change

4. **Constraints**:
   - Grid dimensions must be positive
   - Generations must be non-negative
   - Neighbor count is always 0-8

## Why This Example?

Game of Life is ideal for METL demonstration because:

- **Simple Rules**: Easy to model formally
- **Rich Behavior**: Despite simple rules, produces complex patterns
- **Well-Tested**: Comprehensive test suite validates behavior
- **Clear Invariants**: Rules are deterministic and well-defined
- **Educational**: Widely known, easy to understand

## Next Steps

After running METL extraction:

1. Review generated Alloy models in `alloy-models/`
2. Run Alloy Analyzer to visualize scenarios
3. Compare generated test cases with existing unit tests
4. Identify any edge cases missed by manual testing
5. Use insights to improve test coverage

## License

MIT
