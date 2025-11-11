# metl
Model Extract Transform Load -- Logic Code Analysis and Generation

The idea here is to use tools like [Alloy](https://alloytools.org/) and [TLA+](https://lamport.azurewebsites.net/tla/tla.html) in real-code situations powered by LLM technology (Agents if you will). The initial and flagship usecase:

* Extract a high-level model (Alloy/TLA+) from your codebase
* Use that model to explore and visualize data and interaction scenarios
* Identify interesting cases, especially failures
* Translate those cases back into (failing) tests written in the codebase language

From there you can, of course, fix the implementation and/or the concepts of your code.

## General process

* Identify a small number (3-4) of core concepts (models and/or interactions) from the codebase
* Build an Alloy or TLA+ version of the model
* Loop: Generate an example, translate it into a test in the original system, execute it there to confirm
* If we find an example that we expect to fail but it works in the original system, there is likely a software constraint that we can identify and then add that into the model
* If we find an example that fails in the original system and highlights a flaw, great!
* The result should be (all in a dedicated folder):
  * A markdown document describing the model and including some diagrams
  * A model file(s) in Alloy or TLA+
  * Some passing or failing tests in the original system
  * A shell script to run the models
  * A shell script to run the generated original system tests
 
## Implementation

This tool is implemented using TypeScript and the [Claude Agent SDK](https://docs.claude.com/en/docs/agent-sdk/overview). It provides an MCP (Model Context Protocol) server with specialized tools for formal methods analysis.

Initially we only implement Alloy models using the [alloy-lang](https://www.npmjs.com/package/alloy-lang) npm module. Future versions may include TLA+ support.

## Installation

```bash
# Clone the repository
git clone https://github.com/awwaiid/metl.git
cd metl

# Install dependencies
npm install

# Build the project
npm run build
```

## Prerequisites

- Node.js >= 18.0.0
- Anthropic API key (set as `ANTHROPIC_API_KEY` environment variable)

## Usage

### Running the Application

```bash
# Run in development mode
npm run dev

# Run the built version
npm start
```

### Available Tools

METL provides three core tools:

1. **create_alloy_model** - Create an Alloy formal model from code concepts
   - Input: model name, concepts, relationships, constraints
   - Output: Generated Alloy model code

2. **run_alloy_model** - Execute an Alloy model to generate scenarios
   - Input: model content, command, scope
   - Output: Example scenarios (implementation in progress)

3. **translate_to_test** - Translate Alloy scenarios into test cases
   - Input: scenario, target language, testing framework, code context
   - Output: Test code in the target language

### Examples

#### Direct Tool Usage

```typescript
import { createAlloyModel } from './dist/tools/alloy.js';

const result = await createAlloyModel.handler({
  modelName: 'BankingSystem',
  concepts: ['Account', 'Transaction', 'User'],
  relationships: ['User owns Account'],
  constraints: ['Account balance must be non-negative']
}, {});
```

Run the complete example:
```bash
npx tsx examples/direct-tool-usage.ts
```

#### Agent Query Usage

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createMetlMcpServer, metlAgentDefinition } from './dist/agent.js';

const q = query({
  prompt: "Help me model a queue system...",
  options: {
    systemPrompt: metlAgentDefinition.prompt,
    mcpServers: { metl: createMetlMcpServer() }
  }
});

for await (const message of q) {
  // Process messages
}
```

Run the complete example:
```bash
npx tsx examples/basic-usage.ts
```

## Project Structure

```
metl/
├── src/
│   ├── agent.ts          # METL agent definition and MCP server
│   ├── index.ts          # Main entry point
│   ├── tools/
│   │   └── alloy.ts      # Alloy-specific tools
│   └── types/
│       └── index.ts      # TypeScript type definitions
├── examples/
│   ├── basic-usage.ts    # Agent query example
│   └── direct-tool-usage.ts  # Direct tool usage example
└── dist/                 # Built JavaScript output
```

## Development

```bash
# Run type checking
npm run typecheck

# Build the project
npm run build

# Run in development mode with auto-reload
npm run dev
```

## Testing with Real Projects

We can use public projects like [Human Essentials](https://github.com/rubyforgood/human-essentials) to try this on a real application.
