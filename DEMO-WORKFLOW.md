# METL Demo Workflow - Game of Life

## Overview

This document describes the complete workflow for demonstrating METL's model extraction capabilities using the Game of Life example application.

## What We Built

### 1. Game of Life Demo Application (`examples/game-of-life/`)

A complete, tested TypeScript implementation featuring:

- **Core Logic** (`src/game.ts`):
  - Grid and cell management
  - Game of Life rules implementation
  - Pattern parsing and serialization
  - Multi-generation simulation

- **CLI Interface** (`src/cli.ts`):
  - Non-interactive command-line runner
  - Takes pattern file and generation count
  - Outputs initial and final states

- **Comprehensive Tests** (`test/game.test.ts`):
  - 18 passing unit tests
  - Coverage of all core functions
  - Edge cases and boundary conditions
  - Known patterns (blinker, glider, block)

- **Example Patterns** (`patterns/`):
  - `glider.txt` - Moving pattern
  - `blinker.txt` - Oscillating pattern
  - `block.txt` - Still life pattern

### 2. Enhanced METL CLI with Streaming Mode

- **Streaming Mode Support**:
  - Uses `AsyncIterable<SDKUserMessage>` for interactive conversations
  - Supports multi-turn agent execution
  - Ready for interactive mode (currently disabled)

- **Verbose Progress Logging**:
  - Session initialization messages
  - Tool usage notifications
  - Execution progress updates
  - Cost and timing information
  - All message types logged with clear formatting

- **Permission Configuration**:
  - `additionalDirectories`: Grants write access to output directory
  - `permissionMode: 'acceptEdits'`: Allows agent to write files without prompting
  - Full environment passed to subprocess (fixes PATH issues)

## How to Use

### Step 1: Run Game of Life Tests

```bash
cd examples/game-of-life
npm test
```

**Expected Output:**
```
✓ All 18 tests pass
```

### Step 2: Test Game of Life CLI

```bash
cd examples/game-of-life
npm run cli patterns/glider.txt 4
```

**Expected Output:**
```
Initial pattern:
.O.
..O
OOO
Live cells: 5

Simulating 4 generation(s)...

Final pattern (generation 4):
...
.OO
.OO
Live cells: 4
```

### Step 3: Extract Formal Models with METL

From the METL root directory:

```bash
node dist/cli.js extract --dir alloy-models --path examples/game-of-life
```

**Expected Behavior** (if SDK works):

1. Session initialization message with tools and MCP servers
2. User message sent to Claude
3. Assistant analyzes codebase structure
4. Tool uses for file reading and exploration
5. Tool uses for `create_alloy_model` to generate models
6. Models saved to `alloy-models/` directory
7. Summary saved to `alloy-models/extraction-summary.txt`

**Expected Models:**

- `Cell.als` - Cell state and properties
- `Grid.als` - Grid structure and constraints
- `Pattern.als` - Pattern definitions
- `Rules.als` - Game of Life evolution rules
- `Generation.als` - State transitions

### Step 4: Explore Models (Optional)

```bash
node dist/cli.js explore --dir alloy-models --path examples/game-of-life
```

This will:
1. Load extracted Alloy models
2. Run scenarios using `run_alloy_model` tool
3. Identify edge cases and boundary conditions
4. Generate test scenarios using `translate_to_test` tool
5. Save results to `alloy-models/exploration-results.txt`

## Current Status

### ✅ Completed

1. **Game of Life Implementation**:
   - Fully functional with 18 passing tests
   - Clean, well-documented code
   - CLI interface working

2. **METL Enhancements**:
   - Streaming mode implemented
   - Verbose logging added
   - Permission configuration set up
   - Full environment passed to SDK

3. **Documentation**:
   - Game of Life README
   - This workflow document
   - Streaming mode documentation

### ⚠️ Known Issue: SDK CLI Subprocess

The Claude Agent SDK v0.1.42 has a documented issue where the CLI subprocess may hang on startup. This affects both single mode and streaming mode.

**Symptoms:**
- Process starts but produces no output
- Hangs indefinitely waiting for messages
- May be related to subprocess initialization or IPC

**Workaround:**
If extraction hangs, you can test individual tools directly:

```typescript
import { createAlloyModel } from './dist/tools/alloy.js';

const result = await createAlloyModel.handler({
  modelName: 'Cell',
  concepts: ['Cell', 'alive', 'dead'],
  relationships: ['Cell has state'],
  constraints: ['state is boolean']
}, {});

console.log(result);
```

### 🔄 Testing Extraction

To test if the SDK works in your environment:

```bash
# Set a short timeout to avoid long waits
timeout 30 node dist/cli.js extract --dir alloy-models --path examples/game-of-life
```

**If it works:**
- You'll see verbose progress messages
- Models will be generated
- Summary will be saved

**If it hangs:**
- Process will timeout after 30 seconds
- SDK subprocess issue is affecting your environment
- Use direct tool calls as workaround

## Architecture

```
User
  ↓
METL CLI (dist/cli.js extract)
  ↓
createMessageStream() → AsyncIterable<SDKUserMessage>
  ↓
SDK query(messageStream, options)
  ├── permissionMode: 'acceptEdits'
  ├── additionalDirectories: [outputDir]
  ├── mcpServers: { metl: mcpServer }
  └── env: full process.env
  ↓
[SDK CLI Subprocess]
  ↓
Claude API (Sonnet 4.5)
  ↓
MCP Server (METL Tools)
  ├── create_alloy_model
  ├── run_alloy_model
  └── translate_to_test
  ↓
Alloy Operations
  ├── Model generation
  ├── Scenario execution
  └── Test translation
```

## What Makes This Demo Effective

1. **Simple Domain**: Game of Life rules are easy to understand
2. **Clear Structure**: Well-organized TypeScript code
3. **Comprehensive Tests**: 18 tests provide validation baseline
4. **Formal Rules**: Deterministic behavior perfect for modeling
5. **Rich Behavior**: Despite simplicity, produces interesting patterns
6. **Educational Value**: Demonstrates METL capabilities clearly

## Expected Insights from Extraction

After successful extraction, you should discover:

1. **Domain Model**:
   - Cell as fundamental unit
   - Grid as collection with constraints
   - Pattern as initial configuration
   - Rules as state transition functions

2. **Constraints**:
   - Grid dimensions must be positive
   - Neighbor count is 0-8
   - Rules are deterministic
   - Generations are non-negative

3. **Edge Cases**:
   - Corner cells have 3 neighbors max
   - Edge cells have 5 neighbors max
   - Empty grids stay empty
   - Single cells die

4. **Patterns**:
   - Still lifes (block)
   - Oscillators (blinker)
   - Spaceships (glider)

## Next Steps

1. **Test Extraction**: Run extraction and see if SDK works
2. **Review Models**: If generated, examine Alloy models
3. **Validate**: Compare extracted constraints with tests
4. **Iterate**: Use insights to improve either models or tests
5. **Document**: Report SDK behavior (working or hanging)

## Files Changed

- `src/cli.ts` - Streaming mode + verbose logging + permissions
- `examples/game-of-life/` - Complete demo application
- `STREAMING-MODE.md` - Streaming mode documentation
- `DEMO-WORKFLOW.md` - This document

## Commit Message

"Add Game of Life demo and enhance METL with verbose logging"

Summary of changes:
- Implement complete Game of Life demo with tests
- Add streaming mode support to METL CLI
- Add verbose progress logging for all message types
- Configure permissions for output directory writes
- Document demo workflow and usage
