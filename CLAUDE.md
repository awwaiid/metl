# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

METL (Model Extract Transform Load) is a formal methods analysis tool that uses Claude Agent SDK to extract Alloy formal models from codebases, explore them for edge cases, and generate test cases. The core workflow:

1. Extract high-level Alloy/TLA+ models from code
2. Use models to explore data and interaction scenarios
3. Identify interesting cases (especially failures)
4. Translate cases back into tests in the original codebase language

## Technology Stack

- **TypeScript** with ES2022 modules (Node16 module resolution)
- **Claude Agent SDK** (@anthropic-ai/claude-agent-sdk v0.1.0) - provides MCP server and query functionality
- **alloy-lang** (v6.2.0-17) - npm package for Alloy model execution
- **Node.js** >= 18.0.0 required

## Build and Development Commands

```bash
# Build TypeScript to JavaScript
npm run build

# Run in development mode (no build step)
npm run dev

# Type checking without emitting files
npm run typecheck

# Run the CLI tool
npm run cli

# Run built version
npm start
```

## Running Examples

```bash
# Direct tool usage (no API key needed)
npx tsx examples/direct-tool-usage.ts

# Agent-based usage (requires ANTHROPIC_API_KEY)
export ANTHROPIC_API_KEY=your_key_here
npx tsx examples/basic-usage.ts
```

## Architecture

### Three-Layer Tool System

METL implements tools at three levels:

1. **Direct Tool Functions** (`src/tools/alloy.ts`) - Core tool implementations using SDK's `tool()` function
   - `createAlloyModel` - Generate Alloy model from concepts/relationships/constraints
   - `runAlloyModel` - Execute Alloy model to generate scenarios (placeholder, alloy-lang integration pending)
   - `translateToTest` - Translate Alloy scenarios to test code (placeholder)

2. **MCP Server** (`src/agent.ts`) - Wraps tools in MCP protocol via `createSdkMcpServer()`
   - Exposes tools to Claude agent via Model Context Protocol
   - Includes METL system prompt with methodology

3. **CLI Interface** (`src/cli.ts`) - User-facing commands that orchestrate agent workflow
   - `metl extract` - Analyze codebase and extract formal models
   - `metl explore` - Validate models and generate test scenarios
   - Both commands use `query()` from SDK to run multi-turn agent sessions

### Key Files

- `src/agent.ts` - MCP server creation, METL system prompt
- `src/tools/alloy.ts` - Tool implementations (create, run, translate)
- `src/cli.ts` - CLI commands using query() for multi-turn agent sessions
- `src/index.ts` - Main entry point (minimal, mostly scaffolding)
- `src/types/index.ts` - TypeScript type definitions

### Output Structure

When using CLI commands, artifacts are organized in a dedicated directory (default: `alloy/`):
- Markdown documentation with diagrams
- Alloy model files (.als)
- Generated test files
- Shell scripts to run models and tests
- `extraction-summary.txt` or `exploration-results.txt`

## Development Notes

- ES modules throughout (type: "module" in package.json)
- TypeScript compiled to `dist/` directory
- Use `tsx` for running TypeScript directly without build step
- `npm run cli` uses tsx to run src/cli.ts directly
- Node16 module resolution requires `.js` extensions in import paths even for `.ts` files
- The CLI passes the full environment to the agent subprocess (src/cli.ts lines 122, 238)
